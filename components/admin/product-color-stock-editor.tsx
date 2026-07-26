// Location: components/admin/product-color-stock-editor.tsx
'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ProductColor } from '@/lib/product-colors';

// Stock por color, solo cuando el producto tiene colores definidos (ver
// ProductColorEditor). El total del producto se recalcula server-side como
// la suma de estos valores (lib/stock.ts) -- por eso acá no hay un input de
// "stock total" separado cuando hay colores, evita que las dos fuentes de
// verdad se desincronicen.
export function ProductColorStockEditor({
  colors,
  stocks,
  onChange,
}: {
  colors: ProductColor[];
  stocks: Record<string, number>;
  onChange: (colorName: string, stock: number) => void;
}) {
  if (colors.length === 0) return null;

  const total = colors.reduce((sum, c) => sum + (stocks[c.name] ?? 0), 0);

  return (
    <div className="space-y-2">
      <Label>Stock por color</Label>
      <div className="space-y-2 rounded-md border p-3">
        {colors.map(color => (
          <div key={color.name} className="flex items-center gap-2">
            <span
              className="h-5 w-5 shrink-0 rounded-full border"
              style={{ backgroundColor: color.hex }}
            />
            <span className="w-28 truncate text-sm">{color.name}</span>
            <Input
              type="number"
              min="0"
              className="h-8 w-24"
              value={stocks[color.name] ?? 0}
              onChange={e =>
                onChange(color.name, Math.max(0, parseInt(e.target.value) || 0))
              }
            />
          </div>
        ))}
        <p className="pt-1 text-xs text-muted-foreground">
          Stock total del producto: <strong>{total}</strong> (suma de los
          colores de arriba)
        </p>
      </div>
    </div>
  );
}
