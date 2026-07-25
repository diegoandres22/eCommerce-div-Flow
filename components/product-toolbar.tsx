// File: components/product-toolbar.tsx
'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { ProductGrid } from './product-grid';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'recent' | 'price-asc' | 'price-desc';

interface ToolbarProduct {
  id: string;
  name: string;
  price: number | string;
  images: string[];
  createdAt: string | Date;
  category?: { name: string; slug: string } | null;
}

// Ordenamiento y filtro por rango de precio 100% client-side: el catálogo del
// MVP es pequeño, así que no justifica mover esto a la query de Prisma
// (evita reescribir 3 páginas con lógica de searchParams por poco beneficio).
export function ProductToolbar({ products }: { products: ToolbarProduct[] }) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const visibleProducts = useMemo(() => {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;

    return products
      .filter(p => {
        const price = Number(p.price);
        return price >= min && price <= max;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [products, sortBy, minPrice, maxPrice]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {visibleProducts.length}{' '}
          {visibleProducts.length === 1 ? 'producto' : 'productos'}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 items-center gap-1 rounded-md border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <Input
              type="number"
              min="0"
              inputMode="decimal"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="Mín"
              aria-label="Precio mínimo"
              className="h-7 w-14 border-0 p-0 text-center shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min="0"
              inputMode="decimal"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="Máx"
              aria-label="Precio máximo"
              className="h-7 w-14 border-0 p-0 text-center shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <Select
            value={sortBy}
            onValueChange={value => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="h-9 w-auto gap-2 border-input text-sm">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="price-asc">Menor precio</SelectItem>
              <SelectItem value="price-desc">Mayor precio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProductGrid products={visibleProducts} />
    </div>
  );
}
