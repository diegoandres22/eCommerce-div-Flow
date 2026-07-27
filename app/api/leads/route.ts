// File: app/api/leads/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { leadSchema } from '@/lib/validators';
import { sendNewLeadEmail } from '@/lib/mailer';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Público (sin auth): se llama desde cart-checkout.tsx justo antes de abrir
// el enlace de WhatsApp, fire-and-forget. No bloquea ni reemplaza ese flujo
// -- solo deja un registro de la intención de compra para el admin.
export async function POST(req: Request) {
  // 20 leads / 5 min por IP: generoso para un comprador real (incluso
  // reintentando), suficiente para frenar un script de spam.
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(`leads:${ip}`, 20, 5 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos, esperá un momento.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

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

  // Best-effort: el lead ya quedó guardado y visible en /admin/leads pase lo
  // que pase acá -- si el SMTP falla o no está configurado, no se rompe la
  // respuesta ni el flujo de WhatsApp del cliente.
  try {
    await sendNewLeadEmail({
      items: parsed.data.items,
      totalAmount: parsed.data.totalAmount,
    });
  } catch (error) {
    console.error('No se pudo enviar la notificación de nuevo lead:', error);
  }

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
