// server/queries/products.ts
import prisma from '@/lib/prisma';

const withCategory = {
  category: { select: { id: true, name: true, slug: true } },
} as const;

export async function getActiveProducts(limit?: number) {
  return prisma.product.findMany({
    where: { isActive: true },
    include: withCategory,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: withCategory,
  });
}

// Incrementa el contador de vistas de un producto (se llama desde la ficha
// pública de producto). No bloquea el render si falla.
export async function incrementProductViews(id: string) {
  try {
    await prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  } catch {
    // Producto borrado justo en esa ventana, o error transitorio: se ignora.
  }
}

export async function getTopViewedProducts(limit = 10) {
  return prisma.product.findMany({
    where: { isActive: true, views: { gt: 0 } },
    include: withCategory,
    orderBy: { views: 'desc' },
    take: limit,
  });
}

// Categorías activas (con al menos un producto activo) junto a sus productos,
// listas para renderizar un carrusel por categoría en el home.
export async function getCategoriesWithActiveProducts(limitPerCategory = 10) {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      products: {
        where: { isActive: true },
        include: withCategory,
        orderBy: { createdAt: 'desc' },
        take: limitPerCategory,
      },
    },
    orderBy: { name: 'asc' },
  });

  return categories.filter(category => category.products.length > 0);
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4
) {
  return prisma.product.findMany({
    where: {
      categoryId,
      isActive: true,
      NOT: { id: productId },
    },
    include: withCategory,
    take: limit,
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

// El slug puede ser una categoría principal o una subcategoría: en ambos
// casos se buscan productos que la tengan como categoría o como subcategoría.
export async function getProductsByCategorySlug(slug: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) return [];

  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [{ categoryId: category.id }, { subCategoryId: category.id }],
    },
    include: withCategory,
    orderBy: { createdAt: 'desc' },
  });
}

export async function searchProducts(query: string) {
  if (!query.trim()) return [];

  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: withCategory,
    orderBy: { createdAt: 'desc' },
  });
}
