// File: app/api/admin/banners/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { bannerSchema } from '@/lib/validators';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = bannerSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const banner = await prisma.banner.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(banner);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
