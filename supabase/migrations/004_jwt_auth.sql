alter table public.profiles
  add column if not exists password_hash text;

create index if not exists profiles_role_idx on public.profiles(role);
