// File: components/categories-menu.tsx
'use client';

import Link from 'next/link';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CategoriesMenuProps {
  categories: { id: string; name: string; slug: string }[];
}

const MAX_VISIBLE = 10;

export function CategoriesMenu({ categories }: CategoriesMenuProps) {
  const visible = categories.slice(0, MAX_VISIBLE);
  const hasMore = categories.length > MAX_VISIBLE;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <LayoutGrid className="h-4 w-4" />
          Categorías
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {visible.length === 0 && (
          <DropdownMenuItem disabled>Sin categorías todavía</DropdownMenuItem>
        )}
        {visible.map(category => (
          <DropdownMenuItem key={category.id} asChild>
            <Link href={`/category/${category.slug}`}>{category.name}</Link>
          </DropdownMenuItem>
        ))}
        {(hasMore || visible.length > 0) && <DropdownMenuSeparator />}
        <DropdownMenuItem asChild>
          <Link href="/categories" className="font-medium text-primary-accent">
            Ver más
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
