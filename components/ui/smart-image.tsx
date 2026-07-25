// File: components/ui/smart-image.tsx
'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Envuelve next/image con estados nativos de carga: mientras descarga
// (isLoading) muestra un skeleton con shimmer del mismo tamaño que el
// contenedor; al terminar con éxito (isLoaded) hace fade-in suave; si falla
// (hasError: bucket sin permisos, objeto borrado, URL inválida) muestra un
// fallback en vez de un ícono roto del navegador. Pensado para usarse con
// `fill` dentro de un contenedor `relative` ya dimensionado — el patrón que
// ya usa todo el sitio — así que no requiere librerías nuevas.
export function SmartImage({ className, alt, ...props }: ImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    'loading'
  );

  if (status === 'error') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
        <ImageOff className="h-5 w-5" />
        <span className="text-[10px]">Sin imagen</span>
      </div>
    );
  }

  return (
    <>
      {status === 'loading' && (
        <div className="absolute inset-0 animate-shimmer bg-muted bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] bg-[length:200%_100%]" />
      )}
      <Image
        {...props}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          status === 'loaded' ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </>
  );
}
