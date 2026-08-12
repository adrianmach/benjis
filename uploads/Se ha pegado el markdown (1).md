Sí. Con lo que me pasaste, yo no haría simplemente una “tienda parecida a Joxfina”: haría una **tienda editorial de moda independiente inspirada en el lenguaje visual, ritmo y microinteracciones de Joxfina**, pero con identidad propia de Benji$, y además pensada desde el principio como un **e-commerce + CMS administrable**.

Estuve revisando [JOXFINA](https://joxfina.com/?utm_source=chatgpt.com) y su página institucional. La referencia efectivamente trabaja una estética de marca de autor, con producto como protagonista, textos muy breves y una lógica de catálogo/colección. 

Abajo te dejo el estudio y, al final, un **prompt maestro para pegarle a Claude Code**.

---

# 1. Qué entiendo que tiene que ser Benji$

La web debería sentirse como:

> **una marca de ropa independiente + editorial de moda + tienda online**, no como una plantilla genérica de Shopify/WooCommerce.

El usuario tiene que entrar y sentir que está entrando al universo de Benji$ antes de empezar a comprar.

La prioridad visual debería ser:

1. **Fotografía** 
2. **Tipografía** 
3. **Movimiento** 
4. **Espacio en blanco** 
5. **Producto** 
6. **Información** 

Y no al revés.

No quiero una web llena de cards, botones redondeados, sombras, gradients, etc. El lenguaje tiene que ser mucho más **fashion/editorial/minimalista**.

---

# 2. Análisis de la referencia Joxfina

La web de Joxfina presenta una marca de diseño independiente uruguaya y pone mucho peso en identidad, producción local y piezas limitadas. Su catálogo muestra productos con nombre, precio, promociones, disponibilidad y CTA de compra. 

También es importante que Joxfina no intenta explicar absolutamente todo en la home. Hay una jerarquía bastante clara:

### Marca

Primero se percibe la identidad.

### Imagen

Después aparece el universo visual.

### Producto

Luego el producto se convierte en protagonista.

### Información

Finalmente aparecen detalles, políticas, contacto, etc.

Para Benji$ mantendría exactamente esa filosofía.

---

# 3. La gran diferencia: Benji$ necesita tener personalidad propia

No copiaría:

-  logo J 
-  textos 
-  imágenes 
-  layouts idénticos 
-  animaciones idénticas 
-  código 
-  CSS 
-  componentes propietarios 

Sí tomaría como referencia:

-  ritmo 
-  minimalismo 
-  proporciones 
-  jerarquía visual 
-  protagonismo fotográfico 
-  navegación 
-  sensación editorial 
-  transiciones 
-  comportamiento del catálogo 
-  simplicidad del checkout 

La referencia debe funcionar como **dirección de arte**, no como clon.

---

# 4. Identidad visual Benji$

Según el formulario:

**Marca:**
 `Benji$`

**Instagram:**
 `@benjis.uy`

**Tipografías:**

-  Bristol 
-  Horizon 

Y hay una indicación importantísima:

> La transición de carga de Joxfina utiliza la J.
>  Benji$ tiene que utilizar la **B**.

Esto lo convertiría en uno de los elementos distintivos de la web.

---

# 5. Loading / transición inicial

Esto para mí es clave.

## Primera carga

Pantalla completa.

Fondo:

```
```

```
BENJI$ background
```

Centro:

```
```

```
B
```

La B debería ser el elemento protagonista.

Puede aparecer mediante:

```
```

```
opacity: 0 → 1
scale: 0.92 → 1
```

y después desaparecer mediante:

```
```

```
clip / mask / scale / fade
```

para revelar la home.

### Concepto

No quiero un spinner.

No quiero:

```
```

```
Loading...
```

No quiero una barra de progreso genérica.

Quiero:

**B → transición → universo Benji$.**

---

# 6. Transiciones entre páginas

Acá Claude Code debería implementar una pequeña máquina de estados:

```
```

```
IDLE
 ↓
PAGE_ENTER
 ↓
ACTIVE
 ↓
PAGE_EXIT
 ↓
NEXT_PAGE
 ↓
PAGE_ENTER
```

La transición podría utilizar nuevamente la B como elemento gráfico.

Por ejemplo:

```
```

```
Página A

        B

      ↓

overlay negro

      ↓

        B

      ↓

Página B
```

La animación tiene que ser rápida.

Ideal:

**350–700 ms**

Nunca una transición de 2 segundos que haga lenta la compra.

---

# 7. Home de Benji$

Yo estructuraría la home así.

---

## 01 — Hero

Pantalla prácticamente completa.

Puede ser:

```
```

```
┌─────────────────────────────────────┐
│ BENJI$        SHOP    ABOUT     BAG │
│                                     │
│                                     │
│           [IMAGEN / VIDEO]          │
│                                     │
│                                     │
│              BENJI$                 │
│          SHOP COLLECTION             │
└─────────────────────────────────────┘
```

Pero dependiendo del material fotográfico, preferiría:

### Opción A

Una fotografía vertical editorial.

### Opción B

Video corto.

### Opción C

Imagen full-screen con texto mínimo.

Desde el admin se debería poder elegir cuál.

---

# 8. Barra superior

Minimalista.

Desktop:

```
```

```
BENJI$                     SHOP
                           CUSTOM
                           ABOUT

                           SEARCH
                           ♡
                           BAG
```

O:

```
```

```
BENJI$       SHOP       CUSTOM       ABOUT       SEARCH ♡ BAG
```

No pondría un navbar enorme.

---

# 9. Mobile

En mobile:

```
```

```
B       BENJI$       ☰
```

o incluso:

```
```

```
BENJI$                 ☰
```

Al abrir:

```
```

```
SHOP

BUZOS
BALACLAVAS
RIÑONERAS

CUSTOM

ABOUT

CONTACT
```

La navegación mobile tiene que sentirse como una pantalla editorial, no como un menú Bootstrap.

---

# 10. Secciones de productos

Tus categorías iniciales deberían ser:

### BUZOS

Actualmente sin fotos completas.

Esto no significa que no pueda existir la categoría.

El producto puede tener:

```
```

```
PRÓXIMAMENTE
```

o:

```
```

```
COMING SOON
```

y desde el admin activar/desactivar la venta.

---

### BALACLAVAS

6 modelos.

Acá haría:

```
```

```
BALACLAVAS

01
02
03
04
05
06
```

pero **no publicaría fotos inexistentes como si estuvieran listas**.

Los seis productos pueden estar cargados desde administración, pero cada uno puede tener:

```
```

```
published: true/false
```

y:

```
```

```
available_for_sale: true/false
```

Así vos podés ir habilitando cada modelo cuando tengas las fotos.

---

# 11. Riñoneras

Acá sí tomaría una decisión conceptual.

**No haría “Riñoneras” versus “Únicos” como categorías mutuamente excluyentes.**

Haría dos conceptos diferentes:

### Categoría

```
```

```
RIÑONERAS
```

### Atributo

```
```

```
PIEZA ÚNICA
```

Entonces una riñonera puede ser:

```
```

```
Categoría: Riñoneras
Stock: 1
Tipo: Pieza única
```

Visualmente:

```
```

```
RIÑONERA #01

PIEZA ÚNICA

$XXX
```

Y además podrías crear una colección dinámica:

# ÚNICOS

que automáticamente muestre todos los productos cuyo:

```
```

```
is_unique = true
```

Esto te deja preparada la tienda para futuros productos 1/1.

---

# 12. Página de producto

Esta página es importantísima.

Desktop:

```
```

```
┌────────────────────────┬─────────────────────────┐
│                        │ BALACLAVA 03             │
│                        │                         │
│                        │ $ 1.XXX                 │
│                        │                         │
│       FOTO GRANDE      │ Color                   │
│                        │                         │
│                        │ ───────────────          │
│                        │                         │
│                        │ AGREGAR AL CARRITO       │
│                        │                         │
│                        │ ♡                        │
│                        │                         │
│                        │ DESCRIPCIÓN              │
│                        │                         │
│                        │ ENVÍOS                   │
│                        │ CAMBIOS                  │
└────────────────────────┴─────────────────────────┘
```

No haría una card gigante llena de información.

---

# 13. Galería de producto

Debe soportar:

-  múltiples imágenes 
-  video 
-  imagen principal 
-  orden manual 
-  zoom 
-  fullscreen 
-  mobile swipe 

Y especialmente:

```
```

```
imagen 1
imagen 2
imagen 3
imagen 4
```

sin thumbnails horribles ocupando media pantalla.

---

# 14. Productos sin fotos

Esto es importante por tu situación actual.

No debemos diseñar el sistema suponiendo que siempre vas a tener contenido perfecto.

Cada producto debería tener estados:

```
```

```
draft
coming_soon
published
sold_out
archived
```

Entonces:

### Buzo

```
```

```
COMING SOON
```

### Balaclava con fotos

```
```

```
COMPRAR
```

### Riñonera vendida

```
```

```
SOLD OUT
```

### Riñonera única

```
```

```
1/1
```

---

# 15. Personalizados / a medida

Esto no lo trataría como un producto común.

Tiene que tener una sección propia:

# CUSTOM

o

# PERSONALIZADOS

Conceptualmente:

> ¿Tenés una idea?
>
> Trabajamos prendas y piezas personalizadas.
>
> Contanos qué estás buscando.

CTA:

**ENVIAR CONSULTA →**

---

## Formulario

```
```

```
Nombre

Instagram

Email

WhatsApp

¿Qué querés hacer?

Contanos tu idea

Presupuesto aproximado

Adjuntar imágenes

[ ENVIAR CONSULTA ]
```

Esto debería entrar al panel admin.

---

# 16. El formulario puede convertirse en una ventaja enorme

En vez de mandar todo a un email perdido, el admin tendría:

```
```

```
CONSULTAS

#00021
María
Custom
Nueva
10/08/2026
```

Estados:

```
```

```
Nueva
En conversación
Presupuesto enviado
Aceptada
Rechazada
Finalizada
```

Esto convierte el CMS en una pequeña herramienta de gestión comercial.

---

# 17. Shop

La tienda debería tener una estructura extremadamente simple.

```
```

```
SHOP

ALL
BUZOS
BALACLAVAS
RIÑONERAS
ÚNICOS
```

Y filtros:

```
```

```
CATEGORÍA
PRECIO
COLOR
DISPONIBILIDAD
```

Como en el formulario marcaste que querés:

-  buscador 
-  filtros 
-  wishlist 
-  WhatsApp 

los implementaría desde el inicio.

---

# 18. Buscador

El buscador no tiene que ser un input aburrido.

Al abrir:

```
```

```
SEARCH

¿Qué estás buscando?

_________________________

Resultados
```

Buscar por:

-  nombre 
-  categoría 
-  descripción 
-  tags 
-  color 

---

# 19. Wishlist

La wishlist debería funcionar sin obligar a crear una cuenta.

Usaría:

```
```

```
localStorage
```

inicialmente.

Así:

```
```

```
♡
```

guarda productos.

Si más adelante querés cuentas de usuario, se puede conectar.

---

# 20. Carrito

Carrito lateral / drawer.

```
```

```
TU CARRITO

BALACLAVA 02
$ XXX

RIÑONERA 01
$ XXX

────────────────

Subtotal
$ XXX

ENVÍOS CALCULADOS AL FINAL

[ FINALIZAR COMPRA ]
```

No cambiaría de página cada vez que alguien agrega algo.

---

# 21. Mercado Pago

Según el formulario ya tienen:

**Mercado Pago creado: Sí.**

Y métodos:

-  Mercado Pago 
-  transferencia bancaria 
-  otros si después los agregás. 

Yo lo diseñaría con una capa de pagos:

```
```

```
PaymentProvider
   └── MercadoPagoProvider
```

Así el día de mañana podés agregar otro proveedor sin rehacer el checkout.

El admin debe permitir:

```
```

```
Mercado Pago
[ ON ]

Transferencia
[ ON/OFF ]
```

---

# 22. Envíos

Según el formulario:

**Retiro en local: Sí**

**DAC: Sí**

Yo lo mostraría así:

```
```

```
MÉTODO DE ENTREGA

○ Retiro en local
○ Envío DAC
```

Y el admin debería permitir modificar:

```
```

```
Costo DAC
Costo retiro
Envío gratis desde $
```

Sin tocar código.

---

# 23. Checkout

Muy simple.

### Paso 1

Datos:

```
```

```
Nombre
Apellido
Email
Teléfono
```

### Paso 2

Entrega:

```
```

```
Retiro en local

o

DAC
Dirección
Ciudad
Departamento
```

### Paso 3

Pago:

```
```

```
Mercado Pago
Transferencia
```

### Paso 4

Confirmación.

---

# 24. Panel administrador

Esta parte es fundamental.

No quiero un panel que solamente permita editar productos.

Quiero que sea un **CMS completo**.

---

# Dashboard

```
```

```
BENJI$ ADMIN

────────────────────────

Ventas
$ XXX

Pedidos
XX

Productos
XX

Consultas
XX

────────────────────────

Últimos pedidos

Últimas consultas

Productos con poco stock
```

---

# 25. Productos

CRUD completo:

```
```

```
PRODUCTOS

+ NUEVO PRODUCTO

Nombre
Slug
Descripción
Descripción corta

Precio
Precio anterior

Categoría

Stock

SKU

Color

Talle

Es único
□

Estado
Draft
Coming soon
Published
Sold out
Archived

Imágenes
[drag & drop]

SEO
```

---

# 26. Variantes

Muy importante para ropa.

Un producto podría tener:

```
```

```
BUZO X

Talles:
S
M
L
XL
```

Cada uno:

```
```

```
stock
SKU
```

También:

```
```

```
Color
```

Por ejemplo:

```
```

```
NEGRO
GRIS
ROJO
```

No asumir que cada color es necesariamente un producto independiente.

---

# 27. Categorías

Desde admin:

```
```

```
Categorías

BUZOS
BALACLAVAS
RIÑONERAS
ÚNICOS
CUSTOM
```

Poder:

-  crear 
-  editar 
-  eliminar 
-  cambiar orden 
-  ocultar 
-  agregar imagen 
-  agregar descripción 
-  SEO 

---

# 28. Homepage editable

Esto es lo que realmente haría potente al CMS.

La home debería construirse mediante bloques.

Ejemplo:

```
```

```
HOME

01 HERO
02 FEATURED PRODUCTS
03 EDITORIAL IMAGE
04 CATEGORY GRID
05 CUSTOM CTA
06 INSTAGRAM
07 NEWSLETTER
08 FOOTER
```

Cada bloque:

```
```

```
visible: true/false
order: 1
```

Así vos desde admin podés cambiar la web sin Claude Code.

---

# 29. Hero editable

Admin:

```
```

```
HERO

Tipo:
○ Imagen
○ Video

Desktop image
Mobile image

Título

Subtítulo

CTA

CTA URL

Overlay

Alt text

Activar
```

---

# 30. Banners

También:

```
```

```
BANNER SUPERIOR

"ENVÍOS A TODO EL PAÍS"

Activar
```

Esto permite campañas:

```
```

```
DROP 01
SALE
NUEVO DROP
ENVÍOS GRATIS
```

sin tocar código.

---

# 31. CMS de textos

Crear:

```
```

```
PÁGINAS

Quiénes somos
Política de cambios
Preguntas frecuentes
Información de contacto
Envíos
Privacidad
Términos
```

Esto coincide con el formulario que te pasaron.

---

# 32. Editor de contenido

No pondría un editor demasiado complejo.

Pero sí:

-  títulos 
-  párrafos 
-  imágenes 
-  links 
-  listas 
-  destacados 

y eventualmente bloques.

---

# 33. Media Manager

Esto es **muy importante para vos** porque todavía te faltan fotos.

El admin debería tener:

```
```

```
MEDIA

Upload

[drag & drop]

Fotos
Videos
Logos
Banners
```

Con:

```
```

```
alt text
nombre
tipo
dimensiones
tamaño
```

Y poder seleccionar una imagen desde cualquier sección.

---

# 34. Esto resuelve tu problema de las balaclavas

Podés tener:

```
```

```
BALACLAVA 01
✓ foto
✓ publicada

BALACLAVA 02
✓ foto
✓ publicada

BALACLAVA 03
✓ foto
✓ publicada

BALACLAVA 04
✗ foto
✓ producto cargado
COMING SOON

BALACLAVA 05
✗ foto
COMING SOON

BALACLAVA 06
✗ foto
COMING SOON
```

Cuando tengas las fotos:

**subís → asignás → publicás.**

---

# 35. Pedidos

Admin:

```
```

```
PEDIDOS

#1024
Juan Pérez
$ 3.900
Mercado Pago
DAC
PAGADO

#1023
Ana
$ 2.400
Transferencia
Retiro
PENDIENTE
```

Estados:

```
```

```
Pendiente
Pago pendiente
Pagado
Preparando
Enviado
Entregado
Cancelado
```

---

# 36. Consultas Custom

```
```

```
CONSULTAS

Nueva
En conversación
Presupuesto enviado
Aceptada
Rechazada
Finalizada
```

Esto es algo que muchas tiendas chicas terminan resolviendo con WhatsApp + Excel. Acá quedaría centralizado.

---

# 37. Configuración general

Admin:

```
```

```
CONFIGURACIÓN

Marca
Logo
Logo B loading

Instagram
WhatsApp
Email
Teléfono

Dirección
Horario

Mercado Pago
DAC
```

---

# 38. Configuración visual

También permitiría:

```
```

```
TIPOGRAFÍA PRINCIPAL
Bristol

TIPOGRAFÍA SECUNDARIA
Horizon

COLOR FONDO
#XXXXXX

COLOR TEXTO
#XXXXXX

COLOR ACCENTO
#XXXXXX
```

Pero **no permitiría modificar 40 cosas**.

La gracia es que vos puedas cambiar el contenido sin romper la dirección de arte.

---

# 39. SEO

Cada producto:

```
```

```
SEO title
SEO description
OG image
slug
```

Cada página:

```
```

```
SEO title
SEO description
OG image
```

También:

-  sitemap 
-  robots.txt 
-  canonical 
-  Open Graph 
-  Twitter/X cards 
-  structured data para productos 
-  structured data para organización 

---

# 40. Arquitectura técnica que le pediría a Claude Code

Yo usaría:

### Frontend

**Next.js + TypeScript**

### Styling

**Tailwind CSS + CSS custom**

Pero no usaría componentes visuales genéricos para el frontend.

### Animaciones

**GSAP + Framer Motion**, usando cada uno donde tenga sentido.

Especialmente:

-  page transitions 
-  loader 
-  reveal 
-  image transitions 
-  hover 
-  scroll animations 

### Backend / DB

**Supabase**

Para:

-  PostgreSQL 
-  Auth 
-  Storage 
-  Row Level Security 

### Admin

Dentro de la misma aplicación:

```
```

```
/admin
```

protegido por autenticación.

### Pagos

Mercado Pago.

### Deploy

Vercel.

---

# 41. Base de datos

Una estructura inicial:

```
```

```
users
admin_users
products
product_variants
categories
product_categories
product_images
collections
homepage_sections
pages
media
orders
order_items
customers
custom_requests
shipping_methods
payment_settings
site_settings
navigation_items
discounts
```

---

# 42. Tabla Products

Algo como:

```
```

```
Product {
  id
  name
  slug
  shortDescription
  description
  price
  compareAtPrice
  categoryId

  status
  stock

  isUnique
  isFeatured
  isComingSoon

  seoTitle
  seoDescription

  createdAt
  updatedAt
}
```

---

# 43. Product Images

```
```

```
ProductImage {
  id
  productId
  url
  alt
  sortOrder
  type
}
```

donde:

```
```

```
type:
image
video
```

---

# 44. Home Sections

```
```

```
HomepageSection {
  id
  type
  title
  subtitle
  content
  image
  mobileImage
  link
  sortOrder
  isVisible
}
```

Tipos:

```
```

```
hero
featured_products
category_grid
editorial
custom
banner
instagram
newsletter
```

---

# 45. Responsive

No quiero:

> “desktop y después vemos mobile”.

Tiene que diseñarse simultáneamente.

Breakpoints:

```
```

```
mobile
tablet
desktop
large desktop
```

Especialmente:

### Mobile

-  navegación 
-  galería 
-  carrito 
-  filtros 
-  checkout 
-  loader 

tienen que sentirse pensados para touch.

---

# 46. Performance

Esto es crítico en una marca de ropa porque vamos a tener imágenes pesadas.

Implementar:

-  WebP/AVIF 
-  responsive images 
-  lazy loading 
-  preload de hero 
-  optimización automática 
-  blur placeholders 
-  video optimizado 
-  CDN 
-  evitar JS innecesario 

La primera carga tiene que ser rápida aunque haya fotografía editorial.

---

# 47. Accesibilidad

Aunque sea una web fashion:

-  alt text 
-  contraste 
-  navegación por teclado 
-  focus states 
-  botones accesibles 
-  labels 
-  reduced motion 

Y especialmente:

```
```

```
@media (prefers-reduced-motion: reduce)
```

para desactivar animaciones fuertes.

---

# 48. Animaciones

La regla que le daría a Claude:

> **La animación tiene que reforzar la marca, nunca competir con el producto.**

Animaciones recomendadas:

### Loader

Alta.

### Page transition

Media/alta.

### Hover productos

Media.

### Scroll reveal

Muy baja.

### Botones

Muy baja.

Nada de:

```
```

```
bounce
shake
confetti
```

---

# 49. Hover de producto

Por ejemplo:

Imagen principal:

```
```

```
producto frontal
```

hover:

```
```

```
segunda foto
```

y abajo:

```
```

```
BALACLAVA 03
$1.500
```

Podría aparecer un pequeño:

```
```

```
+ QUICK ADD
```

pero sin convertirlo en una tienda genérica.

---

# 50. “Únicos”

La página debería tener una identidad especial.

Por ejemplo:

```
```

```
ÚNICOS

PIEZAS 1/1
HECHAS A PARTIR DE MATERIALES RECUPERADOS
```

Y debajo:

```
```

```
[imagen] [imagen] [imagen]
```

Esto puede convertirse en uno de los conceptos fuertes de Benji$.

---

# 51. Custom

Yo incluso lo pondría en navegación principal:

```
```

```
SHOP
CUSTOM
ABOUT
```

porque no es un detalle secundario.

Es una propuesta comercial distinta.

---

# 52. About

No haría una página institucional aburrida.

Podría ser:

```
```

```
BENJI$

[foto]

Texto de marca

[foto]

Proceso

[foto]

Materiales

[CTA CUSTOM]
```

La información que todavía no tengas se puede cargar desde CMS.

---

# 53. Footer

Minimalista:

```
```

```
BENJI$

SHOP
CUSTOM
ABOUT
CONTACT

INSTAGRAM
WHATSAPP

CAMBIOS
ENVÍOS
FAQ

© BENJI$ 2026
```

---

# 54. WhatsApp

Como está marcado en el formulario, tendría un acceso discreto.

No pondría el típico:

🟢 “Hola! ¿En qué podemos ayudarte?”

enorme.

Mejor:

```
```

```
WHATSAPP
```

o un icono pequeño.

Y que desde producto pueda enviar:

> Hola, quiero consultar por [PRODUCTO].

---

# 55. Lo que NO haría

Esto se lo pondría explícitamente a Claude Code.

**NO:**

-  Bootstrap look 
-  cards con sombras 
-  bordes redondeados excesivos 
-  gradients 
-  botones gigantes 
-  emojis 
-  iconografía genérica 
-  navbar pesada 
-  animaciones exageradas 
-  loaders genéricos 
-  textos inventados 
-  fotos stock 
-  productos falsos 
-  precios inventados 
-  lorem ipsum 
-  colores que no correspondan a Benji$ 
-  copiar literalmente Joxfina 

---

# 56. Contenido inicial

Con lo que me pasaste, cargaría inicialmente:

### Categorías

```
```

```
BUZOS
BALACLAVAS
RIÑONERAS
ÚNICOS
CUSTOM
```

### Productos

```
```

```
Buzos
→ próximos / sin fotos

Balaclavas
→ 6 modelos
→ algunas fotos disponibles

Riñoneras
→ piezas únicas 1/1
```

No inventaría nombres ni precios.

Los productos que todavía no tengan información completa quedan como `draft`.

---

# 57. Estados de contenido

Esto es esencial para que puedas trabajar mientras la web está en construcción.

Cada producto:

```
```

```
DRAFT
COMING SOON
PUBLISHED
SOLD OUT
ARCHIVED
```

Así la tienda puede estar online mientras vos seguís cargando material.

---

# 58. Mi propuesta visual concreta

Yo llevaría Benji$ hacia:

### Editorial

Mucho aire.

### Tipografía

Bristol para títulos / identidad.

Horizon para navegación, UI o contraste.

### Fotografía

Grande.

### Layout

Asimétrico cuando tenga sentido.

### Color

Basado en la identidad real de Benji$, no inventado por el developer.

### Bordes

Muy pocos.

### Sombras

Prácticamente ninguna.

### Iconos

Minimalistas.

### Texto

Mayúsculas cuando corresponda.

---

# 59. Una cosa que cambiaría del enfoque típico

No le pediría a Claude:

> “Creá una web parecida a Joxfina”.

Eso produce una copia superficial.

Le daría una especificación como esta:

> **“Analizá la referencia visual proporcionada y reproducí sus principios de dirección de arte, ritmo, jerarquía, minimalismo editorial y lenguaje de interacción, pero crea una identidad visual independiente para Benji$.”**

Eso es muchísimo más efectivo.

---

# 60. PROMPT MAESTRO PARA CLAUDE CODE

Te dejo esto prácticamente listo para pegar.

```
```

```
Quiero desarrollar el e-commerce oficial de BENJI$.

IMPORTANTE:
La web debe tomar como referencia estética y de interacción a:
https://joxfina.com/

La referencia NO debe copiarse literalmente.
No copiar HTML, CSS, assets, textos, imágenes, logo ni código.
Quiero reproducir principios de diseño: estética editorial de moda independiente, minimalismo, protagonismo de fotografía, tipografía expresiva, mucho espacio negativo, navegación simple, microinteracciones elegantes y transiciones fluidas.

La identidad final debe ser BENJI$, no JOXFINA.

==================================================
MARCA
==================================================

Nombre:
BENJI$

Instagram:
@benjis.uy

Ubicación:
Montevideo, Uruguay

Tipografías:
- Bristol
- Horizon

Si los archivos de fuente son proporcionados posteriormente, integrarlos mediante @font-face.
No sustituirlas automáticamente por una fuente genérica si existen los archivos oficiales.

==================================================
CONCEPTO
==================================================

La web debe sentirse como una marca de moda independiente/editorial.

Prioridad visual:

1. Fotografía
2. Tipografía
3. Movimiento
4. Espacio negativo
5. Producto
6. Información

No quiero una tienda genérica.

Evitar:
- Bootstrap aesthetic
- cards genéricas
- shadows excesivos
- gradients
- rounded cards excesivas
- botones enormes
- layouts corporativos
- iconografía genérica
- animaciones exageradas

==================================================
LOADING / BRAND TRANSITION
==================================================

La referencia utiliza una transición de carga basada en su inicial.

BENJI$ debe tener el mismo concepto pero utilizando la letra B.

Crear un loader fullscreen.

Centro:
B

La B debe ser un elemento gráfico protagonista.

Animación:
- entrada suave
- pequeña escala
- transición del overlay
- reveal de la página

No utilizar spinner.

No utilizar "Loading...".

Duración aproximada:
400–700ms.

Debe existir soporte para:
prefers-reduced-motion.

==================================================
PAGE TRANSITIONS
==================================================

Crear transiciones entre páginas.

Usar la B como elemento de transición cuando sea apropiado.

La transición debe sentirse editorial y premium.

No debe bloquear la navegación.

Objetivo:
350–700ms.

==================================================
STACK
==================================================

Usar:

Next.js
TypeScript
React
Tailwind CSS
CSS custom para detalles visuales
GSAP y/o Framer Motion para motion
Supabase para PostgreSQL/Auth/Storage
Mercado Pago para pagos
Vercel para deployment

Mantener arquitectura limpia y escalable.

==================================================
FRONTEND
==================================================

Crear:

/
 /shop
 /shop/[category]
 /product/[slug]
 /custom
 /about
 /contact
 /faq
 /shipping
 /returns
 /search
 /wishlist
 /cart
 /checkout
 /order-success

Admin:

/admin
/admin/dashboard
/admin/products
/admin/categories
/admin/orders
/admin/custom-requests
/admin/media
/admin/pages
/admin/home
/admin/navigation
/admin/settings

==================================================
HOME
==================================================

La homepage debe estar construida con bloques administrables.

Bloques posibles:

- Hero
- Featured products
- Category grid
- Editorial image
- Editorial text
- Custom CTA
- Unique pieces
- Newsletter
- Instagram
- Announcement banner

Cada bloque debe tener:

id
type
sortOrder
isVisible
content
images
mobileImages
link

El administrador debe poder:
- activar/desactivar
- reordenar
- editar
- cambiar imágenes
- cambiar textos
- cambiar links

==================================================
HEADER
==================================================

Desktop:

BENJI$ + navegación mínima.

Secciones principales:

SHOP
CUSTOM
ABOUT

Acciones:
SEARCH
WISHLIST
CART

Mantenerlo limpio y editorial.

Mobile:
header compacto.

Menú fullscreen o drawer elegante.

==================================================
SHOP
==================================================

Categorías iniciales:

BUZOS
BALACLAVAS
RIÑONERAS
ÚNICOS

CUSTOM debe ser una sección independiente.

La tienda debe permitir:

- búsqueda
- filtros
- orden
- categorías
- wishlist
- quick add opcional

==================================================
PRODUCTOS
==================================================

Estados:

draft
coming_soon
published
sold_out
archived

Campos:

name
slug
description
shortDescription
price
compareAtPrice
category
stock
SKU
color
size
isUnique
isFeatured
isComingSoon
status
SEO title
SEO description

==================================================
VARIANTES
==================================================

Soportar:

talle
color
stock
SKU

Cada variante debe poder tener stock independiente.

==================================================
PRODUCT IMAGES
==================================================

Soportar:

- múltiples imágenes
- video
- orden manual
- imagen principal
- alt text
- fullscreen
- zoom
- swipe mobile

Optimizar imágenes automáticamente.

Usar:
WebP/AVIF cuando sea posible.

==================================================
ESTADOS REALES DE BENJI$
==================================================

BUZOS:

Actualmente no hay fotos disponibles de los buzos actuales.
Están por salir.

No inventar fotos.

Permitir cargarlos como:
COMING SOON

BALACLAVAS:

Existen 6 modelos.

Actualmente hay fotos buenas de algunos, pero no de los 6.

El sistema debe permitir publicar individualmente cada modelo.

Ejemplo:

Balaclava 01:
published

Balaclava 02:
published

Balaclava 03:
coming_soon

etc.

RIÑONERAS:

Son piezas únicas porque están realizadas con materiales reciclados.

No crear "Únicos" como categoría exclusiva.

Usar:

category = RIÑONERAS
isUnique = true
stock = 1

Crear además una colección dinámica:
ÚNICOS

que muestre todos los productos con:
isUnique = true

==================================================
CUSTOM
==================================================

Crear una sección dedicada:

CUSTOM
o
PERSONALIZADOS

Mensaje conceptual:

"¿Tenés una idea?"

"Trabajamos piezas personalizadas y a medida."

CTA:
ENVIAR CONSULTA

Formulario:

Nombre
Instagram
Email
WhatsApp
Tipo de trabajo
Descripción
Presupuesto aproximado
Archivo adjunto

Guardar las consultas en base de datos.

Admin debe poder cambiar estado:

new
in_conversation
quote_sent
accepted
rejected
completed

==================================================
PRODUCT PAGE
==================================================

Diseño editorial.

Desktop:
galería grande a la izquierda.
información a la derecha.

Información:

nombre
precio
precio anterior si existe
estado
variantes
stock
agregar al carrito
wishlist
descripción
materiales
cuidados
envíos
cambios

No llenar la pantalla de componentes.

==================================================
CART
==================================================

Implementar cart drawer.

Mostrar:

producto
imagen
variante
cantidad
precio
subtotal

CTA:
FINALIZAR COMPRA

==================================================
WISHLIST
==================================================

Implementar wishlist inicialmente mediante localStorage.

No obligar a crear una cuenta.

Persistir productos guardados.

==================================================
SEARCH
==================================================

Buscador por:

nombre
categoría
descripción
tags
color

Crear una experiencia de búsqueda editorial fullscreen/drawer.

==================================================
CHECKOUT
==================================================

Datos:

nombre
apellido
email
teléfono

Entrega:

Retiro en local
DAC

Dirección
Ciudad
Departamento

Pago:

Mercado Pago
Transferencia bancaria

==================================================
MERCADO PAGO
==================================================

Integrar Mercado Pago mediante una abstracción PaymentProvider.

No hardcodear credenciales.

Variables de entorno:

MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY

El admin debe poder activar/desactivar métodos de pago.

==================================================
ENVÍOS
==================================================

Métodos:

Retiro en local
DAC

Configurables desde admin:

costo retiro
costo DAC
envío gratis desde $

No hardcodear precios.

==================================================
ADMIN PANEL
==================================================

El administrador debe poder editar prácticamente todo el contenido de la web sin modificar código.

Dashboard:

ventas
pedidos
productos
consultas
stock bajo

==================================================
ADMIN PRODUCTS
==================================================

CRUD completo.

Crear
editar
duplicar
archivar
eliminar

Campos completos.

Drag & drop para imágenes.

==================================================
ADMIN CATEGORIES
==================================================

CRUD.

Orden manual.

Visible/hidden.

SEO.

Imagen.

Descripción.

==================================================
ADMIN HOME
==================================================

Editor visual de bloques.

Permitir:

crear
editar
duplicar
eliminar
ocultar
reordenar

==================================================
ADMIN MEDIA
==================================================

Media manager.

Drag & drop.

Upload múltiple.

Preview.

Buscar.

Filtrar:

images
videos
logos
banners

Permitir seleccionar media desde cualquier módulo.

==================================================
ADMIN ORDERS
==================================================

Estados:

pending
payment_pending
paid
preparing
shipped
delivered
cancelled

Mostrar:

cliente
productos
importe
pago
entrega
fecha

==================================================
ADMIN CONTENT
==================================================

Editar:

Quiénes somos
Preguntas frecuentes
Política de cambios
Envíos
Contacto
Privacidad
Términos

==================================================
ADMIN SETTINGS
==================================================

Editar:

nombre de marca
logo
B de loading
Instagram
WhatsApp
email
teléfono
dirección
horarios

Mercado Pago
DAC

tipografía
colores
social links

==================================================
SEO
==================================================

Implementar:

metadata
title
description
canonical
Open Graph
Twitter cards
sitemap
robots
structured data Product
structured data Organization

==================================================
PERFORMANCE
==================================================

Optimizar:

images
fonts
videos
JS
CSS

Usar:

lazy loading
responsive images
preload hero
blur placeholders
CDN

La web debe mantener excelente performance incluso con imágenes editoriales grandes.

==================================================
ACCESSIBILITY
==================================================

Implementar:

alt text
keyboard navigation
focus states
semantic HTML
aria labels
reduced motion

==================================================
RESPONSIVE
==================================================

Diseñar mobile first.

Debe funcionar correctamente en:

360px
390px
430px
768px
1024px
1440px
1920px

==================================================
MOTION PRINCIPLES
==================================================

Motion debe ser elegante.

Loader:
alta intensidad

Page transition:
media/alta

Product hover:
media

Scroll reveal:
baja

Buttons:
muy baja

No usar:
bounce
shake
confetti
excessive parallax

==================================================
VISUAL LANGUAGE
==================================================

La dirección de arte debe ser:

minimalista
editorial
fashion
experimental
limpia
sofisticada
joven
independiente

Usar mucho espacio negativo.

Tipografía como elemento visual.

Fotografía como protagonista.

Evitar estética de template.

==================================================
COPY
==================================================

No inventar información comercial.

Si falta:
precio
stock
material
medidas
política
dirección

dejar editable desde CMS.

No usar lorem ipsum en producción.

==================================================
IMPORTANT
==================================================

Primero analizar la arquitectura completa.

Antes de implementar:
crear plan de proyecto.

Después:

1. scaffold
2. database schema
3. auth
4. storage
5. admin
6. storefront
7. cart
8. wishlist
9. checkout
10. Mercado Pago
11. shipping
12. custom requests
13. animations
14. SEO
15. performance
16. accessibility
17. tests

Crear componentes reutilizables.

No duplicar código.

No hardcodear contenido que debería venir del CMS.

==================================================
FINAL QUALITY BAR
==================================================

La web debe sentirse como una marca real de moda independiente, no como un proyecto de programación.

Debe ser:

rápida
premium
minimalista
editorial
responsive
administrable
escalable
SEO friendly
accessible

Y la B de BENJI$ debe convertirse en un elemento reconocible del sistema visual, especialmente en el loading y las transiciones.
```

---

## 61. Una decisión importante sobre las fotos

Con las fotos que tenés ahora, **yo no esperaría a tener todo para construir la web**.

Construiría el sistema para que soporte perfectamente el estado incompleto.

Eso te permite lanzar con:

**Balaclavas + Riñoneras**

y mostrar:

**Buzos — próximamente**

Después simplemente vas cargando contenido desde el admin.

---

## 62. Y sobre las riñoneras: mi decisión definitiva

Yo haría:

**SHOP**

→ Buzos
 → Balaclavas
 → Riñoneras
 → Únicos

Pero:

**Únicos no es realmente una categoría de producto; es una colección transversal.**

Una riñonera puede aparecer simultáneamente en:

> Riñoneras

y:

> Únicos

con una etiqueta:

**1/1**

Esto te deja el modelo preparado para cualquier futura pieza única.

---

## 63. Lo que falta definir antes de que Claude empiece

Hay algunas cosas que **no inventaría**:

-  logo definitivo de Benji$ 
-  archivo de la B 
-  colores oficiales 
-  precios 
-  fotos 
-  dirección exacta de retiro 
-  costo DAC 
-  umbral de envío gratis 
-  políticas de cambios 
-  datos bancarios 
-  número de WhatsApp definitivo 
-  textos de marca 
-  datos de Mercado Pago 

Todo eso debería entrar al CMS/configuración.

Y una corrección importante: **yo no puedo mandarte un correo directamente desde este chat**. Sí puedo dejarte preparado el texto exacto del mail y la lista de archivos que tenés que enviar al desarrollador/diseñador.

### Fuentes de referencia

La referencia principal que analicé es [JOXFINA](https://joxfina.com/?utm_source=chatgpt.com). Su home actualmente enfatiza productos destacados, promociones, disponibilidad y producción uruguaya, mientras que su página “Sobre Joxfina” construye una narrativa de diseño independiente, producción local y piezas realizadas con intención. 

Además, el contexto de Joxfina dentro de la escena de diseño independiente/upcycling de Montevideo está documentado en prensa uruguaya, donde se la menciona específicamente por trabajar con upcycling y diseño independiente. 

**Mi recomendación:** no le des todavía a Claude el trabajo de “hacer toda la web” en un solo prompt sin control. Usaría este documento como **PRD**, y después le daría instrucciones por fases: primero arquitectura + DB + CMS, después storefront, después motion/arte, y por último checkout/MP. Así evitás que Claude construya una tienda linda pero técnicamente difícil de mantener.