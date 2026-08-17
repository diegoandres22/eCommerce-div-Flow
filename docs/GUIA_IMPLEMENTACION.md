# Guía de Implementación — Adaptar el proyecto a un cliente nuevo

> Guía paso a paso para clonar y desplegar este proyecto para un cliente real. Complementa a `DOCUMENTACION_TECNICA.md` (qué es el proyecto y cómo está construido) — este documento es exclusivamente el "cómo lo pongo en marcha para alguien nuevo".
>
> Arquitectura single-tenant: cada cliente es un clon independiente, con su propia base de datos, su propio proyecto de Supabase y sus propias variables de entorno. No hay nada compartido entre clientes.

---

## 1. Proveedores necesarios y por qué

| Proveedor | Para qué se usa | Alternativa posible |
|---|---|---|
| **Vercel** | Hosting del proyecto Next.js (recomendado) | Docker self-hosted (`docker/README.md`) |
| **Supabase** | Base de datos PostgreSQL + Storage de imágenes (bucket público `product-images`) | Neon (solo para la base de datos — habría que resolver el Storage con otro proveedor, no está construido para eso) |
| **Google Cloud Console** | Credenciales OAuth para el login del admin con Google | Ninguna si se usa solo el login por credenciales (usuario + contraseña) |
| **Un servidor SMTP** (Gmail con contraseña de aplicación, SendGrid, cualquier SMTP estándar) | Envío del correo de contacto y de notificación de nuevos leads | Ninguna — sin esto, esas dos funciones fallan silenciosamente (best-effort, no rompen el resto del sitio, pero el admin no se entera de nada por correo) |

No se usa ninguna pasarela de pago, ningún proveedor de SMS, ni ninguna API de WhatsApp Business — el "checkout por WhatsApp" es un simple deep link (`https://wa.me/...`), sin integración de API ni costos asociados.

---

## 2. Variables de entorno: qué es cada una y dónde conseguirla

Copiar `.env.example` a `.env` y completar. Ninguna de estas variables se commitea al repositorio.

### Base de datos (obligatorias)

- **`DATABASE_URL`** — conexión "pooled" (PgBouncer), la usa la app en cada request normal. En Supabase: *Settings → Database → Connection string → modo "Transaction"* (puerto 6543, con `?pgbouncer=true`).
- **`DIRECT_URL`** — conexión directa sin pooler, la usa Prisma solo para correr migraciones. En Supabase: misma pantalla, modo *"Direct connection"* (puerto 5432). El modo pooled no soporta bien los cambios de esquema, por eso se necesitan las dos.

### Autenticación (obligatorias)

- **`NEXTAUTH_SECRET`** — generar con `openssl rand -base64 32`. Un valor distinto por cliente, nunca reutilizar entre proyectos.
- **`NEXTAUTH_URL`** — la URL pública del sitio (`http://localhost:3000` en desarrollo, la URL real de Vercel en producción).
- **`GOOGLE_CLIENT_ID`** / **`GOOGLE_CLIENT_SECRET`** — desde [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials). Crear un "OAuth 2.0 Client ID" tipo "Web application", con el *Authorized redirect URI* apuntando a `<URL_DEL_SITIO>/api/auth/callback/google`.
- **`ALLOWED_ADMIN_EMAILS`** — lista de emails (separados por coma) que pueden entrar a `/admin` con Google. Sin esto, nadie puede loguearse por Google. Editar esta única línea para sumar o sacar un admin, sin tocar nada más.
- **`ADMIN_CREDENTIALS`** *(opcional)* — solo si el cliente quiere login con usuario/contraseña además de Google. Lista de pares `usuario:hashBcrypt` separados por coma. Requiere además `permitirLoginConCredenciales: true` en `lib/store-config.ts` para ese cliente puntual. Generar cada hash con:
  ```bash
  node -e "console.log(require('bcryptjs').hashSync('la-contraseña-real', 10))"
  ```
  **Importante:** escapar cada `$` del hash resultante como `\$` en el `.env` (Next.js expande `$algo` como si fuera una variable de entorno — sin el escape, el hash queda vacío y esa cuenta desaparece silenciosamente de la lista).

### Supabase Storage (obligatorias para poder subir imágenes)

- **`SUPABASE_URL`** — desde el dashboard de Supabase, *Settings → API*.
- **`SUPABASE_SERVICE_ROLE_KEY`** — misma pantalla. Server-only, **jamás** debe llegar al navegador ni a un archivo commiteado.

Además, crear manualmente el bucket **`product-images`** en Supabase Storage, marcado como **público** (lectura pública, escritura solo vía Service Role Key desde el servidor).

### Correo (obligatorias para contacto y notificación de leads)

- **`SMTP_HOST`** / **`SMTP_PORT`** / **`SMTP_USER`** / **`SMTP_PASS`** — credenciales del proveedor SMTP elegido. Con Gmail, `SMTP_PASS` debe ser una *contraseña de aplicación*, no la contraseña real de la cuenta (Google la exige para acceso SMTP de terceros).
- **`CONTACT_EMAIL_TO`** — el buzón que recibe tanto los mensajes de contacto como las notificaciones de nuevos leads.

### Aplicación (obligatoria)

- **`NEXT_PUBLIC_APP_URL`** — la URL pública real del sitio, usada en `sitemap.ts`, `robots.ts` y los links de los correos salientes.

---

## 3. Dónde tocar la identidad del cliente (branding)

Todo lo que identifica visualmente al negocio vive en dos lugares, sin mezclarse con datos operativos:

### `lib/store-config.ts` — datos planos, sin lógica
Objeto plano en español que se llena a mano por cliente: `nombre`, `slogan`, `descripcion`, tres colores de marca en hex (`colorPrimario`/`colorSecundario`/`colorAcento`), contacto/redes (`correoSoporte`, `telefono`, `direccion`, `instagram`, `tiktok`, `facebook`) y los flags de módulos opcionales (`mostrarFavoritos`, `mostrarVistosRecientemente`, `mostrarColoresDeProducto`, `mostrarBannerAnuncios`, `permitirLoginConCredenciales`).

Los colores se convierten automáticamente a variables CSS (`lib/theme.ts`), con contraste de texto calculado solo (no hace falta pedirle al cliente un color de texto combinado) y una variante `-accent` que evita texto invisible en tema oscuro cuando el color de marca es muy oscuro.

### Assets a reemplazar directamente (no son campos de texto)
- `public/images/logolight.png` / `logodark.png` — logo para tema claro/oscuro.
- `app/icon.png` (256×256) y `app/apple-icon.png` (180×180) — favicon y accesos directos iOS. Next.js los detecta por convención de nombre de archivo, sin tocar `metadata` en `app/layout.tsx`.
- `public/icons/icon-192.png` / `icon-512.png` — íconos de la PWA (distintos de los anteriores, exigidos por `app/manifest.ts`).

### Dato operativo (no es branding, es configuración del negocio)
El número de WhatsApp de destino **no** está en `store-config.ts` — vive en `ConfiguracionTienda.whatsappNumber` (base de datos), editable día a día desde `/admin/settings` sin necesitar un redeploy. Lo mismo para el texto/activación del banner de anuncios (`/admin/announcement-bar`).

---

## 4. Pasos de despliegue

### Opción A: Vercel (recomendada)

1. `git clone` el repositorio base para el cliente nuevo (repo propio, no un fork público).
2. Completar `lib/store-config.ts` y reemplazar los assets de branding (sección 3).
3. Crear el proyecto en Supabase (o Neon si solo se necesita la base, resolviendo el Storage aparte) y el bucket `product-images`.
4. Crear las credenciales de Google OAuth con el redirect URI apuntando al dominio real de Vercel.
5. Conectar el repositorio en Vercel, cargar **todas** las variables de entorno de la sección 2 en el dashboard del proyecto (Settings → Environment Variables).
6. Desplegar. El comando de build de Vercel debe incluir `prisma migrate deploy` antes de `next build` (ya configurado en el `build` script/pipeline del proyecto) para que las migraciones se apliquen automáticamente en cada deploy.
7. Cargar el catálogo real desde `/admin/products` — **nunca** correr `npm run db:seed` contra la base de datos de un cliente real (el script tiene un guardrail que corta si `NODE_ENV=production` sin `SEED_CONFIRM=true` explícito, pero de todos modos no es el flujo correcto: el seed es 100% para desarrollo, con datos e imágenes de prueba de `loremflickr.com`).
8. Verificar el checklist de la sección 6 antes de entregarle el acceso al cliente.

### Opción B: Docker (self-hosting)

```bash
docker-compose up --build
```

Ver `docker/README.md` para el detalle del `Dockerfile` de producción y las variables de entorno equivalentes (`.env.production` sirve de plantilla — mismas variables que `.env.example`, sin los servicios legados que traía la plantilla base original).

---

## 5. Checklist de verificación antes de entregar el proyecto

- [ ] `npx prisma migrate deploy` corrió sin errores contra la base de datos de producción (no `db push`, que no versiona el cambio).
- [ ] Login de admin funciona con al menos un email real en `ALLOWED_ADMIN_EMAILS`.
- [ ] Subida de imágenes funciona en `/admin/products` (confirma que `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` están bien cargadas y el bucket existe y es público).
- [ ] El número de WhatsApp configurado en `/admin/settings` genera un link correcto al hacer un pedido de prueba.
- [ ] El correo de contacto y la notificación de nuevo lead llegan al buzón configurado en `CONTACT_EMAIL_TO`.
- [ ] Logo, colores de marca y nombre del negocio se ven correctos en tema claro y oscuro, en móvil y escritorio.
- [ ] `loremflickr.com` fue removido de `next.config.mjs` (`remotePatterns` y CSP `img-src`) si el seed de desarrollo se usó en algún momento contra ese entorno.
- [ ] Contenido real (no placeholder) cargado en las páginas legales (Privacidad, Términos, Cookies) — confirmar con el cliente o su asesor legal que el contenido aplica a su jurisdicción real (ver nota legal en `DOCUMENTACION_TECNICA.md`, sección 10).
- [ ] `.env` de producción no contiene ninguna variable de un cliente anterior (Service Role Key, credenciales de Google, SMTP) — cada clon debe tener credenciales 100% propias, nunca reutilizadas entre clientes.

---

## 6. Troubleshooting de problemas conocidos

**Error `P1012: Environment variable not found: DIRECT_URL`** al correr migraciones — falta cargar `DIRECT_URL` en el entorno donde se ejecuta `prisma migrate deploy` (típicamente el pipeline de CI/CD o el comando de build de Vercel), no solo `DATABASE_URL`.

**`Error: supabaseUrl is required`** en el build o en runtime — `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` no están cargadas en ese entorno específico. Nota histórica: Next.js prioriza `.env.production` por sobre `.env` en cualquier build de producción local — si existe un `.env.production` con esas variables vacías (es la plantilla para Docker), un `next build` local puede fallar aunque `.env` esté bien completado.

**500 con body vacío (`SyntaxError: Unexpected end of JSON input`) al subir una imagen** — históricamente causado por una excepción no controlada en el endpoint de upload (env vars de Supabase faltantes, bucket sin permisos). El endpoint actual siempre devuelve JSON con el error real en el campo `detail` — si el problema persiste, ese mensaje indica la causa exacta en vez de un error genérico.

**El formulario de "usuario y contraseña" no aparece en `/auth/signin`** aunque `ADMIN_CREDENTIALS` esté cargada — casi siempre es el `$` sin escapar en el hash de bcrypt dentro del `.env` (ver sección 2). Next.js interpreta `$2a$10$...` como una expansión de variable y lo vacía silenciosamente.

**Pantalla de "Acceso denegado" sin estilo del proyecto** al loguearse con un Google no autorizado — comportamiento esperado (el email no está en `ALLOWED_ADMIN_EMAILS`), la página ahora hereda el branding del sitio y explica el motivo. Si un admin legítimo ve esto, confirmar que su email está bien escrito en la lista (sin espacios extra, mismo dominio).

**Botón "Agregar"/"Agotado" invisible en tema oscuro, o texto invisible en hover de menús** — clase de bug ya resuelto sistémicamente (`--primary-accent`, ver `DOCUMENTACION_TECNICA.md` sección 8) para colores de marca muy oscuros o muy claros. Si aparece en un componente nuevo, seguir el mismo patrón: cualquier `hover:bg-accent`/`text-primary` fuera de un botón/badge sólido con su `-foreground` parejo debe usar la variante `-accent`.

**Scroll horizontal en móvil** — `overflow-x: hidden` en `html`/`body` actúa como red de seguridad general. Si aparece igual en un dispositivo real, es señal de un elemento puntual desbordando (revisar con DevTools en modo responsive antes de asumir que es el mismo bug ya resuelto).

**CI de GitHub Actions falla en `better-npm-audit`** por una vulnerabilidad nueva no documentada — confirmar primero si la dependencia afectada es directa del proyecto (se puede fijar/actualizar en `package.json`) o viene empaquetada dentro de `next/node_modules` (no controlable desde este repo). Si es lo segundo, documentar la excepción en `.nsprc` con el GHSA ID y la justificación, siguiendo el formato ya usado para las excepciones existentes — nunca aplicar la sugerencia de `npm audit fix --force` sin revisar antes a qué versión de `next` baja (históricamente ha sugerido una versión de 2020 sin App Router).
