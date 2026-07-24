// Location: components/product-card.tsx

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AddToCart } from './add-to-cart';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: {
    name: string;
    slug: string;
  } | null;
}

export function ProductCard({ id, name, price, image, category }: ProductCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/products/${id}`} className="block h-full w-full">
          <Image
            src={image || '/images/placeholder.svg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>

        <div className="absolute inset-x-2 bottom-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <AddToCart
            product={{ id, name, price, images: image ? [image] : [] }}
            variant="secondary"
            size="sm"
            className="w-full bg-background/90 hover:bg-background"
          />
        </div>
      </div>

      <CardContent className="p-4">
        {category && (
          <Link
            href={`/category/${category.slug}`}
            className="text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            {category.name}
          </Link>
        )}

        <Link href={`/products/${id}`}>
          <h3 className="mb-2 mt-1 line-clamp-2 text-sm font-medium transition-colors hover:text-primary">
            {name}
          </h3>
        </Link>

        <span className="text-lg font-semibold">{formatPrice(price)}</span>
      </CardContent>
    </Card>
  );
}
