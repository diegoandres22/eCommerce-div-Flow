// File: components/product-carousel.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { ProductCard } from '@/components/product-card';

interface Product {
  id: string;
  name: string;
  price: number | string;
  images: string[];
  isOutOfStock?: boolean;
  category?: { name: string; slug: string } | null;
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
  viewAllHref?: string;
}

export function ProductCarousel({
  title,
  products,
  viewAllHref,
}: ProductCarouselProps) {
  if (products.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center text-sm font-medium text-primary hover:underline"
          >
            Ver todo
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>

      <Carousel opts={{ align: 'start' }} className="w-full">
        <CarouselContent>
          {products.map(product => (
            <CarouselItem
              key={product.id}
              className="basis-1/2 sm:basis-1/3 lg:basis-1/4"
            >
              <ProductCard
                id={product.id}
                name={product.name}
                price={Number(product.price)}
                image={product.images?.[0]}
                category={product.category}
                isOutOfStock={product.isOutOfStock}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {products.length > 4 && (
          <>
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </>
        )}
      </Carousel>
    </div>
  );
}
