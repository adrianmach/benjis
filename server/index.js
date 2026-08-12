import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import publicRoutes from './routes/public.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// Static content. Mounted explicitly (not a blanket express.static(ROOT))
// so server/, data/, node_modules/ and .env are never reachable over HTTP.
app.use('/assets', express.static(path.join(ROOT, 'assets')));
app.use('/uploads', express.static(path.join(ROOT, 'uploads'))); // legacy, unreferenced but kept as-is
app.use('/uploads-admin', express.static(path.join(ROOT, 'uploads-admin')));
app.get('/support.js', (req, res) => res.sendFile(path.join(ROOT, 'support.js')));

app.use('/api', publicRoutes);

app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

app.listen(PORT, () => {
  console.log(`Benji$ corriendo en http://localhost:${PORT}`);
});
