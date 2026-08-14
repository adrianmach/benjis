-- ============================================================
-- Benji$ — migración 002: ofertas, medio de envío y sección
-- "Sobre mí" de About. Correr en el SQL Editor de Supabase
-- (requiere que supabase/schema.sql ya esté aplicado).
-- ============================================================

-- productos: precio de oferta
alter table benjis_products add column if not exists on_sale boolean not null default false;
alter table benjis_products add column if not exists sale_price integer;

-- pedidos: medio de envío elegido en el checkout
alter table benjis_orders add column if not exists shipping_method text not null default 'pickup';
alter table benjis_orders add column if not exists shipping_notes text not null default '';
alter table benjis_orders add column if not exists shipping_cost integer not null default 0;

-- se elimina el estado "coming" (coming soon): los productos que lo tenían
-- pasan a "published", sus badges COMING SOON se limpian y SOLD OUT pasa
-- a español.
update benjis_products set status = 'published' where status = 'coming';
update benjis_products set badge = null where badge = 'COMING SOON';
update benjis_products set badge = 'AGOTADO' where badge = 'SOLD OUT';

-- contenido nuevo: costo del cadete + sección "Sobre mí" de About
insert into benjis_content (key, value) values
  ('shipping_cadete_cost', '200'),
  ('about_sobremi_title', 'Sobre mí'),
  ('about_sobremi_paragraph', 'Contá acá quién está detrás de Benji$: tu historia, por qué empezaste, qué te inspira. [ Editable desde el CMS ]'),
  ('about_sobremi_image_url', '')
on conflict (key) do nothing;
