-- ============================================================
-- Benji$ — migración 003: colores por producto + talles con
-- descripción/medidas. Correr en el SQL Editor de Supabase
-- (requiere que supabase/schema.sql y 002 ya estén aplicados).
--
-- El mínimo de 3 imágenes por producto y el layout de la ficha
-- son cambios de código/UI únicamente, no requieren SQL.
-- ============================================================

-- productos: colores opcionales -- [{ "name": "Negro", "hex": "#111111" }, ...]
-- Si queda en '[]' (default), la ficha del producto no muestra el selector
-- de color.
alter table benjis_products add column if not exists colors jsonb not null default '[]'::jsonb;

-- talles: antes era un array de strings (["S","M","L"]), pasa a ser un
-- array de objetos con nombre + descripción/medidas:
-- [{ "name": "M", "description": "Pecho: 52cm, Largo: 68cm, Manga: 62cm" }, ...]
-- La conversión solo toca elementos que todavía son strings (si se vuelve
-- a correr esta migración no hace nada, ya quedan como objetos).
update benjis_products
set sizes = coalesce((
  select jsonb_agg(
    case
      when jsonb_typeof(elem) = 'string' then jsonb_build_object('name', elem #>> '{}', 'description', '')
      else elem
    end
    order by ord
  )
  from jsonb_array_elements(sizes) with ordinality as t(elem, ord)
), '[]'::jsonb)
where jsonb_typeof(sizes) = 'array';
