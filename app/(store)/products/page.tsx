// File: app/(store)/products/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';
import { ProductGridSkeleton } from '@/components/product-grid-skeleton';
import { getActiveProducts } from '@/server/queries/products';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Productos',
};

async function AllProducts() {
  const products = await getActiveProducts();
  return <ProductGrid products={products} />;
}

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Productos</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <AllProducts />
      </Suspense>
    </div>
  );
}
