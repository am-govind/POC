-- Categories (8 alcohol types)
insert into public.categories (name, slug) values
  ('Whisky', 'whisky'),
  ('Wine', 'wine'),
  ('Beer', 'beer'),
  ('Gin', 'gin'),
  ('Vodka', 'vodka'),
  ('Rum', 'rum'),
  ('Tequila', 'tequila'),
  ('Liqueurs', 'liqueurs')
on conflict (slug) do nothing;

-- Admin + demo customer (passwords: admin123 / customer123)
insert into public.profiles (email, full_name, role, date_of_birth, password_hash) values
  ('admin@bottleshop.local', 'Admin User', 'admin', '1990-01-15',
   '$2b$12$tM49JH3EHSMxe3OsL/K1rO6NV5zqHJrPOLZoVpox9Z/A0l8ZuTTAO'),
  ('customer@bottleshop.local', 'Demo Customer', 'customer', '1995-06-20',
   '$2b$12$U12.Z5mjrKlwoAwRM/gDd.o50WU8iJ8OttjrDw4jDUpLsYQSGh3uG')
on conflict (email) do update set
  role = excluded.role,
  password_hash = excluded.password_hash,
  date_of_birth = excluded.date_of_birth;

-- Sample products (2 per category)
insert into public.products (category_id, name, brand, description, alcohol_percentage, volume_ml, price, image_url)
select c.id, x.name, x.brand, x.description, x.abv, x.volume_ml, x.price, x.image_url
from (values
  ('whisky', 'Oak & Ember Single Malt', 'Oak & Ember', 'Rich single malt with warm oak and honey notes.', 42.8, 750, 2899, 'https://images.unsplash.com/photo-1527281800644-f7a1659c3be5?w=400'),
  ('whisky', 'Highland Reserve 12', 'Highland Reserve', 'Smooth Highland whisky with vanilla finish.', 40.0, 750, 3499, 'https://images.unsplash.com/photo-1569529465841-dfecdabfb3b5?w=400'),
  ('wine', 'Cedar Valley Shiraz', 'Cedar Valley', 'Full-bodied red with berry and spice.', 13.5, 750, 1299, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400'),
  ('wine', 'Sunset Rosé', 'Vine & Valley', 'Crisp rosé with strawberry notes.', 12.0, 750, 999, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400'),
  ('beer', 'Harbor Light Lager', 'Harbor Light', 'Crisp refreshing craft lager.', 5.0, 500, 220, 'https://images.unsplash.com/photo-1608270582240-4e6608835c37?w=400'),
  ('beer', 'Mountain IPA', 'Peak Brew', 'Hoppy IPA with citrus punch.', 6.5, 500, 280, 'https://images.unsplash.com/photo-1618885472179-5e474019f2a6?w=400'),
  ('gin', 'Juniper House London Dry', 'Juniper House', 'Classic dry gin with juniper and citrus.', 40.0, 700, 1799, 'https://images.unsplash.com/photo-1571613314887-6f8d3cbf7ef7?w=400'),
  ('gin', 'Botanical No. 7', 'Botanical Co', 'Floral gin with elderflower.', 41.0, 700, 2199, 'https://images.unsplash.com/photo-1618885472179-5e474019f2a6?w=400'),
  ('vodka', 'Crystal Clear Vodka', 'Crystal', 'Triple-distilled smooth vodka.', 40.0, 750, 1499, 'https://images.unsplash.com/photo-1569529465841-dfecdabfb3b5?w=400'),
  ('vodka', 'Arctic Premium', 'Arctic', 'Premium wheat vodka.', 40.0, 750, 1999, 'https://images.unsplash.com/photo-1571613314887-6f8d3cbf7ef7?w=400'),
  ('rum', 'Caribbean Gold Rum', 'Island Spirits', 'Aged golden rum with caramel notes.', 40.0, 750, 1699, 'https://images.unsplash.com/photo-1569529465841-dfecdabfb3b5?w=400'),
  ('rum', 'Dark Cove Spiced', 'Dark Cove', 'Spiced rum with vanilla and cinnamon.', 37.5, 700, 1399, 'https://images.unsplash.com/photo-1527281800644-f7a1659c3be5?w=400'),
  ('tequila', 'Agave Blanco', 'Sierra Azul', '100% agave blanco tequila.', 38.0, 750, 2499, 'https://images.unsplash.com/photo-1618885472179-5e474019f2a6?w=400'),
  ('tequila', 'Reposado Reserve', 'Sierra Azul', 'Oak-rested reposado with smooth finish.', 40.0, 750, 3299, 'https://images.unsplash.com/photo-1571613314887-6f8d3cbf7ef7?w=400'),
  ('liqueurs', 'Midnight Coffee Liqueur', 'Midnight', 'Rich coffee liqueur for cocktails.', 20.0, 500, 1199, 'https://images.unsplash.com/photo-1569529465841-dfecdabfb3b5?w=400'),
  ('liqueurs', 'Honey Herb Liqueur', 'Golden Hive', 'Sweet herbal liqueur.', 25.0, 500, 999, 'https://images.unsplash.com/photo-1527281800644-f7a1659c3be5?w=400')
) as x(slug, name, brand, description, abv, volume_ml, price, image_url)
join public.categories c on c.slug = x.slug
where not exists (select 1 from public.products p where p.name = x.name);

insert into public.inventory (product_id, stock_quantity, reorder_level)
select p.id,
  case when p.name like '%Lager%' then 8 when p.name like '%Coffee%' then 5 else 42 end,
  12
from public.products p
where not exists (select 1 from public.inventory i where i.product_id = p.id);
