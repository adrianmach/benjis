// `npm run build`: ya no hay una base de datos local que migrar/sembrar
// (eso vive en Supabase, ver supabase/schema.sql). Esto solo valida que las
// variables de entorno necesarias estén presentes antes de un deploy.

import 'dotenv/config';

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SESSION_SECRET', 'ADMIN_USER', 'ADMIN_PASS'];
const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length) {
  console.error('Faltan variables de entorno: ' + missing.join(', '));
  process.exit(1);
}

console.log('Env OK. Recordá haber corrido supabase/schema.sql en el SQL Editor de Supabase.');
