alter table public.products
  add column if not exists mrp numeric(10,2),
  add column if not exists country_of_origin text,
  add column if not exists highlights text[] default '{}',
  add column if not exists sku text;

alter table public.products
  add constraint products_sku_key unique (sku);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order smallint not null default 0,
  is_primary boolean not null default false
);

create index if not exists product_images_product_idx
  on public.product_images(product_id, sort_order);
