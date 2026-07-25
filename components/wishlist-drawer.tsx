// File: components/wishlist-drawer.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { SmartImage } from '@/components/ui/smart-image';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/utils';
import { useWishlist } from '@/components/wishlist-provider';

export function WishlistDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeItem, totalItems } = useWishlist();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Heart className="h-4 w-4" />
          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold leading-none text-destructive-foreground">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
          <span className="sr-only">Abrir lista de deseos</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Mis favoritos ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-muted p-6">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Todavía no tienes favoritos</h3>
            <Button asChild>
              <Link href="/products" onClick={() => setIsOpen(false)}>
                Ver productos
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center space-x-4 rounded-lg border p-4"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  <SmartImage
                    src={item.images[0] || '/images/placeholder.svg'}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.id}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <h4 className="truncate text-sm font-medium transition-colors hover:text-primary">
                      {item.name}
                    </h4>
                  </Link>
                  <p className="mt-1 text-sm font-semibold">
                    {formatCurrency(item.price)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  aria-label="Quitar de favoritos"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
