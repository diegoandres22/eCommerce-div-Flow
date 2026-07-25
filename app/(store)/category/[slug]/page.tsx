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

interface CategoryPageProps {
  params: { slug: string };
  searchParams: {
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  return { title: category ? category.name : 'Categoría no encontrada' };
}

async function CategoryProducts({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: CategoryPageProps['searchParams'];
}) {
  const { products, totalCount, totalPages, page } =
    await getProductsByCategorySlug(slug, {
      sort: searchParams.sort as ProductSort | undefined,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      page: searchParams.page ? Number(searchParams.page) : 1,
    });

  return (
    <>
      <Suspense fallback={<div className="h-16 animate-pulse rounded-md bg-muted" />}>
        <ProductFilters totalCount={totalCount} />
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

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{category.name}</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <CategoryProducts slug={params.slug} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
