// File: app/(store)/category/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProductToolbar } from '@/components/product-toolbar';
import { ProductGridSkeleton } from '@/components/product-grid-skeleton';
import {
  getCategoryBySlug,
  getProductsByCategorySlug,
} from '@/server/queries/products';

interface CategoryPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  return { title: category ? category.name : 'Categoría no encontrada' };
}

async function CategoryProducts({ slug }: { slug: string }) {
  const products = await getProductsByCategorySlug(slug);
  return <ProductToolbar products={products} />;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{category.name}</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <CategoryProducts slug={params.slug} />
      </Suspense>
    </div>
  );
}
