// File: components/admin/banner-settings-form.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ConfiguracionTienda } from '@prisma/client';
import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

// Página propia (/admin/announcement-bar), separada de la de WhatsApp, para
// que este espacio pueda crecer más adelante con más texto dinámico
// (segundo anuncio, anuncios programados, etc.) sin volver a mezclarse con
// la configuración de canales de contacto.
export function BannerSettingsForm({
  initialConfig,
}: {
  initialConfig: ConfiguracionTienda | null;
}) {
  const [bannerText, setBannerText] = useState(
    initialConfig?.bannerText || ''
  );
  const [showBanner, setShowBanner] = useState(
    initialConfig?.showBanner || false
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
          // Se reenvía tal cual estaba: esta página no debe pisar el
          // número de WhatsApp ni el switch de stock, que se guardan desde
          // otras pantallas.
          whatsappNumber: initialConfig?.whatsappNumber || '',
          controlStockActivo: initialConfig?.controlStockActivo || false,
          bannerText,
          showBanner,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo guardar',
          variant: 'destructive',
        });
        return;
      }

      setBannerText(data.bannerText || '');
      setShowBanner(data.showBanner);
      toast({ title: 'Banner guardado' });
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
            <Megaphone className="h-5 w-5 text-primary-accent" />
            <CardTitle className="text-lg">
              Banner de la tienda / Anuncios destacados
            </CardTitle>
          </div>
          <CardDescription>
            Este texto aparecerá en la barra superior de tu tienda para
            anunciar promociones, envíos gratis o avisos importantes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bannerText">Texto del anuncio</Label>
            <Input
              id="bannerText"
              value={bannerText}
              onChange={e => setBannerText(e.target.value)}
              placeholder="Ej: ¡Envíos gratis esta semana!"
              maxLength={200}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showBanner}
              onChange={e => setShowBanner(e.target.checked)}
            />
            Mostrar banner en la tienda
          </label>

          {/* Vista previa a todo el ancho: bandeja idéntica a la que ve el
              cliente en components/announcement-bar.tsx, "sangrada" para
              simular el ancho completo de la página dentro de la card. */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Vista previa
            </p>
            <div className="-mx-6 overflow-hidden border-y bg-muted/30">
              <div className="bg-primary py-2 text-center text-sm font-medium text-primary-foreground">
                {bannerText || 'Así se verá tu anuncio en la tienda'}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
