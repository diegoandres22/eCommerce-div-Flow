// Location: components/admin/quick-restock-drawer.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ProductColorStockEditor } from '@/components/admin/product-color-stock-editor';
import { useToast } from '@/components/ui/use-toast';
import { parseProductColors } from '@/lib/product-colors';
import { parseProductSizes } from '@/lib/product-sizes';
import { variantStockKey } from '@/lib/stock';
import type { LowStockProduct } from '@/server/queries/products';

// Reposición rápida desde la alerta de "Stock bajo" de /admin/inventario:
// antes, hacer clic en un producto ahí redirigía a la lista general de
// /admin/products, interrumpiendo el flujo. Este drawer abre directo con los
// campos de stock del producto puntual -- reutiliza ProductColorStockEditor
// (mismo componente que el formulario completo de producto) para que la
// edición por variante (color, talla, o la combinación) sea idéntica en
// ambos lugares. El guardado es un PATCH parcial a
// /api/admin/products/[id] enviando solo `colorStocks` o `stock` -- mismo
// patrón que ya usa banner-manager.tsx para togglear `isActive` sin
// reenviar el resto del producto.
export function QuickRestockDrawer({
  product,
  onClose,
  onUpdated,
}: {
  product: LowStockProduct | null;
  onClose: () => void;
  onUpdated: (id: string, stock: number) => void;
}) {
  const [stock, setStock] = useState('0');
  const [colorStocks, setColorStocks] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Repuebla el formulario cada vez que se abre un producto distinto.
  useEffect(() => {
    if (!product) return;
    setStock(String(product.stock));
    setColorStocks(
      Object.fromEntries(
        product.colorStocks.map(c => [
          variantStockKey(c.colorName, c.talla),
          c.stock,
        ])
      )
    );
  }, [product]);

  if (!product) return null;

  const colors = parseProductColors(product.colores);
  const sizes = parseProductSizes(product.tallas);
  const hasVariants = colors.length > 0 || sizes.length > 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let payload: Record<string, unknown>;
      let newTotal: number;

      if (hasVariants) {
        const rows =
          colors.length > 0 && sizes.length > 0
            ? colors.flatMap(color =>
                sizes.map(size => ({
                  colorName: color.name,
                  talla: size,
                  stock: colorStocks[variantStockKey(color.name, size)] ?? 0,
                }))
              )
            : colors.length > 0
              ? colors.map(color => ({
                  colorName: color.name,
                  talla: '',
                  stock: colorStocks[variantStockKey(color.name, '')] ?? 0,
                }))
              : sizes.map(size => ({
                  colorName: '',
                  talla: size,
                  stock: colorStocks[variantStockKey('', size)] ?? 0,
                }));
        newTotal = rows.reduce((sum, r) => sum + r.stock, 0);
        payload = { colorStocks: rows };
      } else {
        newTotal = parseInt(stock) || 0;
        payload = { stock: newTotal };
      }

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el stock',
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'Stock actualizado' });
      onUpdated(product.id, newTotal);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent className="flex flex-col gap-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Reponer stock</SheetTitle>
          <SheetDescription>{product.name}</SheetDescription>
        </SheetHeader>

        {hasVariants ? (
          <ProductColorStockEditor
            colors={colors}
            sizes={sizes}
            stocks={colorStocks}
            onChange={(colorName, talla, value) =>
              setColorStocks(prev => ({
                ...prev,
                [variantStockKey(colorName, talla)]: value,
              }))
            }
          />
        ) : (
          <div>
            <Label htmlFor="quick-stock">Stock</Label>
            <Input
              id="quick-stock"
              type="number"
              min="0"
              value={stock}
              onChange={e => setStock(e.target.value)}
            />
          </div>
        )}

        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
