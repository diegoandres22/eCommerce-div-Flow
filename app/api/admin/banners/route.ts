// File: app/api/admin/banners/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { bannerSchema } from '@/lib/validators';
import { requireAdminSession } from '@/lib/api-auth';

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const banners = await prisma.banner.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(banners);
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

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
