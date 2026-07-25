// Location: lib/product-colors.ts

export interface ProductColor {
  name: string;
  hex: string;
}

// Reutiliza el campo genérico `campoTextoGeneral` (String simple en el
// modelo Product de Prisma) para guardar la lista de colores del producto,
// sin necesitar una migración ni una tabla de variantes real. Formato:
// "Nombre:#hex,Nombre:#hex" (ej. "Negro:#171717,Blanco:#FFFFFF"). Es
// opcional: un producto sin colores simplemente guarda "" en ese campo.
const ITEM_SEPARATOR = ',';
const PAIR_SEPARATOR = ':';
const HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/;

export function parseProductColors(
  raw: string | null | undefined
): ProductColor[] {
  if (!raw) return [];

  return raw
    .split(ITEM_SEPARATOR)
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .map(chunk => {
      const [name, hex] = chunk.split(PAIR_SEPARATOR);
      return { name: (name || '').trim(), hex: (hex || '').trim() };
    })
    .filter(color => color.name && HEX_PATTERN.test(color.hex));
}

export function serializeProductColors(colors: ProductColor[]): string {
  return colors
    .filter(c => c.name.trim() && HEX_PATTERN.test(c.hex.trim()))
    .map(c => `${c.name.trim()}${PAIR_SEPARATOR}${c.hex.trim()}`)
    .join(ITEM_SEPARATOR);
}
