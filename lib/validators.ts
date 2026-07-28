// lib/validators.ts
import { z } from 'zod';

// Category schema (name + slug, tal como el modelo Category del MVP)
export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  slug: z
    .string()
    .min(1, 'El slug es obligatorio')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  // Opcional: si se define, esta categoría pasa a ser subcategoría de otra
  // (un solo nivel de anidamiento, validado en la API).
  parentId: z.string().nullable().optional(),
});

// Product schema (tal como el modelo Product del MVP: sin SKU, sin
// inventario, sin variantes; images son URLs públicas de Supabase Storage).
export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  description: z.string().optional(),
  price: z.number().min(0.01, 'El precio debe ser mayor a 0'),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  // Opcional: debe ser hija directa de categoryId (se valida en la API).
  subCategoryId: z.string().nullable().optional(),
  images: z.array(z.string().url('Debe ser una URL válida')).default([]),
  marca: z.string().min(1, 'La marca es obligatoria'),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  // Colores del producto como "Nombre:#hex,Nombre:#hex" (ver
  // lib/product-colors.ts). Opcional: no todos los productos tienen
  // variantes de color.
  colores: z.string().default(''),
  // Tallas del producto como "38,39,40,41" o "S,M,L,XL" (ver
  // lib/product-sizes.ts). Opcional e independiente de `colores`: un
  // producto puede tener talla, color, ambos o ninguno.
  tallas: z.string().default(''),
  isActive: z.boolean().default(true),
  // Independiente de isActive: producto visible pero no comprable. Solo se
  // edita a mano cuando controlStockActivo está apagado -- con el módulo de
  // stock activo, este valor se ignora y se deriva de `stock` (ver
  // app/api/admin/products/route.ts y [id]/route.ts).
  isOutOfStock: z.boolean().default(false),
  // --- Módulo de stock (opcional) ---
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  stockMinimo: z
    .number()
    .int()
    .min(0, 'El umbral no puede ser negativo')
    .default(3),
  // Solo relevante si el producto tiene `colores` y/o `tallas`: una fila por
  // variante (color solo, talla sola, o la combinación de ambos) con su
  // cantidad. Cuando viene no vacío, `stock` se recalcula server-side como
  // la suma de estas filas (ver API) -- el admin no lo edita a mano en ese caso.
  colorStocks: z
    .array(
      z.object({
        colorName: z.string().default(''),
        talla: z.string().default(''),
        stock: z.number().int().min(0),
      })
    )
    .default([]),
});

// Banner del carrusel principal (home). imageUrl es una URL de Supabase Storage,
// igual que las imágenes de producto. title/subtitle/linkUrl son opcionales.
export const bannerSchema = z.object({
  imageUrl: z.string().url('Debe ser una URL válida'),
  title: z.string().max(150).optional().or(z.literal('')),
  subtitle: z.string().max(255).optional().or(z.literal('')),
  linkUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// Formulario público de asesoría/contacto.
export const contactSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  email: z.string().email('Email inválido'),
  phone: z.string().max(20).optional().or(z.literal('')),
  message: z
    .string()
    .min(10, 'Cuéntanos un poco más (mínimo 10 caracteres)')
    .max(2000),
});

// Lead / intención de compra: se registra justo antes de redirigir a
// WhatsApp (ver cart-checkout.tsx), sin pedirle nada extra al cliente. Es
// solo un snapshot de lo que se cotizó, para que el admin tenga un rastro
// consultable de lo que WhatsApp por sí solo no deja ver.
export const leadSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(100),
        name: z.string().min(1).max(255),
        // Color elegido en el carrito, si el producto tiene colores. Le
        // permite a la confirmación de venta (app/api/admin/leads/[id]/route.ts)
        // descontar la fila específica de ProductColorStock en vez de
        // siempre el agregado del producto.
        colorName: z.string().max(100).optional(),
        // Talla elegida en el carrito, si el producto tiene tallas.
        talla: z.string().max(50).optional(),
        price: z.number().nonnegative().max(999999),
        quantity: z.number().int().positive().max(999),
      })
    )
    // Es un endpoint público sin auth: los topes (50 líneas, strings
    // acotados arriba) evitan que un payload arbitrariamente grande abuse
    // de la DB o del envío de correo (sendNewLeadEmail formatea cada línea).
    .min(1, 'El carrito no puede estar vacío')
    .max(50, 'Demasiados productos en un solo pedido'),
  totalAmount: z.number().nonnegative().max(99999999),
});

// Actualización masiva de precios (/admin/bulk-pricing). "categoryId" sirve
// tanto para categorías principales como subcategorías (se matchea contra
// categoryId O subCategoryId del producto, igual que en las vistas públicas).
export const bulkPricingSchema = z
  .object({
    scope: z.enum(['category', 'manual', 'all']),
    categoryId: z.string().optional(),
    productIds: z.array(z.string()).optional(),
    adjustmentType: z.enum(['percentage', 'fixed']),
    value: z.number().refine(v => v !== 0, 'El valor no puede ser 0'),
  })
  .refine(data => data.scope !== 'category' || !!data.categoryId, {
    message: 'Selecciona una categoría',
    path: ['categoryId'],
  })
  .refine(
    data =>
      data.scope !== 'manual' ||
      (data.productIds && data.productIds.length > 0),
    { message: 'Selecciona al menos un producto', path: ['productIds'] }
  );

// Configuración de la tienda (singleton: solo debe existir una fila).
// whatsappNumber en formato internacional sin "+" ni espacios (ej: 521234567890),
// tal como lo requiere un enlace wa.me.
export const configuracionTiendaSchema = z.object({
  whatsappNumber: z
    .string()
    .min(8, 'Número muy corto')
    .max(15, 'Número muy largo')
    .regex(/^[0-9]+$/, 'Solo dígitos, sin "+" ni espacios ni guiones'),
  // Barra de anuncio superior: texto libre, visible solo si showBanner es true.
  bannerText: z.string().max(200).optional().or(z.literal('')),
  showBanner: z.boolean().default(false),
  // Interruptor global del módulo de stock (ver Product.stock/Lead.estado).
  controlStockActivo: z.boolean().default(false),
});

// Acción sobre un Lead desde /admin/leads: confirmar la venta (descuenta
// stock) o rechazarla/revertirla (sin efecto, o repone stock si ya estaba
// confirmada). Ver app/api/admin/leads/[id]/route.ts.
export const leadActionSchema = z.object({
  action: z.enum(['confirm', 'cancel']),
});
