# Benji$ — ecommerce + panel admin

Sitio de Benji$ (marca de ropa independiente, Montevideo) convertido de un export estático de Claude Design a un ecommerce funcional: backend Express + Supabase (Postgres + Storage), carrito con checkout vía MercadoPago, y un panel `/admin` para editar todo el contenido del sitio sin tocar código.

El frontend público (`index.html` + `support.js`) **no se reescribió**: sigue siendo el mismo sistema de templates (`{{ }}`, `sc-if`, `sc-for`) que ya traía el export. Lo único que cambió es de dónde vienen los datos — antes hardcodeados en el script, ahora vienen de la API (`/api/content`, `/api/products`, `/api/archives`), con esos mismos valores hardcodeados como fallback si la API no responde.

## Estructura del proyecto

```
index.html          Sitio público (template + lógica del componente)
support.js           Runtime que interpreta el template (no se toca)
assets/              Imágenes de marca + las 4 fotos fijas del hero/galería
uploads/              Carpeta legacy del export original (no referenciada)
uploads-admin/        Legacy: destino local de uploads antes de Supabase Storage (gitignored, ya no se escribe)

supabase/
  schema.sql           Tablas (prefijo benjis_), triggers de updated_at y seed data. Correr una vez en el SQL Editor de Supabase.

server/
  index.js            App de Express: monta estáticos, rutas, sesión
  supabase.js          Cliente de Supabase (service role) + helpers de Storage (uploadImage/deleteImageByUrl)
  auth.js               Login por sesión del admin
  lib/
    settings.js          Claves válidas de benjis_content + cuáles son booleanas
    format.js             formatPrice() compartido
    mercadopago.js         Wrapper del SDK de MercadoPago
    upload.js              Helpers de multer (memoria) + runUpload()
  routes/
    public.js            GET /api/content, /api/products, /api/archives
    checkout.js           POST /api/checkout, webhook, redirects de vuelta de MP
    admin.js              CRUD completo detrás de /api/admin (protegido)

admin/
  index.html, admin.css, admin.js   Panel admin (HTML/CSS/JS plano, sin build)
```

## Setup

Requiere Node.js **22.5 o superior**, y un proyecto de [Supabase](https://supabase.com) (puede ser compartido con otros proyectos — todas las tablas usan el prefijo `benjis_`).

### 1. Crear las tablas en Supabase

Abrí el **SQL Editor** del proyecto de Supabase y corré el contenido de [`supabase/schema.sql`](supabase/schema.sql) completo. Crea las 5 tablas (`benjis_content`, `benjis_categories`, `benjis_products`, `benjis_archives`, `benjis_orders`), sus triggers de `updated_at`, habilita RLS sin policies (solo la service key, que bypassea RLS, puede leer/escribir) y carga el contenido/productos/categorías/archivos originales del sitio como seed. Es idempotente — correrlo de nuevo no duplica filas ni pisa ediciones hechas desde `/admin`.

### 2. Crear el bucket de Storage

En **Storage**, crear (o confirmar que ya existe) un bucket público llamado **`benjis`**. Ahí se suben todas las imágenes que se cargan desde el admin (productos, archivos, about, custom, galería). Las 4 fotos fijas del hero (`assets/hero-*.jpg|png`) son la única excepción: siguen viviendo en el repo porque `index.html` hardcodea esos paths.

### 3. Conseguir las credenciales

En **Project Settings → API** copiar la **URL** del proyecto y la **service_role key** (no la `anon` key — el backend necesita bypassear RLS).

### 4. Instalar y correr

```bash
npm install
cp .env.example .env
# completar .env (ver abajo)
npm run dev
```

Abrí `http://localhost:3000` para el sitio y `http://localhost:3000/admin` para el panel.

### Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor con `--watch` (reinicia solo al guardar) |
| `npm run build` | Valida que las variables de entorno necesarias estén configuradas (útil antes de un deploy) |
| `npm start` | Levanta el servidor en modo normal |

## Variables de entorno (`.env`)

| Variable | Para qué |
|---|---|
| `PORT` | Puerto del servidor (default 3000) |
| `PUBLIC_BASE_URL` | URL pública absoluta del sitio. La usa MercadoPago para las `back_urls` y el `notification_url` del webhook — **tiene que ser alcanzable desde internet**, no `localhost`, para que el webhook funcione (ver más abajo) |
| `ADMIN_USER` / `ADMIN_PASS` | Credenciales del panel `/admin`. Un solo usuario, no hay tabla de usuarios |
| `SESSION_SECRET` | Secreto para firmar la cookie de sesión del admin. Generar uno random, por ejemplo `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `MERCADOPAGO_ACCESS_TOKEN` | Access token de MercadoPago (ver abajo) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secreto de firma del webhook (opcional pero recomendado, ver abajo) |
| `SUPABASE_URL` | URL del proyecto de Supabase (Project Settings → API) |
| `SUPABASE_SERVICE_KEY` | Service role key del proyecto (**no** la `anon` key — necesita bypassear RLS para que el backend pueda leer/escribir) |

## MercadoPago

### Conseguir credenciales

1. Entrar a [mercadopago.com.uy/developers/panel](https://www.mercadopago.com.uy/developers/panel) con la cuenta de Benji$.
2. Crear una aplicación (o usar una existente) en modo **Checkout Pro**.
3. En "Credenciales de prueba" copiar el **Access Token de test** y pegarlo en `MERCADOPAGO_ACCESS_TOKEN` para probar sin plata real. Las tarjetas de prueba están documentadas en la misma página de MercadoPago.
4. Cuando esté todo probado, cambiar a las credenciales de **producción** (misma pantalla, tab "Credenciales de producción") antes de lanzar.
5. En "Webhooks" de la misma aplicación, configurar la URL `https://<tu-dominio>/api/mercadopago/webhook` y copiar el **Secreto de firma** a `MERCADOPAGO_WEBHOOK_SECRET`. Sin esto el webhook igual funciona, pero sin validar que la notificación realmente vino de MercadoPago.

### Probar el webhook en local

MercadoPago necesita poder llegar a `notification_url` desde internet, así que `localhost` no sirve. Para probar el flujo completo en desarrollo:

1. Levantar un túnel, por ejemplo con [ngrok](https://ngrok.com/): `ngrok http 3000`.
2. Poner la URL que te da ngrok (`https://xxxx.ngrok-free.app`) en `PUBLIC_BASE_URL`.
3. Reiniciar el servidor y hacer una compra de prueba de punta a punta.

Sin esto, el checkout redirige igual a MercadoPago y el pago se puede completar, pero el pedido se queda en estado `pendiente` en el admin hasta que alguien lo cambie a mano (sección Pedidos) — el webhook es el único que lo pasa a `aprobado`/`rechazado` automáticamente.

### Qué hace el servidor

- `POST /api/checkout` recalcula los precios **desde la base de datos**, nunca confía en lo que mande el navegador. Si algún producto del carrito no tiene precio cargado (todos los productos arrancan sin precio real, ver abajo) o no está publicado, devuelve un error claro en vez de crear el pedido.
- El webhook (`POST /api/mercadopago/webhook`) vuelve a consultar el pago por API con el access token en vez de confiar en el contenido de la notificación, y valida la firma si `MERCADOPAGO_WEBHOOK_SECRET` está configurado.

## Panel admin

`/admin`, login con `ADMIN_USER`/`ADMIN_PASS`. Secciones (en el orden del sidebar):

Banner superior · Hero · Galería full-bleed · Productos · Categorías del Shop · Sección Únicos 1/1 · CTA "¿Tenés una idea?" · Página Custom · Página About · Archivos · Pedidos

Notas sobre el comportamiento:

- **Hero y Galería comparten archivos.** El Hero tiene 4 slots fijos (`assets/hero-modelo1.jpg`, `hero-flatlay.jpg`, `hero-modelo2.jpg`, `hero-modelo3.png`); la Galería full-bleed usa 3 de esas mismas 4 imágenes (modelo1, modelo2, modelo3). Subir una foto nueva desde cualquiera de las dos secciones actualiza el mismo archivo físico — no son fotos independientes, es una limitación del diseño original del sitio, no del admin.
- Esas 4 imágenes se **sobrescriben in-place** (mismo nombre de archivo) para no tener que tocar `index.html`. El formato debe coincidir con el original (JPG o PNG según el slot) — el admin lo valida y avisa si subís el formato equivocado.
- **Ningún producto arranca con precio real cargado** (así estaba el sitio original, con placeholder `$ X.XXX`). Hay que cargarle precio a un producto desde el admin antes de que se pueda comprar — si no, el checkout lo rechaza con un mensaje explicando por qué.
- "Destacado en Home" y "Pieza única" son toggles por producto: los primeros 3 destacados aparecen en "Drop 01" de la Home, y las primeras 2 piezas únicas se usan automáticamente como las imágenes de la sección "Únicos 1/1" (esas 2 imágenes no se cargan a mano en ningún lado, son siempre las de los productos marcados).

## Deploy

1. Correr `supabase/schema.sql` en el proyecto de Supabase de producción (una sola vez; ver Setup arriba).
2. Crear el bucket público `benjis` en Supabase Storage si todavía no existe.
3. `npm install --omit=dev`
4. Completar `.env` con las variables de producción (`PUBLIC_BASE_URL` real, credenciales de MercadoPago de producción, `ADMIN_PASS` fuerte, `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`).
5. `npm run build` (valida que estén todas las variables de entorno).
6. `npm start`, detrás de un proxy con HTTPS.

Los datos (contenido, productos, pedidos, archivos) y las imágenes viven en Supabase — no hay nada que respaldar a mano en el servidor de la app.
