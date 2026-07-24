// File: app/api/admin/products/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { productSchema } from '@/lib/validators';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
          where: { id: params.id },
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

  const product = await prisma.product.update({
    where: { id: params.id },
    data: parsed.data,
    include: {
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
