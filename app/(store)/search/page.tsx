// File: app/(store)/search/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/product-grid';
import { ProductGridSkeleton } from '@/components/product-grid-skeleton';
import { ProductFilters } from '@/components/product-filters';
import { Pagination } from '@/components/pagination';
import { searchProducts, type ProductSort } from '@/server/queries/products';
import { getStockConfig } from '@/server/queries/settings';
import { withEffectiveStock } from '@/lib/stock';
import prisma from '@/lib/prisma';

// Next.js 15: searchParams es una Promise, hay que resolverla antes de leer
// sus propiedades (ver nextjs.org/docs/messages/sync-dynamic-apis).
interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    subCategoryId?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q || '';
  return { title: query ? `Buscar: ${query}` : 'Buscar productos' };
}

async function SearchResults({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';

  if (!query.trim()) {
    return (
      <div className="py-16 text-center">
        <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">
          Escribe algo para buscar productos.
        </p>
      </div>
    );
  }

  const [{ products, totalCount, totalPages, page }, categories, { controlStockActivo }] =
    await Promise.all([
      searchProducts(query, {
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q || '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Buscar productos
      </h1>

      <form action="/search" method="get" className="mb-8 max-w-2xl">
        <div className="flex gap-2">
          <Input
            name="q"
            placeholder="Buscar productos..."
            defaultValue={query}
            className="flex-1"
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
        </div>
      </form>

      <Suspense fallback={<ProductGridSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
