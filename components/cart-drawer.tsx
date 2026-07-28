// Location: components/cart-drawer.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SmartImage } from '@/components/ui/smart-image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCart } from '@/components/cart-provider';

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, updateQuantity, removeItem, totalAmount, totalItems, isLoaded } =
    useCart();

  // Animación breve del ícono/badge cada vez que sube el conteo de
  // artículos. Se ignora mientras !isLoaded: el carrito se hidrata desde
  // localStorage de forma asíncrona, así que el primer salto de 0 -> N no
  // es un producto recién agregado, sino el carrito de una visita anterior.
  const [bump, setBump] = useState(false);
  const prevTotalItems = useRef(totalItems);
  const hasSyncedAfterLoad = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!hasSyncedAfterLoad.current) {
      hasSyncedAfterLoad.current = true;
      prevTotalItems.current = totalItems;
      return;
    }

    if (totalItems > prevTotalItems.current) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 600);
      prevTotalItems.current = totalItems;
      return () => clearTimeout(timer);
    }
    prevTotalItems.current = totalItems;
    return undefined;
  }, [totalItems, isLoaded]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className={cn('h-4 w-4', bump && 'animate-bounce')} />
          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 z-20 flex h-5 w-5">
              {bump && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              )}
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold leading-none text-destructive-foreground">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            </span>
          )}
          <span className="sr-only">Abrir carrito</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-muted p-6">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Tu carrito está vacío</h3>
            </div>
            <Button asChild>
              <Link href="/products" onClick={() => setIsOpen(false)}>
                Ver productos
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto py-4">
              {items.map(item => (
                <div
                  key={`${item.productId}-${item.colorName ?? ''}-${item.talla ?? ''}`}
                  className="flex items-center space-x-4 rounded-lg border p-4"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <SmartImage
                      src={item.product.images[0] || '/images/placeholder.svg'}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.productId}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <h4 className="truncate text-sm font-medium transition-colors hover:text-primary-accent">
                        {item.product.name}
                      </h4>
                    </Link>
                    {(item.colorName || item.talla) && (
                      <p className="text-xs text-muted-foreground">
                        {[
                          item.colorName && `Color: ${item.colorName}`,
                          item.talla && `Talla: ${item.talla}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-semibold">
                      {formatCurrency(item.product.price)}
                    </p>

                    <div className="mt-2 flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1, item.colorName, item.talla)
                        }
                        disabled={item.quantity <= 1}
                        className="h-6 w-6"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="min-w-[2rem] text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1, item.colorName, item.talla)
                        }
                        className="h-6 w-6"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.productId, item.colorName, item.talla)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <p className="text-sm font-semibold">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="flex-col space-y-4 border-t pt-4 sm:flex-col">
              <div className="flex w-full items-center justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href="/cart" onClick={() => setIsOpen(false)}>
                  Ver carrito
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
