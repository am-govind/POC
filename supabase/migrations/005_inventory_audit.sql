create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  delta integer not null,
  quantity_before integer not null,
  quantity_after integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_adjustments_product_idx
  on public.inventory_adjustments(product_id, created_at desc);
