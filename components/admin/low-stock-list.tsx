// Location: components/admin/low-stock-list.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SmartImage } from '@/components/ui/smart-image';
import { QuickRestockDrawer } from '@/components/admin/quick-restock-drawer';
import type { LowStockProduct } from '@/server/queries/products';

// Listado de la card "Productos con stock bajo" de /admin/inventario. Antes
// cada fila era un <Link href="/admin/products">, que mandaba al admin a la
// lista general del catálogo -- tenía que volver a buscar el producto y
// abrir su formulario completo solo para cargar unidades. Ahora cada fila es
// un botón que abre QuickRestockDrawer directo sobre ese producto.
export function LowStockList({ products }: { products: LowStockProduct[] }) {
  const [selected, setSelected] = useState<LowStockProduct | null>(null);
  const router = useRouter();

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ningún producto activo está por debajo de su umbral de alerta.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {products.map(product => (
          <button
            key={product.id}
            type="button"
            onClick={() => setSelected(product)}
            className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-muted"
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-muted">
              {product.images[0] && (
                <SmartImage
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              )}
            </div>
            <span className="flex-1 truncate">{product.name}</span>
            {product.stock === 0 ? (
              <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                Agotado
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                {product.stock} / {product.stockMinimo}
              </span>
            )}
          </button>
        ))}
      </div>

      <QuickRestockDrawer
        product={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => router.refresh()}
      />
    </>
  );
}
