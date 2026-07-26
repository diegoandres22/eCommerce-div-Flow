// File: app/(store)/category/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';
import { ProductGridSkeleton } from '@/components/product-grid-skeleton';
import { ProductFilters } from '@/components/product-filters';
import { Pagination } from '@/components/pagination';
import {
  getCategoryBySlug,
  getProductsByCategorySlug,
  type ProductSort,
} from '@/server/queries/products';
import { getStockConfig } from '@/server/queries/settings';
import { withEffectiveStock } from '@/lib/stock';

// Next.js 15: params/searchParams son Promises, hay que resolverlas antes de
// leer sus propiedades (ver nextjs.org/docs/messages/sync-dynamic-apis).
interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category ? category.name : 'Categoría no encontrada' };
}

async function CategoryProducts({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: CategoryPageProps['searchParams'];
}) {
  const params = await searchParams;
  const [{ products, totalCount, totalPages, page }, { controlStockActivo }] =
    await Promise.all([
      getProductsByCategorySlug(slug, {
        sort: params.sort as ProductSort | undefined,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        page: params.page ? Number(params.page) : 1,
      }),
      getStockConfig(),
    ]);
  const effectiveProducts = withEffectiveStock(products, controlStockActivo);

  return (
    <>
      <Suspense fallback={<div className="h-16 animate-pulse rounded-md bg-muted" />}>
        <ProductFilters totalCount={totalCount} />
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

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{category.name}</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <CategoryProducts slug={slug} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
