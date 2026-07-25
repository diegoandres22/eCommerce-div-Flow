# Auditoría Técnica — Últimas 15 Iteraciones de Desarrollo

**Rol:** Senior QA Engineer / Technical Lead
**Alcance:** Todo el trabajo entregado desde la restructuración del login hasta el componente `SmartImage` (sesión actual).
**Fecha:** 2026-07-24

---

## 1. Línea de tiempo cronológica

| # | Petición | Entregable(s) principal(es) | Archivos clave | Tipo |
|---|----------|------------------------------|-----------------|------|
| 1 | Diagnóstico SMTP (`535-5.7.8`) | Verificación de `.env` byte a byte, causa aislada al lado de Google (App Password) | `.env` | Diagnóstico (sin código) |
| 2 | Rediseño panel de login | Logo + nombre fuera de la card, como título; corrección de 2 copys | `app/auth/signin/page.tsx` | Fix UI/Copy |
| 3 | Wishlist ($0, localStorage) | Contexto + persistencia, botón corazón, drawer en navbar | `wishlist-provider.tsx`, `wishlist-button.tsx`, `wishlist-drawer.tsx` | Feature |
| 4 | Compartir producto | WhatsApp / Facebook / copiar enlace | `share-buttons.tsx` | Feature |
| 5 | Buscador predictivo | Fetch único + filtro `.filter()` en memoria, dropdown de resultados | `predictive-search.tsx`, revive `app/api/products/route.ts` | Feature |
| 6 | Carrusel "También te puede interesar" | Match por categoría/subcategoría, excluye producto actual | `getRelatedProducts` en `server/queries/products.ts`, `product-carousel.tsx` | Feature |
| 7 | Banner de anuncio dinámico | Campos `bannerText`/`showBanner` en `ConfiguracionTienda`, barra condicional | Migración Prisma, `announcement-bar.tsx`, `settings-form.tsx` | Feature + Schema |
| 8 | Fix de navbar (una sola línea) + branding admin | `flex-row` sin wrap para el nav, logo+nombre dinámico en sidebar admin | `header.tsx`, `app/admin/layout.tsx`, `lib/store-config.ts` | Fix UI |
| 9 | Migración completa a Supabase Storage | Cliente admin, endpoint de subida, botón de subida, `next.config.mjs` | `lib/supabase-admin.ts`, `app/api/admin/upload/route.ts`, `image-upload-button.tsx` | Feature/Infra |
| 10 | Ficha de producto enriquecida + precios masivos | Todos los campos de Prisma renderizados, swatches simulados, trust badges, accordion; herramienta `/admin/bulk-pricing` | `products/[id]/page.tsx`, `bulk-pricing-form.tsx`, `app/api/admin/bulk-pricing/route.ts` | Feature |
| 11 | `CLAUDE.md` + soporte (service role key, checklist de verificación) | Documentación actualizada a Supabase Storage | `CLAUDE.md` | Docs |
| 12 | Fixes críticos de admin | Guía de reinicio por caché de `next.config`, alineación botón+buscador, tablas ocultas en edición, estilo premium de tablas | `product-manager.tsx`, `category-manager.tsx` | Fix + UI |
| 13 | Filtro de precio + orden, contador de carrito animado | `ProductToolbar` (client-side sort/filter), badge con `animate-bounce`/`animate-ping` | `product-toolbar.tsx` (nuevo), `cart-drawer.tsx` | Feature |
| 14 | Fix z-index + rediseño toolbar + diagnóstico de imágenes | Quitar `overflow-x-auto` del nav, `z-10`/`z-20`, toolbar minimalista, auditoría de código (sin bug hallado en el código) | `header.tsx`, `cart-drawer.tsx`, `wishlist-drawer.tsx`, `product-toolbar.tsx` | Fix + Refactor |
| 15 | Bucket mal nombrado, policy, límites de subida, `SmartImage` | Corrección de nombre de bucket, policy SELECT, validación de tamaño cliente, componente con estados loading/loaded/error + shimmer | `image-upload-button.tsx`, `components/ui/smart-image.tsx` (nuevo), 9 puntos de renderizado | Fix + Feature |

---

## 2. Evaluación de comportamiento e impacto en el ecosistema

Leyenda de severidad: 🔴 Alto (bug funcional real) · 🟡 Medio (deuda técnica / edge case no cubierto) · 🟢 Bajo (cosmético o mejora opcional).

### 🔴 Bug confirmado: falso positivo en la animación del carrito (punto #13)

`CartDrawer` (`components/cart-drawer.tsx`) inicializa así:

```tsx
const prevTotalItems = useRef(totalItems);
useEffect(() => {
  if (totalItems > prevTotalItems.current) {
    setBump(true); /* ...animate-bounce + animate-ping... */
  }
  prevTotalItems.current = totalItems;
}, [totalItems]);
```

`CartProvider` carga el carrito desde `localStorage` **de forma asíncrona** (dentro de un `useEffect`, no en el primer render). Esto significa que en el primer render `totalItems` siempre es `0`, y el `useRef` captura ese `0` como valor inicial. Cuando el `useEffect` de `CartProvider` termina de leer `localStorage` y `totalItems` salta de `0` a, por ejemplo, `3` (carrito con productos de una visita anterior), `CartDrawer` interpreta ese salto como "se acaba de agregar un producto" y dispara `animate-bounce` + `animate-ping` **en cada carga de página**, aunque el usuario no haya tocado nada.

**Impacto:** cualquier usuario recurrente con productos ya en el carrito verá el ícono "saltar" solo al entrar al sitio — comportamiento confuso, no lo que se pidió.

**Fix propuesto** (no aplicado todavía, pendiente de tu confirmación):
1. Exponer `isLoaded` desde `CartProvider` (ya existe como estado interno, solo falta agregarlo al `value` del contexto).
2. En `CartDrawer`, no evaluar el `useEffect` de `bump` mientras `!isLoaded`, y sincronizar `prevTotalItems.current` recién cuando `isLoaded` pasa a `true` por primera vez.

### 🟡 Edge case a verificar: `SmartImage` y caché del navegador (punto #15)

`onLoad`/`onError` se atan al `<img>` interno de `next/image`. Si el navegador ya tiene la imagen en caché, existe un caso límite conocido en React/Next donde el evento `load` nativo puede dispararse antes de que el listener quede conectado, dejando el shimmer visible indefinidamente. Next 15 mitiga la mayoría de estos casos internamente, pero **no está verificado en este proyecto**. Prueba manual recomendada: recargar (F5, no hard-refresh) una página con imágenes ya cacheadas y confirmar que no queden shimmers "pegados".

### 🟡 Deuda técnica: límite de tamaño de archivo duplicado (punto #15)

`MAX_FILE_SIZE_MB = 5` está hardcodeado en `image-upload-button.tsx`, pero el límite real vive en la configuración del bucket de Supabase (ajustada manualmente en el Dashboard). Si en el futuro cambias el límite en Supabase y olvidas actualizar esta constante, el admin verá mensajes de error inconsistentes (el cliente permite subir un archivo que el bucket rechaza, o viceversa). **Mejora:** mover el valor a una variable de entorno pública (`NEXT_PUBLIC_MAX_UPLOAD_MB`) que se documente junto al valor configurado en Supabase, o aceptar el trade-off y dejarlo anotado en `CLAUDE.md` como "debe coincidir manualmente".

### 🟡 Precisión decimal en precios masivos (punto #10)

`app/api/admin/bulk-pricing/route.ts` hace `Number(product.price)` (Prisma `Decimal` → `number` de JS) y luego `Number(newPrice.toFixed(2))`. Para ajustes simples (una sola pasada) es seguro, pero convertir `Decimal` a `number` de punto flotante es una práctica arriesgada si en el futuro se encadenan más operaciones aritméticas sobre precios (riesgo clásico de `0.1 + 0.2 !== 0.3`). Hoy no causa bug visible porque cada producto solo recibe un ajuste por ejecución, pero queda como deuda técnica a vigilar.

### 🟡 Layout del nav en viewports muy angostos (punto #14)

Se quitó `overflow-x-auto` del `<nav>` del header para resolver el clipping de los badges. Los botones "Panel admin" y "Cerrar sesión" ya estaban ocultos en móvil (`hidden sm:inline-flex`), así que en pantallas pequeñas solo quedan 4 elementos (Categorías, Wishlist, Carrito, Tema) — deberían caber sin problema incluso en 320px. **No verificado visualmente**; es el caso de prueba obligatorio antes de dar esto por cerrado.

### 🟢 Duplicación de markup entre `CartDrawer` y `WishlistDrawer`

Ambos triggers repiten casi el mismo bloque de "ícono + badge absoluto". Es candidato natural para extraer un `<DrawerTriggerBadge count={n} icon={...} />` compartido — mejora de mantenibilidad, no de comportamiento.

### 🟢 Sin regresiones detectadas en:
- Tema claro/oscuro (todas las clases nuevas usan tokens `bg-muted`, `text-foreground`, `dark:` cuando aplica).
- Tipado estricto (`SmartImage` usa `ImageProps` de `next/image` sin ningún `any`, cumpliendo la regla de `CLAUDE.md`).
- El `AnnouncementBar` no comparte stacking context con el nav (no es `fixed`/`absolute`), por lo que el nuevo `z-10` del nav no genera conflicto ahí.

---

## 3. Casos de mejora, refactorización y edge cases por componente

| Componente | Estado actual | Riesgo / deuda | Mejora propuesta | Edge cases a probar |
|---|---|---|---|---|
| `cart-drawer.tsx` | Animación de bump basada en `useRef` sin distinguir hidratación | 🔴 Bug real (ver arriba) | Exponer `isLoaded` en `CartProvider`; ignorar el primer cambio real de `totalItems` | Recargar con carrito no vacío desde antes; agregar 2 productos seguidos rápido (debounce visual) |
| `product-toolbar.tsx` | Filtro/orden 100% client-side sobre el array completo | 🟡 No escala más allá de unos cientos de productos | Aceptable para MVP (según `CLAUDE.md`, "sin control complejo de inventario"); si el catálogo crece, mover a `searchParams` + query de Prisma con `orderBy`/`where` | Rango de precio con `min > max`; catálogo vacío; valores no numéricos pegados en los inputs |
| `smart-image.tsx` | Maneja `loading/loaded/error` con `useState` local, shimmer vía Tailwind | 🟡 Posible edge case de caché (ver arriba) | Agregar `useEffect` que resetee `status` a `loading` si `src` cambia sin remount (hoy funciona porque los `key` cambian, pero es frágil si algún caller no pasa `key`) | Producto con `images: []` (ya cae al placeholder, confirmar que el placeholder también dispara `loaded` y no queda en shimmer) |
| `image-upload-button.tsx` | Valida tamaño en cliente con constante hardcodeada | 🟡 Puede desincronizarse del límite real del bucket | Documentar el valor en `.env`/`CLAUDE.md` junto al límite de Supabase | Subir un archivo de exactamente 5MB (límite exacto); subir un archivo con extensión falsa (`.jpg` que en realidad es un `.exe` renombrado — el `accept` del input no lo bloquea) |
| `app/api/admin/bulk-pricing/route.ts` | Aritmética de precios con `Number()`/`toFixed()` | 🟡 Riesgo de precisión decimal a futuro | Si se agregan ajustes encadenados o reportes financieros, migrar a una librería decimal-safe (`decimal.js`) o mantener la operación dentro de Prisma con `Prisma.Decimal` | Ajuste de `-100%` (ya clamped a `0.01`, confirmar que no rompe el checkout de WhatsApp con precio casi cero); catálogo con 0 productos que matcheen el scope |
| `header.tsx` | Nav sin `overflow-x-auto`, con `z-10` | 🟡 No probado en viewports < 375px | Prueba manual en DevTools con Responsive Mode a 320px | Sesión admin activa en móvil (más botones, aunque estén `hidden sm:`) |
| `product-manager.tsx` / `category-manager.tsx` | Tabla oculta con `{!showForm && (...)}`, estilo premium con `[&_th]:` | 🟢 Correcto, sin deuda relevante | Extraer el wrapper `border rounded-lg overflow-hidden` + header estilizado a un componente `PremiumTable` reutilizable si aparece una tercera tabla admin (banners, por ejemplo) | Buscar mientras el formulario está abierto (el input de búsqueda queda oculto junto con la tabla — confirmar que es el comportamiento deseado, no un descuido) |
| `wishlist-drawer.tsx` / `cart-drawer.tsx` | Badges casi idénticos duplicados | 🟢 Duplicación de código | Extraer `components/ui/count-badge.tsx` compartido | — |
| `bulk-pricing-form.tsx` | Selección manual con checkboxes + buscador | 🟢 Sin bugs detectados | Si el catálogo crece, paginar la tabla de selección manual (hoy renderiza todos los productos filtrados de una vez) | Buscar y seleccionar, luego borrar el texto de búsqueda — confirmar que la selección previa persiste (sí, usa `Set` independiente del filtro) |

---

## 4. Prioridad de acción recomendada

1. **🔴 Alto:** corregir el falso positivo de animación del carrito (`cart-drawer.tsx` + `cart-provider.tsx`).
2. **🟡 Medio:** verificar manualmente el edge case de imágenes cacheadas en `SmartImage` y el nav en 320px.
3. **🟡 Medio:** documentar en `CLAUDE.md` la relación entre `MAX_FILE_SIZE_MB` (cliente) y el límite real del bucket de Supabase.
4. **🟢 Bajo:** refactors de deduplicación (`CountBadge`, `PremiumTable`) — no urgentes, mejoran mantenibilidad a futuro.

No se detectaron regresiones de renderizado, conflictos de tema claro/oscuro, ni usos de `any` en el código auditado. El único bug funcional confirmado es el de la animación del carrito; el resto son casos límite no verificados o deuda técnica de bajo impacto inmediato.
