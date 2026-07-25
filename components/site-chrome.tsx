// File: components/site-chrome.tsx
'use client';

import { usePathname } from 'next/navigation';

// Rutas que no deben mostrar el Header/Footer públicos: el panel de admin
// tiene su propia navegación (app/admin/layout.tsx), y la pantalla de login
// debe verse limpia, sin el navbar de la tienda encima.
const HIDDEN_CHROME_PREFIXES = ['/admin', '/auth/signin'];

interface SiteChromeProps {
  announcementBar: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  whatsappButton: React.ReactNode;
  children: React.ReactNode;
}

// Todos llegan ya renderizados desde app/layout.tsx (Server Component): así
// pueden seguir usando auth()/Prisma sin que este wrapper cliente los
// importe directamente.
export function SiteChrome({
  announcementBar,
  header,
  footer,
  whatsappButton,
  children,
}: SiteChromeProps) {
  const pathname = usePathname();
  const hideChrome = HIDDEN_CHROME_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      {announcementBar}
      {header}
      <main className="flex-1">{children}</main>
      {footer}
      {whatsappButton}
    </>
  );
}
