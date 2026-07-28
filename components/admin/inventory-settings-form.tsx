// File: components/admin/inventory-settings-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ConfiguracionTienda } from '@prisma/client';
import { Boxes } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

// Página propia (/admin/inventario), mismo patrón que whatsapp-settings-form
// y banner-settings-form: reenvía tal cual los campos de las otras dos
// pantallas para no pisarlos al guardar (ver PATCH /api/admin/settings).
export function InventorySettingsForm({
  initialConfig,
}: {
  initialConfig: ConfiguracionTienda | null;
}) {
  const [controlStockActivo, setControlStockActivo] = useState(
    initialConfig?.controlStockActivo || false
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleToggle = async (next: boolean) => {
    setControlStockActivo(next);
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: initialConfig?.whatsappNumber || '',
          bannerText: initialConfig?.bannerText || '',
          showBanner: initialConfig?.showBanner || false,
          controlStockActivo: next,
        }),
      });

      if (!res.ok) {
        setControlStockActivo(!next);
        toast({
          title: 'Error',
          description: 'No se pudo guardar el cambio',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: next
          ? 'Control de stock activado'
          : 'Control de stock desactivado',
      });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary-accent" />
            <CardTitle className="text-lg">Control de existencias</CardTitle>
          </div>
          <CardDescription>
            Activa esta opción para llevar stock real por producto (y por
            color, cuando aplique). Con el interruptor apagado, la tienda
            funciona exactamente igual que antes: &quot;Agotado&quot; sigue
            siendo un checkbox manual en cada producto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <p className="text-sm font-medium">Control de stock activo</p>
              <p className="text-xs text-muted-foreground">
                Habilita los campos de stock en Productos y el flujo de
                Confirmar/Rechazar en Leads.
              </p>
            </div>
            <Switch
              checked={controlStockActivo}
              onCheckedChange={handleToggle}
              loading={isSaving}
              aria-label="Control de stock activo"
            />
          </div>

          {controlStockActivo && (
            <p className="rounded-md bg-primary/5 p-3 text-xs text-muted-foreground">
              Con el módulo activo, las ventas confirmadas desde{' '}
              <strong>/admin/leads</strong> descuentan stock automáticamente.
              El descuento nunca es automático al pedir por WhatsApp -- ver el
              detalle en docs/analysis/PROPUESTA_MODULO_STOCK.md.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
