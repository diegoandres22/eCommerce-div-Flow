// File: components/pwa-register.tsx
'use client';

import { useEffect } from 'react';

// Registra el service worker sin bloquear el render ni requerir dependencias.
export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}
