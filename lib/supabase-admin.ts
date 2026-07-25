// File: lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

// Cliente server-only con la Service Role Key: tiene permisos completos y
// jamás debe llegar al navegador. Se usa únicamente dentro de
// app/api/admin/upload/route.ts (protegido por middleware.ts).
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const PRODUCT_IMAGES_BUCKET = 'product-images';
