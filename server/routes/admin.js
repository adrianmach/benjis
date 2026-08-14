// API admin protegida. Montada en /api/admin detrás de requireAdmin (ver
// server/index.js) -- todas las rutas de este archivo asumen que quien
// llama ya está autenticado.

import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { supabase, uploadImage, deleteImageByUrl } from '../supabase.js';
import { heroUpload, imageUpload, runUpload, ROOT } from '../lib/upload.js';
import { SETTINGS_KEYS, BOOLEAN_SETTINGS } from '../lib/settings.js';

const router = Router();

// Envuelve un handler async: si la promesa rechaza, responde 500 en vez de
// dejar el rechazo sin manejar (Express 4 no hace esto solo).
function ah(fn) {
  return (req, res) => {
    fn(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) res.status(500).json({ error: err.message || 'Error interno.' });
    });
  };
}

// ---------------------------------------------------------------- settings

router.get('/settings', ah(async (req, res) => {
  const { data, error } = await supabase.from('benjis_content').select('key, value').neq('key', 'custom_form_fields');
  if (error) throw error;
  const out = {};
  for (const row of data) out[row.key] = BOOLEAN_SETTINGS.has(row.key) ? row.value === 'true' : row.value;
  res.json(out);
}));

router.put('/settings', ah(async (req, res) => {
  const body = req.body || {};
  const validKeys = new Set(SETTINGS_KEYS);
  const applied = {};
  const rows = [];
  for (const [key, value] of Object.entries(body)) {
    if (!validKeys.has(key)) continue;
    rows.push({ key, value: typeof value === 'boolean' ? String(value) : String(value ?? '') });
    applied[key] = value;
  }
  if (rows.length) {
    const { error } = await supabase.from('benjis_content').upsert(rows);
    if (error) throw error;
  }
  res.json({ ok: true, applied });
}));

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

router.post('/media/hero/:slot', ah(async (req, res) => {
  const slot = HERO_SLOTS[req.params.slot];
  if (!slot) return res.status(400).json({ error: 'Slot inválido.' });
  if (!(await runUpload(heroUpload, req, res))) return;
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
  if (req.file.mimetype !== slot.mime) {
    const wanted = slot.mime === 'image/png' ? 'PNG' : 'JPG';
    return res.status(400).json({ error: `Esta imagen debe subirse como ${wanted} (mismo formato que el archivo original) para no romper el sitio.` });
  }
  fs.writeFileSync(path.join(ROOT, 'assets', slot.file), req.file.buffer);
  res.json({ ok: true, url: `/assets/${slot.file}?v=${Date.now()}` });
}));

// -------------------------------------------------------------- about/custom
// Single-image settings (no son su propia fila en la base): se guardan como
// una URL bajo la key correspondiente de benjis_content.*_image_url.

const SINGLE_IMAGE_TARGETS = {
  'about-proceso': { subdir: 'about', settingKey: 'about_proceso_image_url' },
  'about-materiales': { subdir: 'about', settingKey: 'about_materiales_image_url' },
  'about-sobremi': { subdir: 'about', settingKey: 'about_sobremi_image_url' },
  custom: { subdir: 'custom', settingKey: 'custom_image_url' },
  gallery: { subdir: 'gallery', settingKey: 'gallery_image_url' }
};

router.post('/media/:target', ah(async (req, res) => {
  const target = SINGLE_IMAGE_TARGETS[req.params.target];
  if (!target) return res.status(400).json({ error: 'Destino de imagen inválido.' });
  if (!(await runUpload(imageUpload, req, res))) return;
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });

  const { data: prevRow } = await supabase.from('benjis_content').select('value').eq('key', target.settingKey).maybeSingle();
  const url = await uploadImage(target.subdir, req.file);
  const { error } = await supabase.from('benjis_content').upsert({ key: target.settingKey, value: url });
  if (error) throw error;
  if (prevRow?.value) await deleteImageByUrl(prevRow.value);
  res.json({ ok: true, url });
}));

// ------------------------------------------------------------------ products

function serializeProduct(p) {
  return {
    id: Number(p.id), name: p.name, price: p.price, cat: p.cat, status: p.status,
    unique: !!p.unique_piece, badge: p.badge || '', sizes: p.sizes || [],
    description: p.description || '', materials: p.materials || '', shippingReturns: p.shipping_returns || '',
    featured: !!p.featured, onSale: !!p.on_sale, salePrice: p.sale_price, sortOrder: p.sort_order,
    images: (p.images || []).map(img => ({ id: img.id, url: img.url }))
  };
}

router.get('/products', ah(async (req, res) => {
  const { data, error } = await supabase.from('benjis_products').select('*').order('sort_order').order('id');
  if (error) throw error;
  res.json(data.map(serializeProduct));
}));

router.post('/products', ah(async (req, res) => {
  const b = req.body || {};
  if (!b.name || !String(b.name).trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  const { data: maxRow } = await supabase.from('benjis_products').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase.from('benjis_products').insert({
    name: String(b.name).trim(),
    price: b.price === '' || b.price === null || b.price === undefined ? null : Number(b.price),
    cat: b.cat || '', status: b.status || 'published', unique_piece: !!b.unique, badge: b.badge || null,
    sizes: Array.isArray(b.sizes) ? b.sizes : [],
    description: b.description || '', materials: b.materials || '', shipping_returns: b.shippingReturns || '',
    featured: !!b.featured, on_sale: !!b.onSale,
    sale_price: b.salePrice === '' || b.salePrice === null || b.salePrice === undefined ? null : Number(b.salePrice),
    sort_order: (maxRow?.sort_order ?? -1) + 1
  }).select().single();
  if (error) throw error;
  res.status(201).json(serializeProduct(data));
}));

router.put('/products/:id', ah(async (req, res) => {
  const { data: existing, error: getErr } = await supabase.from('benjis_products').select('*').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado.' });
  const b = req.body || {};
  const patch = {
    name: b.name !== undefined ? String(b.name).trim() : existing.name,
    price: b.price === '' || b.price === null ? null : (b.price !== undefined ? Number(b.price) : existing.price),
    cat: b.cat !== undefined ? b.cat : existing.cat,
    status: b.status !== undefined ? b.status : existing.status,
    unique_piece: b.unique !== undefined ? !!b.unique : existing.unique_piece,
    badge: b.badge !== undefined ? (b.badge || null) : existing.badge,
    sizes: b.sizes !== undefined ? (Array.isArray(b.sizes) ? b.sizes : []) : existing.sizes,
    description: b.description !== undefined ? b.description : existing.description,
    materials: b.materials !== undefined ? b.materials : existing.materials,
    shipping_returns: b.shippingReturns !== undefined ? b.shippingReturns : existing.shipping_returns,
    featured: b.featured !== undefined ? !!b.featured : existing.featured,
    on_sale: b.onSale !== undefined ? !!b.onSale : existing.on_sale,
    sale_price: b.salePrice === '' || b.salePrice === null ? null : (b.salePrice !== undefined ? Number(b.salePrice) : existing.sale_price)
  };
  const { data, error } = await supabase.from('benjis_products').update(patch).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json(serializeProduct(data));
}));

router.delete('/products/:id', ah(async (req, res) => {
  const { data: existing, error: getErr } = await supabase.from('benjis_products').select('images').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado.' });
  const { error } = await supabase.from('benjis_products').delete().eq('id', req.params.id);
  if (error) throw error;
  await Promise.all((existing.images || []).map(img => deleteImageByUrl(img.url)));
  res.json({ ok: true });
}));

router.post('/products/reorder', ah(async (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  await Promise.all(order.map((id, i) => supabase.from('benjis_products').update({ sort_order: i }).eq('id', id)));
  res.json({ ok: true });
}));

router.post('/products/:id/images', ah(async (req, res) => {
  const { data: product, error: getErr } = await supabase.from('benjis_products').select('images').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });
  if (!(await runUpload(imageUpload, req, res))) return;
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });

  const url = await uploadImage('products', req.file);
  const image = { id: crypto.randomUUID(), url };
  const { error } = await supabase.from('benjis_products').update({ images: [...(product.images || []), image] }).eq('id', req.params.id);
  if (error) throw error;
  res.status(201).json(image);
}));

router.delete('/products/:id/images/:imageId', ah(async (req, res) => {
  const { data: product, error: getErr } = await supabase.from('benjis_products').select('images').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  const img = product?.images?.find(i => i.id === req.params.imageId);
  if (!product || !img) return res.status(404).json({ error: 'Imagen no encontrada.' });
  const { error } = await supabase.from('benjis_products').update({ images: product.images.filter(i => i.id !== req.params.imageId) }).eq('id', req.params.id);
  if (error) throw error;
  await deleteImageByUrl(img.url);
  res.json({ ok: true });
}));

router.post('/products/:id/images/reorder', ah(async (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  const { data: product, error: getErr } = await supabase.from('benjis_products').select('images').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });
  const byId = new Map((product.images || []).map(i => [i.id, i]));
  const images = order.map(id => byId.get(id)).filter(Boolean);
  const { error } = await supabase.from('benjis_products').update({ images }).eq('id', req.params.id);
  if (error) throw error;
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- categories

router.get('/categories', ah(async (req, res) => {
  const { data, error } = await supabase.from('benjis_categories').select('id, name, sort_order').order('sort_order').order('id');
  if (error) throw error;
  res.json(data.map(c => ({ id: Number(c.id), name: c.name, sortOrder: c.sort_order })));
}));

router.post('/categories', ah(async (req, res) => {
  const name = (req.body?.name || '').trim().toUpperCase();
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  const { data: maxRow } = await supabase.from('benjis_categories').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const sortOrder = (maxRow?.sort_order ?? -1) + 1;
  const { data, error } = await supabase.from('benjis_categories').insert({ name, sort_order: sortOrder }).select().single();
  if (error) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre.' });
  res.status(201).json({ id: Number(data.id), name: data.name, sortOrder: data.sort_order });
}));

router.put('/categories/:id', ah(async (req, res) => {
  const name = (req.body?.name || '').trim().toUpperCase();
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  const { data, error } = await supabase.from('benjis_categories').update({ name }).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre.' });
  if (!data) return res.status(404).json({ error: 'Categoría no encontrada.' });
  res.json({ ok: true });
}));

router.delete('/categories/:id', ah(async (req, res) => {
  const { data, error } = await supabase.from('benjis_categories').delete().eq('id', req.params.id).select().maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Categoría no encontrada.' });
  res.json({ ok: true });
}));

router.post('/categories/reorder', ah(async (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  await Promise.all(order.map((id, i) => supabase.from('benjis_categories').update({ sort_order: i }).eq('id', id)));
  res.json({ ok: true });
}));

// ------------------------------------------------------------- custom fields
// Viven como un array JSON bajo benjis_content.key = 'custom_form_fields'
// (antes era su propia tabla, custom_form_fields).

async function loadCustomFields() {
  const { data, error } = await supabase.from('benjis_content').select('value').eq('key', 'custom_form_fields').maybeSingle();
  if (error) throw error;
  return data?.value ? JSON.parse(data.value) : [];
}

async function saveCustomFields(fields) {
  const { error } = await supabase.from('benjis_content').upsert({ key: 'custom_form_fields', value: JSON.stringify(fields) });
  if (error) throw error;
}

router.get('/custom-fields', ah(async (req, res) => {
  const fields = await loadCustomFields();
  res.json(fields.map((f, i) => ({ id: f.id, label: f.label, placeholder: f.placeholder || '', sortOrder: i })));
}));

router.post('/custom-fields', ah(async (req, res) => {
  const label = (req.body?.label || '').trim();
  if (!label) return res.status(400).json({ error: 'El label es obligatorio.' });
  const fields = await loadCustomFields();
  const field = { id: crypto.randomUUID(), label, placeholder: req.body?.placeholder || '' };
  fields.push(field);
  await saveCustomFields(fields);
  res.status(201).json({ id: field.id, label: field.label, placeholder: field.placeholder, sortOrder: fields.length - 1 });
}));

router.put('/custom-fields/:id', ah(async (req, res) => {
  const label = (req.body?.label || '').trim();
  if (!label) return res.status(400).json({ error: 'El label es obligatorio.' });
  const fields = await loadCustomFields();
  const idx = fields.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Campo no encontrado.' });
  fields[idx] = { ...fields[idx], label, placeholder: req.body?.placeholder || '' };
  await saveCustomFields(fields);
  res.json({ ok: true });
}));

router.delete('/custom-fields/:id', ah(async (req, res) => {
  const fields = await loadCustomFields();
  const next = fields.filter(f => f.id !== req.params.id);
  if (next.length === fields.length) return res.status(404).json({ error: 'Campo no encontrado.' });
  await saveCustomFields(next);
  res.json({ ok: true });
}));

router.post('/custom-fields/reorder', ah(async (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  const fields = await loadCustomFields();
  const byId = new Map(fields.map(f => [f.id, f]));
  await saveCustomFields(order.map(id => byId.get(id)).filter(Boolean));
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ archives

function serializeArchive(a) {
  return {
    id: Number(a.id), title: a.title, credit: a.credit, description: a.description || '',
    longText: a.long_text || '', coverImageUrl: a.cover_image_url || '', wide: !!a.wide,
    sortOrder: a.sort_order,
    photos: (a.photos || []).map(ph => ({ id: ph.id, url: ph.url, label: ph.label || '' }))
  };
}

router.get('/archives', ah(async (req, res) => {
  const { data, error } = await supabase.from('benjis_archives').select('*').order('sort_order').order('id');
  if (error) throw error;
  res.json(data.map(serializeArchive));
}));

router.post('/archives', ah(async (req, res) => {
  const b = req.body || {};
  if (!b.title || !String(b.title).trim()) return res.status(400).json({ error: 'El título es obligatorio.' });
  const { data: maxRow } = await supabase.from('benjis_archives').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase.from('benjis_archives').insert({
    title: String(b.title).trim(), credit: b.credit || '', description: b.description || '',
    long_text: b.longText || '', cover_image_url: null, wide: !!b.wide, sort_order: (maxRow?.sort_order ?? -1) + 1
  }).select().single();
  if (error) throw error;
  res.status(201).json(serializeArchive(data));
}));

router.put('/archives/:id', ah(async (req, res) => {
  const { data: existing, error: getErr } = await supabase.from('benjis_archives').select('*').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  if (!existing) return res.status(404).json({ error: 'Entrada no encontrada.' });
  const b = req.body || {};
  const patch = {
    title: b.title !== undefined ? String(b.title).trim() : existing.title,
    credit: b.credit !== undefined ? b.credit : existing.credit,
    description: b.description !== undefined ? b.description : existing.description,
    long_text: b.longText !== undefined ? b.longText : existing.long_text,
    wide: b.wide !== undefined ? !!b.wide : existing.wide
  };
  const { data, error } = await supabase.from('benjis_archives').update(patch).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json(serializeArchive(data));
}));

router.delete('/archives/:id', ah(async (req, res) => {
  const { data: existing, error: getErr } = await supabase.from('benjis_archives').select('cover_image_url, photos').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  if (!existing) return res.status(404).json({ error: 'Entrada no encontrada.' });
  const { error } = await supabase.from('benjis_archives').delete().eq('id', req.params.id);
  if (error) throw error;
  if (existing.cover_image_url) await deleteImageByUrl(existing.cover_image_url);
  await Promise.all((existing.photos || []).map(p => deleteImageByUrl(p.url)));
  res.json({ ok: true });
}));

router.post('/archives/reorder', ah(async (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  await Promise.all(order.map((id, i) => supabase.from('benjis_archives').update({ sort_order: i }).eq('id', id)));
  res.json({ ok: true });
}));

router.post('/archives/:id/cover', ah(async (req, res) => {
  const { data: entry, error: getErr } = await supabase.from('benjis_archives').select('cover_image_url').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  if (!entry) return res.status(404).json({ error: 'Entrada no encontrada.' });
  if (!(await runUpload(imageUpload, req, res))) return;
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });

  const url = await uploadImage('archives', req.file);
  const { error } = await supabase.from('benjis_archives').update({ cover_image_url: url }).eq('id', req.params.id);
  if (error) throw error;
  if (entry.cover_image_url) await deleteImageByUrl(entry.cover_image_url);
  res.json({ ok: true, url });
}));

router.post('/archives/:id/photos', ah(async (req, res) => {
  const { data: entry, error: getErr } = await supabase.from('benjis_archives').select('photos').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  if (!entry) return res.status(404).json({ error: 'Entrada no encontrada.' });
  if (!(await runUpload(imageUpload, req, res))) return;
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });

  const url = await uploadImage('archives', req.file);
  const photo = { id: crypto.randomUUID(), url, label: req.body?.label || '' };
  const { error } = await supabase.from('benjis_archives').update({ photos: [...(entry.photos || []), photo] }).eq('id', req.params.id);
  if (error) throw error;
  res.status(201).json(photo);
}));

router.delete('/archives/:id/photos/:photoId', ah(async (req, res) => {
  const { data: entry, error: getErr } = await supabase.from('benjis_archives').select('photos').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  const photo = entry?.photos?.find(p => p.id === req.params.photoId);
  if (!entry || !photo) return res.status(404).json({ error: 'Foto no encontrada.' });
  const { error } = await supabase.from('benjis_archives').update({ photos: entry.photos.filter(p => p.id !== req.params.photoId) }).eq('id', req.params.id);
  if (error) throw error;
  await deleteImageByUrl(photo.url);
  res.json({ ok: true });
}));

router.post('/archives/:id/photos/reorder', ah(async (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) return res.status(400).json({ error: 'Falta la lista "order".' });
  const { data: entry, error: getErr } = await supabase.from('benjis_archives').select('photos').eq('id', req.params.id).maybeSingle();
  if (getErr) throw getErr;
  if (!entry) return res.status(404).json({ error: 'Entrada no encontrada.' });
  const byId = new Map((entry.photos || []).map(p => [p.id, p]));
  const photos = order.map(id => byId.get(id)).filter(Boolean);
  const { error } = await supabase.from('benjis_archives').update({ photos }).eq('id', req.params.id);
  if (error) throw error;
  res.json({ ok: true });
}));

// --------------------------------------------------------------------- orders

router.get('/orders', ah(async (req, res) => {
  const { data, error } = await supabase.from('benjis_orders').select('*').order('id', { ascending: false });
  if (error) throw error;
  res.json(data.map(o => ({
    id: Number(o.id), name: o.name, email: o.email, phone: o.phone, address: o.address,
    items: o.items || [], total: o.total, status: o.status,
    shippingMethod: o.shipping_method, shippingNotes: o.shipping_notes, shippingCost: o.shipping_cost,
    mpPreferenceId: o.mp_preference_id, mpPaymentId: o.mp_payment_id, createdAt: o.created_at
  })));
}));

const ORDER_STATUSES = new Set(['pendiente', 'aprobado', 'rechazado']);

router.put('/orders/:id', ah(async (req, res) => {
  const status = req.body?.status;
  if (!ORDER_STATUSES.has(status)) return res.status(400).json({ error: 'Estado inválido.' });
  const { data, error } = await supabase.from('benjis_orders').update({ status }).eq('id', req.params.id).select().maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Pedido no encontrado.' });
  res.json({ ok: true });
}));

export default router;
