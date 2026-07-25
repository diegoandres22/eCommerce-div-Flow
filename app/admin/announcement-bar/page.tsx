// File: app/admin/announcement-bar/page.tsx
import prisma from '@/lib/prisma';
import { BannerSettingsForm } from '@/components/admin/banner-settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementBarPage() {
  const config = await prisma.configuracionTienda.findFirst();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Banner de la tienda</h1>
      <BannerSettingsForm initialConfig={config} />
    </div>
  );
}
