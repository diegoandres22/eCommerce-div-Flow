// File: lib/mailer.ts
import nodemailer from 'nodemailer';
import { STORE_CONFIG } from '@/lib/store-config';
import { formatPrice } from '@/lib/utils';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function sendContactEmail(data: ContactEmailData) {
  const to = process.env.CONTACT_EMAIL_TO || 'diego.a.v3005@gmail.com';

  await getTransporter().sendMail({
    from: `"Asesoría <div>Flow" <${process.env.SMTP_USER}>`,
    to,
    replyTo: data.email,
    subject: `Nueva solicitud de asesoría de ${data.name}`,
    text: [
      `Nombre: ${data.name}`,
      `Email: ${data.email}`,
      `Teléfono: ${data.phone || '—'}`,
      '',
      'Mensaje:',
      data.message,
    ].join('\n'),
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="margin-bottom: 8px;">Nueva solicitud de asesoría</h2>
        <p><strong>Nombre:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Teléfono:</strong> ${data.phone || '—'}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="white-space: pre-wrap;">${data.message}</p>
      </div>
    `,
  });
}

interface NewLeadEmailItem {
  name: string;
  colorName?: string;
  talla?: string;
  price: number;
  quantity: number;
}

interface NewLeadEmailData {
  items: NewLeadEmailItem[];
  totalAmount: number;
}

// Se dispara desde app/api/leads/route.ts justo después de guardar el lead
// (best-effort: si el correo falla, el lead ya quedó guardado y visible en
// /admin/leads igual -- ver el try/catch en el caller). Cierra el loop de
// "cliente pidió por WhatsApp" -> el admin se entera sin tener que revisar
// el dashboard manualmente.
export async function sendNewLeadEmail(data: NewLeadEmailData) {
  const to = process.env.CONTACT_EMAIL_TO || 'diego.a.v3005@gmail.com';
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/leads`;

  const itemLine = (item: NewLeadEmailItem) => {
    const details = [item.colorName, item.talla].filter(Boolean);
    const suffix = details.length > 0 ? ` (${details.join(', ')})` : '';
    return `${item.name}${suffix} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`;
  };

  await getTransporter().sendMail({
    from: `"${STORE_CONFIG.nombre}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Nuevo pedido por WhatsApp - ${formatPrice(data.totalAmount)}`,
    text: [
      'Llegó una nueva intención de compra:',
      '',
      ...data.items.map(item => `- ${itemLine(item)}`),
      '',
      `Total: ${formatPrice(data.totalAmount)}`,
      '',
      `Confirmá o rechazá desde el panel: ${adminUrl}`,
    ].join('\n'),
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="margin-bottom: 8px;">Nuevo pedido por WhatsApp</h2>
        <ul style="padding-left: 18px; margin: 0 0 12px;">
          ${data.items.map(item => `<li>${itemLine(item)}</li>`).join('')}
        </ul>
        <p><strong>Total: ${formatPrice(data.totalAmount)}</strong></p>
        <p><a href="${adminUrl}" style="color: #2563eb;">Ver y confirmar en el panel de administración</a></p>
      </div>
    `,
  });
}
