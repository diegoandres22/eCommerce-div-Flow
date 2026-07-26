// File: components/product-color-swatches.tsx
'use client';

import { cn } from '@/lib/utils';
import type { ProductColor } from '@/lib/product-colors';
import { STORE_CONFIG } from '@/lib/store-config';

// Selector de color real, basado en los colores cargados para este producto
// (ver lib/product-colors.ts). Si el producto no tiene colores definidos
// ("cuando aplique") o el feature flag está apagado, el componente no
// renderiza nada.
//
// Controlado (ya no lleva su propio useState): quien lo use decide qué color
// está seleccionado y qué pasa al elegir uno. Esto lo hace
// `ProductPurchasePanel`, que necesita saber cuál está activo para calcular
// el stock disponible y el tope de cantidad del selector de `AddToCart`.
//
// `stockByColor` (opcional): con el módulo de stock activo, un color con
// stock 0 se muestra tachado y no se puede seleccionar.
export function ProductColorSwatches({
  colors,
  selectedIndex,
  onSelect,
  stockByColor,
}: {
  colors: ProductColor[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  stockByColor?: Map<string, number>;
}) {
  if (!STORE_CONFIG.mostrarColoresDeProducto || colors.length === 0) return null;

  // colors[selectedIndex] siempre existe en tiempo de ejecución (el índice
  // solo se fija a valores válidos y ya se validó colors.length > 0), pero
  // noUncheckedIndexedAccess de TS no puede inferir eso de un acceso por
  // índice, así que se usa un fallback explícito para tipar correctamente.
  const selectedColor = colors[selectedIndex] ?? colors[0];

  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        Color:{' '}
        <span className="font-normal text-muted-foreground">
          {selectedColor?.name}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => {
          const outOfStock =
            stockByColor != null && (stockByColor.get(color.name) ?? 0) <= 0;
          return (
            <button
              key={`${color.name}-${index}`}
              type="button"
              onClick={() => !outOfStock && onSelect(index)}
              disabled={outOfStock}
              aria-label={outOfStock ? `${color.name} (sin stock)` : color.name}
              aria-pressed={selectedIndex === index}
              className={cn(
                'relative h-8 w-8 rounded-full border-2 transition-transform',
                selectedIndex === index
                  ? 'scale-110 border-primary'
                  : 'border-transparent hover:scale-105',
                outOfStock && 'cursor-not-allowed opacity-40 hover:scale-100'
              )}
              style={{ backgroundColor: color.hex }}
            >
              {outOfStock && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-[1.5px] w-9 rotate-45 bg-foreground/70" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
