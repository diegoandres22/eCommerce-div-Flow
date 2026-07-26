// File: app/api/admin/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { categorySchema } from '@/lib/validators';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = categorySchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.parentId) {
    if (parsed.data.parentId === id) {
      return NextResponse.json(
        { error: 'Una categoría no puede ser su propia subcategoría' },
        { status: 400 }
      );
    }
    const parent = await prisma.category.findUnique({
      where: { id: parsed.data.parentId },
    });
    if (!parent || parent.parentId) {
      return NextResponse.json(
        { error: 'La categoría padre no es válida (no puede ser una subcategoría)' },
        { status: 400 }
      );
    }
    const hasChildren = await prisma.category.count({
      where: { parentId: id },
    });
    if (hasChildren > 0) {
      return NextResponse.json(
        { error: 'Esta categoría ya tiene subcategorías: no puede convertirse en subcategoría de otra' },
        { status: 400 }
      );
    }
  }

  if (parsed.data.slug || parsed.data.name) {
    const duplicate = await prisma.category.findFirst({
      where: {
        NOT: { id },
        OR: [
          parsed.data.name ? { name: parsed.data.name } : undefined,
          parsed.data.slug ? { slug: parsed.data.slug } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'Ya existe otra categoría con ese nombre o slug' },
        { status: 409 }
      );
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [productsCount, childrenCount] = await Promise.all([
    prisma.product.count({
      where: { OR: [{ categoryId: id }, { subCategoryId: id }] },
    }),
    prisma.category.count({ where: { parentId: id } }),
  ]);

  if (productsCount > 0) {
    return NextResponse.json(
      { error: 'No se puede borrar: tiene productos asociados' },
      { status: 409 }
    );
  }

  if (childrenCount > 0) {
    return NextResponse.json(
      { error: 'No se puede borrar: tiene subcategorías asociadas' },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
