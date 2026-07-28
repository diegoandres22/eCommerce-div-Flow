// server/queries/products.ts
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

const withCategory = {
  category: { select: { id: true, name: true, slug: true } },
  // Stock por color -- solo lo usa la ficha de detalle (para deshabilitar
  // swatches sin stock), pero se incluye acá en el include compartido para
  // no duplicar la consulta; es liviano (0 filas para productos sin colores).
  colorStocks: true,
} as const;

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: typeof withCategory;
}>;

export type ProductSort = 'recent' | 'price-asc' | 'price-desc';

// Filtros/orden/paginación comunes a los 3 listados públicos (catálogo,
// categoría, búsqueda). Todo resuelto server-side vía Prisma -- reemplaza
// el filtrado en memoria que tenía ProductToolbar, que no escalaba más
// allá de catálogos chicos.
export interface ProductListFilters {
  sort?: ProductSort;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  subCategoryId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProducts {
  products: ProductWithCategory[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export const DEFAULT_PRODUCT_PAGE_SIZE = 12;

function buildOrderBy(sort?: ProductSort): Prisma.ProductOrderByWithRelationInput {
  if (sort === 'price-asc') return { price: 'asc' };
  if (sort === 'price-desc') return { price: 'desc' };
  return { createdAt: 'desc' };
}

function buildPriceWhere(
  minPrice?: number,
  maxPrice?: number
): Prisma.FloatFilter | undefined {
  if (minPrice == null && maxPrice == null) return undefined;
  return {
    ...(minPrice != null ? { gte: minPrice } : {}),
    ...(maxPrice != null ? { lte: maxPrice } : {}),
  };
}

async function paginateProducts(
  where: Prisma.ProductWhereInput,
  filters: ProductListFilters
): Promise<PaginatedProducts> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PRODUCT_PAGE_SIZE;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: withCategory,
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    page,
    pageSize,
  };
}

export async function getActiveProducts(
  filters: ProductListFilters = {}
): Promise<PaginatedProducts> {
  const priceWhere = buildPriceWhere(filters.minPrice, filters.maxPrice);
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(priceWhere ? { price: priceWhere } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.subCategoryId ? { subCategoryId: filters.subCategoryId } : {}),
  };

  return paginateProducts(where, filters);
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

// "También te puede interesar": misma categoría o misma subcategoría del
// producto actual (si tiene), excluyéndolo. Máximo 4 por defecto.
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  subCategoryId?: string | null,
  limit = 4
) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      NOT: { id: productId },
      OR: [{ categoryId }, ...(subCategoryId ? [{ subCategoryId }] : [])],
    },
    include: withCategory,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// Valor total del catálogo activo disponible para vender (precio * stock,
// sumado en JS -- Prisma no puede multiplicar dos columnas dentro de un
// aggregate). Alimenta la card "Valor total en venta" del dashboard. Solo
// tiene sentido con el módulo de stock activo; si está apagado, `stock`
// queda en 0 por defecto y el total simplemente da 0.
export async function getActiveCatalogValue() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { price: true, stock: true },
  });

  return products.reduce(
    (sum, product) => sum + Number(product.price) * product.stock,
    0
  );
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  stockMinimo: number;
  images: string[];
  colores: string;
  tallas: string;
  colorStocks: { id: string; colorName: string; talla: string; stock: number }[];
}

// Productos activos con unidades por debajo o igual al umbral de alerta
// cargado por producto (`stockMinimo`) -- INCLUYE los que ya están en 0.
// Antes excluía el 0 asumiendo que el badge "Agotado" de la tienda pública
// ya alcanzaba como aviso, pero ese badge no lo ve el admin desde acá -- un
// producto en 0 es el caso más urgente de todos, tiene que aparecer en esta
// misma alerta, no depender de que alguien lo note navegando el catálogo
// público. Prisma no puede comparar dos columnas entre sí dentro de un
// `where` (mismo motivo por el que getActiveCatalogValue no puede
// multiplicar precio * stock en un `aggregate`), así que se trae el catálogo
// activo con los campos mínimos y se filtra en JS -- razonable a la escala
// de un MVP de un solo cliente. Alimenta la card de "Estado del Catálogo" en
// el dashboard y el listado de `/admin/inventario`. Trae también
// colores/tallas/colorStocks (no solo lo mínimo para mostrar la fila) porque
// el drawer de reposición rápida de /admin/inventario necesita esos datos
// para desglosar el reabastecimiento por variante sin otra consulta aparte.
export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      stock: true,
      stockMinimo: true,
      images: true,
      colores: true,
      tallas: true,
      colorStocks: {
        select: { id: true, colorName: true, talla: true, stock: true },
      },
    },
  });

  return products
    .filter(product => product.stock <= product.stockMinimo)
    .sort((a, b) => a.stock - b.stock);
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

// El slug puede ser una categoría principal o una subcategoría: en ambos
// casos se buscan productos que la tengan como categoría o como subcategoría.
export async function getProductsByCategorySlug(
  slug: string,
  filters: ProductListFilters = {}
): Promise<PaginatedProducts> {
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { products: [], totalCount: 0, totalPages: 1, page: 1, pageSize: filters.pageSize ?? DEFAULT_PRODUCT_PAGE_SIZE };
  }

  const priceWhere = buildPriceWhere(filters.minPrice, filters.maxPrice);
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    OR: [{ categoryId: category.id }, { subCategoryId: category.id }],
    ...(priceWhere ? { price: priceWhere } : {}),
    // La subcategoría (si se elige un filtro dentro de esta misma categoría)
    // se aplica como AND explícito para no chocar con el OR de arriba.
    ...(filters.subCategoryId
      ? { AND: [{ subCategoryId: filters.subCategoryId }] }
      : {}),
  };

  return paginateProducts(where, filters);
}

export async function searchProducts(
  query: string,
  filters: ProductListFilters = {}
): Promise<PaginatedProducts> {
  if (!query.trim()) {
    return { products: [], totalCount: 0, totalPages: 1, page: 1, pageSize: filters.pageSize ?? DEFAULT_PRODUCT_PAGE_SIZE };
  }

  const priceWhere = buildPriceWhere(filters.minPrice, filters.maxPrice);
  const andConditions: Prisma.ProductWhereInput[] = [];
  if (filters.categoryId) andConditions.push({ categoryId: filters.categoryId });
  if (filters.subCategoryId) {
    andConditions.push({ subCategoryId: filters.subCategoryId });
  }

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ],
    ...(priceWhere ? { price: priceWhere } : {}),
    ...(andConditions.length > 0 ? { AND: andConditions } : {}),
  };

  return paginateProducts(where, filters);
}
