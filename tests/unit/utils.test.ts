// tests/unit/utils.test.ts
// Cubre solo las funciones de lib/utils.ts que el código real usa
// (formateo de precios en toda la tienda/admin, slugs de categoría). El
// resto de exports de lib/utils.ts (envío, impuestos, descuentos, etc.) son
// remanentes de la plantilla base sin uso real en este MVP -- no vale la
// pena testear lógica que ningún componente invoca.
/// <reference types="jest" />
/// <reference types="@jest/globals" />

import { formatCurrency, formatPrice, generateSlug, formatDate } from '@/lib/utils';

describe('formatCurrency / formatPrice', () => {
  it('formatea USD correctamente', () => {
    expect(formatCurrency(29.99)).toBe('$29.99');
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formatPrice es el mismo alias que formatCurrency', () => {
    expect(formatPrice(29.99)).toBe(formatCurrency(29.99));
  });

  it('redondea a 2 decimales', () => {
    expect(formatCurrency(29.999)).toBe('$30.00');
  });
});

describe('generateSlug (slugify)', () => {
  it('genera slugs básicos', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
    expect(generateSlug('MacBook Pro 14-inch')).toBe('macbook-pro-14-inch');
  });

  // Caso real detectado en producción: el regex anterior borraba vocales
  // acentuadas y la ñ en vez de transliterarlas, rompiendo rutas como
  // /category/[slug] para categorías en español (ver CLAUDE.md).
  it('transllitera tildes y eñe en vez de borrarlas', () => {
    expect(generateSlug('Electrónica')).toBe('electronica');
    expect(generateSlug('Decoración')).toBe('decoracion');
    expect(generateSlug('Baño')).toBe('bano');
  });

  it('maneja casos límite', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug('---')).toBe('');
  });
});

describe('formatDate', () => {
  it('formatea fechas correctamente', () => {
    expect(formatDate('2024-12-25')).toBe('Dec 25, 2024');
  });
});
