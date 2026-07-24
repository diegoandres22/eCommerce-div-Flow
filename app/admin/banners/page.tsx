// File: app/admin/banners/page.tsx
import prisma from '@/lib/prisma';
import { BannerManager } from '@/components/admin/banner-manager';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Banners del home</h1>
      <BannerManager initialBanners={banners} />
    </div>
  );
}
