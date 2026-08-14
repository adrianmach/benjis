'use strict';

// ------------------------------------------------------------------- utils

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
  }
  if (children) {
    for (const c of [].concat(children)) {
      if (c === null || c === undefined) continue;
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(c) : c);
    }
  }
  return node;
}

function field(label, inputEl) {
  return el('div', { class: 'field' }, [el('label', {}, [label]), inputEl]);
}

function formatThousands(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

async function apiFetch(url, { method = 'GET', body, isForm = false } = {}) {
  const init = { method, credentials: 'include' };
  if (body !== undefined) {
    if (isForm) init.body = body;
    else { init.headers = { 'Content-Type': 'application/json' }; init.body = JSON.stringify(body); }
  }
  const res = await fetch(url, init);
  if (res.status === 401) { renderLogin(); throw new Error('Sesión vencida, volvé a iniciar sesión.'); }
  let data = {};
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error(data.error || ('Error ' + res.status));
  return data;
}

const api = {
  session: () => apiFetch('/api/admin/session'),
  login: (user, password) => apiFetch('/api/admin/login', { method: 'POST', body: { user, password } }),
  logout: () => apiFetch('/api/admin/logout', { method: 'POST' }),

  getSettings: () => apiFetch('/api/admin/settings'),
  putSettings: (patch) => apiFetch('/api/admin/settings', { method: 'PUT', body: patch }),

  getHeroSlots: () => apiFetch('/api/admin/hero-slots'),
  uploadHero: (slot, file) => { const fd = new FormData(); fd.append('image', file); return apiFetch('/api/admin/media/hero/' + slot, { method: 'POST', body: fd, isForm: true }); },
  uploadSingle: (target, file) => { const fd = new FormData(); fd.append('image', file); return apiFetch('/api/admin/media/' + target, { method: 'POST', body: fd, isForm: true }); },

  getProducts: () => apiFetch('/api/admin/products'),
  createProduct: (body) => apiFetch('/api/admin/products', { method: 'POST', body }),
  updateProduct: (id, body) => apiFetch('/api/admin/products/' + id, { method: 'PUT', body }),
  deleteProduct: (id) => apiFetch('/api/admin/products/' + id, { method: 'DELETE' }),
  reorderProducts: (order) => apiFetch('/api/admin/products/reorder', { method: 'POST', body: { order } }),
  uploadProductImage: (id, file) => { const fd = new FormData(); fd.append('image', file); return apiFetch(`/api/admin/products/${id}/images`, { method: 'POST', body: fd, isForm: true }); },
  deleteProductImage: (id, imgId) => apiFetch(`/api/admin/products/${id}/images/${imgId}`, { method: 'DELETE' }),
  reorderProductImages: (id, order) => apiFetch(`/api/admin/products/${id}/images/reorder`, { method: 'POST', body: { order } }),

  getCategories: () => apiFetch('/api/admin/categories'),
  createCategory: (name) => apiFetch('/api/admin/categories', { method: 'POST', body: { name } }),
  updateCategory: (id, name) => apiFetch('/api/admin/categories/' + id, { method: 'PUT', body: { name } }),
  deleteCategory: (id) => apiFetch('/api/admin/categories/' + id, { method: 'DELETE' }),
  reorderCategories: (order) => apiFetch('/api/admin/categories/reorder', { method: 'POST', body: { order } }),

  getCustomFields: () => apiFetch('/api/admin/custom-fields'),
  createCustomField: (body) => apiFetch('/api/admin/custom-fields', { method: 'POST', body }),
  updateCustomField: (id, body) => apiFetch('/api/admin/custom-fields/' + id, { method: 'PUT', body }),
  deleteCustomField: (id) => apiFetch('/api/admin/custom-fields/' + id, { method: 'DELETE' }),
  reorderCustomFields: (order) => apiFetch('/api/admin/custom-fields/reorder', { method: 'POST', body: { order } }),

  getArchives: () => apiFetch('/api/admin/archives'),
  createArchive: (body) => apiFetch('/api/admin/archives', { method: 'POST', body }),
  updateArchive: (id, body) => apiFetch('/api/admin/archives/' + id, { method: 'PUT', body }),
  deleteArchive: (id) => apiFetch('/api/admin/archives/' + id, { method: 'DELETE' }),
  reorderArchives: (order) => apiFetch('/api/admin/archives/reorder', { method: 'POST', body: { order } }),
  uploadArchiveCover: (id, file) => { const fd = new FormData(); fd.append('image', file); return apiFetch(`/api/admin/archives/${id}/cover`, { method: 'POST', body: fd, isForm: true }); },
  uploadArchivePhoto: (id, file) => { const fd = new FormData(); fd.append('image', file); return apiFetch(`/api/admin/archives/${id}/photos`, { method: 'POST', body: fd, isForm: true }); },
  deleteArchivePhoto: (id, photoId) => apiFetch(`/api/admin/archives/${id}/photos/${photoId}`, { method: 'DELETE' }),
  reorderArchivePhotos: (id, order) => apiFetch(`/api/admin/archives/${id}/photos/reorder`, { method: 'POST', body: { order } }),

  getOrders: () => apiFetch('/api/admin/orders'),
  updateOrder: (id, status) => apiFetch('/api/admin/orders/' + id, { method: 'PUT', body: { status } })
};

// -------------------------------------------------------------- generic UI

function buildSettingsForm(main, settings, fields, opts) {
  const wrap = el('div', {});
  const inputs = {};
  fields.forEach(f => {
    const input = f.type === 'textarea' ? el('textarea', { rows: 3 }) : el('input', { type: 'text' });
    input.value = settings[f.key] || '';
    inputs[f.key] = input;
    wrap.appendChild(field(f.label, input));
  });
  const status = el('div', { class: 'status-msg' });
  const saveBtn = el('button', { class: 'btn btn-primary' }, ['Guardar cambios']);
  saveBtn.addEventListener('click', async () => {
    const patch = {};
    fields.forEach(f => { patch[f.key] = inputs[f.key].value; });
    if (opts && opts.extra) Object.assign(patch, opts.extra());
    saveBtn.disabled = true;
    try {
      await api.putSettings(patch);
      status.textContent = 'Guardado.'; status.className = 'status-msg ok';
    } catch (e) {
      status.textContent = e.message; status.className = 'status-msg err';
    }
    saveBtn.disabled = false;
  });
  wrap.appendChild(el('div', { class: 'actions-row' }, [saveBtn]));
  wrap.appendChild(status);
  main.appendChild(wrap);
  return inputs;
}

function imageField(label, currentUrl, onUpload) {
  const wrap = el('div', { class: 'field' });
  wrap.appendChild(el('label', {}, [label]));
  const thumb = el('div', { class: 'thumb', style: 'width:120px;height:150px' });
  if (currentUrl) thumb.appendChild(el('img', { src: currentUrl }));
  wrap.appendChild(thumb);
  const status = el('div', { class: 'status-msg' });
  const fileLabel = el('label', { class: 'btn btn-sm', style: 'margin-top:8px;display:inline-flex;width:fit-content' }, [currentUrl ? 'Reemplazar imagen' : 'Subir imagen']);
  const input = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
  fileLabel.appendChild(input);
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    status.textContent = 'Subiendo…'; status.className = 'status-msg';
    try {
      const { url } = await onUpload(file);
      thumb.innerHTML = '';
      thumb.appendChild(el('img', { src: url }));
      status.textContent = 'Actualizado.'; status.className = 'status-msg ok';
      fileLabel.textContent = ''; fileLabel.appendChild(document.createTextNode('Reemplazar imagen')); fileLabel.appendChild(input);
    } catch (e) {
      status.textContent = e.message; status.className = 'status-msg err';
    }
    input.value = '';
  });
  wrap.appendChild(fileLabel);
  wrap.appendChild(status);
  return wrap;
}

// list of items with ↑/↓ reorder buttons that persist immediately, plus
// per-item delete via the render callback's `removeLocal()`.
function reorderableList(items, { renderItem, onReorder, getId }) {
  const container = el('div', {});
  function move(idx, dir) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const tmp = items[idx]; items[idx] = items[newIdx]; items[newIdx] = tmp;
    onReorder(items.map(getId));
    rebuild();
  }
  function rebuild() {
    container.innerHTML = '';
    items.forEach((item, idx) => {
      const card = el('div', { class: 'list-card' });
      const up = el('button', {}, ['↑']); up.disabled = idx === 0; up.addEventListener('click', () => move(idx, -1));
      const down = el('button', {}, ['↓']); down.disabled = idx === items.length - 1; down.addEventListener('click', () => move(idx, 1));
      card.appendChild(el('div', { class: 'reorder-btns' }, [up, down]));
      const body = el('div', { class: 'list-card-body' });
      body.appendChild(renderItem(item, () => { items.splice(idx, 1); rebuild(); }));
      card.appendChild(body);
      container.appendChild(card);
    });
    if (!items.length) container.appendChild(el('div', { class: 'empty-note' }, ['Todavía no hay nada acá.']));
  }
  rebuild();
  return container;
}

// small ‹/› swap controls rendered inside an image thumbnail, used for
// product images and archive detail photos (both ordered lists of files).
function thumbOrderControls(items, idx, onSwap) {
  if (items.length < 2) return null;
  const row = el('div', { style: 'position:absolute;bottom:4px;left:4px;right:4px;display:flex;justify-content:space-between;gap:4px' });
  const left = el('button', { class: 'btn btn-sm', style: 'padding:2px 6px;flex:1' }, ['‹']);
  left.disabled = idx === 0;
  left.addEventListener('click', (e) => { e.preventDefault(); onSwap(idx, idx - 1); });
  const right = el('button', { class: 'btn btn-sm', style: 'padding:2px 6px;flex:1' }, ['›']);
  right.disabled = idx === items.length - 1;
  right.addEventListener('click', (e) => { e.preventDefault(); onSwap(idx, idx + 1); });
  row.appendChild(left); row.appendChild(right);
  return row;
}

// ------------------------------------------------------------- sections

async function renderBanner(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Banner superior']));
  main.appendChild(el('p', { class: 'section-hint' }, ['Franja de anuncios arriba del header. Los 3 textos se repiten en loop infinito.']));
  const settings = await api.getSettings();

  let visible = !!settings.banner_visible;
  let accent = (settings.accent_color || '#F93A2F').toUpperCase();
  const ACCENT_OPTIONS = ['#F93A2F', '#E7000B', '#FF6B3D', '#D9FF3D'];

  const toggleWrap = el('div', { class: 'toggle-row' });
  const sw = el('div', { class: 'switch' + (visible ? ' on' : '') });
  sw.addEventListener('click', () => { visible = !visible; sw.className = 'switch' + (visible ? ' on' : ''); });
  toggleWrap.appendChild(sw); toggleWrap.appendChild(el('label', {}, ['Banner visible']));
  main.appendChild(toggleWrap);

  const colorField = el('div', { class: 'field' });
  colorField.appendChild(el('label', {}, ['Color de acento (se usa en todo el sitio)']));
  const swatchRow = el('div', { class: 'color-swatches' });
  ACCENT_OPTIONS.forEach(c => {
    const dot = el('div', { class: 'color-swatch' + (c === accent ? ' selected' : ''), style: 'background:' + c });
    dot.addEventListener('click', () => { accent = c; Array.from(swatchRow.children).forEach(ch => ch.classList.remove('selected')); dot.classList.add('selected'); });
    swatchRow.appendChild(dot);
  });
  colorField.appendChild(swatchRow);
  main.appendChild(colorField);

  buildSettingsForm(main, settings, [
    { key: 'banner_text_1', label: 'Texto 1' },
    { key: 'banner_text_2', label: 'Texto 2' },
    { key: 'banner_text_3', label: 'Texto 3' }
  ], { extra: () => ({ banner_visible: visible, accent_color: accent }) });
}

function heroSlotWidget(slot) {
  const wrap = el('div', { class: 'hero-slot' });
  wrap.appendChild(el('div', { class: 'hero-slot-label' }, [slot.label]));
  wrap.appendChild(el('div', { class: 'hero-slot-format' }, ['Formato requerido: ' + slot.format]));
  const preview = el('div', { class: 'hero-slot-preview' }, [el('img', { src: slot.url })]);
  wrap.appendChild(preview);
  const status = el('div', { class: 'status-msg' });
  const label = el('label', { class: 'btn btn-sm', style: 'display:inline-flex;width:fit-content' }, ['Reemplazar imagen']);
  const input = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
  label.appendChild(input);
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    status.textContent = 'Subiendo…'; status.className = 'status-msg';
    try {
      const { url } = await api.uploadHero(slot.slot, file);
      preview.innerHTML = ''; preview.appendChild(el('img', { src: url }));
      status.textContent = 'Actualizado.'; status.className = 'status-msg ok';
    } catch (e) {
      status.textContent = e.message; status.className = 'status-msg err';
    }
    input.value = '';
  });
  wrap.appendChild(label);
  wrap.appendChild(status);
  return wrap;
}

async function renderHero(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Hero']));
  main.appendChild(el('p', { class: 'section-hint' }, ['4 imágenes fijas del hero de Home (parallax + logo animado). Solo se pueden reemplazar, no agregar ni quitar slots.']));
  const slots = await api.getHeroSlots();
  const grid = el('div', { style: 'display:flex;gap:28px;flex-wrap:wrap' });
  slots.forEach(slot => grid.appendChild(heroSlotWidget(slot)));
  main.appendChild(grid);
}

async function renderGallery(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Galería full-bleed']));
  main.appendChild(el('p', { class: 'section-hint' }, ['Sección de Home con una imagen fija de fondo a pantalla completa.']));
  const settings = await api.getSettings();
  main.appendChild(imageField('Imagen de fondo', settings.gallery_image_url || '/assets/hero-modelo1.jpg', file => api.uploadSingle('gallery', file)));
  main.appendChild(el('hr', { class: 'divider' }));
  buildSettingsForm(main, settings, [
    { key: 'gallery_brand_text', label: 'Texto de marca superpuesto' },
    { key: 'gallery_subtitle_text', label: 'Subtítulo superpuesto' }
  ]);
}

async function renderUnicos(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Sección "Únicos 1/1" (Home)']));
  main.appendChild(el('p', { class: 'section-hint' }, ['Título, párrafo y link. Las 2 imágenes se toman automáticamente de los primeros 2 productos marcados "Pieza única" en Productos — no se cargan acá.']));
  const settings = await api.getSettings();
  buildSettingsForm(main, settings, [
    { key: 'unicos_title_1', label: 'Título (parte 1)' },
    { key: 'unicos_title_2', label: 'Título (parte 2, en color de acento)' },
    { key: 'unicos_paragraph', label: 'Párrafo', type: 'textarea' },
    { key: 'unicos_link_text', label: 'Texto del link' }
  ]);
}

async function renderCta(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['CTA "¿Tenés una idea?" (Home)']));
  main.appendChild(el('p', { class: 'section-hint' }, ['Última sección de la Home antes del footer.']));
  const settings = await api.getSettings();
  buildSettingsForm(main, settings, [
    { key: 'cta_title', label: 'Título' },
    { key: 'cta_paragraph', label: 'Párrafo', type: 'textarea' },
    { key: 'cta_button_text', label: 'Texto del botón' }
  ]);
}

function customFieldItem(f, removeLocal) {
  const wrap = el('div', {});
  const labelInput = el('input', { type: 'text', style: 'width:100%;margin-bottom:6px' }); labelInput.value = f.label;
  const phInput = el('input', { type: 'text', style: 'width:100%', placeholder: 'Placeholder' }); phInput.value = f.placeholder || '';
  wrap.appendChild(labelInput); wrap.appendChild(phInput);
  const row = el('div', { class: 'actions-row' });
  const saveBtn = el('button', { class: 'btn btn-sm' }, ['Guardar']);
  saveBtn.addEventListener('click', async () => {
    try {
      await api.updateCustomField(f.id, { label: labelInput.value.trim(), placeholder: phInput.value });
      saveBtn.textContent = 'Guardado ✓'; setTimeout(() => { saveBtn.textContent = 'Guardar'; }, 1200);
    } catch (e) { alert(e.message); }
  });
  const delBtn = el('button', { class: 'btn btn-sm btn-danger' }, ['Eliminar']);
  delBtn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar este campo del formulario?')) return;
    await api.deleteCustomField(f.id);
    removeLocal();
  });
  row.appendChild(saveBtn); row.appendChild(delBtn);
  wrap.appendChild(row);
  return wrap;
}

async function renderCustomPage(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Página Custom']));
  main.appendChild(el('p', { class: 'section-hint' }, ['Formulario de pedidos personalizados. Al enviar, el sitio arma un mensaje de WhatsApp con estos campos.']));
  const [settings, fields] = await Promise.all([api.getSettings(), api.getCustomFields()]);

  buildSettingsForm(main, settings, [
    { key: 'custom_title_1', label: 'Título (línea 1)' },
    { key: 'custom_title_2', label: 'Título (línea 2)' },
    { key: 'custom_paragraph', label: 'Párrafo', type: 'textarea' }
  ]);
  main.appendChild(imageField('Imagen de proceso/taller', settings.custom_image_url, file => api.uploadSingle('custom', file)));

  main.appendChild(el('hr', { class: 'divider' }));
  main.appendChild(el('h2', { style: 'font-size:16px' }, ['Campos del formulario']));
  main.appendChild(el('p', { class: 'section-hint' }, ['Lista reordenable de label + placeholder por campo del formulario.']));
  main.appendChild(reorderableList(fields, {
    renderItem: customFieldItem,
    onReorder: (ids) => api.reorderCustomFields(ids),
    getId: f => f.id
  }));
  const addBtn = el('button', { class: 'btn' }, ['+ Agregar campo']);
  addBtn.addEventListener('click', async () => {
    await api.createCustomField({ label: 'Nuevo campo', placeholder: '' });
    renderCustomPage(main);
  });
  main.appendChild(addBtn);
}

async function renderAbout(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Página About']));
  main.appendChild(el('p', { class: 'section-hint' }, ['Subtítulo bajo el logo y los 2 bloques de contenido de la página About.']));
  const settings = await api.getSettings();

  buildSettingsForm(main, settings, [{ key: 'about_subtitle', label: 'Subtítulo bajo el logo' }]);

  main.appendChild(el('hr', { class: 'divider' }));
  main.appendChild(el('h2', { style: 'font-size:16px' }, ['Bloque "Proceso"']));
  buildSettingsForm(main, settings, [
    { key: 'about_proceso_title', label: 'Título' },
    { key: 'about_proceso_paragraph', label: 'Párrafo', type: 'textarea' }
  ]);
  main.appendChild(imageField('Imagen de proceso', settings.about_proceso_image_url, file => api.uploadSingle('about-proceso', file)));

  main.appendChild(el('hr', { class: 'divider' }));
  main.appendChild(el('h2', { style: 'font-size:16px' }, ['Bloque "Materiales recuperados"']));
  buildSettingsForm(main, settings, [
    { key: 'about_materiales_title_1', label: 'Título (línea 1)' },
    { key: 'about_materiales_title_2', label: 'Título (línea 2)' },
    { key: 'about_materiales_paragraph', label: 'Párrafo', type: 'textarea' },
    { key: 'about_materiales_link_text', label: 'Texto del link' }
  ]);
  main.appendChild(imageField('Imagen de materiales', settings.about_materiales_image_url, file => api.uploadSingle('about-materiales', file)));
}

function categoryItem(c, removeLocal) {
  const wrap = el('div', {});
  const input = el('input', { type: 'text', style: 'width:100%;margin-bottom:6px' }); input.value = c.name;
  wrap.appendChild(input);
  const row = el('div', { class: 'actions-row' });
  const saveBtn = el('button', { class: 'btn btn-sm' }, ['Guardar']);
  saveBtn.addEventListener('click', async () => {
    try {
      await api.updateCategory(c.id, input.value.trim());
      saveBtn.textContent = 'Guardado ✓'; setTimeout(() => { saveBtn.textContent = 'Guardar'; }, 1200);
    } catch (e) { alert(e.message); }
  });
  const delBtn = el('button', { class: 'btn btn-sm btn-danger' }, ['Eliminar']);
  delBtn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta categoría? Los productos que la usan van a quedar con una categoría inexistente hasta que se les asigne otra.')) return;
    try { await api.deleteCategory(c.id); removeLocal(); } catch (e) { alert(e.message); }
  });
  row.appendChild(saveBtn); row.appendChild(delBtn);
  wrap.appendChild(row);
  return wrap;
}

async function renderCategories(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Categorías del Shop']));
  main.appendChild(el('p', { class: 'section-hint' }, ['Lista reordenable de categorías reales de producto. "ALL" y "ÚNICOS" son filtros automáticos y no se editan acá. Deben coincidir con la categoría asignada a cada producto.']));
  const categories = await api.getCategories();
  main.appendChild(reorderableList(categories, {
    renderItem: categoryItem,
    onReorder: (ids) => api.reorderCategories(ids),
    getId: c => c.id
  }));
  const addRow = el('div', { class: 'chip-input' });
  const input = el('input', { type: 'text', placeholder: 'NUEVA CATEGORÍA' });
  const addBtn = el('button', { class: 'btn' }, ['+ Agregar']);
  addBtn.addEventListener('click', async () => {
    if (!input.value.trim()) return;
    try { await api.createCategory(input.value.trim()); renderCategories(main); }
    catch (e) { alert(e.message); }
  });
  addRow.appendChild(input); addRow.appendChild(addBtn);
  main.appendChild(addRow);
}

let expandedProducts = new Set();

function productEditForm(p, categories, removeLocal, refreshAll) {
  const form = el('div', { style: 'margin-top:14px;padding-top:14px;border-top:1px solid var(--border)' });

  const nameInput = el('input', { type: 'text' }); nameInput.value = p.name;
  const priceInput = el('input', { type: 'number', min: '0', step: '1' }); priceInput.value = p.price ?? '';
  const catSelect = el('select');
  categories.forEach(c => { const opt = el('option', { value: c.name }, [c.name]); if (c.name === p.cat) opt.selected = true; catSelect.appendChild(opt); });
  const statusSelect = el('select');
  [['published', 'Publicado'], ['coming', 'Coming soon'], ['sold', 'Sold out']].forEach(([v, l]) => { const opt = el('option', { value: v }, [l]); if (v === p.status) opt.selected = true; statusSelect.appendChild(opt); });
  const badgeSelect = el('select');
  [['', 'Sin badge'], ['1/1', '1/1'], ['SOLD OUT', 'SOLD OUT'], ['COMING SOON', 'COMING SOON']].forEach(([v, l]) => { const opt = el('option', { value: v }, [l]); if (v === (p.badge || '')) opt.selected = true; badgeSelect.appendChild(opt); });
  const descTextarea = el('textarea', { rows: 3 }); descTextarea.value = p.description || '';
  const materialsTextarea = el('textarea', { rows: 3 }); materialsTextarea.value = p.materials || '';
  const shippingTextarea = el('textarea', { rows: 3 }); shippingTextarea.value = p.shippingReturns || '';

  let unique = p.unique;
  let featured = p.featured;

  form.appendChild(el('div', { class: 'field-row' }, [field('Nombre', nameInput), field('Precio (UYU)', priceInput)]));
  form.appendChild(el('div', { class: 'field-row' }, [field('Categoría', catSelect), field('Estado', statusSelect), field('Badge', badgeSelect)]));

  const uniqueWrap = el('div', { class: 'toggle-row' });
  const uniqueSw = el('div', { class: 'switch' + (unique ? ' on' : '') });
  uniqueSw.addEventListener('click', () => { unique = !unique; uniqueSw.className = 'switch' + (unique ? ' on' : ''); });
  uniqueWrap.appendChild(uniqueSw); uniqueWrap.appendChild(el('label', {}, ['Pieza única (1/1) — aparece en el filtro "Únicos"']));
  form.appendChild(uniqueWrap);

  const featuredWrap = el('div', { class: 'toggle-row' });
  const featuredSw = el('div', { class: 'switch' + (featured ? ' on' : '') });
  featuredSw.addEventListener('click', () => { featured = !featured; featuredSw.className = 'switch' + (featured ? ' on' : ''); });
  featuredWrap.appendChild(featuredSw); featuredWrap.appendChild(el('label', {}, ['Destacado en Home ("Drop 01") — se muestran los primeros 3 marcados']));
  form.appendChild(featuredWrap);

  const sizesField = el('div', { class: 'field' });
  sizesField.appendChild(el('label', {}, ['Talles']));
  let sizes = (p.sizes || []).slice();
  const chipList = el('div', { class: 'chip-list' });
  function renderChips() {
    chipList.innerHTML = '';
    sizes.forEach((sz, i) => {
      const rm = el('button', {}, ['✕']);
      rm.addEventListener('click', () => { sizes.splice(i, 1); renderChips(); });
      chipList.appendChild(el('div', { class: 'chip' }, [sz, rm]));
    });
  }
  renderChips();
  sizesField.appendChild(chipList);
  const chipInput = el('input', { type: 'text', placeholder: 'Ej: M' });
  const chipAddBtn = el('button', { class: 'btn btn-sm' }, ['+ Agregar talle']);
  chipAddBtn.addEventListener('click', () => {
    const v = chipInput.value.trim().toUpperCase();
    if (v) { sizes.push(v); chipInput.value = ''; renderChips(); }
  });
  sizesField.appendChild(el('div', { class: 'chip-input' }, [chipInput, chipAddBtn]));
  form.appendChild(sizesField);

  form.appendChild(field('Descripción (se muestra siempre visible + en el acordeón)', descTextarea));
  form.appendChild(field('Materiales (acordeón)', materialsTextarea));
  form.appendChild(field('Envíos y cambios (acordeón)', shippingTextarea));

  const imagesField = el('div', { class: 'field' });
  imagesField.appendChild(el('label', {}, ['Imágenes (foto principal + detalle)']));
  const thumbRow = el('div', { class: 'thumb-row' });
  let images = p.images.slice();
  function renderThumbs() {
    thumbRow.innerHTML = '';
    images.forEach((img, idx) => {
      const t = el('div', { class: 'thumb' }, [el('img', { src: img.url })]);
      const rm = el('button', { class: 'remove-btn' }, ['✕']);
      rm.addEventListener('click', async () => {
        await api.deleteProductImage(p.id, img.id);
        images.splice(idx, 1);
        renderThumbs();
      });
      t.appendChild(rm);
      const orderCtrl = thumbOrderControls(images, idx, async (a, b) => {
        [images[a], images[b]] = [images[b], images[a]];
        await api.reorderProductImages(p.id, images.map(i => i.id));
        renderThumbs();
      });
      if (orderCtrl) t.appendChild(orderCtrl);
      thumbRow.appendChild(t);
    });
    const uploadSlot = el('label', { class: 'upload-slot' }, ['+']);
    const fileInput = el('input', { type: 'file', accept: 'image/*' });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try { const img = await api.uploadProductImage(p.id, file); images.push(img); renderThumbs(); }
      catch (e) { alert(e.message); }
    });
    uploadSlot.appendChild(fileInput);
    thumbRow.appendChild(uploadSlot);
  }
  renderThumbs();
  imagesField.appendChild(thumbRow);
  form.appendChild(imagesField);

  const status = el('div', { class: 'status-msg' });
  const saveBtn = el('button', { class: 'btn btn-primary' }, ['Guardar producto']);
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    try {
      await api.updateProduct(p.id, {
        name: nameInput.value.trim(),
        price: priceInput.value === '' ? null : Number(priceInput.value),
        cat: catSelect.value, status: statusSelect.value, badge: badgeSelect.value,
        unique, featured, sizes,
        description: descTextarea.value, materials: materialsTextarea.value, shippingReturns: shippingTextarea.value
      });
      status.textContent = 'Guardado.'; status.className = 'status-msg ok';
    } catch (e) {
      status.textContent = e.message; status.className = 'status-msg err';
    }
    saveBtn.disabled = false;
  });
  const delBtn = el('button', { class: 'btn btn-danger' }, ['Eliminar producto']);
  delBtn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar "' + p.name + '"? Esta acción no se puede deshacer.')) return;
    await api.deleteProduct(p.id);
    removeLocal();
  });
  form.appendChild(el('div', { class: 'actions-row' }, [saveBtn, delBtn]));
  form.appendChild(status);
  return form;
}

function productItem(p, categories, removeLocal, refreshAll) {
  const wrap = el('div', {});
  const summary = el('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:12px' });
  summary.appendChild(el('div', {}, [
    el('div', { class: 'list-card-title' }, [p.name + (p.featured ? ' ★' : '')]),
    el('div', { class: 'list-card-sub' }, [p.cat + ' · ' + p.status + (p.price != null ? ' · $ ' + formatThousands(p.price) : ' · sin precio') + (p.unique ? ' · 1/1' : '')])
  ]));
  const toggleBtn = el('button', { class: 'btn btn-sm' }, [expandedProducts.has(p.id) ? 'Cerrar' : 'Editar']);
  toggleBtn.addEventListener('click', () => {
    if (expandedProducts.has(p.id)) expandedProducts.delete(p.id); else expandedProducts.add(p.id);
    refreshAll();
  });
  summary.appendChild(toggleBtn);
  wrap.appendChild(summary);
  if (expandedProducts.has(p.id)) wrap.appendChild(productEditForm(p, categories, removeLocal, refreshAll));
  return wrap;
}

async function renderProducts(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Productos']));
  main.appendChild(el('p', { class: 'section-hint' }, ['CRUD completo del catálogo. El orden acá define el orden en Shop y afecta qué productos se pueden marcar como "Destacado en Home".']));
  const [products, categories] = await Promise.all([api.getProducts(), api.getCategories()]);
  main.appendChild(reorderableList(products, {
    renderItem: (p, removeLocal) => productItem(p, categories, removeLocal, () => renderProducts(main)),
    onReorder: (ids) => api.reorderProducts(ids),
    getId: p => p.id
  }));
  const addBtn = el('button', { class: 'btn' }, ['+ Nuevo producto']);
  addBtn.addEventListener('click', async () => {
    const p = await api.createProduct({ name: 'Producto nuevo', cat: categories[0] ? categories[0].name : '', status: 'coming' });
    expandedProducts.add(p.id);
    renderProducts(main);
  });
  main.appendChild(addBtn);
}

let expandedArchives = new Set();

function archiveEditForm(a, removeLocal, refreshAll) {
  const form = el('div', { style: 'margin-top:14px;padding-top:14px;border-top:1px solid var(--border)' });
  const titleInput = el('input', { type: 'text' }); titleInput.value = a.title;
  const creditInput = el('input', { type: 'text' }); creditInput.value = a.credit || '';
  const descTextarea = el('textarea', { rows: 2 }); descTextarea.value = a.description || '';
  const longTextarea = el('textarea', { rows: 3 }); longTextarea.value = a.longText || '';
  let wide = a.wide;

  form.appendChild(field('Título', titleInput));
  form.appendChild(field('Crédito', creditInput));
  form.appendChild(field('Descripción corta', descTextarea));
  form.appendChild(field('Texto largo (opcional, solo se muestra en el detalle)', longTextarea));

  const wideWrap = el('div', { class: 'toggle-row' });
  const wideSw = el('div', { class: 'switch' + (wide ? ' on' : '') });
  wideSw.addEventListener('click', () => { wide = !wide; wideSw.className = 'switch' + (wide ? ' on' : ''); });
  wideWrap.appendChild(wideSw); wideWrap.appendChild(el('label', {}, ['Ancho destacado en grilla (ocupa 2 columnas)']));
  form.appendChild(wideWrap);

  form.appendChild(imageField('Imagen de portada', a.coverImageUrl, file => api.uploadArchiveCover(a.id, file)));

  const photosField = el('div', { class: 'field' });
  photosField.appendChild(el('label', {}, ['Fotos de la galería de detalle']));
  const photosRow = el('div', { class: 'thumb-row' });
  let photos = a.photos.slice();
  function renderPhotos() {
    photosRow.innerHTML = '';
    photos.forEach((ph, idx) => {
      const t = el('div', { class: 'thumb' });
      if (ph.url) t.appendChild(el('img', { src: ph.url }));
      else t.appendChild(el('div', { style: 'display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-faint);font-size:10px;text-align:center;padding:4px' }, [ph.label || 'sin foto']));
      const rm = el('button', { class: 'remove-btn' }, ['✕']);
      rm.addEventListener('click', async () => { await api.deleteArchivePhoto(a.id, ph.id); photos.splice(idx, 1); renderPhotos(); });
      t.appendChild(rm);
      const orderCtrl = thumbOrderControls(photos, idx, async (x, y) => {
        [photos[x], photos[y]] = [photos[y], photos[x]];
        await api.reorderArchivePhotos(a.id, photos.map(p => p.id));
        renderPhotos();
      });
      if (orderCtrl) t.appendChild(orderCtrl);
      photosRow.appendChild(t);
    });
    const uploadSlot = el('label', { class: 'upload-slot' }, ['+']);
    const fileInput = el('input', { type: 'file', accept: 'image/*' });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try { const ph = await api.uploadArchivePhoto(a.id, file); photos.push(ph); renderPhotos(); }
      catch (e) { alert(e.message); }
    });
    uploadSlot.appendChild(fileInput);
    photosRow.appendChild(uploadSlot);
  }
  renderPhotos();
  photosField.appendChild(photosRow);
  form.appendChild(photosField);

  const status = el('div', { class: 'status-msg' });
  const saveBtn = el('button', { class: 'btn btn-primary' }, ['Guardar entrada']);
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    try {
      await api.updateArchive(a.id, { title: titleInput.value.trim(), credit: creditInput.value, description: descTextarea.value, longText: longTextarea.value, wide });
      status.textContent = 'Guardado.'; status.className = 'status-msg ok';
    } catch (e) {
      status.textContent = e.message; status.className = 'status-msg err';
    }
    saveBtn.disabled = false;
  });
  const delBtn = el('button', { class: 'btn btn-danger' }, ['Eliminar entrada']);
  delBtn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar "' + a.title + '"?')) return;
    await api.deleteArchive(a.id);
    removeLocal();
  });
  form.appendChild(el('div', { class: 'actions-row' }, [saveBtn, delBtn]));
  form.appendChild(status);
  return form;
}

function archiveItem(a, removeLocal, refreshAll) {
  const wrap = el('div', {});
  const summary = el('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:12px' });
  summary.appendChild(el('div', {}, [
    el('div', { class: 'list-card-title' }, [a.title + (a.wide ? ' (ancho)' : '')]),
    el('div', { class: 'list-card-sub' }, [a.credit || 'sin crédito'])
  ]));
  const toggleBtn = el('button', { class: 'btn btn-sm' }, [expandedArchives.has(a.id) ? 'Cerrar' : 'Editar']);
  toggleBtn.addEventListener('click', () => {
    if (expandedArchives.has(a.id)) expandedArchives.delete(a.id); else expandedArchives.add(a.id);
    refreshAll();
  });
  summary.appendChild(toggleBtn);
  wrap.appendChild(summary);
  if (expandedArchives.has(a.id)) wrap.appendChild(archiveEditForm(a, removeLocal, refreshAll));
  return wrap;
}

async function renderArchives(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Archivos']));
  main.appendChild(el('p', { class: 'section-hint' }, ['CRUD de las entradas de la página /archivos (galerías editoriales).']));
  const archives = await api.getArchives();
  main.appendChild(reorderableList(archives, {
    renderItem: (a, removeLocal) => archiveItem(a, removeLocal, () => renderArchives(main)),
    onReorder: (ids) => api.reorderArchives(ids),
    getId: a => a.id
  }));
  const addBtn = el('button', { class: 'btn' }, ['+ Nueva entrada']);
  addBtn.addEventListener('click', async () => {
    const a = await api.createArchive({ title: 'Nueva entrada' });
    expandedArchives.add(a.id);
    renderArchives(main);
  });
  main.appendChild(addBtn);
}

async function renderOrders(main) {
  main.innerHTML = '';
  main.appendChild(el('h2', {}, ['Pedidos']));
  main.appendChild(el('p', { class: 'section-hint' }, ['Pedidos generados desde el checkout. El estado lo actualiza automáticamente el webhook de MercadoPago; también se puede cambiar a mano acá.']));
  const orders = await api.getOrders();
  if (!orders.length) { main.appendChild(el('div', { class: 'empty-note' }, ['Todavía no hay pedidos.'])); return; }
  const table = el('table', { class: 'orders' });
  table.appendChild(el('thead', {}, [el('tr', {}, ['#', 'Fecha', 'Cliente', 'Items', 'Total', 'Estado'].map(h => el('th', {}, [h])))]));
  const tbody = el('tbody');
  orders.forEach(o => {
    const itemsText = o.items.map(it => it.name + (it.size ? ' (' + it.size + ')' : '') + ' x' + it.qty).join(', ');
    const statusSelect = el('select');
    [['pendiente', 'Pendiente'], ['aprobado', 'Aprobado'], ['rechazado', 'Rechazado']].forEach(([v, l]) => {
      const opt = el('option', { value: v }, [l]); if (v === o.status) opt.selected = true; statusSelect.appendChild(opt);
    });
    statusSelect.addEventListener('change', async () => {
      try { await api.updateOrder(o.id, statusSelect.value); }
      catch (e) { alert(e.message); statusSelect.value = o.status; }
    });
    tbody.appendChild(el('tr', {}, [
      el('td', {}, ['#' + o.id]),
      el('td', {}, [new Date(o.createdAt).toLocaleString('es-UY')]),
      el('td', {}, [el('div', {}, [o.name]), el('div', { class: 'list-card-sub' }, [o.email])]),
      el('td', {}, [itemsText || '—']),
      el('td', {}, ['$ ' + formatThousands(o.total)]),
      el('td', {}, [statusSelect])
    ]));
  });
  table.appendChild(tbody);
  main.appendChild(table);
}

// ------------------------------------------------------------------ shell

const SECTIONS = [
  { key: 'banner', label: 'Banner superior', render: renderBanner },
  { key: 'hero', label: 'Hero', render: renderHero },
  { key: 'gallery', label: 'Galería full-bleed', render: renderGallery },
  { key: 'products', label: 'Productos', render: renderProducts },
  { key: 'categories', label: 'Categorías del Shop', render: renderCategories },
  { key: 'unicos', label: 'Sección Únicos 1/1', render: renderUnicos },
  { key: 'cta', label: 'CTA "¿Tenés una idea?"', render: renderCta },
  { key: 'custom', label: 'Página Custom', render: renderCustomPage },
  { key: 'about', label: 'Página About', render: renderAbout },
  { key: 'archives', label: 'Archivos', render: renderArchives },
  { key: 'orders', label: 'Pedidos', render: renderOrders }
];

let currentSection = 'banner';

function renderShell() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const sidebar = el('div', { class: 'sidebar' });
  sidebar.appendChild(el('div', { class: 'sidebar-brand' }, ['Benji', el('span', {}, ['$']), ' Admin']));
  SECTIONS.forEach(sec => {
    sidebar.appendChild(el('div', {
      class: 'nav-item' + (sec.key === currentSection ? ' active' : ''),
      onClick: () => { currentSection = sec.key; renderShell(); }
    }, [sec.label]));
  });
  const footer = el('div', { class: 'sidebar-footer' });
  footer.appendChild(el('button', { class: 'btn btn-sm' , onClick: doLogout }, ['Cerrar sesión']));
  sidebar.appendChild(footer);

  const main = el('div', { class: 'main' });
  main.innerHTML = '<p class="section-hint">Cargando…</p>';

  const shell = el('div', { class: 'admin-shell' }, [sidebar, main]);
  app.appendChild(shell);

  const section = SECTIONS.find(s => s.key === currentSection);
  Promise.resolve(section.render(main)).catch(err => {
    main.innerHTML = '';
    main.appendChild(el('h2', {}, [section.label]));
    main.appendChild(el('div', { class: 'status-msg err' }, [err.message || 'Error cargando la sección.']));
  });
}

function renderLogin(error) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const userInput = el('input', { type: 'text', id: 'login-user', autocomplete: 'username' });
  const passInput = el('input', { type: 'password', id: 'login-pass', autocomplete: 'current-password' });
  const box = el('div', { class: 'login-box' }, [
    el('h1', {}, ['Benji$ Admin']),
    field('Usuario', userInput),
    field('Contraseña', passInput),
    error ? el('div', { class: 'status-msg err' }, [error]) : null,
    el('button', { class: 'btn btn-primary', onClick: doLogin }, ['Entrar'])
  ]);
  app.appendChild(el('div', { class: 'login-screen' }, [box]));
  passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  userInput.focus();
}

async function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  try { await api.login(user, password); renderShell(); }
  catch (e) { renderLogin(e.message); }
}

async function doLogout() {
  await api.logout().catch(() => {});
  renderLogin();
}

(async function init() {
  try {
    const { authenticated } = await api.session();
    authenticated ? renderShell() : renderLogin();
  } catch (e) {
    renderLogin();
  }
})();
