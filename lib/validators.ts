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
  campoTexto1: z.string().min(1, 'campoTexto1 es obligatorio'),
  campoNumero2: z.number(),
  // Reutilizado para guardar los colores del producto como
  // "Nombre:#hex,Nombre:#hex" (ver lib/product-colors.ts). Opcional: no
  // todos los productos tienen variantes de color.
  campoTextoGeneral: z.string().default(''),
  isActive: z.boolean().default(true),
  // Independiente de isActive: producto visible pero no comprable.
  isOutOfStock: z.boolean().default(false),
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
        productId: z.string().min(1),
        name: z.string().min(1),
        price: z.number().nonnegative(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'El carrito no puede estar vacío'),
  totalAmount: z.number().nonnegative(),
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
});
