// File: public/sw.js
// Service worker mínimo, sin dependencias: solo hace instalable la tienda y
// cachea catálogo/imágenes para que siga siendo navegable con conexión
// inestable. No cachea /admin, /api ni /auth (datos privados o dinámicos).
const CACHE_NAME = 'flow-ecommerce-v1';
const PRECACHE_URLS = ['/', '/products'];

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
        .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
    );
  }
});
