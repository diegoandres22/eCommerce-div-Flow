// File: components/header.tsx
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getTopLevelCategories } from '@/server/queries/categories';
import { ThemeToggle } from '@/components/theme-toggle';
import { CartDrawer } from '@/components/cart-drawer';
import { WishlistDrawer } from '@/components/wishlist-drawer';
import { CategoriesMenu } from '@/components/categories-menu';
import { LogoutButton } from '@/components/logout-button';
import { Logo } from '@/components/logo';
import { PredictiveSearch } from '@/components/predictive-search';
import { STORE_NAME } from '@/lib/store-config';
import { Button } from '@/components/ui/button';

export async function Header() {
  const [session, categories] = await Promise.all([
    auth(),
    getTopLevelCategories(),
  ]);

  return (
    <header className="border-b">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-xl font-bold sm:text-2xl"
        >
          <Logo />
          {STORE_NAME}
        </Link>

        <div className="w-full sm:max-w-md sm:flex-1">
          <PredictiveSearch />
        </div>

        <nav className="relative z-10 flex flex-row flex-nowrap items-center justify-between gap-x-3 text-sm font-medium sm:shrink-0 sm:justify-end sm:gap-x-4">
          <CategoriesMenu categories={categories} />
          {session?.user && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden shrink-0 gap-1 sm:inline-flex"
            >
              <Link href="/admin">
                <ShieldCheck className="h-4 w-4" />
                Panel admin
              </Link>
            </Button>
          )}
          <WishlistDrawer />
          <CartDrawer />
          <ThemeToggle />
          {session?.user && (
            <LogoutButton
              iconOnly
              variant="ghost"
              className="hidden shrink-0 sm:inline-flex"
            />
          )}
        </nav>
      </div>
    </header>
  );
}
