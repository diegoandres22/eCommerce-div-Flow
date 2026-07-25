// File: components/track-recently-viewed.tsx
'use client';

import { useEffect } from 'react';
import {
  useRecentlyViewed,
  type RecentlyViewedProduct,
} from '@/components/recently-viewed-provider';
import { STORE_CONFIG } from '@/lib/store-config';

// Puente entre la página de producto (Server Component) y el contexto de
// localStorage: no renderiza nada, solo registra la visita al montar.
export function TrackRecentlyViewed({
  product,
}: {
  product: RecentlyViewedProduct;
}) {
  const { trackView } = useRecentlyViewed();

  useEffect(() => {
    if (!STORE_CONFIG.mostrarVistosRecientemente) return;
    trackView(product);
    // Solo al montar/cuando cambia el producto visto, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return null;
}
