// middleware.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Solo hay un guardián: si no hay sesión, no entra a /admin ni a /api/admin.
// El callback signIn en lib/auth.ts ya garantiza que la única sesión
// posible es la del email en ALLOWED_ADMIN_EMAIL.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!req.auth && pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!req.auth && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
