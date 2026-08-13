// Upload helpers for the admin panel.
//
// Two flavors:
//  - heroUpload: memory storage for the 4 fixed hero/gallery image slots.
//    The route decides the exact on-disk filename (must match what
//    index.html hardcodes) and overwrites it in place.
//  - genericUpload(subdir): disk storage under uploads-admin/<subdir>/
//    with a random filename, used for anything the DB stores a URL for
//    (products, about, custom, archives).

import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..', '..');

const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

function imageFileFilter(req, file, cb) {
  if (ALLOWED_MIME[file.mimetype]) return cb(null, true);
  cb(new Error('Tipo de archivo no permitido. Usá JPG, PNG, WEBP o GIF.'));
}

export const heroUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter
}).single('image');

export function genericUpload(subdir) {
  const dest = path.join(ROOT, 'uploads-admin', subdir);
  fs.mkdirSync(dest, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + (ALLOWED_MIME[file.mimetype] || ''))
  });
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFileFilter
  }).single('image');
}

export function publicUrlFor(subdir, filename) {
  return `/uploads-admin/${subdir}/${filename}`;
}

// Deletes a previously uploaded file given its public URL, but only if it
// actually lives under uploads-admin/ -- guards against a stray absolute
// path or an /assets/ URL ever reaching here and getting unlinked.
export function deleteUploadedFile(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads-admin/')) return;
  const rel = url.replace(/^\/+/, '');
  const abs = path.join(ROOT, rel);
  if (!abs.startsWith(path.join(ROOT, 'uploads-admin'))) return; // path traversal guard
  fs.unlink(abs, () => {}); // best-effort, ignore ENOENT etc.
}
