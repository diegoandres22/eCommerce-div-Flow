// File: app/api/admin/bulk-pricing/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { bulkPricingSchema } from '@/lib/validators';

export async function PATCH(req: Request) {
  const body = await req.json();
  const parsed = bulkPricingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { scope, categoryId, productIds, adjustmentType, value } = parsed.data;

  const where =
    scope === 'all'
      ? {}
      : scope === 'category'
        ? { OR: [{ categoryId }, { subCategoryId: categoryId }] }
        : { id: { in: productIds ?? [] } };

  const targets = await prisma.product.findMany({
    where,
    select: { id: true, price: true },
  });

  if (targets.length === 0) {
    return NextResponse.json(
      { error: 'No hay productos que coincidan con el criterio elegido' },
      { status: 400 }
    );
  }

  const updates = targets.map(product => {
    const rawPrice = Number(product.price);
    const newPrice =
      adjustmentType === 'percentage'
        ? rawPrice * (1 + value / 100)
        : rawPrice + value;

    return prisma.product.update({
      where: { id: product.id },
      data: { price: Math.max(0.01, Number(newPrice.toFixed(2))) },
    });
  });

  await prisma.$transaction(updates);

  return NextResponse.json({ updatedCount: targets.length });
}
