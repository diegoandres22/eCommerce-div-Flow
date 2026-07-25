// File: components/wishlist-button.tsx
'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist, type WishlistProduct } from '@/components/wishlist-provider';
import { cn } from '@/lib/utils';

export function WishlistButton({
  product,
  className,
}: {
  product: WishlistProduct;
  className?: string;
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const active = isWishlisted(product.id);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={e => {
        e.preventDefault();
        toggleWishlist(product);
      }}
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className={cn('bg-background/90 hover:bg-background', className)}
    >
      <Heart className={cn('h-4 w-4', active && 'fill-red-500 text-red-500')} />
    </Button>
  );
}
