// File: app/api/admin/settings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { configuracionTiendaSchema } from '@/lib/validators';
import { requireAdminSession } from '@/lib/api-auth';

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const config = await prisma.configuracionTienda.findFirst();
  return NextResponse.json(config);
}

export async function PATCH(req: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const parsed = configuracionTiendaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.configuracionTienda.findFirst();

  const config = existing
    ? await prisma.configuracionTienda.update({
        where: { id: existing.id },
        data: parsed.data,
      })
    : await prisma.configuracionTienda.create({ data: parsed.data });

  return NextResponse.json(config);
}
