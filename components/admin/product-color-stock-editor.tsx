// Location: components/admin/product-color-stock-editor.tsx
'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ProductColor } from '@/lib/product-colors';
import { variantStockKey } from '@/lib/stock';

// Stock por variante -- color, talla, o la combinación de ambos, según qué
// tenga definido el producto. El total del producto se recalcula
// server-side como la suma de estos valores (lib/stock.ts) -- por eso acá no
// hay un input de "stock total" separado, evita que las dos fuentes de
// verdad se desincronicen. `stocks` viene indexado por variantStockKey
// (colorName|talla) para no colisionar entre ejes.
export function ProductColorStockEditor({
  colors,
  sizes,
  stocks,
  onChange,
}: {
  colors: ProductColor[];
  sizes: string[];
  stocks: Record<string, number>;
  onChange: (colorName: string, talla: string, stock: number) => void;
}) {
  if (colors.length === 0 && sizes.length === 0) return null;

  const getStock = (colorName: string, talla: string) =>
    stocks[variantStockKey(colorName, talla)] ?? 0;

  const total = Object.values(stocks).reduce((sum, s) => sum + s, 0);

  // Ambos ejes: una matriz color x talla.
  if (colors.length > 0 && sizes.length > 0) {
    return (
      <div className="space-y-2">
        <Label>Stock por color y talla</Label>
        <div className="overflow-x-auto rounded-md border p-3">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-1 text-left font-medium">Color</th>
                {sizes.map(size => (
                  <th key={size} className="p-1 text-center font-medium">
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colors.map(color => (
                <tr key={color.name}>
                  <td className="p-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="max-w-[8rem] truncate">{color.name}</span>
                    </div>
                  </td>
                  {sizes.map(size => (
                    <td key={size} className="p-1">
                      <Input
                        type="number"
                        min="0"
                        className="h-8 w-16"
                        value={getStock(color.name, size)}
                        onChange={e =>
                          onChange(
                            color.name,
                            size,
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Stock total del producto: <strong>{total}</strong> (suma de todas
          las combinaciones de arriba)
        </p>
      </div>
    );
  }

  // Un solo eje definido: solo color, o solo talla.
  const rows =
    colors.length > 0
      ? colors.map(c => ({
          key: c.name,
          label: c.name,
          colorName: c.name,
          talla: '',
          swatch: c.hex as string | null,
        }))
      : sizes.map(s => ({
          key: s,
          label: s,
          colorName: '',
          talla: s,
          swatch: null as string | null,
        }));

  return (
    <div className="space-y-2">
      <Label>Stock por {colors.length > 0 ? 'color' : 'talla'}</Label>
      <div className="space-y-2 rounded-md border p-3">
        {rows.map(row => (
          <div key={row.key} className="flex items-center gap-2">
            {row.swatch && (
              <span
                className="h-5 w-5 shrink-0 rounded-full border"
                style={{ backgroundColor: row.swatch }}
              />
            )}
            <span className="w-28 truncate text-sm">{row.label}</span>
            <Input
              type="number"
              min="0"
              className="h-8 w-24"
              value={getStock(row.colorName, row.talla)}
              onChange={e =>
                onChange(
                  row.colorName,
                  row.talla,
                  Math.max(0, parseInt(e.target.value) || 0)
                )
              }
            />
          </div>
        ))}
        <p className="pt-1 text-xs text-muted-foreground">
          Stock total del producto: <strong>{total}</strong> (suma de{' '}
          {colors.length > 0 ? 'los colores' : 'las tallas'} de arriba)
        </p>
      </div>
    </div>
  );
}
