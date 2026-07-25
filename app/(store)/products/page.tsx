// File: app/(store)/products/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';
import { ProductGridSkeleton } from '@/components/product-grid-skeleton';
import { ProductFilters } from '@/components/product-filters';
import { Pagination } from '@/components/pagination';
import { getActiveProducts, type ProductSort } from '@/server/queries/products';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Productos',
};

interface ProductsPageProps {
  searchParams: {
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    subCategoryId?: string;
    page?: string;
  };
}

async function AllProducts({ searchParams }: ProductsPageProps) {
  const [{ products, totalCount, totalPages, page }, categories] =
    await Promise.all([
      getActiveProducts({
        sort: searchParams.sort as ProductSort | undefined,
        minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
        maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
        categoryId: searchParams.categoryId,
        subCategoryId: searchParams.subCategoryId,
        page: searchParams.page ? Number(searchParams.page) : 1,
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
    ]);

  return (
    <>
      <Suspense fallback={<div className="h-16 animate-pulse rounded-md bg-muted" />}>
        <ProductFilters totalCount={totalCount} categories={categories} />
      </Suspense>
      <div className="mt-6">
        <ProductGrid products={products} />
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
