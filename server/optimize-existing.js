// Re-optimiza las imágenes que ya están en Supabase Storage (subidas antes de
// que el admin empezara a optimizar en el momento del upload): las descarga,
// las redimensiona a máx. 1200px + WebP calidad 80, las vuelve a subir y
// actualiza la URL en la base si cambió de extensión.
//
// Correr con: node server/optimize-existing.js

import 'dotenv/config';
import crypto from 'node:crypto';
import { supabase, STORAGE_BUCKET, deleteImageByUrl } from './supabase.js';
import { optimizeImage } from './lib/image.js';

const CONTENT_IMAGE_KEYS = [
  'about_proceso_image_url',
  'about_materiales_image_url',
  'about_sobremi_image_url',
  'custom_image_url',
  'gallery_image_url'
];

const stats = { optimized: 0, skipped: 0, failed: 0 };

function keyFromUrl(url) {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

// Descarga, optimiza y re-sube una imagen. Devuelve la nueva URL pública, o
// null si no había nada para hacer (no es del bucket, o ya es WebP).
async function optimizeAndReupload(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.toLowerCase().endsWith('.webp')) return null;
  const oldKey = keyFromUrl(url);
  if (!oldKey) return null;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar`);
  const original = Buffer.from(await res.arrayBuffer());
  const optimized = await optimizeImage(original);

  const subdir = oldKey.split('/').slice(0, -1).join('/') || 'misc';
  const newKey = `${subdir}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(newKey, optimized, {
    contentType: 'image/webp',
    upsert: false
  });
  if (error) throw error;

  const newUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(newKey).data.publicUrl;
  await deleteImageByUrl(url);
  return newUrl;
}

async function handle(label, url) {
  try {
    const newUrl = await optimizeAndReupload(url);
    if (newUrl) {
      stats.optimized++;
      console.log(`OK  ${label} -> ${newUrl}`);
      return newUrl;
    }
    stats.skipped++;
    return null;
  } catch (err) {
    stats.failed++;
    console.error(`FALLÓ ${label} (${url}): ${err.message}`);
    return null;
  }
}

async function optimizeProducts() {
  const { data: products, error } = await supabase.from('benjis_products').select('id, images');
  if (error) throw error;
  for (const p of products) {
    const images = p.images || [];
    let changed = false;
    for (const img of images) {
      const newUrl = await handle(`producto ${p.id} imagen ${img.id}`, img.url);
      if (newUrl) { img.url = newUrl; changed = true; }
    }
    if (changed) {
      const { error: updErr } = await supabase.from('benjis_products').update({ images }).eq('id', p.id);
      if (updErr) console.error(`No se pudo actualizar producto ${p.id}: ${updErr.message}`);
    }
  }
}

async function optimizeContent() {
  const { data: rows, error } = await supabase.from('benjis_content').select('key, value').in('key', CONTENT_IMAGE_KEYS);
  if (error) throw error;
  for (const row of rows) {
    const newUrl = await handle(`content ${row.key}`, row.value);
    if (newUrl) {
      const { error: updErr } = await supabase.from('benjis_content').update({ value: newUrl }).eq('key', row.key);
      if (updErr) console.error(`No se pudo actualizar ${row.key}: ${updErr.message}`);
    }
  }
}

async function optimizeArchives() {
  const { data: archives, error } = await supabase.from('benjis_archives').select('id, cover_image_url, photos');
  if (error) throw error;
  for (const a of archives) {
    const patch = {};

    const newCover = await handle(`archivo ${a.id} cover`, a.cover_image_url);
    if (newCover) patch.cover_image_url = newCover;

    const photos = a.photos || [];
    let photosChanged = false;
    for (const ph of photos) {
      const newUrl = await handle(`archivo ${a.id} foto ${ph.id}`, ph.url);
      if (newUrl) { ph.url = newUrl; photosChanged = true; }
    }
    if (photosChanged) patch.photos = photos;

    if (Object.keys(patch).length) {
      const { error: updErr } = await supabase.from('benjis_archives').update(patch).eq('id', a.id);
      if (updErr) console.error(`No se pudo actualizar archivo ${a.id}: ${updErr.message}`);
    }
  }
}

async function run() {
  await optimizeProducts();
  await optimizeContent();
  await optimizeArchives();
  console.log(`\nListo. Optimizadas: ${stats.optimized}, ya optimizadas/omitidas: ${stats.skipped}, fallidas: ${stats.failed}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
