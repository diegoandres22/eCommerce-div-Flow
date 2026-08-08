// File: server/queries/broken-links.ts
import prisma from '@/lib/prisma';

// Se llama desde app/not-found.tsx sin esperar el resultado (fire-and-forget):
// nunca debe retrasar ni romper el render de la página de error. Cualquier
// falla (path vacío, error transitorio de DB) se ignora en el caller.
export async function logBrokenLink(path: string) {
  if (!path) return;

  await prisma.brokenLink.upsert({
    where: { path },
    update: { hits: { increment: 1 }, lastSeenAt: new Date() },
    create: { path },
  });
}

export async function getTopBrokenLinks(limit = 5) {
  // Por hits primero (la sección se llama "enlaces rotos" ordenados por
  // frecuencia, no "últimos 404"): un enlace pisado 50 veces importa más
  // que uno pisado una sola vez hace un minuto. lastSeenAt como desempate.
  return prisma.brokenLink.findMany({
    orderBy: [{ hits: 'desc' }, { lastSeenAt: 'desc' }],
    take: limit,
  });
}
