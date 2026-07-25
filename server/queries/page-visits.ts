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
    orderBy: { lastSeenAt: 'desc' },
    take: limit,
  });
}
