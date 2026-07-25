// File: components/recently-viewed-carousel.tsx
'use client';

import { useRecentlyViewed } from '@/components/recently-viewed-provider';
import { ProductCarousel } from '@/components/product-carousel';
import { STORE_CONFIG } from '@/lib/store-config';

export function RecentlyViewedCarousel({ excludeId }: { excludeId?: string }) {
  const { items } = useRecentlyViewed();
  const visible = excludeId ? items.filter(i => i.id !== excludeId) : items;

  if (!STORE_CONFIG.mostrarVistosRecientemente || visible.length === 0) return null;

  return <ProductCarousel title="Vistos recientemente" products={visible} />;
}
