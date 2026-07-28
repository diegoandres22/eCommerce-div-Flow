// File: app/admin/inventario/page.tsx
import { AlertTriangle } from 'lucide-react';
import prisma from '@/lib/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InventorySettingsForm } from '@/components/admin/inventory-settings-form';
import { LowStockList } from '@/components/admin/low-stock-list';
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
              Llegaron (o están por debajo) del umbral de alerta cargado en
              cada producto -- incluye los que ya están totalmente agotados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LowStockList products={lowStockProducts} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
