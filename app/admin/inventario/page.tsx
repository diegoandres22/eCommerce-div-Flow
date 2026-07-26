// File: app/admin/inventario/page.tsx
import prisma from '@/lib/prisma';
import { InventorySettingsForm } from '@/components/admin/inventory-settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminInventarioPage() {
  const config = await prisma.configuracionTienda.findFirst();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventario</h1>
      <InventorySettingsForm initialConfig={config} />
    </div>
  );
}
