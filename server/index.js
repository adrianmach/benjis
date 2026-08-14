import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import publicRoutes from './routes/public.js';
import { checkoutApiRouter, checkoutRedirectRouter } from './routes/checkout.js';
import authRouter, { sessionMiddleware, requireAdmin } from './auth.js';
import adminRouter from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

const app = express();
app.disable('x-powered-by');
// Railway (y proxies similares) terminan TLS antes del proceso de Node;
// sin esto Express no reconoce la conexión como segura y las cookies de
// sesión con `secure: true` (NODE_ENV=production) pueden no funcionar bien.
app.set('trust proxy', 1);
app.use(express.json());
app.use(sessionMiddleware());

// Static content. Mounted explicitly (not a blanket express.static(ROOT))
// so server/, node_modules/ and .env are never reachable over HTTP.
app.use('/assets', express.static(path.join(ROOT, 'assets')));
app.use('/uploads', express.static(path.join(ROOT, 'uploads'))); // legacy, unreferenced but kept as-is
app.use('/uploads-admin', express.static(path.join(ROOT, 'uploads-admin'))); // legacy: uploads del admin ahora van a Supabase Storage
app.get('/support.js', (req, res) => res.sendFile(path.join(ROOT, 'support.js')));

app.use('/api', publicRoutes);
app.use('/api', checkoutApiRouter);
app.use(checkoutRedirectRouter);
app.use('/api', authRouter);
app.use('/api/admin', requireAdmin, adminRouter);

// Admin panel: static assets are public (no secrets in them), the page
// itself checks /api/admin/session client-side and shows a login form
// when unauthenticated. Actual data access always goes through the
// requireAdmin-gated /api/admin/* routes above.
app.use('/admin', express.static(path.join(ROOT, 'admin')));
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'admin', 'index.html')));

app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

app.listen(PORT, () => {
  console.log(`Benji$ corriendo en http://localhost:${PORT}`);
});
