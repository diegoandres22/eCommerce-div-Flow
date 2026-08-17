// File: app/api/admin/products/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { productSchema } from '@/lib/validators';
import { resolveProductStock } from '@/lib/stock';
import { requireAdminSession } from '@/lib/api-auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json();
  const parsed = productSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.subCategoryId) {
    const effectiveCategoryId =
      parsed.data.categoryId ??
      (
        await prisma.product.findUnique({
          where: { id },
          select: { categoryId: true },
        })
      )?.categoryId;

    const subCategory = await prisma.category.findUnique({
      where: { id: parsed.data.subCategoryId },
    });
    if (!subCategory || subCategory.parentId !== effectiveCategoryId) {
      return NextResponse.json(
        { error: 'La subcategoría debe pertenecer a la categoría elegida' },
        { status: 400 }
      );
    }
  }

  // colorStocks es una relación, no un campo escalar de Product -- se separa
  // del resto y se reemplaza entera (deleteMany + create) cuando viene en el
  // body. `stock` se recalcula como la suma cuando hay colores (lib/stock.ts).
  // Ojo: con `.partial()`, un campo con `.default()` en el schema base se
  // sigue completando solo si la clave falta en el body -- por eso acá se
  // chequea la presencia en el body crudo, no en `parsed.data`, para no
  // pisar stock/colorStocks a 0/[] en un PATCH parcial que no los incluya.
  const { colorStocks, stock, ...rest } = parsed.data;
  const touchesStock = 'stock' in body || 'colorStocks' in body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...rest,
      ...(touchesStock
        ? { stock: resolveProductStock(stock ?? 0, colorStocks ?? []) }
        : {}),
      ...('colorStocks' in body
        ? { colorStocks: { deleteMany: {}, create: colorStocks ?? [] } }
        : {}),
    },
    include: {
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      colorStocks: true,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
