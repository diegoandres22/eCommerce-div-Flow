// File: app/api/admin/upload/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin, PRODUCT_IMAGES_BUCKET } from '@/lib/supabase-admin';

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
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const formData = await req.formData();
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
        { error: `"${file.name}" supera el máximo de 5MB.` },
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(path);

    urls.push(data.publicUrl);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
