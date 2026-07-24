// File: components/home/banner-carousel.tsx
'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import type { Banner } from '@prisma/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

function Slide({ banner }: { banner: Banner }) {
  const content = (
    <div className="relative h-[220px] w-full overflow-hidden sm:h-[340px] lg:h-[440px]">
      <Image
        src={banner.imageUrl}
        alt={banner.title || 'Banner'}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-0 flex items-center bg-black/30">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg text-white">
              {banner.title && (
                <h2 className="text-2xl font-bold sm:text-4xl">{banner.title}</h2>
              )}
              {banner.subtitle && (
                <p className="mt-2 text-sm sm:text-base">{banner.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return banner.linkUrl ? <Link href={banner.linkUrl}>{content}</Link> : content;
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));

  if (banners.length === 0) return null;

  return (
    <Carousel
      opts={{ loop: true }}
      plugins={[autoplay.current]}
      className="w-full"
    >
      <CarouselContent className="ml-0">
        {banners.map(banner => (
          <CarouselItem key={banner.id} className="pl-0">
            <Slide banner={banner} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {banners.length > 1 && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}
    </Carousel>
  );
}
