// File: app/api/leads/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { leadSchema } from '@/lib/validators';

// Público (sin auth): se llama desde cart-checkout.tsx justo antes de abrir
// el enlace de WhatsApp, fire-and-forget. No bloquea ni reemplaza ese flujo
// -- solo deja un registro de la intención de compra para el admin.
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.create({
    data: {
      items: parsed.data.items,
      totalAmount: parsed.data.totalAmount,
    },
  });

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
