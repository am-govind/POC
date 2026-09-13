-- Clerk owns authentication; this stores the external identity alongside the
-- internal UUID used by carts and orders.
alter table public.profiles
  add column if not exists clerk_user_id text;

create unique index if not exists profiles_clerk_user_id_uidx
  on public.profiles(clerk_user_id)
  where clerk_user_id is not null;
