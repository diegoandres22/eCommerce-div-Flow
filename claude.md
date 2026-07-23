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

## Directrices de Desarrollo para Claude Code
- Mantén la arquitectura de carpetas limpia y minimalista.
- No agregues sobreingeniería, lógica de stock ni inventarios complejos.
- Proporciona código modular y enfócate en cumplir un CRUD simple a la vez.
