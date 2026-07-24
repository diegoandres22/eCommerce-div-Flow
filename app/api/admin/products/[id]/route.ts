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

  const product = await prisma.product.update({
    where: { id: params.id },
    data: parsed.data,
    include: { category: { select: { id: true, name: true } } },
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
