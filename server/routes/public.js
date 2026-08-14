// Público, solo lectura, consumido por index.html al cargar la página. Los
// nombres de campo están elegidos para calzar con lo que ya espera
// renderVals() en el frontend (cat, tag, unique, sizes, desc, wide...).

import { Router } from 'express';
import { supabase } from '../supabase.js';
import { BOOLEAN_SETTINGS } from '../lib/settings.js';

const router = Router();

router.get('/content', async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('benjis_content').select('key, value');
    if (error) throw error;

    const settings = {};
    let customFields = [];
    for (const row of rows) {
      if (row.key === 'custom_form_fields') {
        customFields = JSON.parse(row.value || '[]').map(f => ({ label: f.label, placeholder: f.placeholder || '' }));
        continue;
      }
      settings[row.key] = BOOLEAN_SETTINGS.has(row.key) ? row.value === 'true' : row.value;
    }

    const { data: categories, error: catErr } = await supabase
      .from('benjis_categories').select('name').order('sort_order').order('id');
    if (catErr) throw catErr;

    res.json({ settings, categories: categories.map(c => c.name), customFields });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase.from('benjis_products').select('*').order('sort_order').order('id');
    if (error) throw error;
    res.json(data.map(p => ({
      id: Number(p.id),
      name: p.name,
      price: p.price,
      cat: p.cat,
      status: p.status,
      unique: !!p.unique_piece,
      tag: p.badge || '',
      sizes: p.sizes || [],
      desc: p.description || '',
      materials: p.materials || '',
      shippingReturns: p.shipping_returns || '',
      featured: !!p.featured,
      images: (p.images || []).map(img => img.url)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/archives', async (req, res) => {
  try {
    const { data, error } = await supabase.from('benjis_archives').select('*').order('sort_order').order('id');
    if (error) throw error;
    res.json(data.map(a => ({
      id: Number(a.id),
      title: a.title,
      credit: a.credit,
      desc: a.description || '',
      text: a.long_text || '',
      cover: a.cover_image_url || null,
      wide: !!a.wide,
      photos: (a.photos || []).map(ph => ({ url: ph.url, label: ph.label || '' }))
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
