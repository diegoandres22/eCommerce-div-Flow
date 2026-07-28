// Location: components/product-card.tsx

import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { SmartImage } from '@/components/ui/smart-image';
import { AddToCart } from './add-to-cart';
import { WishlistButton } from './wishlist-button';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: {
    name: string;
    slug: string;
  } | null;
  isOutOfStock?: boolean;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  category,
  isOutOfStock,
}: ProductCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/products/${id}`} className="block h-full w-full">
          <SmartImage
            src={image || '/images/placeholder.svg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>

        {isOutOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-foreground/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
            Agotado
          </span>
        )}

        <WishlistButton
          product={{ id, name, price, images: image ? [image] : [] }}
          className="absolute right-2 top-2 h-8 w-8"
        />

        <div className="absolute inset-x-2 bottom-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <AddToCart
            product={{ id, name, price, images: image ? [image] : [] }}
            variant="secondary"
            size="sm"
            disabled={isOutOfStock}
            // `variant="secondary"` trae `text-secondary-foreground` -- un
            // color de marca fijo, igual en claro/oscuro a propósito (ver
            // lib/theme.ts). Acá se pisa el fondo con `bg-background/90`
            // (que sí cambia con el tema) sin pisar el texto, así que en
            // tema oscuro quedaba texto casi negro sobre fondo casi negro,
            // invisible. Fix: `text-foreground` es la pareja correcta de
            // `background` -- los dos cambian juntos con el tema.
            className="w-full bg-background/90 text-foreground hover:bg-background"
          >
            {isOutOfStock ? 'Agotado' : undefined}
          </AddToCart>
        </div>
      </div>

      <CardContent className="p-4">
        {category && (
          <Link
            href={`/category/${category.slug}`}
            className="text-xs text-muted-foreground transition-colors hover:text-primary-accent"
          >
            {category.name}
          </Link>
        )}

        <Link href={`/products/${id}`}>
          <h3 className="mb-2 mt-1 line-clamp-2 text-sm font-medium transition-colors hover:text-primary-accent">
            {name}
          </h3>
        </Link>

        <span className="text-lg font-semibold">{formatPrice(price)}</span>
      </CardContent>
    </Card>
  );
}
