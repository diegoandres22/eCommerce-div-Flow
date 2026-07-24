// File: components/header.tsx
import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getTopLevelCategories } from '@/server/queries/categories';
import { ThemeToggle } from '@/components/theme-toggle';
import { CartDrawer } from '@/components/cart-drawer';
import { CategoriesMenu } from '@/components/categories-menu';
import { LogoutButton } from '@/components/logout-button';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export async function Header() {
  const [session, categories] = await Promise.all([
    auth(),
    getTopLevelCategories(),
  ]);

  return (
    <header className="border-b">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 sm:grid sm:grid-cols-3 sm:items-center sm:gap-4">
        <Link href="/" className="text-xl font-bold sm:text-2xl">
          E-commerce Store
        </Link>

        <form
          action="/search"
          method="get"
          className="w-full sm:mx-auto sm:max-w-md sm:justify-self-center"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar productos..."
              className="pl-9"
            />
          </div>
        </form>

        <nav className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium sm:justify-self-end">
          <div className="flex items-center gap-3">
            <CategoriesMenu categories={categories} />
          </div>
          <div className="flex items-center gap-2">
            {session?.user && (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden gap-1 sm:inline-flex"
                >
                  <Link href="/admin">
                    <ShieldCheck className="h-4 w-4" />
                    Panel admin
                  </Link>
                </Button>
                <LogoutButton iconOnly className="hidden sm:inline-flex" />
              </>
            )}
            <CartDrawer />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
