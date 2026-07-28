// Location: lib/product-sizes.ts

// El campo `tallas` (String simple en el modelo Product) guarda la lista de
// tallas del producto serializada como texto separado por comas -- mismo
// patrón que `colores` (lib/product-colors.ts) pero sin color asociado:
// texto libre, sirve tanto para tallas numéricas ("38,39,40,41") como en
// letra ("S,M,L,XL"). Opcional: un producto sin tallas guarda "".
const SEPARATOR = ',';

export function parseProductSizes(raw: string | null | undefined): string[] {
  if (!raw) return [];

  return raw
    .split(SEPARATOR)
    .map(size => size.trim())
    .filter(Boolean);
}

export function serializeProductSizes(sizes: string[]): string {
  return sizes
    .map(size => size.trim())
    .filter(Boolean)
    .join(SEPARATOR);
}
