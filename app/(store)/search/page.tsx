// File: app/(store)/search/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/product-grid';
import { ProductGridSkeleton } from '@/components/product-grid-skeleton';
import { searchProducts } from '@/server/queries/products';

interface SearchPageProps {
  searchParams: { q?: string };
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const query = searchParams.q || '';
  return { title: query ? `Buscar: ${query}` : 'Buscar productos' };
}

async function SearchResults({ query }: { query: string }) {
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

  const products = await searchProducts(query);
  return <ProductGrid products={products} />;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';

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
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
