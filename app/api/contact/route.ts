// File: app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validators';
import { sendContactEmail } from '@/lib/mailer';

export async function POST(req: Request) {
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
