// File: instrumentation.ts
//
// Hook nativo de Next.js: corre una sola vez cuando arranca el server, antes
// de servir cualquier request -- nunca durante `next build` (evita repetir
// el bug ya conocido de lib/supabase-admin.ts, donde una validación a nivel
// de módulo rompía el build por correr en el momento equivocado). Falla
// rápido y con un mensaje claro si falta una env var realmente
// imprescindible, en vez de dejar que el primer request que la necesite
// tire un error críptico en un punto random del código.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env');
    validateEnv();
  }
}
