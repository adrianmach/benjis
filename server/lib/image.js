// Optimización de imágenes con sharp. Todo lo que sube el admin (y el script
// de migración server/optimize-existing.js) pasa por acá antes de llegar a
// Supabase Storage: redimensionar a un ancho máximo y convertir a WebP.

import sharp from 'sharp';

const DEFAULT_QUALITY = 80;
const DEFAULT_MAX_WIDTH = 1200;
const THUMB_WIDTH = 400;

// `animated: true` preserva la animación si el original es un GIF/WebP
// animado; para una imagen estática no tiene efecto.
export async function optimizeImage(buffer, { maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY } = {}) {
  return sharp(buffer, { animated: true })
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

export async function makeThumbnail(buffer, { width = THUMB_WIDTH, quality = DEFAULT_QUALITY } = {}) {
  return optimizeImage(buffer, { maxWidth: width, quality });
}
