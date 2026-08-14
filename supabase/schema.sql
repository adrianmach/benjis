-- ============================================================
-- Benji$ — esquema Supabase (tablas con prefijo benjis_)
-- Correr una sola vez en el SQL Editor de Supabase (proyecto compartido).
-- Es seguro volver a correrlo: el contenido/seed usa guards que no
-- duplican filas ni pisan ediciones ya hechas desde /admin.
--
-- Storage: usa el bucket público "benjis" (ya existente) para todas las
-- imágenes subidas desde el admin. Estas tablas solo guardan URLs.
-- ============================================================

-- Mantiene updated_at al día en cualquier UPDATE.
create or replace function benjis_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------- content
-- Key/value: settings (banner, hero, textos de secciones, colores...) y
-- también los campos del formulario de "custom" (JSON) bajo la key
-- 'custom_form_fields'. Reemplaza a settings + custom_form_fields de SQLite.
create table if not exists benjis_content (
  key text primary key,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists benjis_content_updated_at on benjis_content;
create trigger benjis_content_updated_at
  before update on benjis_content
  for each row execute function benjis_set_updated_at();

alter table benjis_content enable row level security;

-- ------------------------------------------------------------- categories
create table if not exists benjis_categories (
  id bigint generated always as identity primary key,
  name text unique not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists benjis_categories_updated_at on benjis_categories;
create trigger benjis_categories_updated_at
  before update on benjis_categories
  for each row execute function benjis_set_updated_at();

alter table benjis_categories enable row level security;

-- --------------------------------------------------------------- products
-- images: [{ "id": "uuid", "url": "...", "sortOrder": 0 }]  (antes: product_images)
create table if not exists benjis_products (
  id bigint generated always as identity primary key,
  name text not null,
  price integer,
  cat text not null default '',
  status text not null default 'published',
  unique_piece boolean not null default false,
  badge text,
  sizes jsonb not null default '[]'::jsonb,
  description text not null default '',
  materials text not null default '',
  shipping_returns text not null default '',
  featured boolean not null default false,
  sort_order integer not null default 0,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists benjis_products_updated_at on benjis_products;
create trigger benjis_products_updated_at
  before update on benjis_products
  for each row execute function benjis_set_updated_at();

alter table benjis_products enable row level security;

-- --------------------------------------------------------------- archives
-- photos: [{ "id": "uuid", "url": "...", "label": "...", "sortOrder": 0 }]  (antes: archive_photos)
create table if not exists benjis_archives (
  id bigint generated always as identity primary key,
  title text not null,
  credit text not null default '',
  description text not null default '',
  long_text text not null default '',
  cover_image_url text,
  wide boolean not null default false,
  sort_order integer not null default 0,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists benjis_archives_updated_at on benjis_archives;
create trigger benjis_archives_updated_at
  before update on benjis_archives
  for each row execute function benjis_set_updated_at();

alter table benjis_archives enable row level security;

-- ----------------------------------------------------------------- orders
create table if not exists benjis_orders (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  phone text not null default '',
  address text not null default '',
  items jsonb not null default '[]'::jsonb,
  total integer not null,
  status text not null default 'pendiente',
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists benjis_orders_updated_at on benjis_orders;
create trigger benjis_orders_updated_at
  before update on benjis_orders
  for each row execute function benjis_set_updated_at();

alter table benjis_orders enable row level security;

-- Nota RLS: no se agregan policies a propósito. El backend usa la
-- SERVICE_KEY (bypassea RLS siempre), y como no habilitamos ninguna
-- policy, la anon key queda sin ningún acceso a estas tablas -- correcto
-- ya que el frontend nunca habla directo con Supabase, solo con esta API.

-- ================================================================
-- Seed data (idéntico al contenido hardcodeado / semilla de SQLite)
-- ================================================================

insert into benjis_content (key, value) values
  ('banner_text_1', 'Envíos a todo el país'),
  ('banner_text_2', 'Drop 01'),
  ('banner_text_3', 'Montevideo'),
  ('banner_visible', 'true'),
  ('accent_color', '#F93A2F'),
  ('gallery_brand_text', 'Benji$'),
  ('gallery_subtitle_text', 'Montevideo — Uruguay'),
  ('gallery_image_url', ''),
  ('unicos_title_1', 'Únicos'),
  ('unicos_title_2', '1/1'),
  ('unicos_paragraph', 'Piezas únicas hechas a partir de materiales recuperados. Una sola unidad de cada una. Cuando se va, se fue.'),
  ('unicos_link_text', 'Ver piezas únicas'),
  ('cta_title', '¿Tenés una idea?'),
  ('cta_paragraph', 'Trabajamos prendas y piezas personalizadas. Contanos qué estás buscando y lo armamos juntos.'),
  ('cta_button_text', 'Enviar consulta →'),
  ('custom_title_1', '¿Tenés'),
  ('custom_title_2', 'una idea?'),
  ('custom_paragraph', 'Trabajamos prendas y piezas personalizadas: buzos, balaclavas, riñoneras y lo que se te ocurra. Contanos tu idea y te respondemos con una propuesta.'),
  ('custom_image_url', ''),
  ('about_subtitle', 'Marca independiente hecha en Montevideo'),
  ('about_proceso_title', 'Proceso'),
  ('about_proceso_paragraph', 'Cada pieza se hace a mano, en tandas chicas. [ Texto de marca — editable desde el CMS ]'),
  ('about_proceso_image_url', ''),
  ('about_materiales_title_1', 'Materiales'),
  ('about_materiales_title_2', 'recuperados'),
  ('about_materiales_paragraph', 'Las piezas únicas nacen de materiales que ya tuvieron una vida. Por eso son 1/1. [ Editable desde el CMS ]'),
  ('about_materiales_link_text', 'Pedí tu custom →'),
  ('about_materiales_image_url', '')
on conflict (key) do nothing;

insert into benjis_content (key, value) values
  ('custom_form_fields', '[
    {"id":"seed-1","label":"Nombre","placeholder":"Tu nombre","sortOrder":0},
    {"id":"seed-2","label":"Instagram","placeholder":"@usuario","sortOrder":1},
    {"id":"seed-3","label":"Email","placeholder":"tu@email.com","sortOrder":2},
    {"id":"seed-4","label":"WhatsApp","placeholder":"09x xxx xxx","sortOrder":3},
    {"id":"seed-5","label":"Presupuesto aproximado","placeholder":"Opcional","sortOrder":4}
  ]')
on conflict (key) do nothing;

insert into benjis_categories (name, sort_order)
select * from (values
  ('BUZOS', 0),
  ('BALACLAVAS', 1),
  ('RIÑONERAS', 2)
) as v(name, sort_order)
where not exists (select 1 from benjis_categories);

insert into benjis_products (name, price, cat, status, unique_piece, badge, sizes, description, materials, shipping_returns, featured, sort_order)
select * from (values
  ('BALACLAVA 01', null::integer, 'BALACLAVAS', 'published', false, null::text, '["S","M","L"]'::jsonb, 'Balaclava de punto grueso con terminaciones a mano. Abrigo y estilo en una sola pieza.', '', '', true, 0),
  ('BALACLAVA 02', null::integer, 'BALACLAVAS', 'published', false, null::text, '["M","L","XL"]'::jsonb, 'Balaclava de algodón liviano, ideal para entretiempo. Corte relajado.', '', '', true, 1),
  ('BALACLAVA 03', null::integer, 'BALACLAVAS', 'published', false, null::text, '["S","M","L","XL"]'::jsonb, 'Balaclava oversize de frisa rústica. Doble capa en la zona del cuello.', '', '', false, 2),
  ('BALACLAVA 04', null::integer, 'BALACLAVAS', 'coming', false, 'COMING SOON', '[]'::jsonb, '', '', '', false, 3),
  ('BALACLAVA 05', null::integer, 'BALACLAVAS', 'coming', false, 'COMING SOON', '[]'::jsonb, '', '', '', false, 4),
  ('BALACLAVA 06', null::integer, 'BALACLAVAS', 'coming', false, 'COMING SOON', '[]'::jsonb, '', '', '', false, 5),
  ('RIÑONERA 01', null::integer, 'RIÑONERAS', 'published', true, '1/1', '["ÚNICA"]'::jsonb, 'Riñonera hecha con materiales recuperados. Pieza única e irrepetible.', '', '', true, 6),
  ('RIÑONERA 02', null::integer, 'RIÑONERAS', 'published', true, '1/1', '["ÚNICA"]'::jsonb, 'Riñonera artesanal con cierre YKK y correa ajustable. Pieza 1/1.', '', '', false, 7),
  ('RIÑONERA 03', null::integer, 'RIÑONERAS', 'sold', true, 'SOLD OUT', '[]'::jsonb, '', '', '', false, 8),
  ('BUZO 01', null::integer, 'BUZOS', 'coming', false, 'COMING SOON', '[]'::jsonb, 'Buzo oversize de frisa rústica con capucha y bolsillos asimétricos.', '', '', false, 9),
  ('BUZO 02', null::integer, 'BUZOS', 'coming', false, 'COMING SOON', '[]'::jsonb, 'Buzo liviano con estampa serigráfica y corte boxy.', '', '', false, 10)
) as v(name, price, cat, status, unique_piece, badge, sizes, description, materials, shipping_returns, featured, sort_order)
where not exists (select 1 from benjis_products);

insert into benjis_archives (title, credit, description, long_text, cover_image_url, wide, sort_order, photos)
select * from (values
  ('STREET SESH 01', 'Fotos @fotógrafo — Marzo, 2025', 'Primera sesión callejera de Benji$. Montevideo de noche, prendas en su hábitat natural.', 'La primera salida a la calle con las piezas terminadas. Sin producción, sin luces artificiales. Solo la ciudad y la ropa.', null::text, false, 0,
    '[{"id":"seed-1","url":null,"label":"STREET 01 — FOTO 1","sortOrder":0},{"id":"seed-2","url":null,"label":"STREET 01 — FOTO 2","sortOrder":1},{"id":"seed-3","url":null,"label":"STREET 01 — FOTO 3","sortOrder":2},{"id":"seed-4","url":null,"label":"STREET 01 — FOTO 4","sortOrder":3},{"id":"seed-5","url":null,"label":"STREET 01 — FOTO 5","sortOrder":4},{"id":"seed-6","url":null,"label":"STREET 01 — FOTO 6","sortOrder":5}]'::jsonb),
  ('STREET SESH 02', 'Fotos @fotógrafo — Mayo, 2025', 'Segunda sesión. Ciudad Vieja, atardecer, balaclavas y riñoneras.', '', null::text, false, 1,
    '[{"id":"seed-1","url":null,"label":"STREET 02 — FOTO 1","sortOrder":0},{"id":"seed-2","url":null,"label":"STREET 02 — FOTO 2","sortOrder":1},{"id":"seed-3","url":null,"label":"STREET 02 — FOTO 3","sortOrder":2},{"id":"seed-4","url":null,"label":"STREET 02 — FOTO 4","sortOrder":3},{"id":"seed-5","url":null,"label":"STREET 02 — FOTO 5","sortOrder":4}]'::jsonb),
  ('LOOKBOOK DROP 01', 'Fotos @fotógrafo — Junio, 2025', 'Lookbook completo del primer drop. Todas las piezas, todos los ángulos.', 'Cada prenda fotografiada en contexto. Sin fondo blanco, sin maniquí. Así se usan.', null::text, true, 2,
    '[{"id":"seed-1","url":null,"label":"LOOKBOOK — FOTO 1","sortOrder":0},{"id":"seed-2","url":null,"label":"LOOKBOOK — FOTO 2","sortOrder":1},{"id":"seed-3","url":null,"label":"LOOKBOOK — FOTO 3","sortOrder":2},{"id":"seed-4","url":null,"label":"LOOKBOOK — FOTO 4","sortOrder":3},{"id":"seed-5","url":null,"label":"LOOKBOOK — FOTO 5","sortOrder":4},{"id":"seed-6","url":null,"label":"LOOKBOOK — FOTO 6","sortOrder":5},{"id":"seed-7","url":null,"label":"LOOKBOOK — FOTO 7","sortOrder":6},{"id":"seed-8","url":null,"label":"LOOKBOOK — FOTO 8","sortOrder":7}]'::jsonb),
  ('DETRÁS DE ESCENA', 'Benji$ — 2025', 'El proceso. El taller. Las manos detrás de cada pieza.', '', null::text, false, 3,
    '[{"id":"seed-1","url":null,"label":"BTS — FOTO 1","sortOrder":0},{"id":"seed-2","url":null,"label":"BTS — FOTO 2","sortOrder":1},{"id":"seed-3","url":null,"label":"BTS — FOTO 3","sortOrder":2},{"id":"seed-4","url":null,"label":"BTS — FOTO 4","sortOrder":3}]'::jsonb),
  ('STREET SESH 03', 'Fotos @fotógrafo — Julio, 2025', 'Tercera sesión. Rambla, mediodía, sol directo.', '', null::text, false, 4,
    '[{"id":"seed-1","url":null,"label":"STREET 03 — FOTO 1","sortOrder":0},{"id":"seed-2","url":null,"label":"STREET 03 — FOTO 2","sortOrder":1},{"id":"seed-3","url":null,"label":"STREET 03 — FOTO 3","sortOrder":2},{"id":"seed-4","url":null,"label":"STREET 03 — FOTO 4","sortOrder":3},{"id":"seed-5","url":null,"label":"STREET 03 — FOTO 5","sortOrder":4}]'::jsonb),
  ('DESFILE BENJI$', 'Fotos @fotógrafo — Agosto, 2025', 'Primer desfile de Benji$. Todas las piezas en movimiento.', 'La primera vez que las piezas se vieron en pasarela. Un espacio industrial en el Cerro, música en vivo, 15 modelos.', null::text, true, 5,
    '[{"id":"seed-1","url":null,"label":"DESFILE — FOTO 1","sortOrder":0},{"id":"seed-2","url":null,"label":"DESFILE — FOTO 2","sortOrder":1},{"id":"seed-3","url":null,"label":"DESFILE — FOTO 3","sortOrder":2},{"id":"seed-4","url":null,"label":"DESFILE — FOTO 4","sortOrder":3},{"id":"seed-5","url":null,"label":"DESFILE — FOTO 5","sortOrder":4},{"id":"seed-6","url":null,"label":"DESFILE — FOTO 6","sortOrder":5},{"id":"seed-7","url":null,"label":"DESFILE — FOTO 7","sortOrder":6}]'::jsonb)
) as v(title, credit, description, long_text, cover_image_url, wide, sort_order, photos)
where not exists (select 1 from benjis_archives);
