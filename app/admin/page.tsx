// File: app/admin/page.tsx
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartImage } from '@/components/ui/smart-image';
import { getLeadStats } from '@/server/queries/leads';
import { getTopBrokenLinks } from '@/server/queries/broken-links';
import { getTopPageVisits } from '@/server/queries/page-visits';
import { ClearBrokenLinksButton } from '@/components/admin/clear-broken-links-button';
import { formatPrice, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    productCount,
    activeProductCount,
    categoryCount,
    subCategoryCount,
    activeBannerCount,
    priceAgg,
    productsWithoutImages,
    topViewed,
    categoriesWithCounts,
    leadStats,
    topBrokenLinks,
    topPageVisits,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.category.count({ where: { parentId: { not: null } } }),
    prisma.banner.count({ where: { isActive: true } }),
    prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true },
    }),
    prisma.product.count({ where: { images: { isEmpty: true } } }),
    prisma.product.findMany({
      where: { isActive: true, views: { gt: 0 } },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, name: true, views: true, images: true },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    }),
    getLeadStats(),
    getTopBrokenLinks(5),
    getTopPageVisits(5),
  ]);

  const inactiveProductCount = productCount - activeProductCount;
  const stats = [
    { href: '/admin/products', label: 'Productos', value: productCount },
    { href: '/admin/products', label: 'Activos', value: activeProductCount },
    { href: '/admin/products', label: 'Inactivos', value: inactiveProductCount },
    { href: '/admin/categories', label: 'Categorías', value: categoryCount },
    { href: '/admin/banners', label: 'Banners activos', value: activeBannerCount },
    {
      href: '/admin/products',
      label: 'Sin imágenes',
      value: productsWithoutImages,
    },
    { href: '/admin/leads', label: 'Leads (hoy)', value: leadStats.leadsToday },
    {
      href: '/admin/leads',
      label: 'Potencial de ventas',
      value: formatPrice(leadStats.totalRevenuePotential),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(stat =>
          stat.label === 'Categorías' ? (
            // Único cuadro que muestra dos métricas: Categorías (izquierda,
            // estilo intacto) + Subcategorías (derecha, misma tipografía).
            // El resto de las cards sigue exactamente el template de abajo.
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Subcategorías</p>
                    <p className="text-3xl font-bold">{subCategoryCount}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            </Link>
          )
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rango de precios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Mínimo:{' '}
              <span className="font-semibold">
                {priceAgg._min.price != null
                  ? formatPrice(priceAgg._min.price)
                  : '—'}
              </span>
            </p>
            <p>
              Promedio:{' '}
              <span className="font-semibold">
                {priceAgg._avg.price != null
                  ? formatPrice(priceAgg._avg.price)
                  : '—'}
              </span>
            </p>
            <p>
              Máximo:{' '}
              <span className="font-semibold">
                {priceAgg._max.price != null
                  ? formatPrice(priceAgg._max.price)
                  : '—'}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Productos por categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {categoriesWithCounts.length === 0 && (
              <p className="text-muted-foreground">Sin categorías todavía.</p>
            )}
            {categoriesWithCounts.map(category => (
              <div key={category.id} className="flex items-center justify-between">
                <span className="truncate">{category.name}</span>
                <span className="font-semibold">{category._count.products}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 más vistos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {topViewed.length === 0 && (
              <p className="text-muted-foreground">
                Todavía no hay vistas registradas.
              </p>
            )}
            {topViewed.map(product => (
              <div key={product.id} className="flex items-center gap-2">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
                  {product.images[0] && (
                    <SmartImage
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="flex-1 truncate">{product.name}</span>
                <span className="font-semibold">{product.views}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Rojo = algo anda mal (404). Diferencial visual a propósito para
            que se distinga de un vistazo de la card de al lado. */}
        <Card className="border-destructive/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </span>
              <div>
                <CardTitle className="text-base">Enlaces rotos</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Páginas inexistentes (404) · 
                </p>
              </div>
            </div>
            {topBrokenLinks.length > 0 && <ClearBrokenLinksButton />}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topBrokenLinks.length === 0 && (
              <p className="text-muted-foreground">
                Sin visitas a páginas inexistentes registradas todavía.
              </p>
            )}
            {topBrokenLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs">{link.path}</p>
                  <p className="text-xs text-muted-foreground">
                    última vez: {formatDateTime(link.lastSeenAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                  {link.hits} {link.hits === 1 ? 'visita' : 'visitas'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Verde/primario = tráfico sano, para que el contraste con la card
            de enlaces rotos sea inmediato: una es el problema, la otra el KPI. */}
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </span>
            <div>
              <CardTitle className="text-base">Rutas más visitadas</CardTitle>
              <p className="text-xs text-muted-foreground">
                Navegación real y exitosa · 
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topPageVisits.length === 0 && (
              <p className="text-muted-foreground">
                Todavía no hay visitas registradas.
              </p>
            )}
            {topPageVisits.map(visit => (
              <div key={visit.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs">{visit.path}</p>
                  <p className="text-xs text-muted-foreground">
                    última vez: {formatDateTime(visit.lastSeenAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {visit.hits} {visit.hits === 1 ? 'visita' : 'visitas'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
