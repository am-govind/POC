insert into public.categories (name, slug) values
  ('Whisky', 'whisky'), ('Wine', 'wine'), ('Beer', 'beer'), ('Gin', 'gin')
on conflict (slug) do nothing;

insert into public.products (category_id, name, brand, description, alcohol_percentage, volume_ml, price)
select c.id, x.name, x.brand, x.description, x.abv, x.volume_ml, x.price
from (values
  ('Whisky', 'Oak & Ember Single Malt', 'Oak & Ember', 'Rich, smooth single malt with warm oak notes.', 42.8, 750, 2899),
  ('Wine', 'Cedar Valley Shiraz', 'Cedar Valley', 'Full-bodied red wine with berry and spice notes.', 13.5, 750, 1299),
  ('Beer', 'Harbor Light Lager', 'Harbor Light', 'Crisp, refreshing craft lager.', 5.0, 500, 220),
  ('Gin', 'Juniper House London Dry', 'Juniper House', 'Classic dry gin with bright juniper and citrus.', 40.0, 700, 1799)
) as x(category, name, brand, description, abv, volume_ml, price)
join public.categories c on c.name = x.category
where not exists (select 1 from public.products p where p.name = x.name);

insert into public.inventory (product_id, stock_quantity, reorder_level)
select p.id, case p.name when 'Harbor Light Lager' then 8 else 42 end, 12
from public.products p
where not exists (select 1 from public.inventory i where i.product_id = p.id);
