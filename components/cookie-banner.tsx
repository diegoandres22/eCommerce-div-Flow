// File: components/cookie-banner.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getStoredConsent, storeConsent } from '@/lib/consent';

// Consentimiento real, no decorativo: mientras no haya elección guardada no
// se marca nada como aceptado. "Rechazar" tiene el mismo peso visual que
// "Aceptar". Una vez elegido, no vuelve a mostrarse -- no bloquea nada.
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getStoredConsent() === null);
  }, []);

  const handleChoice = (choice: 'accepted' | 'rejected') => {
    storeConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-card px-4 py-4 shadow-lg md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          Usamos cookies esenciales para el funcionamiento de la tienda. Aún no usamos cookies de
          análisis o publicidad; si en el futuro se activan, se pedirá tu consentimiento antes de
          cargarlas.{' '}
          <Link href="/cookies" className="text-primary-accent underline hover:no-underline">
            Más información
          </Link>
        </p>
        <div className="flex flex-shrink-0 gap-3">
          <Button variant="outline" size="sm" onClick={() => handleChoice('rejected')}>
            Rechazar
          </Button>
          <Button size="sm" onClick={() => handleChoice('accepted')}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}
