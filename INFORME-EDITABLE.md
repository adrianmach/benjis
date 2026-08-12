# Informe de contenido editable — Benji$ (para futuro panel admin)

Análisis del proyecto exportado desde Claude Design, con el detalle de qué contenido debería quedar editable desde un panel administrador, dónde vive ese contenido en el código y qué tipo de input le corresponde.

**Archivo analizado:** `index.html` (760 líneas) — es el único archivo con contenido/texto/imágenes del sitio. `Benjis Web.dc.html` es una copia idéntica (backup del export original de Claude Design, no se sirve en la app). `support.js` (y su copia `public/support.js`) es solo el runtime que interpreta el formato (`{{ }}`, `sc-if`, `sc-for`); no contiene contenido editable.

## Cómo leer este informe (importante para quien construya el admin)

El archivo mezcla dos tipos de contenido:

- **Texto literal en el HTML** (ej. `<h2>Drop 01</h2>`): es un string fijo dentro de `index.html`. El admin tendría que reemplazar ese literal por un binding `{{ variable }}` para poder editarlo — hoy no hay forma de cambiarlo sin tocar código.
- **Valores `{{ variable }}`**: ya vienen de un objeto JS que arma el método `renderVals()` (línea 585 en adelante), o de arrays de datos como `products()` (línea 569) y `_archives()` (línea 747), todos dentro del `<script type="text/x-dc" data-dc-script>` (línea 451 a 758). Hoy esos arrays están **hardcodeados en el código**, no hay base de datos — el admin necesitaría un backend/CMS que alimente estos mismos campos.

No se modificó ningún archivo para este análisis.

### Leyenda de tipos de input

`text` · `textarea` · `number` · `image upload` · `url` · `color picker` · `toggle on/off` · `select/dropdown` · `lista reordenable`

---

## 1. Banner superior (announcement bar)

**Ubicación:** arriba del header, franja roja con texto en marquesina infinita.
**Archivo:** `index.html`, líneas 40–65.

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Visibilidad del banner | `true` (visible) | 40, 653 (prop `mostrarBanner`, definida en 451) | toggle on/off |
| Color de fondo/glow del banner | `#F93A2F` (variable `accent`, es el color de marca global, se usa en todo el sitio) | 41, prop `accent` definida en línea 451 | color picker (ya viene con 4 opciones predefinidas: `#F93A2F`, `#E7000B`, `#FF6B3D`, `#D9FF3D`) |
| Texto 1 | "Envíos a todo el país" | 44 (repetido en 50 y 56 para el loop infinito) | text |
| Texto 2 | "Drop 01" | 46 (repetido en 52 y 58) | text |
| Texto 3 | "Montevideo" | 48 (repetido en 54 y 60) | text |
| Link del banner | No tiene — es solo texto, no es clickeable | — | — |

**Nota técnica:** cada texto está repetido 3 veces en el HTML (líneas 44/50/56, 46/52/58, 48/54/60) porque la animación de scroll infinito necesita el contenido duplicado. El admin solo debe exponer 3 campos de texto; la duplicación para el loop debe resolverla el código, no el usuario del panel.

---

## 2. Hero principal (Home)

**Ubicación:** primera sección de la Home, imágenes con efecto parallax + logo animado que se separa en letras al hacer scroll.
**Archivo:** `index.html`, líneas 105–149.

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Imagen hero 1 (modelo, capa izquierda) | `assets/hero-modelo1.jpg` | 110 | image upload |
| Imagen hero 2 (flatlay/producto) | `assets/hero-flatlay.jpg` | 113 | image upload |
| Imagen hero 3 (modelo) | `assets/hero-modelo2.jpg` | 116 | image upload |
| Imagen hero 4 (modelo) | `assets/hero-modelo3.png` | 119 | image upload |
| Link del CTA flecha "→" (esquina inferior) | Navega a Shop (interno, no editable como URL libre) | 145 | — (no aplica; es navegación interna del sitio) |

**No editable / excluido:** el logo "Benji$" que se arma con las 6 imágenes (líneas 121–138) es el mismo `assets/logo-wordmark.png` recortado 6 veces con `clip-path` — es el isotipo de marca, tratado igual que el logo del header (excluido por consigna).

**Nota técnica:** las 4 imágenes son 4 "slots" fijos con posición/tamaño individual programado en CSS (no es una lista genérica). El panel puede permitir **reemplazar** cada una, pero agregar o quitar slots requiere tocar código.

---

## 3. Sección "Drop 01" (productos destacados, Home)

**Ubicación:** debajo del hero, grilla de 3 productos destacados.
**Archivo:** `index.html`, líneas 151–171 (HTML) + línea 683 (JS, selección de productos).

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Título de sección | "Drop 01" | 153 | text |
| Texto del link "Ver todo →" | "Ver todo →" | 154 | text |
| Productos mostrados | Fijo: producto #1, #2 y #7 del catálogo (`BALACLAVA 01`, `BALACLAVA 02`, `RIÑONERA 01`) | 683: `featured: [all[0], all[1], all[6]]` | lista reordenable (selección manual de hasta 3 productos destacados) |

**Nota importante:** hoy los "destacados" están hardcodeados por posición en el array de productos (índices 0, 1 y 6), no por un flag `destacado: true`. Para que el admin pueda elegir libremente qué productos destacar, conviene agregar un campo booleano `destacado` (o similar) a cada producto en vez de depender del orden del array.

Las imágenes de cada producto en esta grilla usan el mismo campo de imagen que el catálogo de productos (ver sección 8) — hoy no hay imagen real, solo el placeholder `[ FOTO <nombre> ]` (línea 160).

---

## 4. Galería full-bleed (Home, efecto scroll con crossfade)

**Ubicación:** sección con foto a pantalla completa y crossfade entre 3 imágenes según el scroll, texto "Benji$ — Montevideo, Uruguay" superpuesto.
**Archivo:** `index.html`, líneas 173–193.

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Imagen galería 1 | `assets/hero-modelo1.jpg` | 176 | image upload |
| Imagen galería 2 | `assets/hero-modelo2.jpg` | 180 | image upload |
| Imagen galería 3 | `assets/hero-modelo3.png` | 184 | image upload |
| Texto superpuesto (nombre de marca) | "Benji$" | 188 | text (aunque en la práctica es el nombre de marca, normalmente estático) |
| Subtítulo superpuesto | "Montevideo — Uruguay" | 189 | text |
| Contador "01 / 03" | Se autogenera por JS según cuántas imágenes hay | 191 (valor inicial) + lógica en línea 538 | — (no editable directamente, es calculado) |

**Nota técnica (importante):** esta galería está **programada para exactamente 3 imágenes** — el cálculo del crossfade divide todo por 3 en varios puntos del JS (líneas 528–529, 538). Si el admin permite agregar/quitar imágenes de esta sección, hay que generalizar ese código; hoy solo se puede reemplazar cada una de las 3.

---

## 5. Sección "Únicos 1/1" (Home)

**Ubicación:** sección con texto a la izquierda y 2 imágenes en grilla a la derecha (piezas únicas hechas con materiales recuperados).
**Archivo:** `index.html`, líneas 195–205.

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Título (parte 1) | "Únicos" | 197 | text |
| Título (parte 2, resaltada en color de acento) | "1/1" | 197 | text |
| Párrafo descriptivo | "Piezas únicas hechas a partir de materiales recuperados. Una sola unidad de cada una. Cuando se va, se fue." | 198 | textarea |
| Texto del link | "Ver piezas únicas" | 199 | text |
| Imagen/placeholder 1 | Sin imagen real — placeholder de texto "[ RIÑONERA 01 ]" | 202 | image upload |
| Imagen/placeholder 2 | Sin imagen real — placeholder de texto "[ RIÑONERA 02 ]" | 203 | image upload |

**Nota importante:** estas 2 imágenes **no están conectadas al catálogo de productos** (aunque existen productos con esos mismos nombres en el catálogo, ver sección 8). Es contenido hardcodeado, independiente. Conviene decidir si esta sección debe: (a) ser 2 imágenes libres de texto/marketing, o (b) pasar a mostrar productos reales de categoría "Únicos" tomados del catálogo — hoy es lo primero pero con apariencia de lo segundo, lo cual puede confundir en el admin.

---

## 6. CTA "¿Tenés una idea?" (Home)

**Ubicación:** última sección de la Home antes del footer, invita a pedir una prenda personalizada.
**Archivo:** `index.html`, líneas 207–211.

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Título | "¿Tenés una idea?" | 208 | text |
| Párrafo | "Trabajamos prendas y piezas personalizadas. Contanos qué estás buscando y lo armamos juntos." | 209 | textarea |
| Texto del botón | "Enviar consulta →" | 210 | text |
| Link del botón | Navega a la página Custom (interno) | 210 | — (no aplica; navegación interna) |

---

## 7. Página Shop — categorías y listado

**Ubicación:** página `/shop`, filtro de categorías + carrusel de productos.
**Archivo:** `index.html`, líneas 215–240 (HTML) + línea 602 (JS, lista de categorías).

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Categorías del filtro | `ALL`, `BUZOS`, `BALACLAVAS`, `RIÑONERAS`, `ÚNICOS` | 602: `const catNames = [...]` | lista reordenable (nombres de categoría) |

El resto del contenido de esta página (nombre, precio, imagen, tags de cada producto) se genera automáticamente desde el catálogo de productos — ver sección 8. No hay textos ni imágenes propios de esta página además del listado de categorías.

**Nota:** `ALL` y `ÚNICOS` no son categorías reales de producto — son filtros especiales (`ALL` = todos, `ÚNICOS` = productos con `unique: true`, ver sección 8). Solo `BUZOS`, `BALACLAVAS`, `RIÑONERAS` corresponden al campo "categoría" real de cada producto.

---

## 8. Catálogo de productos

**Ubicación:** fuente de datos central usada en Home (destacados), Shop (listado) y página de Producto (detalle).
**Archivo:** `index.html`, método `products()`, líneas 569–584.

Hay **11 productos** hardcodeados como array de objetos JS. Campos por producto:

| Campo | Ejemplo actual | Tipo de input | Notas |
|---|---|---|---|
| Nombre | `BALACLAVA 01` | text | — |
| Precio | `$ X.XXX` (string, no número real — es un placeholder de precio) | number (+ formateo de moneda en frontend) | Hoy es texto libre, no un número; conviene migrar a `number` para poder ordenar/calcular |
| Categoría | `BALACLAVAS` / `RIÑONERAS` / `BUZOS` | select/dropdown | Opciones deben coincidir con las categorías de la sección 7 |
| Disponibilidad / estado | `published` / `coming` / `sold` | select/dropdown | `published` = comprable, `coming` = "Coming soon" (no comprable), `sold` = "Sold out" (se muestra atenuado). **No hay stock numérico**, solo este estado de 3 valores |
| Pieza única (1/1) | `true` / `false` (solo en Riñoneras) | toggle on/off | Determina si aparece en el filtro "Únicos" |
| Badge/tag | `1/1`, `SOLD OUT`, `COMING SOON`, o vacío | select/dropdown (con opción de texto libre) | Se muestra como etiqueta de color sobre la imagen |
| Talles | `['S','M','L']`, `['ÚNICA']`, o `[]` (sin talles → producto sin selector de talle) | lista reordenable | — |
| Descripción | "Balaclava de punto grueso con terminaciones a mano..." | textarea | Algunos productos "coming soon" no tienen descripción cargada |
| **Imágenes del producto** | **No existe este campo hoy** — en todos lados (Shop, destacados, detalle) se muestra el placeholder de texto `[ FOTO <nombre> ]` | image upload (múltiple) | **Gap más importante del catálogo**: no hay ninguna imagen real de producto en todo el sitio. Hay que agregar un campo de imágenes (al menos 2, ver sección 9) |
| Orden de aparición | Orden del array (líneas 572–582) | lista reordenable | Define el orden en Shop y afecta qué 3 productos son "destacados" (sección 3) |
| Destacado en Home | No es un campo — se calcula por posición fija (índices 0, 1, 6) | toggle on/off (a agregar) | Ver nota en sección 3 |

**Listado completo de los 11 productos actuales** (para referencia, líneas 572–582):

1. BALACLAVA 01 — Balaclavas — $X.XXX — publicado — talles S/M/L
2. BALACLAVA 02 — Balaclavas — $X.XXX — publicado — talles M/L/XL
3. BALACLAVA 03 — Balaclavas — $X.XXX — publicado — talles S/M/L/XL
4. BALACLAVA 04 — Balaclavas — sin precio — coming soon
5. BALACLAVA 05 — Balaclavas — sin precio — coming soon
6. BALACLAVA 06 — Balaclavas — sin precio — coming soon
7. RIÑONERA 01 — Riñoneras — $X.XXX — publicado — pieza única (1/1) — talle único
8. RIÑONERA 02 — Riñoneras — $X.XXX — publicado — pieza única (1/1) — talle único
9. RIÑONERA 03 — Riñoneras — pieza única — **sold out**
10. BUZO 01 — Buzos — sin precio — coming soon
11. BUZO 02 — Buzos — sin precio — coming soon

---

## 9. Página de Producto (detalle)

**Ubicación:** página individual de cada producto (`/shop/producto`).
**Archivo:** `index.html`, líneas 242–303.

Los campos de nombre, precio, tag, talles y descripción se toman del catálogo (sección 8). Además hay textos y elementos **fijos para todos los productos** (no varían por producto):

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Foto principal | Placeholder `[ <nombre> — FOTO 1 ]`, sin imagen real | 245 | image upload |
| Foto secundaria/detalle | Placeholder `[ <nombre> — FOTO 2 / DETALLE ]`, sin imagen real | 246 | image upload |
| Texto fijo "Diseñado y producido en Uruguay" | Igual en todos los productos | 256 | text (microcopy global del sitio) |
| Swatches de color | 3 cuadrados de color fijos (`#1a1a1a`, `#3a3a3a`, color de acento) | 262–264 | — **no son datos reales de producto**, son decorativos y están hardcodeados en el HTML. No hay campo "color" en el modelo de producto — si se quiere manejar colores reales por producto, hay que agregarlo |
| Texto botón "Añadir al carrito" | Fijo | 289 | text (microcopy global) |
| Texto botón "Coming soon" | Fijo, se muestra cuando `status: 'coming'` | 295 | text (microcopy global) |
| Etiquetas del acordeón inferior | "Descripción +", "Materiales +", "Envíos y cambios +" | 298 | text (microcopy global) — **nota:** hoy son solo etiquetas visuales, no despliegan contenido (no están implementadas como acordeón funcional) |
| Texto link WhatsApp | "Consultar por WhatsApp →" | 300 | text (microcopy global; el link no tiene número de WhatsApp cargado, `href="#"`) |

---

## 10. Página Custom (formulario de pedidos personalizados)

**Ubicación:** página `/custom`.
**Archivo:** `index.html`, líneas 305–325 (HTML) + líneas 669–675 (JS, campos del formulario).

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Título | "¿Tenés una idea?" | 308 | text |
| Párrafo | "Trabajamos prendas y piezas personalizadas: buzos, balaclavas, riñoneras y lo que se te ocurra. Contanos tu idea y te respondemos con una propuesta." | 309 | textarea |
| Imagen de proceso/taller | Sin imagen real — placeholder "[ FOTO PROCESO / TALLER ]" | 310 | image upload |
| Campos del formulario | Lista de 5: Nombre / Instagram / Email / WhatsApp / Presupuesto aproximado (cada uno con label + placeholder) | 669–675 | lista reordenable (label + placeholder por campo) |
| Label textarea final | "Contanos tu idea" | 318 | text |
| Placeholder textarea final | "Qué querés hacer, referencias, colores…" | 319 | text |
| Texto de la zona de adjuntar imágenes | "Adjuntar imágenes de referencia" | 321 | text |
| Texto del botón enviar | "Enviar consulta →" | 322 | text |

**Nota:** el formulario no tiene lógica de envío real conectada (no hay `action`, `fetch`, ni integración con email/WhatsApp) — es solo maquetación visual.

---

## 11. Página About

**Ubicación:** página `/about`.
**Archivo:** `index.html`, líneas 327–349.

| Campo | Valor actual | Línea | Tipo de input |
|---|---|---|---|
| Subtítulo bajo el logo | "Marca independiente hecha en Montevideo" | 331 | text |
| Imagen bloque "Proceso" | Sin imagen real — placeholder "[ FOTO PROCESO ]" | 334 | image upload |
| Título "Proceso" | "Proceso" | 336 | text |
| Párrafo "Proceso" | "Cada pieza se hace a mano, en tandas chicas. [ Texto de marca — editable desde el CMS ]" | 337 | textarea |
| Título "Materiales recuperados" | "Materiales<br>recuperados" (con salto de línea manual) | 342 | text (si se separa en 2 líneas, considerar 2 campos o permitir salto de línea en el textarea) |
| Párrafo "Materiales recuperados" | "Las piezas únicas nacen de materiales que ya tuvieron una vida. Por eso son 1/1. [ Editable desde el CMS ]" | 343 | textarea |
| Texto del link | "Pedí tu custom →" | 344 | text |
| Imagen bloque "Materiales" | Sin imagen real — placeholder "[ FOTO MATERIALES ]" | 346 | image upload |

**No editable / excluido:** el logo wordmark en el tope de la página (línea 330) es el mismo logo de marca del header — excluido por consigna.

**Nota:** los propios textos actuales incluyen literalmente "[ Editable desde el CMS ]" — son placeholders de redacción, confirman que esta sección está pensada para ser reemplazada por copy real desde el panel.

---

## 12. Sección/página Archivos

**Ubicación:** página `/archivos` (grilla de galerías editoriales) y su detalle `/archivos/:item`.
**Archivo:** `index.html`, líneas 351–392 (HTML) + líneas 747–756 (JS, datos).

| Campo | Línea | Tipo de input |
|---|---|---|
| Título de la página "Archivos" | 353 | text |

Hay **6 entradas de archivo** hardcodeadas. Campos por entrada:

| Campo | Ejemplo actual | Tipo de input | Notas |
|---|---|---|---|
| Título | "STREET SESH 01" | text | — |
| Crédito | "Fotos @fotógrafo — Marzo, 2025" | text | — |
| Imagen de portada (grilla) | **No existe el campo** — se muestra placeholder de texto `[ COVER <título> ]` | image upload | Hay que agregar el campo, hoy no hay imagen real |
| Ancho destacado en grilla | `true`/`false` (algunas entradas ocupan 2 columnas) | toggle on/off | — |
| Descripción corta | "Primera sesión callejera de Benji$..." | textarea | — |
| Texto largo (detalle, opcional) | Algunos vacíos, otros con párrafo largo | textarea | Se muestra solo si tiene contenido (opcional) |
| Fotos de la galería de detalle | Array de 4 a 8 labels por entrada (ej. "STREET 01 — FOTO 1"), **sin imágenes reales** | lista reordenable de image upload | Hoy son solo strings de texto usados como placeholder, no rutas de imagen |
| Orden de aparición | Orden del array (líneas 749–754) | lista reordenable | — |

**Nota técnica:** el layout de las fotos de detalle sigue un patrón fijo de proporciones que se repite cada 8 posiciones (línea 733–742: `layouts`). Si se reordenan o agregan fotos, el aspecto (cuadrado, vertical, panorámico) de cada una cambia según su posición en la lista — es una limitación de diseño a tener en cuenta si el admin permite reordenar libremente.

---

## Elementos fuera de alcance (excluidos a propósito)

Por consigna, no se incluye header ni footer. Además, se dejaron fuera del informe estos elementos por no ser contenido de marketing/producto sino UI de marca o de sistema:

- **Logo de marca** (`assets/logo-b.png` y `assets/logo-wordmark.png`): aparece en el header, footer, pantalla de carga (líneas 30–34), overlay de transición entre páginas (líneas 36–38) y en la página About (línea 330). Se trata siempre como el mismo isotipo/wordmark de marca, no como imagen de contenido editable.
- **Pantalla de carga y overlay de transición** (líneas 30–38): solo muestran el logo, no tienen texto.
- **Carrito de compras** (líneas 420–447): textos como "Tu carrito", "Todavía no agregaste nada", "Subtotal", "Finalizar compra" son microcopy transaccional/UI del carrito, no contenido de página. Se puede incluir en una futura sección de "Textos del sistema" si se desea, pero no encaja en las categorías pedidas (banner, hero, productos, secciones, imágenes).
- **`assets/letter-0.png` a `letter-5.png`**: existen en la carpeta `assets/` pero **no están referenciados en ningún lugar del código actual** (el logo animado usa recortes de `logo-wordmark.png` vía CSS, no estos archivos sueltos). Quedan huérfanos — no requieren campo en el admin salvo que se decida reactivarlos.

---

## Resumen para quien construya el panel admin

1. **No hay backend hoy.** Todo el contenido vive hardcodeado en el `<script data-dc-script>` de `index.html` (arrays JS) o directamente como texto en el HTML. El admin necesita un modelo de datos nuevo (productos, archivos, secciones de home, etc.) que reemplace estos literales por bindings dinámicos.
2. **El gap más grande es imágenes de producto**: hoy no existe un solo producto con imagen real en todo el sitio (Shop, destacados y detalle muestran placeholders de texto). Es el campo más urgente a resolver.
3. **Ya existen 2 "props" editables nativas** del formato Design Canvas, listas para usar como referencia de patrón: `accent` (color picker, línea 451) y `mostrarBanner` (toggle, línea 451) — son un buen ejemplo del tipo de metadata que el resto de los campos debería tener.
4. **Varias secciones tienen límites de cantidad fijos en el código** (hero: 4 imágenes, galería: 3 imágenes, archivos: layout de fotos cada 8 posiciones) — permitir agregar/quitar ítems libremente desde el admin requiere generalizar esa lógica, no solo conectar datos.
5. **Categorías de producto y filtros del Shop** (sección 7) deben mantenerse sincronizados con el campo `categoría` de cada producto (sección 8) — hoy son dos listas hardcodeadas independientes (`catNames` y el campo `cat` de cada producto) que casualmente coinciden.
