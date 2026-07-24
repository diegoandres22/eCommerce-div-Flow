// File: server/queries/categories.ts
import prisma from '@/lib/prisma';

// Categorías principales (sin parentId) para el dropdown del navbar.
// El límite real de "10 + Ver más" se aplica en el componente que las usa.
export async function getTopLevelCategories(limit?: number) {
  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
    take: limit,
  });
}

export async function getAllCategoriesWithChildren() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
}
