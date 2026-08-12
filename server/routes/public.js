// Public, read-only API consumed by index.html on page load. Field names
// are chosen to match what the frontend's renderVals() already expects
// (cat, tag, unique, sizes, desc, wide...) to keep the template diff small.

import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

const BOOLEAN_SETTINGS = new Set(['banner_visible']);

function loadSettings(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const row of rows) {
    out[row.key] = BOOLEAN_SETTINGS.has(row.key) ? row.value === 'true' : row.value;
  }
  return out;
}

router.get('/content', (req, res) => {
  const db = getDb();
  const settings = loadSettings(db);
  const categories = db.prepare('SELECT name FROM categories ORDER BY sort_order, id').all().map(r => r.name);
  const customFields = db.prepare('SELECT label, placeholder FROM custom_form_fields ORDER BY sort_order, id').all();
  res.json({ settings, categories, customFields });
});

router.get('/products', (req, res) => {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order, id').all();
  const imgStmt = db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order, id');
  const out = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    cat: p.cat,
    status: p.status,
    unique: !!p.unique_piece,
    tag: p.badge || '',
    sizes: JSON.parse(p.sizes || '[]'),
    desc: p.description || '',
    materials: p.materials || '',
    shippingReturns: p.shipping_returns || '',
    featured: !!p.featured,
    images: imgStmt.all(p.id).map(r => r.url)
  }));
  res.json(out);
});

router.get('/archives', (req, res) => {
  const db = getDb();
  const archives = db.prepare('SELECT * FROM archive_entries ORDER BY sort_order, id').all();
  const photoStmt = db.prepare('SELECT url, label FROM archive_photos WHERE archive_id = ? ORDER BY sort_order, id');
  const out = archives.map(a => ({
    id: a.id,
    title: a.title,
    credit: a.credit,
    desc: a.description || '',
    text: a.long_text || '',
    cover: a.cover_image_url || null,
    wide: !!a.wide,
    photos: photoStmt.all(a.id)
  }));
  res.json(out);
});

export default router;
