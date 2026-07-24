// File: components/cart-checkout.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MessageCircle } from 'lucide-react';
import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { buildWhatsAppOrderLink } from '@/lib/whatsapp';

export function CartCheckout({
  whatsappNumber,
}: {
  whatsappNumber: string | null;
}) {
  const { items, totalAmount, totalItems, updateQuantity, removeItem } =
    useCart();

  if (!items.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Tu carrito está vacío
          </h1>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ver productos
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const whatsappLink = whatsappNumber
    ? buildWhatsAppOrderLink(
        whatsappNumber,
        items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount
      )
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Carrito</h1>
      <p className="mb-8 text-muted-foreground">
        {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map(item => (
            <div
              key={item.productId}
              className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={item.product.images[0] || '/images/placeholder.svg'}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.productId}`}
                  className="font-medium hover:text-primary"
                >
                  {item.product.name}
                </Link>
                <p className="mt-1 font-semibold">
                  {formatPrice(item.product.price)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                <p className="font-semibold">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.productId)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Quitar
                </Button>
              </div>
            </div>
          ))}

          <Button asChild variant="outline">
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Seguir comprando
            </Link>
          </Button>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            <Separator className="my-4" />

            {whatsappLink ? (
              <Button
                asChild
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Pedir por WhatsApp
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                La tienda todavía no configuró un número de WhatsApp. Pide al
                administrador que lo agregue en el panel.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
