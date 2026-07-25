// File: app/admin/settings/page.tsx
import prisma from '@/lib/prisma';
import { WhatsappSettingsForm } from '@/components/admin/whatsapp-settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const config = await prisma.configuracionTienda.findFirst();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Verificar número de WhatsApp</h1>
      <WhatsappSettingsForm initialConfig={config} />
    </div>
  );
}
