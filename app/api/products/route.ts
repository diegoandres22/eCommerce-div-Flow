// File: app/api/products/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Índice liviano y público para el buscador predictivo del navbar
// (components/predictive-search.tsx): se pide una sola vez y se filtra en
// el cliente con Array.filter(), sin golpear la base de datos por tecla.
export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      category: { select: { slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(products);
}
