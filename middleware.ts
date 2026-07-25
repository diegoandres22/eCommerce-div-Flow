// middleware.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Guardián de admin: si no hay sesión, no entra a /admin ni a /api/admin.
// El callback signIn en lib/auth.ts ya garantiza que la única sesión
// posible es la del email en ALLOWED_ADMIN_EMAIL.
//
// Además, en TODA ruta (no solo /admin) reenvía la ruta pedida como header
// `x-pathname`: es la forma estándar de que un Server Component como
// app/not-found.tsx -- que no recibe la URL como prop -- pueda saber qué
// enlace roto se visitó (ver server/queries/broken-links.ts).
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!req.auth && pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!req.auth && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  // Corre en todas las rutas de página/API, salvo assets estáticos (todo lo
  // que tiene extensión de archivo: imágenes, sw.js, manifest.webmanifest,
  // etc.) e internos de Next.js.
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
