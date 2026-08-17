// File: app/api/admin/upload/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin, PRODUCT_IMAGES_BUCKET } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/api-auth';

// Protegido por middleware.ts (app/api/admin/*). Recibe uno o más archivos
// (FormData, campo "files"), los sube a Supabase Storage y devuelve las
// URLs públicas finales para pegarlas en el formulario de producto/banner.
//
// image-dropzone.tsx ya le muestra al admin "PNG, JPG o WEBP, hasta 5MB",
// pero eso era solo copy en el cliente -- el servidor aceptaba cualquier
// tipo/tamaño de archivo. Como esto va a un bucket PÚBLICO de Supabase
// Storage, sin este chequeo cualquiera con la sesión de admin (o una sesión
// robada) podía subir un archivo arbitrario y quedaba servido públicamente
// bajo *.supabase.co.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// 4MB (no 5MB): las funciones serverless de Vercel cortan el body de la
// request en ~4.5MB *antes* de que este código corra -- con el límite en
// 5MB, un archivo de 4.6MB pasaba la validación del cliente pero la
// plataforma lo truncaba a mitad de camino, produciendo el mismo síntoma que
// se está arreglando acá (500 sin body JSON). 4MB deja margen real.
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

// Fix real (agosto 2026): esta ruta no tenía try/catch. Cualquier excepción
// no controlada (la más común: getSupabaseAdmin() -- ver lib/supabase-admin.ts
// -- llamando a createClient() con SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
// undefined porque no están cargadas en ese entorno) se escapaba del handler
// entero. Next.js/Vercel responden esos casos con un 500 de body VACÍO (no
// JSON), y el cliente (image-dropzone.tsx#uploadFiles) hace `await
// res.json()` a ciegas -- de ahí el `SyntaxError: Unexpected end of JSON
// input` reportado, no un problema de tamaño de archivo (pasaba con
// archivos de 700KB). Con el try/catch de abajo, CUALQUIER fallo (env vars
// faltantes, bucket sin permisos, red caída) devuelve JSON válido siempre.
export async function POST(req: Request) {
  try {
    const unauthorized = await requireAdminSession();
    if (unauthorized) return unauthorized;

    // Validación temprana y explícita de las env vars -- mejor un 500 con
    // mensaje claro ("faltan las credenciales de Supabase") que dejar que
    // @supabase/supabase-js tire una excepción genérica de "supabaseUrl is
    // required" más abajo.
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            'La subida de imágenes no está configurada en este servidor: faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.',
        },
        { status: 500 }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'No se pudo leer la solicitud. Probá con archivos más chicos o de a uno.' },
        { status: 400 }
      );
    }

    const files = formData.getAll('files').filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo' },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipo de archivo no permitido: ${file.type || 'desconocido'}. Solo PNG, JPG, WEBP o GIF.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `"${file.name}" supera el máximo de 4MB.` },
          { status: 400 }
        );
      }
    }

    const urls: string[] = [];
    const supabaseAdmin = getSupabaseAdmin();

    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabaseAdmin.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: false });

      if (error) {
        // error.message de Supabase suele ser accionable tal cual
        // ("Bucket not found", "new row violates row-level security
        // policy", etc.) -- se reenvía directo en vez de genérico.
        return NextResponse.json(
          { error: `No se pudo subir "${file.name}": ${error.message}` },
          { status: 502 }
        );
      }

      const { data } = supabaseAdmin.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(path);

      urls.push(data.publicUrl);
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    // Red de seguridad final: cualquier excepción no prevista (incluida la
    // de createClient() si las env vars están vacías pero definidas, DNS
    // caído, etc.) cae acá en vez de tumbar la respuesta sin body.
    console.error('[api/admin/upload] Error no controlado:', error);
    return NextResponse.json(
      {
        error: 'Error interno al procesar la imagen.',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
