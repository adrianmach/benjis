// Cliente de Supabase (service role -- bypassea RLS, solo se usa server-side)
// + helpers de Storage. Todas las imágenes que sube el admin (excepto los 4
// slots fijos del hero, que siguen viviendo en assets/ porque index.html
// hardcodea esos paths) van al bucket público "benjis". Todo pasa antes por
// optimizeImage (resize + WebP) -- ver server/lib/image.js.

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { optimizeImage, makeThumbnail } from './lib/image.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY no configurados en .env.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

export const STORAGE_BUCKET = 'benjis';
const WEBP_MIME = 'image/webp';

async function putWebp(key, buffer) {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(key, buffer, {
    contentType: WEBP_MIME,
    upsert: false
  });
  if (error) throw error;
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(key).data.publicUrl;
}

// Optimiza un archivo (buffer en memoria, viene de multer) y lo sube a
// <subdir>/<uuid>.webp dentro del bucket. Devuelve la URL pública.
export async function uploadImage(subdir, file, opts) {
  const optimized = await optimizeImage(file.buffer, opts);
  return putWebp(`${subdir}/${crypto.randomUUID()}.webp`, optimized);
}

// Igual que uploadImage, pero además genera y sube un thumbnail de 400px
// para usar en previews (ej. panel admin) sin cargar la imagen completa.
export async function uploadProductImage(file) {
  const [main, thumb] = await Promise.all([
    optimizeImage(file.buffer),
    makeThumbnail(file.buffer)
  ]);
  const [url, thumbUrl] = await Promise.all([
    putWebp(`products/${crypto.randomUUID()}.webp`, main),
    putWebp(`products/thumbs/${crypto.randomUUID()}.webp`, thumb)
  ]);
  return { url, thumbUrl };
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
