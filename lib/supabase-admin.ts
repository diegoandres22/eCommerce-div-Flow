// File: lib/supabase-admin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cliente server-only con la Service Role Key: tiene permisos completos y
// jamás debe llegar al navegador. Se usa únicamente dentro de
// app/api/admin/upload/route.ts (protegido por middleware.ts).
//
// Inicialización perezosa (no al importar el módulo): `next build` analiza
// cada ruta de API para "Collecting page data", lo cual importa este archivo
// aunque el endpoint no se llame. Si SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
// no están disponibles en ESE momento (ej. `.env.production` con
// placeholders vacíos pisando a `.env` durante un build local), un cliente
// creado a nivel de módulo rompe el build entero. Creándolo recién en el
// primer uso real, el build nunca depende de tener esas variables cargadas.
let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return cachedClient;
}

export const PRODUCT_IMAGES_BUCKET = 'product-images';
