// File: lib/mailer.ts
import nodemailer from 'nodemailer';

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
