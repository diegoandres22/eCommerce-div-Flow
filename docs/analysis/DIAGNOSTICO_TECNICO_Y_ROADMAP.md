# Diagnóstico Técnico y Hoja de Ruta — Flow eCommerce

**Rol:** Senior Software Engineer / Technical Lead
**Alcance:** Auditoría completa del repositorio (arquitectura, código, dependencias, tests, seguridad, SEO).
**Fecha:** 2026-07-24

---

## 1. Evaluación general y diagnóstico actual

### Arquitectura

La decisión de fondo — un monolito Next.js 15 (App Router) con tienda pública, admin y API routes en el mismo repo — es la correcta para un MVP single-tenant que se clona por cliente. No hay sobreingeniería de microservicios ni de colas de eventos que no necesitas. La separación de responsabilidades es limpia y consistente en casi todo el código:

- **Lecturas vs. mutaciones bien separadas:** las páginas públicas (Server Components) consultan Prisma directamente vía `server/queries/*`, y las mutaciones del admin pasan por `app/api/admin/*`. Esto evita una vuelta de red innecesaria y es la práctica correcta en App Router — no es trivial que un proyecto generado iterativamente haya mantenido esta disciplina.
- **Validación centralizada:** todos los formularios del admin pasan por Zod (`lib/validators.ts`) antes de tocar la base de datos, con `.refine()` para reglas cruzadas (subcategoría-categoría, bulk pricing). Es el patrón correcto y está bien ejecutado.
- **Un solo guardián de seguridad:** `middleware.ts` protege `/admin/*` y `/api/admin/*` en un único punto, sin lógica de autorización duplicada dispersa por las rutas API. Correcto.
- **Componentes Server vs. Client bien delimitados:** `Header` es Server Component porque necesita `auth()` y Prisma; los interactivos (`CartDrawer`, `ThemeToggle`, `CategoriesMenu`) son Client Components inyectados como hijos. Esto demuestra que entendés la frontera real de Next.js App Router, no solo la sintaxis.

### Experiencia de usuario

Para un MVP de venta por WhatsApp, el nivel de pulido ya está por encima del promedio de este tipo de proyectos: carruseles con autoplay, buscador predictivo, wishlist persistente, banner dinámico, estados de carga con skeletons reales (no solo spinners genéricos), manejo de errores de imagen con fallback visual, tema claro/oscuro consistente. La mayoría de "tiendas WhatsApp" que se venden como producto en el mercado hispanohablante no llegan a este nivel de detalle.

### Puntos fuertes a destacar

1. **Disciplina de "no romper lo que no aplica":** cuando heredaste el template base con Stripe/Cart/Order/Review, lo eliminaste por completo en vez de dejarlo "por si acaso". Eso es exactamente lo contrario de lo que suele pasar en proyectos clonados, y se nota en que hoy no hay código muerto compitiendo con el código real *dentro de la lógica de negocio*.
2. **Convenciones documentadas y respetadas:** `CLAUDE.md` no es un README decorativo — cada decisión de arquitectura no obvia (por qué `Product` no tiene slug, por qué el `Header` es Server Component, cómo se resuelve la jerarquía de subcategorías) está anotada y se ha mantenido actualizada en cada iteración. Esto reduce drásticamente el riesgo de que un cambio futuro rompa una convención sin darse cuenta.
3. **Formularios de admin con feedback real:** loading states, validación con mensajes claros, tablas que se ocultan durante edición, campos obligatorios marcados — el admin no se siente como un CRUD genérico de scaffolding.
4. **SEO técnico ya resuelto en la base:** `sitemap.ts` es dinámico de verdad (lee productos y categorías activos desde Postgres, no una lista estática), y `robots.ts` existe. Esto es algo que muchos proyectos "terminados" olvidan.

---

## 2. Optimización y deuda técnica (qué mejorar hoy)

### 🔴 Deuda técnica de mayor impacto

**La suite de tests no prueba tu aplicación.** Revisé `tests/unit/price.test.ts`, `tests/integration/database.test.ts` y el resto: son remanentes del template base. `price.test.ts` define sus propias funciones `calculatePrice`/`calculateTax` *dentro del archivo de test*, sin importar nada de `lib/utils.ts` — no testea tu código, testea una simulación de otro proyecto. `database.test.ts` literalmente dice en un comentario `// @ts-nocheck ... intentional schema mismatches for demonstration purposes`. Tener `npm test` "verde" mientras no cubre nada real es peor que no tener tests, porque da falsa confianza. Antes de que el proyecto crezca, esto debería limpiarse: borrar lo que no aplica y escribir un puñado de tests reales sobre lo que sí importa (Zod schemas, `formatPrice`, `parseProductColors`, la lógica de `bulk-pricing`).

**No hay persistencia de pedidos.** El checkout es 100% vía enlace de WhatsApp — no existe ningún registro en base de datos de qué se "vendió" o intentó comprar. Hoy, si el WhatsApp del negocio se pierde, se cambia de número, o simplemente querés saber cuánto facturaste el mes pasado, no hay ninguna fuente de verdad. No es un problema de código roto, es una ausencia estructural que limita el valor comercial del sistema. Lo desarrollo en la Hoja de Ruta (sección 3) porque no es una pasarela de pago ni algo que hayas excluido — es research de negocio, no de proveedor de pagos.

### 🟡 Cuellos de botella de escalabilidad

- **Sin paginación en ningún listado:** `getActiveProducts()`, `searchProducts()`, `getProductsByCategorySlug()` y el índice de `/api/products` (usado por el buscador predictivo) traen **todo** el catálogo en una sola consulta. Con 50 productos no se nota. Con 500+ productos, cada visita a `/products` o cada primer foco en el buscador va a descargar y renderizar el catálogo completo. Es el mismo trade-off que ya documentamos conscientemente en `ProductToolbar` (filtro/orden client-side) — pero ahí fue una decisión explícita para el tamaño actual del catálogo; en las queries de Prisma es simplemente algo que no se ha necesitado todavía, no algo decidido.
- **Sin índices explícitos para los patrones de consulta reales:** Prisma indexa automáticamente las columnas de relación (`categoryId`, `subCategoryId`), pero se filtra y ordena constantemente por `isActive` y `views` (home, "más vistos", listados) sin un índice compuesto dedicado. A la escala actual no importa; a partir de unos miles de filas sí.
- **Subida de imágenes sin validación server-side del tipo de archivo:** `app/api/admin/upload/route.ts` confía en `file.type` (lo que el navegador *dice* que es el archivo) sin verificarlo contra una lista blanca de MIME types en el servidor. Es un endpoint protegido por sesión de admin, así que el riesgo real es bajo, pero es la clase de gap que vale la pena cerrar antes de dar acceso a más de una persona al panel.

### 🟡 Seguridad y configuración

- **Sin cabeceras de seguridad HTTP.** `next.config.mjs` configura `Cache-Control` para `/api/:path*`, pero no hay `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy` ni `Strict-Transport-Security` en ningún lado. Es una capa barata de agregar (un objeto más en `headers()`) que reduce superficie de ataque (clickjacking, sniffing de tipo de contenido) para casi cero costo de desarrollo.
- **Sin validación de variables de entorno al arrancar.** Cuando falta o está mal una variable (`SUPABASE_SERVICE_ROLE_KEY`, `SMTP_PASS`, etc.), el error aparece tarde y de forma críptica — como ya vivimos con el error de Prisma "Can't reach database server" y el 500 crudo de NextAuth. Un archivo `lib/env.ts` que valide `process.env` con Zod al bootear la app convierte esos errores en un mensaje claro apenas arranca el servidor, en vez de en medio de una petición de un cliente real.

### 🟢 Limpieza menor (bajo impacto, bajo esfuerzo)

- `package.json` describe el proyecto como algo que ya no es ("Stripe payments, newsletter subscriptions... comprehensive testing") — es la descripción del template original, nunca se actualizó.
- Dependencias instaladas y nunca importadas en el código real: `@vercel/analytics` y `@vercel/speed-insights` no están wireados en `app/layout.tsx` (están en `package.json` pero no se usan); `schema-dts` tampoco se usa en ningún lado (ver sección 3, es una oportunidad, no solo deuda); `@next/font` es el paquete viejo, reemplazado por `next/font` nativo desde Next 13; `zustand`, `cmdk`, `react-hot-toast`, `date-fns`, `nanoid`, varios `@radix-ui/*` (`dialog`, `popover`, `tabs`, `react-icons`) no aparecen usados en el código de la tienda/admin actual — probablemente sobras del template. Vale la pena una pasada con `depcheck` para confirmar y podar: menos dependencias es menos superficie de vulnerabilidades y builds más rápidos.

---

## 3. Hoja de ruta — de lo más fácil/importante a lo más complejo

*(Excluyo explícitamente pasarelas de pago, cupones, reseñas, integraciones de envío y login social, como pediste.)*

### 1. Datos estructurados (JSON-LD) para productos
**Esfuerzo:** bajo · **Beneficio técnico:** ninguno nuevo que instalar — `schema-dts` ya está en `package.json` sin usarse. **Beneficio comercial:** Google puede mostrar precio, disponibilidad y nombre directamente en resultados de búsqueda (rich snippets), lo que históricamente sube el CTR orgánico de fichas de producto. Es prácticamente gratis dado que ya tenés la librería instalada.

### 2. Flag de "Agotado" independiente de `isActive`
**Esfuerzo:** bajo (un booleano más en `Product`, una migración simple) · **Beneficio técnico:** no viola la regla de "sin inventario complejo" — es un interruptor, no conteo de stock. **Beneficio comercial:** hoy la única opción es ocultar el producto por completo (`isActive: false`) cuando se agota, perdiendo el tráfico SEO y el historial de esa ficha. Con "Agotado" el producto sigue siendo visible e indexable, pero el botón de WhatsApp se deshabilita con un mensaje — no perdés la página, solo pausás la venta.

### 3. "Vistos recientemente"
**Esfuerzo:** bajo (mismo patrón que `wishlist-provider.tsx`, ya construido y probado) · **Beneficio técnico:** reutiliza 100% la arquitectura de localStorage que ya existe, cero backend nuevo. **Beneficio comercial:** es uno de los mecanismos de retención/conversión más simples y efectivos en e-commerce (le recuerda al usuario lo que ya le interesó), y el costo de construirlo es mínimo porque el patrón ya está resuelto en tu código.

### 4. Paginación / scroll infinito en listados de productos
**Esfuerzo:** medio · **Beneficio técnico:** resuelve directamente el cuello de botella de escalabilidad de la sección 2 (queries que traen el catálogo completo). **Beneficio comercial:** tiempos de carga consistentes sin importar cuántos productos tenga el cliente final — hoy el sistema "funciona bien" porque el catálogo de prueba es chico, no porque esté resuelto.

### 5. Filtros facetados por categoría/subcategoría en listados
**Esfuerzo:** medio (se apoya en `ProductToolbar` ya existente) · **Beneficio técnico:** extiende un componente que ya sabe filtrar/ordenar client-side, no arranca de cero. **Beneficio comercial:** en catálogos con muchas categorías, dejar que el usuario filtre sin salir de la página de resultados reduce fricción y abandono.

### 6. Captura de leads / intención de compra (el gap más importante del sistema)
**Esfuerzo:** medio-alto · **Beneficio técnico:** agrega un modelo `Lead` (o `OrderIntent`) mínimo — nombre, teléfono/email opcional, snapshot del carrito, timestamp — que se guarda **antes** de redirigir a WhatsApp (no reemplaza el flujo actual, lo complementa). No es una pasarela de pago ni un sistema de pedidos con estados de envío: es simplemente dejar un rastro de lo que pasó. **Beneficio comercial:** es la diferencia entre operar "a ciegas" (sin saber cuánto se vendió, qué se cotizó y no se cerró, quién mostró interés) y tener un panel de admin con estadísticas reales de conversión — vistas → agregado al carrito → clic en WhatsApp. Para el dueño del negocio, esto vale más que casi cualquier otra feature de esta lista, porque es la única forma de medir si el sitio realmente está vendiendo.

### 7. Dashboard de analítica de negocio sobre esos leads
**Esfuerzo:** alto (depende del punto 6) · **Beneficio técnico:** consultas de agregación sobre el nuevo modelo `Lead` (ya tenés el patrón de `Promise.all` + `prisma.aggregate` usado en `app/admin/page.tsx`). **Beneficio comercial:** convierte el panel de admin de "gestor de catálogo" a "panel de control del negocio" — productos más cotizados, horarios de mayor intención de compra, tasa de conversión por categoría. Es el tipo de feature que justifica cobrar más por el producto si lo estás vendiendo a terceros clientes.

### 8. PWA básica (instalable + caché de catálogo)
**Esfuerzo:** alto · **Beneficio técnico:** `manifest.json` + service worker con estrategia de caché para el catálogo (sin tocar backend). **Beneficio comercial:** en mercados donde la venta por WhatsApp es común, gran parte del tráfico es móvil con conexión inestable; poder "instalar" la tienda y navegar el catálogo offline/con conexión lenta es una ventaja competitiva real frente a otras tiendas WhatsApp que son solo una web simple.

---

## Resumen ejecutivo

El proyecto está bien construido para lo que es: un MVP disciplinado, sin sobreingeniería, con convenciones documentadas y una UX que ya compite con soluciones comerciales. La deuda técnica real es acotada (tests que no testean nada, ausencia de paginación, sin cabeceras de seguridad) y ninguna de ellas es urgente hoy — son cosas a resolver *antes de escalar*, no *antes de seguir vendiendo*. La brecha más importante para convertirlo en un e-commerce "de alto valor" no es técnica sino de datos: no hay ningún registro de lo que pasa después de que el cliente hace clic en "Comprar por WhatsApp". Cerrar esa brecha (punto 6 de la hoja de ruta) es, con diferencia, la inversión con mayor retorno de las que propongo.
