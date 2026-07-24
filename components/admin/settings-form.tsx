// File: components/admin/settings-form.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ConfiguracionTienda } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export function SettingsForm({
  initialConfig,
}: {
  initialConfig: ConfiguracionTienda | null;
}) {
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialConfig?.whatsappNumber || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: whatsappNumber.replace(/\D/g, ''),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error',
          description:
            data.error?.fieldErrors?.whatsappNumber?.join(', ') ||
            data.error ||
            'No se pudo guardar',
          variant: 'destructive',
        });
        return;
      }

      setWhatsappNumber(data.whatsappNumber);
      toast({ title: 'Configuración guardada' });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4 rounded-md border p-4">
      <div>
        <Label htmlFor="whatsappNumber">Número de WhatsApp</Label>
        <Input
          id="whatsappNumber"
          value={whatsappNumber}
          onChange={e => setWhatsappNumber(e.target.value)}
          placeholder="521234567890"
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Formato internacional, solo dígitos: código de país + número, sin
          &quot;+&quot; ni espacios (ej: 521234567890).
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        Guardar
      </Button>
    </form>
  );
}
