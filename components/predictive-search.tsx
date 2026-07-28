// File: components/predictive-search.tsx
'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SmartImage } from '@/components/ui/smart-image';
import { formatPrice } from '@/lib/utils';

interface IndexProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
}

export function PredictiveSearch() {
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState<IndexProduct[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Se pide el índice de productos UNA sola vez (al primer foco), luego
  // todo el filtrado por tecla es puro Array.filter() en memoria.
  const loadIndexIfNeeded = async () => {
    if (allProducts !== null) return;
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      setAllProducts(res.ok ? await res.json() : []);
    } finally {
      setLoading(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const results =
    normalizedQuery && allProducts
      ? allProducts
          .filter(p => p.name.toLowerCase().includes(normalizedQuery))
          .slice(0, 6)
      : [];

  const goToSearchPage = () => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    goToSearchPage();
  };

  return (
    <div ref={containerRef} className="relative w-full sm:mx-auto sm:max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => {
              setOpen(true);
              loadIndexIfNeeded();
            }}
            placeholder="Buscar productos..."
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </form>

      {open && normalizedQuery && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          {loading && (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}

          {!loading && results.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              Sin resultados para &quot;{query}&quot;.
            </p>
          )}

          {!loading &&
            results.map(product => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-2 hover:bg-accent"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                  <SmartImage
                    src={product.images[0] || '/images/placeholder.svg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}

          {!loading && results.length > 0 && (
            <button
              type="button"
              onClick={goToSearchPage}
              className="block w-full border-t p-2 text-center text-sm font-medium text-primary-accent hover:bg-accent"
            >
              Ver todos los resultados
            </button>
          )}
        </div>
      )}
    </div>
  );
}
