// File: components/ui/submit-button.tsx
'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Botón de submit para <form action={serverAction}>: useFormStatus detecta
// el estado "pending" del <form> padre automáticamente (sin estado local ni
// JS extra en el Server Component que lo envuelve). Mientras el back
// procesa, se deshabilita y muestra un spinner minimalista + texto de carga.
export function SubmitButton({
  children,
  loadingText = 'Cargando...',
  className,
  ...props
}: ButtonProps & { loadingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn('gap-2', className)}
      {...props}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? loadingText : children}
    </Button>
  );
}
