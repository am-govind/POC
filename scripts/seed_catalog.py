"""Seed catalog from supabase/seed/catalog.json

Usage:
  DATABASE_URL='postgresql://...' python scripts/seed_catalog.py
"""
import json
import os
import sys
from pathlib import Path

import psycopg

CATALOG_PATH = Path(__file__).resolve().parent.parent / "supabase" / "seed" / "catalog.json"


def main():
    if not os.getenv("DATABASE_URL"):
        raise SystemExit("Set DATABASE_URL")
    if not CATALOG_PATH.exists():
        raise SystemExit(f"Missing {CATALOG_PATH}")

    items = json.loads(CATALOG_PATH.read_text())
    dsn = os.environ["DATABASE_URL"]

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            for item in items:
                slug = item["category"].strip().lower()
                cur.execute(
                    """insert into categories (name, slug) values (%s, %s)
                    on conflict (slug) do update set name=excluded.name
                    returning id""",
                    (slug.replace('-', ' ').title(), slug),
                )
                cat_id = cur.fetchone()[0]
                images = item.get("images") or ([item["image_url"]] if item.get("image_url") else [])
                primary = images[0] if images else item.get("image_url")

                cur.execute(
                    """
                    insert into products (
                      sku, category_id, name, brand, description,
                      alcohol_percentage, volume_ml, price, mrp, image_url,
                      country_of_origin, highlights
                    ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    on conflict (sku) do update set
                      name=excluded.name, brand=excluded.brand, description=excluded.description,
                      price=excluded.price, mrp=excluded.mrp, image_url=excluded.image_url,
                      country_of_origin=excluded.country_of_origin, highlights=excluded.highlights,
                      category_id=excluded.category_id, updated_at=now()
                    returning id
                    """,
                    (
                        item["sku"],
                        cat_id,
                        item["name"],
                        item["brand"],
                        item.get("description", ""),
                        item["abv"],
                        item["volume_ml"],
                        item["price"],
                        item.get("mrp", item["price"]),
                        primary,
                        item.get("country"),
                        item.get("highlights", []),
                    ),
                )
                pid = cur.fetchone()[0]

                cur.execute("delete from product_images where product_id = %s", (pid,))
                for i, url in enumerate(images):
                    cur.execute(
                        """
                        insert into product_images (product_id, url, sort_order, is_primary)
                        values (%s, %s, %s, %s)
                        """,
                        (pid, url, i, i == 0),
                    )

                cur.execute(
                    """
                    insert into inventory (product_id, stock_quantity, reorder_level)
                    values (%s, %s, %s)
                    on conflict (product_id) do update set
                      stock_quantity=excluded.stock_quantity,
                      reorder_level=excluded.reorder_level
                    """,
                    (pid, item.get("stock", 40), item.get("reorder_level", 12)),
                )
        conn.commit()
    print(f"Seeded {len(items)} products from catalog.json")


if __name__ == "__main__":
    main()
