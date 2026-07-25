// File: components/product-color-swatches.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ProductColor } from '@/lib/product-colors';

// Selector de color real, basado en los colores cargados para este producto
// (ver lib/product-colors.ts). Si el producto no tiene colores definidos
// ("cuando aplique"), el componente no renderiza nada.
export function ProductColorSwatches({ colors }: { colors: ProductColor[] }) {
  const [selected, setSelected] = useState(0);

  if (colors.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        Color:{' '}
        <span className="font-normal text-muted-foreground">
          {colors[selected].name}
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
