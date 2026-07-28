// Location: lib/stock.ts
//
// Helper compartido entre app/api/admin/products/route.ts y [id]/route.ts:
// cuando un producto tiene colorStocks (stock por variante -- color, talla,
// o la combinación de ambos, ver prisma/schema.prisma#ProductColorStock),
// Product.stock deja de ser editable a mano y pasa a ser la suma de esas
// filas -- así el agregado nunca queda desincronizado del detalle. Si no hay
// variantes, se respeta el valor de stock que mandó el formulario.
export interface ColorStockInput {
  colorName: string;
  talla: string;
  stock: number;
}

export function resolveProductStock(
  stock: number,
  colorStocks: ColorStockInput[]
): number {
  if (colorStocks.length === 0) return stock;
  return colorStocks.reduce((sum, c) => sum + c.stock, 0);
}

// Clave compuesta para indexar filas de stock por variante en un Map --
// mismo criterio en el admin (editor de stock) y en la tienda (selector de
// compra), así una fila "Rojo + M" y "Rojo" (sin talla) no colisionan.
export function variantStockKey(colorName: string, talla: string): string {
  return `${colorName}|${talla}`;
}

// Con el módulo de stock activo, "agotado" se deriva de `stock <= 0` en vez
// del checkbox manual `isOutOfStock` (que solo se usa cuando el switch
// global está apagado). Usado tanto en el admin (product-manager.tsx, cada
// uno con su propia copia porque ahí no viene de una consulta server) como
// en toda página pública que renderiza productos.
export function isEffectivelyOutOfStock(
  product: { isOutOfStock: boolean; stock: number },
  controlStockActivo: boolean
): boolean {
  return controlStockActivo ? product.stock <= 0 : product.isOutOfStock;
}

// Aplica la derivación de arriba a una lista completa, devolviendo los
// mismos objetos con `isOutOfStock` ya resuelto -- así ProductCard/ProductGrid/
// ProductCarousel no necesitan saber nada sobre controlStockActivo, siguen
// leyendo `isOutOfStock` tal cual como si fuera el campo de siempre.
export function withEffectiveStock<
  T extends { isOutOfStock: boolean; stock: number },
>(products: T[], controlStockActivo: boolean): T[] {
  if (!controlStockActivo) return products;
  return products.map(product => ({
    ...product,
    isOutOfStock: isEffectivelyOutOfStock(product, controlStockActivo),
  }));
}
