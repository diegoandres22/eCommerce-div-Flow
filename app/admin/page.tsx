// File: app/admin/page.tsx
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartImage } from '@/components/ui/smart-image';
import { getLeadStats } from '@/server/queries/leads';
import { getTopBrokenLinks } from '@/server/queries/broken-links';
import { formatPrice, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    productCount,
    activeProductCount,
    categoryCount,
    activeBannerCount,
    priceAgg,
    productsWithoutImages,
    topViewed,
    categoriesWithCounts,
    leadStats,
    topBrokenLinks,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
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
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enlaces rotos más visitados</CardTitle>
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
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                {link.hits} {link.hits === 1 ? 'visita' : 'visitas'}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
