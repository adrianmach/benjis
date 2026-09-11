-- ============================================================
-- Benji$ — migración 004: visibilidad (mostrar/ocultar) de
-- categorías de tienda y entradas de archivo. Correr en el SQL
-- Editor de Supabase (requiere que supabase/schema.sql y 002-003
-- ya estén aplicados).
-- ============================================================

-- categorías: si visible = false, se ocultan del filtro del shop y del
-- frontend, y los productos que usan esa categoría también se ocultan
-- (pero siguen existiendo en la base).
alter table benjis_categories add column if not exists visible boolean not null default true;

-- archivos: si visible = false, la entrada no aparece en /archivos.
alter table benjis_archives add column if not exists visible boolean not null default true;
