// File: components/admin/image-dropzone.tsx
'use client';

import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud, Loader2, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmartImage } from '@/components/ui/smart-image';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_MB = 5;

interface ImageDropzoneProps {
  images: string[];
  onChange: (urls: string[]) => void;
  // false = una sola imagen (banner); true = varias (producto).
  multiple?: boolean;
}

// Carga de imágenes 100% basada en archivos: arrastrar/soltar o clic para
// elegir desde el dispositivo. Sube directo a Supabase Storage vía el mismo
// endpoint que ya usaba ImageUploadButton (/api/admin/upload) y muestra la
// previsualización final con acciones rápidas (copiar enlace / quitar). El
// usuario nunca ve ni pega una URL a mano.
export function ImageDropzone({
  images,
  onChange,
  multiple = true,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const oversized = list.find(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversized) {
      toast({
        title: 'Archivo demasiado grande',
        description: `"${oversized.name}" supera el límite de ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    list.forEach(file => formData.append('files', file));

    setUploading(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error al subir',
          description: data.error || 'Intenta de nuevo',
          variant: 'destructive',
        });
        return;
      }

      onChange(multiple ? [...images, ...data.urls] : [data.urls[0]]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  const removeImage = (url: string) => onChange(images.filter(i => i !== url));

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 1500);
    } catch {
      toast({ title: 'No se pudo copiar el enlace', variant: 'destructive' });
    }
  };

  // En modo single (banner) ya con imagen, se oculta el dropzone: para
  // reemplazarla primero hay que quitar la actual con el botón X.
  const showDropzone = multiple || images.length === 0;

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map(url => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <SmartImage src={url} alt="Imagen subida" fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => copyLink(url)}
                  aria-label="Copiar enlace"
                >
                  {copiedUrl === url ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => removeImage(url)}
                  aria-label="Quitar imagen"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDropzone && (
        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-input hover:bg-accent/50'
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {uploading ? 'Subiendo...' : 'Arrastra una imagen o haz clic para elegirla'}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG o WEBP, hasta {MAX_FILE_SIZE_MB}MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={e => e.target.files && uploadFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}
