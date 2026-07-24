// File: app/admin/settings/page.tsx
import prisma from '@/lib/prisma';
import { SettingsForm } from '@/components/admin/settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const config = await prisma.configuracionTienda.findFirst();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración de la tienda</h1>
      <SettingsForm initialConfig={config} />
    </div>
  );
}
