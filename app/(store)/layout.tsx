// File: app/(store)/layout.tsx
import { headers } from 'next/headers';
import { logPageVisit } from '@/server/queries/page-visits';
import { isPrefetchRequest, isTrackablePath } from '@/lib/route-tracking';

// Envuelve únicamente las páginas públicas de la tienda (route group
// (store)) -- no admin, no not-found.tsx (que vive en app/not-found.tsx, un
// nivel arriba de este grupo, así que un 404 nunca pasa por acá y nunca
// termina contado como visita exitosa). Es un simple passthrough con un
// efecto de lado fire-and-forget: registra la ruta en PageVisit para el
// panel de "Rutas más visitadas", descartando prefetches silenciosos igual
// que el resto del sistema de tracking (ver lib/route-tracking.ts).
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const path = headersList.get('x-pathname') || '';

  if (isTrackablePath(path) && !isPrefetchRequest(headersList)) {
    void logPageVisit(path).catch(() => {});
  }

  return <>{children}</>;
}
