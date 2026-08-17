// File: app/api/admin/broken-links/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/api-auth';

// Protegida por middleware.ts (app/api/admin/*) + requireAdminSession()
// acá abajo (segunda capa, ver lib/api-auth.ts). Vacía por completo el
// registro de enlaces rotos -- pensada para limpiar de una sola vez el
// ruido acumulado por el bug de prefetch ya corregido en app/not-found.tsx,
// o simplemente para reiniciar el conteo cuando el admin quiera.
export async function DELETE() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  await prisma.brokenLink.deleteMany({});
  return NextResponse.json({ success: true });
}
