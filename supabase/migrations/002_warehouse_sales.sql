-- Historical warehouse/retail dataset import support.
alter table public.products add column if not exists source_item_code text;
create unique index if not exists products_source_item_code_uidx
  on public.products(source_item_code) where source_item_code is not null;

create table if not exists public.warehouse_sales (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  year smallint not null,
  month smallint not null check (month between 1 and 12),
  supplier text,
  retail_sales numeric(12,2) not null default 0,
  retail_transfers numeric(12,2) not null default 0,
  warehouse_sales numeric(12,2) not null default 0,
  unique(product_id, year, month, supplier)
);

create index if not exists warehouse_sales_period_idx
  on public.warehouse_sales(year, month);
create index if not exists warehouse_sales_product_idx
  on public.warehouse_sales(product_id);

-- Used only by scripts/import_warehouse_sales.py and safe to truncate/reload.
create table if not exists public.warehouse_sales_import (
  year text, month text, supplier text, item_code text, item_description text,
  item_type text, retail_sales text, retail_transfers text, warehouse_sales text
);
