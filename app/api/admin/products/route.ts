// File: app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { productSchema } from '@/lib/validators';
import { resolveProductStock } from '@/lib/stock';

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      colorStocks: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.subCategoryId) {
    const subCategory = await prisma.category.findUnique({
      where: { id: parsed.data.subCategoryId },
    });
    if (!subCategory || subCategory.parentId !== parsed.data.categoryId) {
      return NextResponse.json(
        { error: 'La subcategoría debe pertenecer a la categoría elegida' },
        { status: 400 }
      );
    }
  }

  // colorStocks es una relación (ProductColorStock), no un campo escalar de
  // Product -- se separa del resto y se crea anidada. `stock` se recalcula
  // como la suma cuando hay colores (ver lib/stock.ts).
  const { colorStocks, stock, ...productData } = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...productData,
      stock: resolveProductStock(stock, colorStocks),
      colorStocks:
        colorStocks.length > 0 ? { create: colorStocks } : undefined,
    },
    include: {
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      colorStocks: true,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
