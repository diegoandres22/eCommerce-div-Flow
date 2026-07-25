// File: app/not-found.tsx
import Link from 'next/link';
import { headers } from 'next/headers';
import { Compass, Home, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PredictiveSearch } from '@/components/predictive-search';
import { ProductCarousel } from '@/components/product-carousel';
import { getTopViewedProducts } from '@/server/queries/products';
import { getTopLevelCategories } from '@/server/queries/categories';
import { logBrokenLink } from '@/server/queries/broken-links';

export const dynamic = 'force-dynamic';

// Frases con algo de personalidad en vez del típico "página no encontrada"
// -- rota en cada visita solo para que no sea siempre la misma línea.
const MENSAJES = [
  'Este enlace tomó un camino distinto al tuyo.',
  'Buscamos por todo el catálogo y no encontramos esta página.',
  'Parece que este producto o página ya no está por acá.',
  'Ups, esta ruta se perdió en el camino.',
];

export default async function NotFound() {
  // Next.js 15: headers() es async.
  const headersList = await headers();
  const brokenPath = headersList.get('x-pathname') || '';
  const mensaje = MENSAJES[Math.floor(Math.random() * MENSAJES.length)];

  // Fire-and-forget: registrar el 404 nunca debe retrasar ni romper el
  // render de esta página. Si la base de datos falla, se ignora.
  if (brokenPath) {
    void logBrokenLink(brokenPath).catch(() => {});
  }

  const [topViewed, categories] = await Promise.all([
    getTopViewedProducts(8),
    getTopLevelCategories(6),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <span
            className="select-none text-[7rem] font-extrabold leading-none tracking-tight text-primary/10 sm:text-[10rem]"
            aria-hidden
          >
            404
          </span>
          <Compass
            className="animate-float absolute inset-0 m-auto h-16 w-16 text-primary sm:h-20 sm:w-20"
            strokeWidth={1.5}
          />
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {mensaje}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Puede que la URL tenga un error de tipeo, o que el producto ya no
          esté disponible. Volvamos a encaminarte.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/products">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Ver todo el catálogo
            </Link>
          </Button>
        </div>

        <div className="mt-10 w-full max-w-md">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            ¿Buscabas algo en particular?
          </p>
          <PredictiveSearch />
        </div>

        {categories.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map(category => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded-full border bg-background px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {topViewed.length > 0 && (
        <div className="mt-16">
          <ProductCarousel title="Quizás te interese esto" products={topViewed} />
        </div>
      )}
    </div>
  );
}
