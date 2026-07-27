// File: app/admin/inventario/page.tsx
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import prisma from '@/lib/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SmartImage } from '@/components/ui/smart-image';
import { InventorySettingsForm } from '@/components/admin/inventory-settings-form';
import { getLowStockProducts } from '@/server/queries/products';

export const dynamic = 'force-dynamic';

export default async function AdminInventarioPage() {
  const [config, lowStockProducts] = await Promise.all([
    prisma.configuracionTienda.findFirst(),
    getLowStockProducts(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventario</h1>
      <InventorySettingsForm initialConfig={config} />

      {/* Solo con el switch activo: apagado, stock queda en 0 por defecto
          para todos los productos y esta lista siempre estaría vacía sin
          decir nada útil. */}
      {config?.controlStockActivo && (
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              <CardTitle className="text-lg">Productos con stock bajo</CardTitle>
            </div>
            <CardDescription>
              Todavía tienen unidades, pero ya llegaron (o están por debajo)
              del umbral de alerta cargado en cada producto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ningún producto activo está por debajo de su umbral de alerta.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map(product => (
                  <Link
                    key={product.id}
                    href="/admin/products"
                    className="flex items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-muted"
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
                    <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {product.stock} / {product.stockMinimo}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
