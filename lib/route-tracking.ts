// File: lib/route-tracking.ts
//
// Helpers compartidos por todo lo que registra tráfico en base a la ruta
// pedida (enlaces rotos, rutas más visitadas, contador de vistas de
// producto). Centralizado acá para no repetir la misma lógica de detección
// de prefetch en cada punto que la necesita.

// Next.js precarga en segundo plano CUALQUIER <Link> visible en pantalla
// (carruseles, header, footer...), sin que el usuario haga clic. Sin este
// chequeo, esos prefetches silenciosos se contaban como visitas reales --
// tanto en el contador de vistas de producto (duplicándolo: un prefetch +
// la visita real) como en el registro de enlaces rotos (registrando rutas
// que nadie pidió a propósito). Se distingue un prefetch de una navegación
// real por estos headers: `Next-Router-Prefetch` (App Router) y
// `Purpose`/`Sec-Purpose` (prefetch iniciado por el navegador).
export function isPrefetchRequest(headersList: Headers): boolean {
  return (
    headersList.get('next-router-prefetch') === '1' ||
    headersList.get('purpose') === 'prefetch' ||
    (headersList.get('sec-purpose') || '').includes('prefetch')
  );
}

// Rutas que nunca deben contarse en las analíticas de tráfico público
// (enlaces rotos ni rutas más visitadas): son áreas operativas del propio
// admin/infraestructura, no navegación real de un cliente de la tienda.
const EXCLUDED_PREFIXES = ['/admin', '/api', '/auth'];

export function isTrackablePath(path: string): boolean {
  if (!path) return false;
  return !EXCLUDED_PREFIXES.some(prefix => path.startsWith(prefix));
}
