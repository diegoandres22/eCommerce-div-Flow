// File: app/api/admin/banners/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { bannerSchema } from '@/lib/validators';

export async function GET() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(banners);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = bannerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const banner = await prisma.banner.create({ data: parsed.data });
  return NextResponse.json(banner, { status: 201 });
}
