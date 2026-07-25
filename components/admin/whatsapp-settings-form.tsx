// File: components/admin/whatsapp-settings-form.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ConfiguracionTienda } from '@prisma/client';
import { MessageCircle, Mail, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PhoneNumberInput } from '@/components/admin/phone-number-input';

// Solo administra whatsappNumber. El banner de anuncios vive en su propia
// página (/admin/announcement-bar) -- ver banner-settings-form.tsx -- para
// que esta sección tenga espacio propio y quede lista para sumar más
// verificaciones/integraciones (correo, WhatsApp Business API, etc.) sin
// amontonarse con contenido que no tiene relación con contacto/canales.
export function WhatsappSettingsForm({
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
          // Se reenvían tal cual estaban: esta página no debe pisar el
          // banner de anuncios, que ahora se guarda desde otra pantalla.
          bannerText: initialConfig?.bannerText || '',
          showBanner: initialConfig?.showBanner || false,
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
      toast({ title: 'Número de WhatsApp guardado' });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Número de WhatsApp</CardTitle>
          </div>
          <CardDescription>
            Este número se usará para recibir los pedidos directamente en tu
            chat y para el botón de soporte flotante de la tienda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Elige tu país e ingresa tu número local</Label>
          <PhoneNumberInput
            value={whatsappNumber}
            onChange={setWhatsappNumber}
          />
          <p className="text-xs text-muted-foreground">
            No hace falta escribir el &quot;+&quot; ni el código de país: se
            arma automáticamente según el país que elijas, así el enlace de
            WhatsApp nunca se rompe por un formato incorrecto.
          </p>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </CardContent>
      </Card>

      {/* Reservado para lo que sigue en esta sección: verificación de correo,
          verificación del número de WhatsApp y futuras integraciones. Se
          deja visible como card deshabilitado para que la sección crezca
          con coherencia en vez de mezclarse con canales ya configurados. */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg text-muted-foreground">
              Próximamente
            </CardTitle>
          </div>
          <CardDescription>
            Verificación de correo, verificación del número de WhatsApp e
            integraciones adicionales se agregarán en esta misma sección.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            Sin novedades todavía — vuelve a revisar más adelante.
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
