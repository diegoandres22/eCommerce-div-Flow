// File: app/admin/layout.tsx
import Link from 'next/link';
import { requireAdmin } from '@/lib/roles';
import { AdminSidebarNav } from '@/components/admin/admin-sidebar-nav';
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoutButton } from '@/components/logout-button';
import { PredictiveSearch } from '@/components/predictive-search';
import { Logo } from '@/components/logo';
import { STORE_CONFIG } from '@/lib/store-config';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    // h-dvh (no min-h-screen) + overflow-hidden: el contenedor raíz queda
    // fijado exactamente al alto del viewport, así el <main> de abajo es el
    // único que puede crecer más que su caja y generar scroll propio. Con
    // min-h-screen el contenedor podía crecer más alto que la pantalla y
    // terminaba scrolleando la página entera (sidebar y header incluidos)
    // en vez de solo el contenido. Layout fijo: cualquier página nueva de
    // /admin/* hereda este comportamiento sin hacer nada extra, siempre que
    // no agregue su propio contenedor con scroll.
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar (desktop): fijo, con scroll propio solo si el nav creciera más que la pantalla. */}
      <aside className="hidden w-64 flex-col overflow-y-auto border-r bg-card lg:flex">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2 text-xl font-bold">
            <Logo />
            {STORE_CONFIG.nombre}
          </Link>
        </div>

        <div className="flex-1">
          <AdminSidebarNav />
        </div>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user.name || 'Admin'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <LogoutButton iconOnly />
          </div>
        </div>
      </aside>

      {/* Columna derecha: header fijo (shrink-0) + main con el único scroll vertical del panel. */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b bg-card px-4 py-3 lg:px-6">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <AdminMobileNav />
              <span className="flex items-center gap-2 font-semibold lg:hidden">
                <Logo />
                {STORE_CONFIG.nombre}
              </span>
            </div>

            {/* Misma barra predictiva del ecommerce: al elegir un resultado
                o buscar, te lleva al sitio público. */}
            <div className="hidden w-full max-w-md sm:block">
              <PredictiveSearch />
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
