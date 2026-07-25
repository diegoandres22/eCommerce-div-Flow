// File: components/product-filters.tsx
'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';
import type { Category } from '@prisma/client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Controla filtros/orden vía la URL (searchParams) en vez de filtrar un
// array en memoria: el Server Component de cada página lee estos mismos
// parámetros y arma la query de Prisma (ver server/queries/products.ts).
// Esto es lo que permite paginar sin romper el filtro/orden.
export function ProductFilters({
  totalCount,
  categories,
}: {
  totalCount: number;
  // Si se pasa, habilita los selects de categoría/subcategoría. Se omite
  // en /category/[slug], donde la categoría ya viene fija por la ruta.
  categories?: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get('sort') ?? 'recent';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const subCategoryId = searchParams.get('subCategoryId') ?? '';

  const topLevelCategories = categories?.filter(c => !c.parentId) ?? [];
  const subCategoryOptions =
    categories?.filter(c => c.parentId === categoryId) ?? [];

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      params.delete('page'); // cualquier cambio de filtro vuelve a la página 1
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="space-y-3 border-b pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 items-center gap-1 rounded-md border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <Input
              type="number"
              min="0"
              inputMode="decimal"
              defaultValue={minPrice}
              onBlur={e => updateParams({ minPrice: e.target.value || null })}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
              placeholder="Mín"
              aria-label="Precio mínimo"
              className="h-7 w-14 border-0 p-0 text-center shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min="0"
              inputMode="decimal"
              defaultValue={maxPrice}
              onBlur={e => updateParams({ maxPrice: e.target.value || null })}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
              placeholder="Máx"
              aria-label="Precio máximo"
              className="h-7 w-14 border-0 p-0 text-center shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <Select
            value={sort}
            onValueChange={value =>
              updateParams({ sort: value === 'recent' ? null : value })
            }
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

      {categories && topLevelCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Select
            value={categoryId || 'all'}
            onValueChange={value =>
              updateParams({
                categoryId: value === 'all' ? null : value,
                subCategoryId: null,
              })
            }
          >
            <SelectTrigger className="h-9 w-[180px] text-sm">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {topLevelCategories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {categoryId && subCategoryOptions.length > 0 && (
            <Select
              value={subCategoryId || 'all'}
              onValueChange={value =>
                updateParams({ subCategoryId: value === 'all' ? null : value })
              }
            >
              <SelectTrigger className="h-9 w-[180px] text-sm">
                <SelectValue placeholder="Subcategoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {subCategoryOptions.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
