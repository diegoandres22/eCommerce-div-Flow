# eCommerce Div Flow - MVP Full-Stack Specification

## Arquitectura del Proyecto
Este es un proyecto Full-Stack unificado en un solo repositorio utilizando Next.js 15 (App Router). Contiene tres capas integradas:
1. **Frontend Público (Tienda):** Rutas dinámicas para clientes finales.
2. **Dashboard de Administración:** Ruta protegida en `/admin` para la gestión del comercio.
3. **API Interna (API Routes):** Endpoints bajo `app/api/*` encargados de los CRUDs y la comunicación con la base de datos a través de Prisma ORM.

## Tecnologías Principales
- Framework: Next.js 15
- Lenguaje: TypeScript
- Base de Datos: PostgreSQL (Supabase/Neon) con Prisma ORM
- Autenticación: Auth.js v5 (Google Auth)

## Requisitos de Interfaz y Diseño (UI/UX)
- **Diseño Responsivo:** Toda la interfaz (tienda pública y panel de administración) debe ser 100% Mobile-First y adaptarse perfectamente a dispositivos móviles, tablets y pantallas de escritorio.
- **Tema Claro/Oscuro:** El proyecto debe soportar de forma nativa el cambio de tema (Light/Dark mode) utilizando las clases de Tailwind CSS y el sistema integrado en el repositorio base. Toda nueva vista debe heredar y respetar estos estilos.

## Reglas de Negocio Específicas del MVP
- **Single-Tenant:** El código se clona e implementa de forma independiente por cada cliente.
- **Flujo de Pago por WhatsApp:** No hay pasarelas de pago. El carrito de compras se procesa mediante un botón que abre un enlace de WhatsApp con un mensaje preformateado conteniendo el resumen del pedido.
- **Configuración de la Tienda:** El número de teléfono de WhatsApp de destino debe almacenarse en la base de datos y ser editable desde el Dashboard de administración.
- **Gestión de Imágenes:** Las imágenes se manejan exclusivamente mediante enlaces/URLs de texto externos provenientes de Cloudinary. El framework Next.js debe configurar el dominio `://cloudinary.com` en su archivo de configuración para permitir el renderizado nativo optimizado.
- **Exclusiones actuales:** Sin sistema de cupones ni control complejo de inventario.

## Esquema de Datos Requerido (Prisma)
Asegurar que los modelos reflejen los siguientes campos mínimos:
1. **Category:** id, name, slug, timestamps (CRUD completo en Admin).
2. **Product:** 
   - id, name, description, price
   - categoryId (Relación con Category)
   - images (Array de strings / URLs de texto de Cloudinary)
   - campoTexto1 (String)
   - campoNumero2 (Float/Int)
   - campoTextoGeneral (String)
   - isActive (Boolean)
   - timestamps
3. **ConfiguracionTienda:** id, whatsappNumber (para control desde el Dashboard).
4. **Auth.js v5:** Modelos estándar (User, Account, Session) validados estrictamente contra la variable de entorno `ALLOWED_ADMIN_EMAIL` en el login.

## Requisitos Técnicos y de Experiencia (UX/DX)
- **Carga Eficiente de Imágenes:** El frontend debe utilizar el componente `<Image />` de Next.js con propiedades de aspecto (`aspect-ratio`) y layouts responsivos. Se prohíbe el uso de etiquetas `<img>` nativas.
- **Estados de Carga y Errores (Skeletons):** Cada interacción con la base de datos debe incluir un estado visual de carga utilizando Skeletons o Spinners atractivos, además de un manejo limpio de pantallas de error.
- **Validación de Formularios Extrema:** El formulario de creación/edición de productos en el Admin debe validar que los enlaces de Cloudinary sean URLs válidas, que el precio sea mayor a cero y que los campos obligatorios no se envíen vacíos.
- **Preparación para Producción (Build Clean):** Todo el código de TypeScript debe estar estrictamente tipado. No se permite el uso de `any` para garantizar que el despliegue en Vercel pase el comando `npm run build` sin errores en el primer intento.
- **Manejo de Moneda y Formato:** Todos los precios mostrados en la tienda y el administrador deben formatearse dinámicamente según la moneda local requerida mediante `Intl.NumberFormat` de manera centralizada.


## Decisiones de Implementación (para no generar ambigüedad)
- **Rutas de Producto:** `Product` no tiene `slug` (solo `Category` lo tiene). Las rutas públicas de producto son `/products/[id]`, no `/products/[slug]`.
- **API Routes vs lecturas directas:** Las mutaciones (crear/editar/borrar) del Admin pasan por `app/api/admin/*`. Las lecturas para renderizar páginas (Server Components) consultan Prisma directamente vía `server/queries/*`, sin pasar por una API Route intermedia, para evitar una vuelta de red innecesaria dentro del propio servidor.
- **Tema Claro/Oscuro:** Implementado con `next-themes` (`ThemeProvider` en `app/layout.tsx` + `<ThemeToggle />` en el header público y en el panel admin). Las variables de color ya estaban definidas en `styles/globals.css` (`:root` y `.dark`), solo faltaba conectar el toggle.
- **Auth.js v5 real:** Dos providers en `lib/auth.ts`: Google (gate por `ALLOWED_ADMIN_EMAIL`) y un `CredentialsProvider` de cuenta de prueba (`TEST_ADMIN_USER`/`TEST_ADMIN_PASS` en `.env`) para que terceros prueben el panel sin Google. Ambos dan acceso completo, sin roles ni tabla de permisos — si existe sesión, es admin. El callback `signIn` aprueba directo cuando `account.provider === 'credentials'` (ya validado en `authorize()`) y valida el email solo para Google. `middleware.ts` protege `/admin/*` y `/api/admin/*` igual que antes.
- **Base clonada vs. MVP real:** El repo base (`SatvikPraveen/Nextjs-Ecommerce`) traía Stripe, `Cart`/`CartItem`/`Order`/`OrderItem`/`Review`/`Newsletter`/`Inventory`/`ProductVariant` en el schema, cuentas de cliente con perfil/historial de pedidos, y un uploader a S3. Todo eso se eliminó por completo (código y modelos) porque no aplica a este MVP (pago por WhatsApp, sin cuentas de cliente, imágenes solo por URL de Cloudinary). Si aparece algo que referencie esos conceptos, es código viejo que no debería haber sobrevivido — bórralo, no lo repares.
- **Imágenes:** `next.config.mjs` restringe `remotePatterns` a `res.cloudinary.com` (antes permitía cualquier dominio).
- **Home con carruseles:** `app/page.tsx` arma tres bloques: `Banner` (modelo nuevo, CRUD en `/admin/banners`, carrusel full-width con autoplay), "Los más vistos" (`Product.views`, incrementado en cada visita a `/products/[id]` vía `incrementProductViews`) y un carrusel por cada categoría con productos activos. El carrusel base es `components/ui/carousel.tsx` (wrapper de `embla-carousel-react`, patrón shadcn/ui), reutilizado por `components/product-carousel.tsx` y `components/home/banner-carousel.tsx`.
- **Modelo `Banner`:** `id, imageUrl, title?, subtitle?, linkUrl?, order, isActive, timestamps`. CRUD completo en `/admin/banners` (mismo patrón que Category/Product: Zod en `lib/validators.ts`, API en `app/api/admin/banners/*`, `AlertDialog` para borrar).
- **Subcategorías (`Category.parentId`):** `Category` tiene una relación autorreferencial (`parentId`/`parent`/`children`, relation `"CategoryHierarchy"`) limitada a **un solo nivel**: una categoría con `parentId` es subcategoría, una categoría sin `parentId` es principal; una subcategoría no puede a su vez tener hijas (validado en `app/api/admin/categories/route.ts` y `[id]/route.ts`, no a nivel de base de datos). `Product` tiene `categoryId` (obligatoria, siempre la categoría principal) y `subCategoryId` (opcional; si se define, debe ser hija directa de `categoryId`, validado en `app/api/admin/products/route.ts` y `[id]/route.ts`). `server/queries/products.ts#getProductsByCategorySlug` acepta el slug de una categoría principal o de una subcategoría y busca productos por `categoryId` **o** `subCategoryId` para que ambas vistas funcionen. El dropdown "Categorías" del navbar (`components/categories-menu.tsx`) solo lista categorías principales (`parentId: null`), máximo 10 + "Ver más" hacia `/categories`.
- **Chrome condicional (Header/Footer):** `app/layout.tsx` es el único root layout (Next.js App Router no permite múltiples roots sin reestructurar todo en route groups). Para que `/admin/*` y `/auth/signin` no muestren el Header/Footer públicos, `components/site-chrome.tsx` (Client Component, usa `usePathname`) los oculta condicionalmente; `Header`/`Footer` se pasan ya renderizados como props (`header`/`footer`) desde `app/layout.tsx` porque un Client Component no puede importar y renderizar directamente un Server Component que usa `auth()`/Prisma.
- **`Header` es Server Component:** `components/header.tsx` ya no lleva `'use client'` — necesita `auth()` (para el botón "Panel admin", visible si hay sesión) y `getTopLevelCategories()` (para el dropdown). Los subcomponentes interactivos (`CartDrawer`, `ThemeToggle`, `CategoriesMenu`) siguen siendo Client Components renderizados desde él.
- **Formulario de asesoría:** `app/(store)/contacto/page.tsx` + `components/contact-form.tsx` envían el formulario a `app/api/contact/route.ts`, que usa `lib/mailer.ts` (Nodemailer + SMTP, variables `SMTP_HOST/PORT/USER/PASS` y `CONTACT_EMAIL_TO` en `.env`) para reenviar el mensaje por correo. No se guarda en base de datos (no hay modelo `ContactMessage`, por simplicidad del MVP).
- **Login de prueba en UI:** `app/auth/signin/page.tsx` usa `components/icons/google-icon.tsx` (SVG oficial a color) en el botón de Google y `components/ui/password-input.tsx` (con ícono de ojo de `lucide-react`) en el campo de contraseña de la cuenta de prueba.

## Directrices de Desarrollo para Claude Code
- Mantén la arquitectura de carpetas limpia y minimalista.
- No agregues sobreingeniería, lógica de stock ni inventarios complejos.
- Proporciona código modular y enfócate en cumplir un CRUD simple a la vez.
