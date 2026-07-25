// File: components/announcement-bar.tsx
import { getStoreBanner } from '@/server/queries/settings';

// Server Component: se renderiza (o no) según showBanner en cada request.
export async function AnnouncementBar() {
  const { bannerText, showBanner } = await getStoreBanner();
  if (!showBanner || !bannerText) return null;

  return (
    <div className="bg-primary py-2 text-center text-sm font-medium text-primary-foreground">
      {bannerText}
    </div>
  );
}
