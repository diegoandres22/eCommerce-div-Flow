// File: app/api/admin/upload/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin, PRODUCT_IMAGES_BUCKET } from '@/lib/supabase-admin';

// Protegido por middleware.ts (app/api/admin/*). Recibe uno o más archivos
// (FormData, campo "files"), los sube a Supabase Storage y devuelve las
// URLs públicas finales para pegarlas en el formulario de producto/banner.
export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll('files').filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json(
      { error: 'No se recibió ningún archivo' },
      { status: 400 }
    );
  }

  const urls: string[] = [];

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
