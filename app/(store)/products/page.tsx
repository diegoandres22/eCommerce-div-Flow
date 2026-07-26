// File: app/(store)/products/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';
import { ProductGridSkeleton } from '@/components/product-grid-skeleton';
import { ProductFilters } from '@/components/product-filters';
import { Pagination } from '@/components/pagination';
import { getActiveProducts, type ProductSort } from '@/server/queries/products';
import { getStockConfig } from '@/server/queries/settings';
import { withEffectiveStock } from '@/lib/stock';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Productos',
};

// Next.js 15: searchParams es una Promise, hay que resolverla antes de leer
// sus propiedades (ver nextjs.org/docs/messages/sync-dynamic-apis).
interface ProductsPageProps {
  searchParams: Promise<{
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    subCategoryId?: string;
    page?: string;
  }>;
}

async function AllProducts({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const [{ products, totalCount, totalPages, page }, categories, { controlStockActivo }] =
    await Promise.all([
      getActiveProducts({
        sort: params.sort as ProductSort | undefined,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        categoryId: params.categoryId,
        subCategoryId: params.subCategoryId,
        page: params.page ? Number(params.page) : 1,
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      getStockConfig(),
    ]);
  const effectiveProducts = withEffectiveStock(products, controlStockActivo);

  return (
    <>
      <Suspense fallback={<div className="h-16 animate-pulse rounded-md bg-muted" />}>
        <ProductFilters totalCount={totalCount} categories={categories} />
      </Suspense>
      <div className="mt-6">
        <ProductGrid products={effectiveProducts} />
      </div>
      <Suspense fallback={null}>
        <Pagination page={page} totalPages={totalPages} />
      </Suspense>
    </>
  );
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Productos</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <AllProducts searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
