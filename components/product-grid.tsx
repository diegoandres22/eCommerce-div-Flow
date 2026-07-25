// Location: components/product-grid.tsx

import { ProductCard } from './product-card';

interface Product {
  id: string;
  name: string;
  price: number | string;
  images: string[];
  isOutOfStock?: boolean;
  category?: {
    name: string;
    slug: string;
  } | null;
}

interface ProductGridProps {
  products: Product[];
  className?: string;
}

export function ProductGrid({ products, className }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold">No hay productos</h3>
        <p className="max-w-sm text-muted-foreground">
          Todavía no hay productos que mostrar aquí.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className || ''}`}
    >
      {products.map(product => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          price={Number(product.price)}
          image={product.images?.[0]}
          category={product.category}
          isOutOfStock={product.isOutOfStock}
        />
      ))}
    </div>
  );
}
