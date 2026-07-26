// File: components/product-purchase-panel.tsx
'use client';

import { useState } from 'react';
import { AddToCart } from '@/components/add-to-cart';
import { ProductColorSwatches } from '@/components/product-color-swatches';
import type { ProductColor } from '@/lib/product-colors';

interface ProductPurchasePanelProps {
  product: { id: string; name: string; price: number; images: string[] };
  colors: ProductColor[];
  controlStockActivo: boolean;
  // Stock agregado del producto -- el que aplica cuando no tiene colores (o
  // como fallback de disponibilidad general).
  stock: number;
  colorStocks: { colorName: string; stock: number }[];
  // Ya resuelto por isEffectivelyOutOfStock en la page (server): con el
  // switch apagado es el manual de siempre; con el switch activo y sin
  // colores, es `stock <= 0`.
  isOutOfStock: boolean;
}

// Coordina la selección de color con el tope de cantidad y la disponibilidad
// que le pasa a `AddToCart` -- antes esto vivía repartido entre
// ProductColorSwatches (con su propio estado interno) y la page, sin manera
// de que el selector de color afectara la cantidad máxima comprable. El
// color elegido acá viaja con el `product` hasta `AddToCart` -> `CartProvider`
// (`CartProduct.colorName`) y de ahí hasta el `Lead`, para que confirmar la
// venta en /admin/leads descuente la fila de `ProductColorStock` correcta.
export function ProductPurchasePanel({
  product,
  colors,
  controlStockActivo,
  stock,
  colorStocks,
  isOutOfStock,
}: ProductPurchasePanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const stockByColor =
    colorStocks.length > 0
      ? new Map(colorStocks.map(c => [c.colorName, c.stock]))
      : undefined;

  const selectedColor = colors[selectedIndex] ?? colors[0];
  const hasColors = colors.length > 0;

  // Stock relevante para el selector de cantidad: el del color elegido si el
  // producto tiene colores, si no el agregado del producto.
  const availableStock = hasColors
    ? (stockByColor?.get(selectedColor?.name ?? '') ?? 0)
    : stock;

  const effectivelyOut = controlStockActivo
    ? hasColors
      ? availableStock <= 0
      : isOutOfStock
    : isOutOfStock;

  return (
    <>
      <ProductColorSwatches
        colors={colors}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        stockByColor={controlStockActivo ? stockByColor : undefined}
      />

      {effectivelyOut && (
        <p className="text-sm font-medium text-destructive">
          Este producto está agotado por el momento.
        </p>
      )}

      <div className="flex items-center gap-2">
        <AddToCart
          // El color elegido viaja con el producto hasta el carrito (ver
          // CartProduct.colorName en cart-provider.tsx) -- es lo que permite
          // que "Marcar como vendido" en /admin/leads sepa de qué color
          // descontar stock en vez de siempre el agregado del producto.
          product={hasColors ? { ...product, colorName: selectedColor?.name } : product}
          showQuantitySelector
          disabled={effectivelyOut}
          maxQuantity={controlStockActivo ? Math.max(1, availableStock) : 10}
        />
      </div>
    </>
  );
}
