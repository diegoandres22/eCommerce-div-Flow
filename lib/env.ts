// File: lib/env.ts
//
// Validación de variables de entorno al arrancar el server (ver
// instrumentation.ts) -- deliberadamente NO a nivel de módulo/import, porque
// correr esto en cada import rompería `next build` igual que el bug ya
// resuelto en lib/supabase-admin.ts (Next.js importa cada API route para
// "Collecting page data" durante el build, con env vars que todavía pueden
// no estar cargadas en ese momento puntual).
//
// Dos niveles: REQUIRED corta el arranque -- sin esto la app no puede
// funcionar en absoluto (sin DB no hay nada que servir, sin estas variables
// de Auth.js nadie entra al admin). RECOMMENDED solo avisa por consola --
// ya degradan de forma controlada en su propio punto de uso
// (getSupabaseAdmin() explica el error recién al subir una imagen,
// sendContactEmail ya es best-effort con try/catch) y no tiene sentido
// tumbar todo el sitio porque falte, por ejemplo, el SMTP de un cliente que
// todavía no lo configuró.
const REQUIRED_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'ALLOWED_ADMIN_EMAILS',
] as const;

const RECOMMENDED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'CONTACT_EMAIL_TO',
  'NEXT_PUBLIC_APP_URL',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
        'La app no puede arrancar sin esto -- revisá tu .env (o las env vars del hosting) contra .env.example.'
    );
  }

  const missingRecommended = RECOMMENDED_VARS.filter(key => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn(
      `[env] Faltan variables recomendadas: ${missingRecommended.join(', ')}. ` +
        'El sitio arranca igual, pero las funciones que dependen de ellas (subida de imágenes, correo de contacto) van a fallar hasta que se completen.'
    );
  }
}
