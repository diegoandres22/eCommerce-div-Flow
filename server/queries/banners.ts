// File: server/queries/banners.ts
import prisma from '@/lib/prisma';

export async function getActiveBanners() {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
}
