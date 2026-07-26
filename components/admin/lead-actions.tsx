// Location: components/admin/lead-actions.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadEstado } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Único lugar de la UI donde se dispara el descuento/reposición de stock
// (PATCH /api/admin/leads/[id]) -- ver docs/analysis/PROPUESTA_MODULO_STOCK.md
// sección 4. "Confirmar" descuenta, "Rechazar" en un pendiente no toca stock,
// "Revertir" en uno ya confirmado repone lo que se había descontado.
export function LeadActions({ id, estado }: { id: string; estado: LeadEstado }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const act = async (action: 'confirm' | 'cancel') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast({
          title: 'Error',
          description: data?.error || 'No se pudo actualizar',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title:
          action === 'confirm'
            ? 'Venta confirmada: stock descontado'
            : estado === 'confirmado'
              ? 'Venta revertida: stock repuesto'
              : 'Lead rechazado',
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  if (estado === 'pendiente') {
    return (
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={() => act('confirm')} disabled={isLoading}>
          Confirmar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => act('cancel')}
          disabled={isLoading}
        >
          Rechazar
        </Button>
      </div>
    );
  }

  if (estado === 'confirmado') {
    return (
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => act('cancel')}
          disabled={isLoading}
        >
          Revertir
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <span className="text-xs text-muted-foreground">—</span>
    </div>
  );
}
