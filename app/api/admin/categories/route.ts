// File: app/api/admin/categories/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { categorySchema } from '@/lib/validators';

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const exists = await prisma.category.findFirst({
    where: {
      OR: [{ name: parsed.data.name }, { slug: parsed.data.slug }],
    },
  });

  if (exists) {
    return NextResponse.json(
      { error: 'Ya existe una categoría con ese nombre o slug' },
      { status: 409 }
    );
  }

  // Solo un nivel de anidamiento: el padre elegido no puede ser a su vez
  // una subcategoría.
  if (parsed.data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parsed.data.parentId },
    });
    if (!parent || parent.parentId) {
      return NextResponse.json(
        { error: 'La categoría padre no es válida (no puede ser una subcategoría)' },
        { status: 400 }
      );
    }
  }

  const category = await prisma.category.create({ data: parsed.data });
  return NextResponse.json(category, { status: 201 });
}
