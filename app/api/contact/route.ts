// File: app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validators';
import { sendContactEmail } from '@/lib/mailer';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  // 5 mensajes / 10 min por IP: un formulario de contacto real no se envía
  // seguido, esto solo frena spam automatizado.
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos, esperá un momento.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await sendContactEmail(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error enviando email de contacto:', error);
    return NextResponse.json(
      { error: 'No se pudo enviar el mensaje. Intenta de nuevo más tarde.' },
      { status: 500 }
    );
  }
}
