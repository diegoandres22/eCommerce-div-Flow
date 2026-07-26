// File: app/api/admin/leads/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { leadActionSchema } from '@/lib/validators';
import type { LeadItem } from '@/server/queries/leads';
import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

// Recalcula Product.stock como la suma de todas sus filas de ProductColorStock
// -- se llama siempre que se toca una fila de color puntual, para que el
// agregado nunca quede desincronizado del detalle (ver lib/stock.ts#resolveProductStock,
// misma regla que usa el guardado del producto en el admin).
async function resyncAggregateStock(tx: Tx, productId: string) {
  const rows = await tx.productColorStock.findMany({ where: { productId } });
  const total = rows.reduce((sum, row) => sum + row.stock, 0);
  await tx.product.update({ where: { id: productId }, data: { stock: total } });
}

// Suma (positivo o negativo) el stock de un ítem cotizado. Si el ítem tiene
// colorName, ajusta esa fila puntual de ProductColorStock y resincroniza el
// agregado del producto -- si no tiene color, ajusta directo Product.stock.
// `delta` negativo = descuenta (confirmar venta), positivo = repone (revertir).
async function applyStockDelta(tx: Tx, item: LeadItem, delta: number) {
  if (item.colorName) {
    const colorRow = await tx.productColorStock.findUnique({
      where: {
        productId_colorName: {
          productId: item.productId,
          colorName: item.colorName,
        },
      },
    });
    // Si la fila de color ya no existe (se borró/renombró después de
    // cotizado), no hay de dónde descontar con certeza -- se ignora, igual
    // que un producto borrado.
    if (!colorRow) return;

    await tx.productColorStock.update({
      where: { id: colorRow.id },
      data: { stock: Math.max(0, colorRow.stock + delta) },
    });
    await resyncAggregateStock(tx, item.productId);
    return;
  }

  const product = await tx.product.findUnique({
    where: { id: item.productId },
    select: { stock: true },
  });
  if (!product) return;

  await tx.product.update({
    where: { id: item.productId },
    data: { stock: Math.max(0, product.stock + delta) },
  });
}

// Único punto donde el módulo de stock efectivamente descuenta o repone
// inventario -- ver la decisión en docs/analysis/PROPUESTA_MODULO_STOCK.md
// (sección 4): como no hay pasarela de pago, el clic en "Pedir por WhatsApp"
// solo crea un Lead `pendiente`; acá es donde el admin confirma que la venta
// realmente se cerró (descuenta) o la rechaza/revierte (sin efecto o repone).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = leadActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
  }

  const items = lead.items as unknown as LeadItem[];

  if (parsed.data.action === 'confirm') {
    if (lead.estado !== 'pendiente') {
      return NextResponse.json(
        { error: 'Este lead ya fue procesado (confirmado o cancelado)' },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async tx => {
      for (const item of items) {
        // Nunca baja de 0, aunque la cantidad cotizada supere el stock
        // actual (pudo cambiar entre la cotización y la confirmación).
        await applyStockDelta(tx, item, -item.quantity);
      }
      return tx.lead.update({ where: { id }, data: { estado: 'confirmado' } });
    });

    return NextResponse.json(updated);
  }

  // action === 'cancel': rechaza un pendiente (sin efecto en stock) o
  // revierte una venta ya confirmada (repone lo que se había descontado).
  if (lead.estado === 'cancelado') {
    return NextResponse.json(
      { error: 'Este lead ya está cancelado' },
      { status: 409 }
    );
  }

  const wasConfirmed = lead.estado === 'confirmado';

  const updated = await prisma.$transaction(async tx => {
    if (wasConfirmed) {
      for (const item of items) {
        await applyStockDelta(tx, item, item.quantity);
      }
    }
    return tx.lead.update({ where: { id }, data: { estado: 'cancelado' } });
  });

  return NextResponse.json(updated);
}
