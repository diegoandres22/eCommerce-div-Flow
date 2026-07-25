// File: components/admin/clear-broken-links-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function ClearBrokenLinksButton() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleClear = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/broken-links', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Historial de enlaces rotos vaciado' });
      router.refresh();
    } catch {
      toast({
        title: 'No se pudo vaciar el historial',
        description: 'Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
          <Trash2 className="h-3.5 w-3.5" />
          Vaciar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Vaciar el historial de enlaces rotos?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borran todos los registros acumulados hasta ahora. A partir de
            la próxima visita a una página inexistente, el conteo arranca de
            nuevo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear} disabled={isDeleting}>
            {isDeleting ? 'Vaciando...' : 'Vaciar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
