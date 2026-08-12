// SQLite layer for Benji$. Uses Node's built-in node:sqlite (DatabaseSync) --
// no native compilation, no extra dependency. Schema is created idempotently
// on every boot; seed data (matching the content that used to be hardcoded
// in index.html) is inserted only once, the first time the DB is empty, so
// the public site looks identical to the pre-migration static export until
// an admin edits something via /admin.

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'benjis.sqlite');

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER,
  cat TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  unique_piece INTEGER NOT NULL DEFAULT 0,
  badge TEXT,
  sizes TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  materials TEXT NOT NULL DEFAULT '',
  shipping_returns TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS custom_form_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  placeholder TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS archive_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  credit TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  long_text TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  wide INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS archive_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id INTEGER NOT NULL REFERENCES archive_entries(id) ON DELETE CASCADE,
  url TEXT,
  label TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// Default settings values -- identical to the literals that are hardcoded
// in index.html today. Keys with a trailing _1/_2 back a title that is
// visually split across two lines by a literal <br> in the template
// (same pattern the "Unicos 1/1" title already used before this migration).
const DEFAULT_SETTINGS = {
  banner_text_1: 'Envíos a todo el país',
  banner_text_2: 'Drop 01',
  banner_text_3: 'Montevideo',
  banner_visible: 'true',
  accent_color: '#F93A2F',

  gallery_brand_text: 'Benji$',
  gallery_subtitle_text: 'Montevideo — Uruguay',

  unicos_title_1: 'Únicos',
  unicos_title_2: '1/1',
  unicos_paragraph: 'Piezas únicas hechas a partir de materiales recuperados. Una sola unidad de cada una. Cuando se va, se fue.',
  unicos_link_text: 'Ver piezas únicas',

  cta_title: '¿Tenés una idea?',
  cta_paragraph: 'Trabajamos prendas y piezas personalizadas. Contanos qué estás buscando y lo armamos juntos.',
  cta_button_text: 'Enviar consulta →',

  custom_title_1: '¿Tenés',
  custom_title_2: 'una idea?',
  custom_paragraph: 'Trabajamos prendas y piezas personalizadas: buzos, balaclavas, riñoneras y lo que se te ocurra. Contanos tu idea y te respondemos con una propuesta.',
  custom_image_url: '',

  about_subtitle: 'Marca independiente hecha en Montevideo',
  about_proceso_title: 'Proceso',
  about_proceso_paragraph: 'Cada pieza se hace a mano, en tandas chicas. [ Texto de marca — editable desde el CMS ]',
  about_proceso_image_url: '',
  about_materiales_title_1: 'Materiales',
  about_materiales_title_2: 'recuperados',
  about_materiales_paragraph: 'Las piezas únicas nacen de materiales que ya tuvieron una vida. Por eso son 1/1. [ Editable desde el CMS ]',
  about_materiales_link_text: 'Pedí tu custom →',
  about_materiales_image_url: ''
};

const SEED_CATEGORIES = ['BUZOS', 'BALACLAVAS', 'RIÑONERAS'];

const CS = 'COMING SOON';
const SEED_PRODUCTS = [
  { name: 'BALACLAVA 01', price: null, cat: 'BALACLAVAS', status: 'published', unique_piece: 0, badge: null, sizes: ['S', 'M', 'L'], description: 'Balaclava de punto grueso con terminaciones a mano. Abrigo y estilo en una sola pieza.', featured: 1 },
  { name: 'BALACLAVA 02', price: null, cat: 'BALACLAVAS', status: 'published', unique_piece: 0, badge: null, sizes: ['M', 'L', 'XL'], description: 'Balaclava de algodón liviano, ideal para entretiempo. Corte relajado.', featured: 1 },
  { name: 'BALACLAVA 03', price: null, cat: 'BALACLAVAS', status: 'published', unique_piece: 0, badge: null, sizes: ['S', 'M', 'L', 'XL'], description: 'Balaclava oversize de frisa rústica. Doble capa en la zona del cuello.', featured: 0 },
  { name: 'BALACLAVA 04', price: null, cat: 'BALACLAVAS', status: 'coming', unique_piece: 0, badge: CS, sizes: [], description: '', featured: 0 },
  { name: 'BALACLAVA 05', price: null, cat: 'BALACLAVAS', status: 'coming', unique_piece: 0, badge: CS, sizes: [], description: '', featured: 0 },
  { name: 'BALACLAVA 06', price: null, cat: 'BALACLAVAS', status: 'coming', unique_piece: 0, badge: CS, sizes: [], description: '', featured: 0 },
  { name: 'RIÑONERA 01', price: null, cat: 'RIÑONERAS', status: 'published', unique_piece: 1, badge: '1/1', sizes: ['ÚNICA'], description: 'Riñonera hecha con materiales recuperados. Pieza única e irrepetible.', featured: 1 },
  { name: 'RIÑONERA 02', price: null, cat: 'RIÑONERAS', status: 'published', unique_piece: 1, badge: '1/1', sizes: ['ÚNICA'], description: 'Riñonera artesanal con cierre YKK y correa ajustable. Pieza 1/1.', featured: 0 },
  { name: 'RIÑONERA 03', price: null, cat: 'RIÑONERAS', status: 'sold', unique_piece: 1, badge: 'SOLD OUT', sizes: [], description: '', featured: 0 },
  { name: 'BUZO 01', price: null, cat: 'BUZOS', status: 'coming', unique_piece: 0, badge: CS, sizes: [], description: 'Buzo oversize de frisa rústica con capucha y bolsillos asimétricos.', featured: 0 },
  { name: 'BUZO 02', price: null, cat: 'BUZOS', status: 'coming', unique_piece: 0, badge: CS, sizes: [], description: 'Buzo liviano con estampa serigráfica y corte boxy.', featured: 0 }
];

const SEED_CUSTOM_FIELDS = [
  { label: 'Nombre', placeholder: 'Tu nombre' },
  { label: 'Instagram', placeholder: '@usuario' },
  { label: 'Email', placeholder: 'tu@email.com' },
  { label: 'WhatsApp', placeholder: '09x xxx xxx' },
  { label: 'Presupuesto aproximado', placeholder: 'Opcional' }
];

const SEED_ARCHIVES = [
  { title: 'STREET SESH 01', credit: 'Fotos @fotógrafo — Marzo, 2025', wide: 0, description: 'Primera sesión callejera de Benji$. Montevideo de noche, prendas en su hábitat natural.', long_text: 'La primera salida a la calle con las piezas terminadas. Sin producción, sin luces artificiales. Solo la ciudad y la ropa.', photos: ['STREET 01 — FOTO 1', 'STREET 01 — FOTO 2', 'STREET 01 — FOTO 3', 'STREET 01 — FOTO 4', 'STREET 01 — FOTO 5', 'STREET 01 — FOTO 6'] },
  { title: 'STREET SESH 02', credit: 'Fotos @fotógrafo — Mayo, 2025', wide: 0, description: 'Segunda sesión. Ciudad Vieja, atardecer, balaclavas y riñoneras.', long_text: '', photos: ['STREET 02 — FOTO 1', 'STREET 02 — FOTO 2', 'STREET 02 — FOTO 3', 'STREET 02 — FOTO 4', 'STREET 02 — FOTO 5'] },
  { title: 'LOOKBOOK DROP 01', credit: 'Fotos @fotógrafo — Junio, 2025', wide: 1, description: 'Lookbook completo del primer drop. Todas las piezas, todos los ángulos.', long_text: 'Cada prenda fotografiada en contexto. Sin fondo blanco, sin maniquí. Así se usan.', photos: ['LOOKBOOK — FOTO 1', 'LOOKBOOK — FOTO 2', 'LOOKBOOK — FOTO 3', 'LOOKBOOK — FOTO 4', 'LOOKBOOK — FOTO 5', 'LOOKBOOK — FOTO 6', 'LOOKBOOK — FOTO 7', 'LOOKBOOK — FOTO 8'] },
  { title: 'DETRÁS DE ESCENA', credit: 'Benji$ — 2025', wide: 0, description: 'El proceso. El taller. Las manos detrás de cada pieza.', long_text: '', photos: ['BTS — FOTO 1', 'BTS — FOTO 2', 'BTS — FOTO 3', 'BTS — FOTO 4'] },
  { title: 'STREET SESH 03', credit: 'Fotos @fotógrafo — Julio, 2025', wide: 0, description: 'Tercera sesión. Rambla, mediodía, sol directo.', long_text: '', photos: ['STREET 03 — FOTO 1', 'STREET 03 — FOTO 2', 'STREET 03 — FOTO 3', 'STREET 03 — FOTO 4', 'STREET 03 — FOTO 5'] },
  { title: 'DESFILE BENJI$', credit: 'Fotos @fotógrafo — Agosto, 2025', wide: 1, description: 'Primer desfile de Benji$. Todas las piezas en movimiento.', long_text: 'La primera vez que las piezas se vieron en pasarela. Un espacio industrial en el Cerro, música en vivo, 15 modelos.', photos: ['DESFILE — FOTO 1', 'DESFILE — FOTO 2', 'DESFILE — FOTO 3', 'DESFILE — FOTO 4', 'DESFILE — FOTO 5', 'DESFILE — FOTO 6', 'DESFILE — FOTO 7'] }
];

function seed(database) {
  const productCount = database.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (productCount > 0) return; // already seeded, never overwrite admin edits

  database.exec('BEGIN');
  try {
    const insSetting = database.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insSetting.run(k, v);

    const insCat = database.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
    SEED_CATEGORIES.forEach((name, i) => insCat.run(name, i));

    const insProd = database.prepare(`INSERT INTO products
      (name, price, cat, status, unique_piece, badge, sizes, description, materials, shipping_returns, featured, sort_order)
      VALUES (@name, @price, @cat, @status, @unique_piece, @badge, @sizes, @description, '', '', @featured, @sort_order)`);
    SEED_PRODUCTS.forEach((p, i) => insProd.run({
      name: p.name, price: p.price, cat: p.cat, status: p.status,
      unique_piece: p.unique_piece, badge: p.badge, sizes: JSON.stringify(p.sizes),
      description: p.description, featured: p.featured, sort_order: i
    }));

    const insField = database.prepare('INSERT INTO custom_form_fields (label, placeholder, sort_order) VALUES (?, ?, ?)');
    SEED_CUSTOM_FIELDS.forEach((f, i) => insField.run(f.label, f.placeholder, i));

    const insArchive = database.prepare(`INSERT INTO archive_entries
      (title, credit, description, long_text, cover_image_url, wide, sort_order)
      VALUES (?, ?, ?, ?, NULL, ?, ?)`);
    const insPhoto = database.prepare('INSERT INTO archive_photos (archive_id, url, label, sort_order) VALUES (?, NULL, ?, ?)');
    SEED_ARCHIVES.forEach((a, i) => {
      insArchive.run(a.title, a.credit, a.description, a.long_text, a.wide, i);
      const archiveId = database.prepare('SELECT last_insert_rowid() AS id').get().id;
      a.photos.forEach((label, j) => insPhoto.run(archiveId, label, j));
    });

    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  seed(db);
  return db;
}

// `node server/db.js` (used by `npm run build`) just ensures the DB exists,
// is migrated and seeded, then exits -- safe to run repeatedly.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  getDb();
  console.log('DB ready at', DB_PATH);
}
