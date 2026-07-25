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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
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

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 lg:px-6">
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

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
