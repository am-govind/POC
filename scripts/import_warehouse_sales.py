"""Load Warehouse_and_Retail_Sales.csv into Supabase.

Usage:
  DATABASE_URL='postgresql://postgres:<password>@<host>:5432/postgres' \
    python scripts/import_warehouse_sales.py Warehouse_and_Retail_Sales.csv
"""
import csv
import os
import re
import sys
import psycopg

CSV_COLUMNS = ["year", "month", "supplier", "item_code", "item_description",
               "item_type", "retail_sales", "retail_transfers", "warehouse_sales"]

if len(sys.argv) != 2 or not os.getenv("DATABASE_URL"):
    raise SystemExit("Set DATABASE_URL and pass the CSV path")

path = sys.argv[1]
dsn = os.environ["DATABASE_URL"]

with psycopg.connect(dsn) as conn:
    with conn.cursor() as cur, open(path, newline="", encoding="utf-8-sig") as fh:
        cur.execute("truncate public.warehouse_sales_import")
        with cur.copy("copy public.warehouse_sales_import (year,month,supplier,item_code,item_description,item_type,retail_sales,retail_transfers,warehouse_sales) from stdin with (format csv)") as copy:
            reader = csv.DictReader(fh)
            for row in reader:
                copy.write_row([row[c.upper()] for c in CSV_COLUMNS])

        # The source has no price/current inventory. Keep those fields at their
        # schema defaults and use the source item code as the stable product key.
        cur.execute("""
          insert into public.categories (name, slug)
          select distinct initcap(lower(nullif(item_type, ''))),
                 lower(regexp_replace(nullif(item_type, ''), '[^a-zA-Z0-9]+', '-', 'g'))
          from public.warehouse_sales_import
          where nullif(item_type, '') is not null
          on conflict (slug) do nothing
        """)
        cur.execute("""
          insert into public.products
            (source_item_code, category_id, name, brand, description, volume_ml)
          select x.item_code, c.id, x.item_description, coalesce(nullif(x.supplier, ''), 'Unknown'),
                 'Imported from Warehouse_and_Retail_Sales.csv',
                 coalesce((regexp_match(x.item_description, '(\\d+(?:\\.\\d+)?)\\s*(?:ML|OZ)'))[1]::numeric,
                          750)::integer
          from (select distinct on (item_code) item_code, item_description, item_type, supplier
                from public.warehouse_sales_import order by item_code, supplier desc) x
          left join public.categories c on c.slug = lower(regexp_replace(nullif(x.item_type, ''), '[^a-zA-Z0-9]+', '-', 'g'))
          on conflict (source_item_code) do update set name=excluded.name, category_id=excluded.category_id
        """)
        cur.execute("""
          insert into public.warehouse_sales
            (product_id, year, month, supplier, retail_sales, retail_transfers, warehouse_sales)
          select p.id, i.year::smallint, i.month::smallint, coalesce(nullif(i.supplier, ''), 'Unknown'),
                 coalesce(nullif(i.retail_sales, '')::numeric, 0),
                 coalesce(nullif(i.retail_transfers, '')::numeric, 0),
                 coalesce(nullif(i.warehouse_sales, '')::numeric, 0)
          from public.warehouse_sales_import i
          join public.products p on p.source_item_code = i.item_code
          on conflict (product_id, year, month, supplier) do update set
            retail_sales=excluded.retail_sales, retail_transfers=excluded.retail_transfers,
            warehouse_sales=excluded.warehouse_sales
        """)
        cur.execute("truncate public.warehouse_sales_import")
    conn.commit()
print("Warehouse sales import complete")
