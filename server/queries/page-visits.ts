// File: server/queries/page-visits.ts
import prisma from '@/lib/prisma';

// Se llama desde app/(store)/layout.tsx sin esperar el resultado
// (fire-and-forget): nunca debe retrasar ni romper el render de la página.
export async function logPageVisit(path: string) {
  if (!path) return;

  await prisma.pageVisit.upsert({
    where: { path },
    update: { hits: { increment: 1 }, lastSeenAt: new Date() },
    create: { path },
  });
}

export async function getTopPageVisits(limit = 5) {
  return prisma.pageVisit.findMany({
    where: {
      // Las fichas de producto ya se rankean, con nombre e imagen, en "Top 5
      // más vistos" (Product.views) -- dejarlas también acá solo duplicaba esa
      // info como un ID de path ilegible y le quitaba lugar a rutas que sí
      // aportan algo nuevo (home, categorías, cart, contacto).
      path: { not: { startsWith: '/products/' } },
      // Con tráfico bajo, una sola visita aislada no es "tendencia" -- sin
      // este piso, terminaba ocupando un lugar del top 5 igual.
      hits: { gte: 2 },
    },
    // Por hits primero (la sección se llama "más visitadas" ordenadas por
    // volumen, no "últimas visitadas"): lastSeenAt solo como desempate.
    orderBy: [{ hits: 'desc' }, { lastSeenAt: 'desc' }],
    take: limit,
  });
}
