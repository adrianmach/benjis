// Cliente de Supabase (service role -- bypassea RLS, solo se usa server-side)
// + helpers de Storage. Todas las imágenes que sube el admin (excepto los 4
// slots fijos del hero, que siguen viviendo en assets/ porque index.html
// hardcodea esos paths) van al bucket público "benjis".

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY no configurados en .env.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

export const STORAGE_BUCKET = 'benjis';

const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// Sube un archivo (buffer en memoria, viene de multer) a <subdir>/<uuid>.<ext>
// dentro del bucket y devuelve la URL pública.
export async function uploadImage(subdir, file) {
  const ext = EXT_BY_MIME[file.mimetype] || 'bin';
  const key = `${subdir}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(key, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

// Borra un archivo del bucket a partir de su URL pública. Best-effort: si la
// URL no pertenece al bucket (o está vacía/es de otro origen) no hace nada.
export async function deleteImageByUrl(url) {
  if (!url || typeof url !== 'string') return;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const key = url.slice(idx + marker.length);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([key]);
  if (error) console.warn('[supabase] no se pudo borrar', key, error.message);
}
