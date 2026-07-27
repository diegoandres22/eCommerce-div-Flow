# Div Flow eCommerce

[![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=next.js&logoColor=fff)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma&logoColor=fff)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=fff)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)

MVP de eCommerce **single-tenant** con checkout por WhatsApp: sin pasarela de pago, sin cuentas de cliente, sin reseñas ni cupones. Cada cliente corre su propio clon del proyecto con su propia base de datos — no es un SaaS multi-tenant compartido.

El cliente arma su pedido en el carrito y lo envía por WhatsApp con un mensaje preformateado; la venta se cierra por conversación directa. La plataforma incluye tienda pública, panel de administración completo y un módulo de control de stock opcional.

📄 **Documentación completa** (arquitectura, modelo de datos, flujos de negocio, guía de desarrollador y checklist de replicación a un cliente nuevo): [`docs/Documentacion_Tecnica_y_de_Producto.docx`](docs/Documentacion_Tecnica_y_de_Producto.docx) y [`CLAUDE.md`](CLAUDE.md).

---

## ✨ Qué incluye

- **Tienda pública** — catálogo con categorías/subcategorías, búsqueda, filtros, carrito, checkout por WhatsApp, banners promocionales, favoritos y "vistos recientemente" (sin backend, en `localStorage`).
- **Panel de administración** (`/admin`) — productos, categorías, banners, precios masivos, configuración de WhatsApp, banner de anuncios y leads (intención de compra).
- **Módulo de stock opcional** — interruptor general que activa cantidades reales por producto (y por color), alertas de stock bajo, y descuento manual al confirmar una venta.
- **Analítica interna liviana** — productos más vistos, rutas más visitadas, enlaces rotos, todo sin depender de Google Analytics.
- **PWA instalable** con soporte offline básico.
- **Tema claro/oscuro** nativo, mobile-first en toda la interfaz.

## 🧱 Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + React 18 + TypeScript estricto |
| Base de datos | PostgreSQL (Supabase / Neon) + Prisma ORM |
| Autenticación | Auth.js v5 — Google OAuth |
| Estilos / UI | Tailwind CSS + shadcn/ui (Radix) + next-themes |
| Imágenes | Supabase Storage (bucket público `product-images`) |
| Correo | Nodemailer sobre SMTP |
| Tablas admin | TanStack Table |
| Carruseles | Embla Carousel |
| Validación | Zod |
| Hosting | Vercel (recomendado) · Docker (alternativa) |

## 🚀 Quick start

**Requisitos:** Node.js 20+, una base de datos PostgreSQL (local con Docker o un proyecto de Supabase/Neon).

```bash
git clone <url-del-repositorio>
cd Nextjs-Ecommerce

npm install
cp .env.example .env    # completar con tus valores (ver sección de abajo)

npx prisma generate
npx prisma migrate deploy

npm run dev              # http://localhost:3000
```

Para tener datos de prueba en desarrollo (100 productos, categorías y banners de ejemplo):

```bash
npm run db:seed
```

Este comando está bloqueado si `NODE_ENV=production` (ver `prisma/seed.ts`) — nunca debe correr contra la base de datos de un cliente real.

### Variables de entorno

Ver [`.env.example`](.env.example) para el listado completo con explicación de cada una. Las imprescindibles para levantar el proyecto:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL (pooled) |
| `DIRECT_URL` | Conexión directa a PostgreSQL (sin pooler), solo para migraciones |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Sesión del panel admin |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login del admin vía Google |
| `ALLOWED_ADMIN_EMAIL` | Único email autorizado a entrar por Google |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Storage de imágenes |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `CONTACT_EMAIL_TO` | Correo de contacto y notificación de leads |
| `NEXT_PUBLIC_APP_URL` | URL pública del sitio |

`ADMIN_LOGIN_EMAIL` + `ADMIN_PASSWORD_HASH` habilitan el login con correo y contraseña (además de Google) -- requiere también `permitirLoginConCredenciales: true` en `lib/store-config.ts` para ese cliente.

## 📁 Estructura del proyecto

```
app/
├── (store)/        # Tienda pública: home, /products, /category/[slug], /search, /cart, /contacto
├── admin/           # Panel de administración (protegido)
├── api/             # Rutas de API: admin/* (protegidas), leads y contact (públicas), auth
└── auth/signin/      # Login del panel admin

components/
├── admin/           # Componentes específicos del panel
├── home/             # Carruseles y banner de inicio
└── ui/                # Componentes base (shadcn/ui)

lib/                 # Lógica sin UI: auth, validadores Zod, correo, WhatsApp, stock, tema, rate limiting…
server/
├── queries/          # Lecturas (llamadas directo desde Server Components)
└── actions/           # Server Actions puntuales

prisma/              # schema.prisma, migraciones, seed.ts (solo desarrollo)
tests/unit/           # Tests unitarios (Jest) de lib/utils.ts
docker/               # Dockerfile de producción
```

## 🛠️ Scripts disponibles

```bash
npm run dev            # Servidor de desarrollo
npm run build           # Build de producción
npm run start            # Sirve el build de producción

npm run lint              # ESLint
npm run type-check         # tsc --noEmit
npm run test:unit           # Tests unitarios (Jest)
npm run format               # Prettier

npm run db:push                # Sincroniza el esquema sin migración con nombre
npm run db:studio               # Prisma Studio
npm run db:generate              # Regenera el cliente de Prisma
npm run db:seed                   # Datos de prueba (SOLO desarrollo)
```

También existe un `Makefile` con atajos equivalentes (`make dev`, `make db-setup`, `make check`, `make docker-up`, etc.) para quien prefiera ese flujo — correr `make help` para ver todos.

## 🔐 Seguridad

- Login del admin restringido a un único email (`ALLOWED_ADMIN_EMAIL`) vía Google OAuth. Opcionalmente, por cliente (`STORE_CONFIG.permitirLoginConCredenciales` en `lib/store-config.ts`), se puede habilitar además un login con correo y contraseña -- la contraseña se guarda como hash de bcrypt (`ADMIN_PASSWORD_HASH`), nunca en texto plano, y ese login tiene rate limiting propio (5 intentos / 15 min por IP).
- `Content-Security-Policy` y demás headers de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) en todas las rutas — ver `next.config.mjs`.
- Rate limiting por IP en los endpoints públicos sin autenticación (`/api/leads`, `/api/contact`).
- Validación de tipo y tamaño en la subida de imágenes; límites de tamaño en los payloads públicos.
- La Service Role Key de Supabase vive solo en el servidor, nunca se expone al navegador.

## 🚢 Despliegue

**Vercel (recomendado)** — conectar el repositorio, cargar las variables de entorno del `.env.example`, y desplegar. Correr `npx prisma migrate deploy` contra la base de datos de producción y cargar el catálogo real desde `/admin/products` (nunca `db:seed`).

**Docker (alternativa)** — ver [`docker/README.md`](docker/README.md):

```bash
docker-compose up --build
```

## 🏗️ Implementar para un cliente nuevo

La arquitectura es single-tenant: cada cliente es un clon independiente con su propia base de datos y variables de entorno. El checklist completo (branding, logos, credenciales, despliegue, verificación) está en la documentación técnica ([`docs/Documentacion_Tecnica_y_de_Producto.docx`](docs/Documentacion_Tecnica_y_de_Producto.docx), sección 12).

## 📄 Licencia

Proyecto de uso privado — no es un repositorio de código abierto. El archivo `LICENSE` (MIT) heredado de la plantilla base sobre la que se construyó este proyecto está pendiente de revisión legal antes de un despliegue comercial con clientes.
