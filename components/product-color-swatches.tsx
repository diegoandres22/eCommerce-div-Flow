// File: components/product-color-swatches.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ProductColor } from '@/lib/product-colors';
import { STORE_CONFIG } from '@/lib/store-config';

// Selector de color real, basado en los colores cargados para este producto
// (ver lib/product-colors.ts). Si el producto no tiene colores definidos
// ("cuando aplique") o el feature flag está apagado, el componente no
// renderiza nada.
export function ProductColorSwatches({ colors }: { colors: ProductColor[] }) {
  const [selected, setSelected] = useState(0);

  if (!STORE_CONFIG.mostrarColoresDeProducto || colors.length === 0) return null;

  // colors[selected] siempre existe en tiempo de ejecución (selected solo se
  // fija a índices válidos y ya se validó colors.length > 0), pero
  // noUncheckedIndexedAccess de TS no puede inferir eso de un acceso por
  // índice, así que se usa un fallback explícito para tipar correctamente.
  const selectedColor = colors[selected] ?? colors[0];

  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        Color:{' '}
        <span className="font-normal text-muted-foreground">
          {selectedColor?.name}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <button
            key={`${color.name}-${index}`}
            type="button"
            onClick={() => setSelected(index)}
            aria-label={color.name}
            aria-pressed={selected === index}
            className={cn(
              'h-8 w-8 rounded-full border-2 transition-transform',
              selected === index
                ? 'scale-110 border-primary'
                : 'border-transparent hover:scale-105'
            )}
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>
    </div>
  );
}
