// File: app/api/admin/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { categorySchema } from '@/lib/validators';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const parsed = categorySchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.slug || parsed.data.name) {
    const duplicate = await prisma.category.findFirst({
      where: {
        NOT: { id: params.id },
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
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const productsCount = await prisma.product.count({
    where: { categoryId: params.id },
  });

  if (productsCount > 0) {
    return NextResponse.json(
      { error: 'No se puede borrar: tiene productos asociados' },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
