// Upload helpers para el panel admin. Todo usa memoryStorage (no se escribe
// a disco excepto los slots fijos del hero, que la ruta escribe en assets/
// a mano) porque el resto de las imágenes se sube a Supabase Storage --
// ver server/supabase.js.

import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..', '..');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function imageFileFilter(req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  cb(new Error('Tipo de archivo no permitido. Usá JPG, PNG, WEBP o GIF.'));
}

// Los 4 slots fijos del hero/galería: la ruta decide el nombre exacto de
// archivo (debe coincidir con lo que hardcodea index.html) y lo sobreescribe
// en assets/.
export const heroUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter
}).single('image');

// Todo lo demás: la ruta sube el buffer a Supabase Storage y guarda la URL
// pública en la base.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter
}).single('image');

// Corre un middleware de multer y devuelve una promesa: true si se puede
// seguir (req.file ya está disponible), false si multer falló y ya mandó
// la respuesta 400 -- el caller solo tiene que hacer `if (!ok) return;`.
export function runUpload(mw, req, res) {
  return new Promise((resolve) => {
    mw(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message || 'No se pudo procesar el archivo.' });
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
