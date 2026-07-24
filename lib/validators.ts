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
});

// Product schema (tal como el modelo Product del MVP: sin SKU, sin
// inventario, sin variantes; images son URLs de Cloudinary pegadas a mano).
export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  description: z.string().optional(),
  price: z.number().min(0.01, 'El precio debe ser mayor a 0'),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  images: z.array(z.string().url('Debe ser una URL válida')).default([]),
  campoTexto1: z.string().min(1, 'campoTexto1 es obligatorio'),
  campoNumero2: z.number(),
  campoTextoGeneral: z.string().min(1, 'campoTextoGeneral es obligatorio'),
  isActive: z.boolean().default(true),
});

// Configuración de la tienda (singleton: solo debe existir una fila).
// whatsappNumber en formato internacional sin "+" ni espacios (ej: 521234567890),
// tal como lo requiere un enlace wa.me.
export const configuracionTiendaSchema = z.object({
  whatsappNumber: z
    .string()
    .min(8, 'Número muy corto')
    .max(15, 'Número muy largo')
    .regex(/^[0-9]+$/, 'Solo dígitos, sin "+" ni espacios ni guiones'),
});
