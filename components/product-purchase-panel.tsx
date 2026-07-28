// File: components/product-purchase-panel.tsx
'use client';

import { useState } from 'react';
import { AddToCart } from '@/components/add-to-cart';
import { ProductColorSwatches } from '@/components/product-color-swatches';
import { ProductSizeSelector } from '@/components/product-size-selector';
import type { ProductColor } from '@/lib/product-colors';
import { variantStockKey } from '@/lib/stock';

interface ProductPurchasePanelProps {
  product: { id: string; name: string; price: number; images: string[] };
  colors: ProductColor[];
  // Independiente de `colors`: un producto puede tener talla, color, ambos o
  // ninguno. Con el módulo de stock activo, la talla SÍ afecta stock y
  // cantidad máxima cuando el producto también tiene colores (o cuando solo
  // tiene tallas) -- ver colorStocks más abajo.
  sizes: string[];
  controlStockActivo: boolean;
  // Stock agregado del producto -- el que aplica cuando no tiene colores NI
  // tallas (o como fallback de disponibilidad general).
  stock: number;
  // Una fila por variante (ver ProductColorStock): color solo (talla ''),
  // talla sola (colorName ''), o la combinación puntual de ambos.
  colorStocks: { colorName: string; talla: string; stock: number }[];
  // Ya resuelto por isEffectivelyOutOfStock en la page (server): con el
  // switch apagado es el manual de siempre; con el switch activo y sin
  // variantes, es `stock <= 0`.
  isOutOfStock: boolean;
}

// Coordina la selección de color y talla con el tope de cantidad y la
// disponibilidad que le pasa a `AddToCart` -- antes esto vivía repartido
// entre ProductColorSwatches (con su propio estado interno) y la page, sin
// manera de que el selector afectara la cantidad máxima comprable. El color
// y la talla elegidos viajan con el `product` hasta `AddToCart` ->
// `CartProvider` (`CartProduct.colorName`/`talla`) y de ahí hasta el `Lead`,
// para que confirmar la venta en /admin/leads descuente la fila exacta de
// `ProductColorStock`.
export function ProductPurchasePanel({
  product,
  colors,
  sizes,
  controlStockActivo,
  stock,
  colorStocks,
  isOutOfStock,
}: ProductPurchasePanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  const selectedColor = colors[selectedIndex] ?? colors[0];
  const hasColors = colors.length > 0;
  const selectedSize = sizes[selectedSizeIndex] ?? sizes[0];
  const hasSizes = sizes.length > 0;

  // Mapa exacto por combinación (colorName|talla) -> stock, tal cual vienen
  // las filas desde la base.
  const exactStock = new Map(
    colorStocks.map(c => [variantStockKey(c.colorName, c.talla), c.stock])
  );

  // Agregado por color (suma de todas sus tallas, o su única fila si el
  // producto no tiene tallas) -- decide si un swatch de color se deshabilita
  // entero, sin importar qué talla esté elegida.
  const stockByColor = hasColors
    ? new Map(
        colors.map(color => [
          color.name,
          colorStocks
            .filter(c => c.colorName === color.name)
            .reduce((sum, c) => sum + c.stock, 0),
        ])
      )
    : undefined;

  // Stock por talla: si también hay colores, es el de la combinación con el
  // color elegido (contextual); si el producto solo tiene tallas, es la fila
  // "talla sola" (colorName '') de cada una.
  const stockBySize = hasSizes
    ? new Map(
        sizes.map(size => [
          size,
          hasColors
            ? (exactStock.get(variantStockKey(selectedColor?.name ?? '', size)) ?? 0)
            : (exactStock.get(variantStockKey('', size)) ?? 0),
        ])
      )
    : undefined;

  // Stock relevante para el selector de cantidad: la combinación exacta
  // elegida (color+talla, solo color, o solo talla), o el agregado del
  // producto si no tiene ninguna variante.
  const availableStock =
    hasColors || hasSizes
      ? (exactStock.get(
          variantStockKey(
            hasColors ? (selectedColor?.name ?? '') : '',
            hasSizes ? (selectedSize ?? '') : ''
          )
        ) ?? 0)
      : stock;

  const effectivelyOut = controlStockActivo
    ? hasColors || hasSizes
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

      <ProductSizeSelector
        sizes={sizes}
        selectedIndex={selectedSizeIndex}
        onSelect={setSelectedSizeIndex}
        stockBySize={controlStockActivo ? stockBySize : undefined}
      />

      {effectivelyOut && (
        <p className="text-sm font-medium text-destructive">
          Este producto está agotado por el momento.
        </p>
      )}

      <div className="flex items-center gap-2">
        <AddToCart
          // El color y la talla elegidos viajan con el producto hasta el
          // carrito (ver CartProduct.colorName/talla en cart-provider.tsx),
          // para que "Marcar como vendido" en /admin/leads sepa de qué
          // variante exacta descontar stock.
          product={{
            ...product,
            ...(hasColors ? { colorName: selectedColor?.name } : {}),
            ...(hasSizes ? { talla: selectedSize } : {}),
          }}
          showQuantitySelector
          disabled={effectivelyOut}
          maxQuantity={controlStockActivo ? Math.max(1, availableStock) : 10}
        />
      </div>
    </>
  );
}
