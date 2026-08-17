// File: lib/api-auth.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Segunda capa de autorización para cada API route de /api/admin/*, además
// de middleware.ts (que ya bloquea esas rutas sin sesión). No es
// redundante: hoy cada handler confía ciegamente en que el middleware corrió
// antes -- si el día de mañana el matcher de middleware.ts tiene un gap (una
// ruta nueva mal registrada, un cambio de configuración, un comportamiento
// distinto en un runtime/edge case de Next.js), estas rutas quedan
// completamente abiertas sin que el propio código lo note. Con este chequeo
// explícito al inicio de cada handler, cada endpoint se protege a sí mismo
// sin depender de una única capa externa.
export async function requireAdminSession(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}
