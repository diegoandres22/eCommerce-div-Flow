// File: components/pagination.tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const hrefForPage = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(target));
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      {page <= 1 ? (
        <Button variant="outline" size="icon" disabled aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      ) : (
        <Button asChild variant="outline" size="icon">
          <Link href={hrefForPage(page - 1)} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>

      {page >= totalPages ? (
        <Button variant="outline" size="icon" disabled aria-label="Página siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button asChild variant="outline" size="icon">
          <Link href={hrefForPage(page + 1)} aria-label="Página siguiente">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
