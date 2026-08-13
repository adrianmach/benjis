// Protected admin API. Mounted at /api/admin behind requireAdmin
// (see server/index.js) -- every route in this file assumes the caller
// is already authenticated.

import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { getDb, SETTINGS_KEYS } from '../db.js';
import { heroUpload, genericUpload, publicUrlFor, deleteUploadedFile, ROOT } from '../lib/upload.js';

const router = Router();

const BOOLEAN_SETTINGS = new Set(['banner_visible']);

function multerErrorHandler(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'No se pudo procesar el archivo.' });
      next();
    });
  };
}

// ---------------------------------------------------------------- settings

router.get('/settings', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const row of rows) out[row.key] = BOOLEAN_SETTINGS.has(row.key) ? row.value === 'true' : row.value;
  res.json(out);
});

router.put('/settings', (req, res) => {
  const body = req.body || {};
  const db = getDb();
  const stmt = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
  const validKeys = new Set(SETTINGS_KEYS);
  const applied = {};
  for (const [key, value] of Object.entries(body)) {
    if (!validKeys.has(key)) continue;
    const stored = typeof value === 'boolean' ? String(value) : String(value ?? '');
    stmt.run(key, stored);
    applied[key] = value;
  }
  res.json({ ok: true, applied });
});

// ---------------------------------------------- hero / gallery (fixed slots)

const HERO_SLOTS = {
  1: { file: 'hero-modelo1.jpg', mime: 'image/jpeg', label: 'Hero — modelo 1 / Galería 1' },
  2: { file: 'hero-flatlay.jpg', mime: 'image/jpeg', label: 'Hero — flatlay' },
  3: { file: 'hero-modelo2.jpg', mime: 'image/jpeg', label: 'Hero — modelo 2 / Galería 2' },
  4: { file: 'hero-modelo3.png', mime: 'image/png', label: 'Hero — modelo 3 / Galería 3' }
};

router.get('/hero-slots', (req, res) => {
  const out = Object.entries(HERO_SLOTS).map(([slot, meta]) => ({
    slot: Number(slot), label: meta.label, url: `/assets/${meta.file}`, format: meta.mime === 'image/png' ? 'PNG' : 'JPG'
  }));
  res.json(out);
});

router.post('/media/hero/:slot', multerErrorHandler(heroUpload), (req, res) => {
  const slot = HERO_SLOTS[req.params.slot];
  if (!slot) return res.status(400).json({ error: 'Slot inválido.' });
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
  if (req.file.mimetype !== slot.mime) {
    const wanted = slot.mime === 'image/png' ? 'PNG' : 'JPG';
    return res.status(400).json({ error: `Esta imagen debe subirse como ${wanted} (mismo formato que el archivo original) para no romper el sitio.` });
  }
  fs.writeFileSync(path.join(ROOT, 'assets', slot.file), req.file.buffer);
  res.json({ ok: true, url: `/assets/${slot.file}?v=${Date.now()}` });
});

// -------------------------------------------------------------- about/custom
// Single-image settings (not their own DB rows): stored as a URL under the
// corresponding settings.*_image_url key.

const SINGLE_IMAGE_TARGETS = {
  'about-proceso': { subdir: 'about', settingKey: 'about_proceso_image_url' },
  'about-materiales': { subdir: 'about', settingKey: 'about_materiales_image_url' },
  custom: { subdir: 'custom', settingKey: 'custom_image_url' }
};

router.post('/media/:target', (req, res, next) => {
  const target = SINGLE_IMAGE_TARGETS[req.params.target];
  if (!target) return res.status(400).json({ error: 'Destino de imagen inválido.' });
  multerErrorHandler(genericUpload(target.subdir))(req, res, () => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    const db = getDb();
    const prev = db.prepare('SELECT value FROM settings WHERE key = ?').get(target.settingKey);
    const url = publicUrlFor(target.subdir, req.file.filename);
    db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(target.settingKey, url);
    if (prev?.value) deleteUploadedFile(prev.value);
    res.json({ ok: true, url });
  });
});

// ------------------------------------------------------------------ products

function serializeProduct(p, db) {
  const images = db.prepare('SELECT id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order, id').all(p.id);
  return {
    id: p.id, name: p.name, price: p.price, cat: p.cat, status: p.status,
    unique: !!p.unique_piece, badge: p.badge || '', sizes: JSON.parse(p.sizes || '[]'),
    description: p.description || '', materials: p.materials || '', shippingReturns: p.shipping_returns || '',
    featured: !!p.featured, sortOrder: p.sort_order, images
  };
}

router.get('/products', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM products ORDER BY sort_order, id').all();
  res.json(rows.map(p => serializeProduct(p, db)));
});

router.post('/products', (req, res) => {
  const b = req.body || {};
  if (!b.name || !String(b.name).trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  const db = getDb();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM products').get().m;
  const info = db.prepare(`INSERT INTO products
    (name, price, cat, status, unique_piece, badge, sizes, description, materials, shipping_returns, featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    String(b.name).trim(),
    b.price === '' || b.price === null || b.price === undefined ? null : Number(b.price),
    b.cat || '', b.status || 'published', b.unique ? 1 : 0, b.badge || null,
    JSON.stringify(Array.isArray(b.sizes) ? b.sizes : []),
    b.description || '', b.materials || '', b.shippingReturns || '',
    b.featured ? 1 : 0, maxOrder + 1
  );
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(serializeProduct(row, db));
});

router.put('/products/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado.' });
  const b = req.body || {};
  db.prepare(`UPDATE products SET
      name = ?, price = ?, cat = ?, status = ?, unique_piece = ?, badge = ?, sizes = ?,
      description = ?, materials = ?, shipping_returns = ?, featured = ?
    WHERE id = ?`).run(
    b.name !== undefined ? String(b.name).trim() : existing.name,
    b.price === '' || b.price === null ? null : (b.price !== undefined ? Number(b.price) : existing.price),
    b.cat !== undefined ? b.cat : existing.cat,
    b.status !== undefined ? b.status : existing.status,
    b.unique !== undefined ? (b.unique ? 1 : 0) : existing.unique_piece,
    b.badge !== undefined ? (b.badge || null) : existing.badge,
    b.sizes !== undefined ? JSON.stringify(Array.isArray(b.sizes) ? b.sizes : []) : existing.sizes,
    b.description !== undefined ? b.description : existing.description,
    b.materials !== undefined ? b.materials : existing.materials,
    b.shippingReturns !== undefined ? b.shippingReturns : existing.shipping_returns,
    b.featured !== undefined ? (b.featured ? 1 : 0) : existing.featured,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(serializeProduct(row, db));
});

router.delete('/products/:id', (req, res) => {
  const db = getDb();
  const images = db.prepare('SELECT url FROM product_images WHERE product_id = ?').all(req.params.id);
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Producto no encontrado.' });
  images.forEach(img => deleteUploadedFile(img.url));
  res.json({ ok: true });
});

router.post('/products/reorder', (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  const db = getDb();
  const stmt = db.prepare('UPDATE products SET sort_order = ? WHERE id = ?');
  order.forEach((id, i) => stmt.run(i, id));
  res.json({ ok: true });
});

router.post('/products/:id/images', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });
  multerErrorHandler(genericUpload('products'))(req, res, () => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    const url = publicUrlFor('products', req.file.filename);
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM product_images WHERE product_id = ?').get(req.params.id).m;
    const info = db.prepare('INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)').run(req.params.id, url, maxOrder + 1);
    res.status(201).json({ id: info.lastInsertRowid, url });
  });
});

router.delete('/products/:id/images/:imageId', (req, res) => {
  const db = getDb();
  const img = db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(req.params.imageId, req.params.id);
  if (!img) return res.status(404).json({ error: 'Imagen no encontrada.' });
  db.prepare('DELETE FROM product_images WHERE id = ?').run(req.params.imageId);
  deleteUploadedFile(img.url);
  res.json({ ok: true });
});

router.post('/products/:id/images/reorder', (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  const db = getDb();
  const stmt = db.prepare('UPDATE product_images SET sort_order = ? WHERE id = ? AND product_id = ?');
  order.forEach((id, i) => stmt.run(i, id, req.params.id));
  res.json({ ok: true });
});

// ---------------------------------------------------------------- categories

router.get('/categories', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT id, name, sort_order AS sortOrder FROM categories ORDER BY sort_order, id').all());
});

router.post('/categories', (req, res) => {
  const name = (req.body?.name || '').trim().toUpperCase();
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  const db = getDb();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM categories').get().m;
  try {
    const info = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(name, maxOrder + 1);
    res.status(201).json({ id: info.lastInsertRowid, name, sortOrder: maxOrder + 1 });
  } catch (err) {
    res.status(400).json({ error: 'Ya existe una categoría con ese nombre.' });
  }
});

router.put('/categories/:id', (req, res) => {
  const name = (req.body?.name || '').trim().toUpperCase();
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  const db = getDb();
  try {
    const info = db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Categoría no encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Ya existe una categoría con ese nombre.' });
  }
});

router.delete('/categories/:id', (req, res) => {
  const db = getDb();
  const info = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Categoría no encontrada.' });
  res.json({ ok: true });
});

router.post('/categories/reorder', (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  const db = getDb();
  const stmt = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
  order.forEach((id, i) => stmt.run(i, id));
  res.json({ ok: true });
});

// ------------------------------------------------------------- custom fields

router.get('/custom-fields', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT id, label, placeholder, sort_order AS sortOrder FROM custom_form_fields ORDER BY sort_order, id').all());
});

router.post('/custom-fields', (req, res) => {
  const label = (req.body?.label || '').trim();
  if (!label) return res.status(400).json({ error: 'El label es obligatorio.' });
  const db = getDb();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM custom_form_fields').get().m;
  const info = db.prepare('INSERT INTO custom_form_fields (label, placeholder, sort_order) VALUES (?, ?, ?)').run(label, req.body?.placeholder || '', maxOrder + 1);
  res.status(201).json({ id: info.lastInsertRowid, label, placeholder: req.body?.placeholder || '', sortOrder: maxOrder + 1 });
});

router.put('/custom-fields/:id', (req, res) => {
  const label = (req.body?.label || '').trim();
  if (!label) return res.status(400).json({ error: 'El label es obligatorio.' });
  const db = getDb();
  const info = db.prepare('UPDATE custom_form_fields SET label = ?, placeholder = ? WHERE id = ?').run(label, req.body?.placeholder || '', req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Campo no encontrado.' });
  res.json({ ok: true });
});

router.delete('/custom-fields/:id', (req, res) => {
  const db = getDb();
  const info = db.prepare('DELETE FROM custom_form_fields WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Campo no encontrado.' });
  res.json({ ok: true });
});

router.post('/custom-fields/reorder', (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  const db = getDb();
  const stmt = db.prepare('UPDATE custom_form_fields SET sort_order = ? WHERE id = ?');
  order.forEach((id, i) => stmt.run(i, id));
  res.json({ ok: true });
});

// ------------------------------------------------------------------ archives

function serializeArchive(a, db) {
  const photos = db.prepare('SELECT id, url, label, sort_order AS sortOrder FROM archive_photos WHERE archive_id = ? ORDER BY sort_order, id').all(a.id);
  return {
    id: a.id, title: a.title, credit: a.credit, description: a.description || '',
    longText: a.long_text || '', coverImageUrl: a.cover_image_url || '', wide: !!a.wide,
    sortOrder: a.sort_order, photos
  };
}

router.get('/archives', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM archive_entries ORDER BY sort_order, id').all();
  res.json(rows.map(a => serializeArchive(a, db)));
});

router.post('/archives', (req, res) => {
  const b = req.body || {};
  if (!b.title || !String(b.title).trim()) return res.status(400).json({ error: 'El título es obligatorio.' });
  const db = getDb();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM archive_entries').get().m;
  const info = db.prepare(`INSERT INTO archive_entries (title, credit, description, long_text, cover_image_url, wide, sort_order)
    VALUES (?, ?, ?, ?, NULL, ?, ?)`).run(String(b.title).trim(), b.credit || '', b.description || '', b.longText || '', b.wide ? 1 : 0, maxOrder + 1);
  const row = db.prepare('SELECT * FROM archive_entries WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(serializeArchive(row, db));
});

router.put('/archives/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM archive_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Entrada no encontrada.' });
  const b = req.body || {};
  db.prepare(`UPDATE archive_entries SET title = ?, credit = ?, description = ?, long_text = ?, wide = ? WHERE id = ?`).run(
    b.title !== undefined ? String(b.title).trim() : existing.title,
    b.credit !== undefined ? b.credit : existing.credit,
    b.description !== undefined ? b.description : existing.description,
    b.longText !== undefined ? b.longText : existing.long_text,
    b.wide !== undefined ? (b.wide ? 1 : 0) : existing.wide,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM archive_entries WHERE id = ?').get(req.params.id);
  res.json(serializeArchive(row, db));
});

router.delete('/archives/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM archive_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Entrada no encontrada.' });
  const photos = db.prepare('SELECT url FROM archive_photos WHERE archive_id = ?').all(req.params.id);
  db.prepare('DELETE FROM archive_entries WHERE id = ?').run(req.params.id);
  if (existing.cover_image_url) deleteUploadedFile(existing.cover_image_url);
  photos.forEach(p => deleteUploadedFile(p.url));
  res.json({ ok: true });
});

router.post('/archives/reorder', (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  const db = getDb();
  const stmt = db.prepare('UPDATE archive_entries SET sort_order = ? WHERE id = ?');
  order.forEach((id, i) => stmt.run(i, id));
  res.json({ ok: true });
});

router.post('/archives/:id/cover', (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM archive_entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entrada no encontrada.' });
  multerErrorHandler(genericUpload('archives'))(req, res, () => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    const url = publicUrlFor('archives', req.file.filename);
    db.prepare('UPDATE archive_entries SET cover_image_url = ? WHERE id = ?').run(url, req.params.id);
    if (entry.cover_image_url) deleteUploadedFile(entry.cover_image_url);
    res.json({ ok: true, url });
  });
});

router.post('/archives/:id/photos', (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT id FROM archive_entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entrada no encontrada.' });
  multerErrorHandler(genericUpload('archives'))(req, res, () => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    const url = publicUrlFor('archives', req.file.filename);
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM archive_photos WHERE archive_id = ?').get(req.params.id).m;
    const info = db.prepare('INSERT INTO archive_photos (archive_id, url, label, sort_order) VALUES (?, ?, ?, ?)').run(req.params.id, url, req.body?.label || '', maxOrder + 1);
    res.status(201).json({ id: info.lastInsertRowid, url });
  });
});

router.delete('/archives/:id/photos/:photoId', (req, res) => {
  const db = getDb();
  const photo = db.prepare('SELECT * FROM archive_photos WHERE id = ? AND archive_id = ?').get(req.params.photoId, req.params.id);
  if (!photo) return res.status(404).json({ error: 'Foto no encontrada.' });
  db.prepare('DELETE FROM archive_photos WHERE id = ?').run(req.params.photoId);
  deleteUploadedFile(photo.url);
  res.json({ ok: true });
});

router.post('/archives/:id/photos/reorder', (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  const db = getDb();
  const stmt = db.prepare('UPDATE archive_photos SET sort_order = ? WHERE id = ? AND archive_id = ?');
  order.forEach((id, i) => stmt.run(i, id, req.params.id));
  res.json({ ok: true });
});

// --------------------------------------------------------------------- orders

router.get('/orders', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(rows.map(o => ({
    id: o.id, name: o.name, email: o.email, phone: o.phone, address: o.address,
    items: JSON.parse(o.items || '[]'), total: o.total, status: o.status,
    mpPreferenceId: o.mp_preference_id, mpPaymentId: o.mp_payment_id, createdAt: o.created_at
  })));
});

const ORDER_STATUSES = new Set(['pendiente', 'aprobado', 'rechazado']);

router.put('/orders/:id', (req, res) => {
  const status = req.body?.status;
  if (!ORDER_STATUSES.has(status)) return res.status(400).json({ error: 'Estado inválido.' });
  const db = getDb();
  const info = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Pedido no encontrado.' });
  res.json({ ok: true });
});

export default router;
