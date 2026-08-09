// File: components/product-gallery.tsx
'use client';

import { useState } from 'react';
import { SmartImage } from '@/components/ui/smart-image';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

// Antes la imagen grande y las miniaturas eran estáticas (fijas en
// images[0] + images[1..4], sin poder volver a la primera desde una
// miniatura). Client Component aparte porque necesita estado -- el resto de
// la página de producto sigue siendo Server Component.
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const gallery = images.length > 0 ? images : ['/images/placeholder.svg'];
  const [selectedIndex, setSelectedIndex] = useState(0);
  // noUncheckedIndexedAccess: un acceso por índice siempre tipa
  // `string | undefined`, aunque `gallery` nunca esté vacío en runtime -- el
  // fallback final a un literal es lo único que angosta el tipo a `string`.
  const selectedImage: string =
    gallery[selectedIndex] ?? gallery[0] ?? '/images/placeholder.svg';

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <SmartImage
          src={selectedImage}
          alt={productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {gallery.map((url, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-current={isSelected}
                aria-label={`Ver imagen ${index + 1} de ${productName}`}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-lg bg-muted ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  // Feedback visual de cuál está activa: borde de acento en la
                  // seleccionada, resto atenuado -- sin esto no había forma de
                  // saber qué miniatura corresponde a la imagen grande.
                  isSelected
                    ? 'ring-2 ring-primary-accent'
                    : 'opacity-70 hover:opacity-100'
                )}
              >
                <SmartImage
                  src={url}
                  alt={`${productName} - foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 25vw, 12vw"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
