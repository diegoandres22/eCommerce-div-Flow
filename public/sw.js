// File: public/sw.js
// Service worker mínimo, sin dependencias: solo hace instalable la tienda y
// cachea catálogo/imágenes para que siga siendo navegable con conexión
// inestable. No cachea /admin, /api ni /auth (datos privados o dinámicos).
const CACHE_NAME = 'flow-ecommerce-v2';
const PRECACHE_URLS = ['/', '/products'];

// HTML mínimo, sin dependencias del build de Next.js (este archivo no pasa
// por webpack, así que no puede importar STORE_CONFIG ni nada de lib/).
// Se usa SOLO cuando falla la red Y no hay una copia cacheada de la ruta
// exacta pedida -- antes de este fix, ese mismo caso servía a ciegas el
// Home cacheado (`caches.match('/')`) para CUALQUIER ruta, mostrando
// contenido real pero equivocado (la URL decía /cart y se veía el Home).
// Mentir sobre qué página es es peor que avisar honestamente que no hay
// conexión.
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sin conexión</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0a0a0a;
      color: #fafafa;
      text-align: center;
      padding: 24px;
    }
    p { margin: 0; color: #a1a1aa; max-width: 360px; }
    button, a {
      margin-top: 12px;
      padding: 10px 20px;
      border-radius: 8px;
      background: #fafafa;
      color: #0a0a0a;
      border: none;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Sin conexión</h1>
  <p>No pudimos cargar esta página. Revisá tu conexión e intentá de nuevo.</p>
  <button onclick="location.reload()">Reintentar</button>
  <a href="/">Ir al inicio</a>
</body>
</html>`;

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth')
  ) {
    return; // siempre red, nunca caché: paneles privados y endpoints dinámicos
  }

  const isImage = request.destination === 'image';
  const isNavigation = request.mode === 'navigate';

  if (isImage) {
    // Cache-first: las imágenes de producto (Supabase Storage) casi no cambian.
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  if (isNavigation) {
    // Network-first con fallback a caché: prioriza contenido fresco del
    // catálogo, pero sigue funcionando si la red falla.
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          // Solo se sirve caché si es un match EXACTO de la ruta pedida
          // (`ignoreSearch` no se usa a propósito: /products?page=2 y
          // /products son navegaciones distintas). Si no hay copia exacta,
          // se muestra la página de "sin conexión" en vez de adivinar con
          // el Home -- eso era lo que generaba el bug de "veo el Home pero
          // la URL dice otra cosa".
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
  }
});
