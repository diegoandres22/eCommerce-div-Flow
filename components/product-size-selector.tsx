// File: components/product-size-selector.tsx
'use client';

import { cn } from '@/lib/utils';

// Selector de talla real, basado en las tallas cargadas para este producto
// (ver lib/product-sizes.ts). Si el producto no tiene tallas definidas, no
// renderiza nada -- igual que ProductColorSwatches, independiente de él (un
// producto puede tener talla, color, ambos o ninguno).
//
// Controlado, mismo criterio que ProductColorSwatches: quien lo use decide
// qué talla está seleccionada. Lo hace ProductPurchasePanel, para que la
// talla elegida viaje junto con el color hasta el carrito y el pedido de
// WhatsApp.
//
// `stockByColor` (opcional, nombre por analogía con el prop homónimo de
// ProductColorSwatches): con el módulo de stock activo, una talla en 0 se
// muestra tachada y no se puede seleccionar -- el stock que representa
// depende de si el producto también tiene colores (ver ProductPurchasePanel,
// que decide si es agregado por talla o por la combinación con el color
// elegido).
export function ProductSizeSelector({
  sizes,
  selectedIndex,
  onSelect,
  stockBySize,
}: {
  sizes: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  stockBySize?: Map<string, number>;
}) {
  if (sizes.length === 0) return null;

  const selectedSize = sizes[selectedIndex] ?? sizes[0];

  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        Talla:{' '}
        <span className="font-normal text-muted-foreground">{selectedSize}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s, index) => {
          const outOfStock = stockBySize != null && (stockBySize.get(s) ?? 0) <= 0;
          return (
            <button
              key={`${s}-${index}`}
              type="button"
              onClick={() => !outOfStock && onSelect(index)}
              disabled={outOfStock}
              aria-label={outOfStock ? `${s} (sin stock)` : s}
              aria-pressed={selectedIndex === index}
              className={cn(
                'flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors',
                selectedIndex === index
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                outOfStock && 'cursor-not-allowed opacity-40 line-through hover:bg-background'
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
