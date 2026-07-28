// File: app/admin/page.tsx
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Wallet,
  ShoppingCart,
  MessageSquare,
  Flame,
  Package,
  Image as ImageIcon,
  Activity,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SmartImage } from '@/components/ui/smart-image';
import { getLeadStats } from '@/server/queries/leads';
import { getActiveCatalogValue, getLowStockProducts } from '@/server/queries/products';
import { getTopBrokenLinks } from '@/server/queries/broken-links';
import { getTopPageVisits } from '@/server/queries/page-visits';
import { getStockConfig } from '@/server/queries/settings';
import { ClearBrokenLinksButton } from '@/components/admin/clear-broken-links-button';
import { formatPrice, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Bloques visuales reutilizables del dashboard. Dos variantes a propósito:
// KpiCard (texto grande, ícono) para la sección de mayor prioridad, y
// MiniStat (texto chico, sin ícono) para datos operativos secundarios -- la
// diferencia de peso visual ES la jerarquía, no solo el orden en la página.
// ---------------------------------------------------------------------------

function SectionHeading({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  href,
  label,
  value,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex items-start justify-between gap-3 p-6">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-3xl font-bold">{value}</p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-accent/10">
            <Icon className="h-4 w-4 text-primary-accent" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function MiniStat({
  href,
  label,
  value,
  secondary,
  alert,
}: {
  href: string;
  label: string;
  value: string | number;
  secondary?: { label: string; value: string | number };
  // Variante ámbar para datos operativos que sí requieren acción (ej. stock
  // bajo) -- mismo lenguaje visual que la card grande de leads pendientes,
  // pero al tamaño de un MiniStat porque acá no bloquea nada, solo avisa.
  alert?: boolean;
}) {
  return (
    <Link href={href}>
      <Card
        className={
          alert
            ? 'h-full border-amber-500/60 bg-amber-500/10 transition-shadow hover:shadow-md'
            : 'h-full transition-shadow hover:shadow-md'
        }
      >
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p
              className={
                alert
                  ? 'text-xs text-amber-600/90 dark:text-amber-500/80'
                  : 'text-xs text-muted-foreground'
              }
            >
              {label}
            </p>
            <p
              className={
                alert
                  ? 'text-xl font-semibold text-amber-700 dark:text-amber-400'
                  : 'text-xl font-semibold'
              }
            >
              {value}
            </p>
          </div>
          {secondary && (
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">{secondary.label}</p>
              <p className="text-xl font-semibold">{secondary.value}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const [
    productCount,
    activeProductCount,
    categoryCount,
    subCategoryCount,
    activeBannerCount,
    bannerCount,
    priceAgg,
    productsWithoutImages,
    topViewed,
    categoriesWithCounts,
    leadStats,
    catalogValue,
    topBrokenLinks,
    topPageVisits,
    stockConfig,
    lowStockProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.category.count({ where: { parentId: { not: null } } }),
    prisma.banner.count({ where: { isActive: true } }),
    prisma.banner.count(),
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
        parentId: true,
        // `products`: productos con esta categoría como categoryId. Como
        // categoryId es SIEMPRE la principal (tenga el producto
        // subcategoría o no), esto ya es el total real de una categoría
        // principal -- no hace falta sumarle nada de sus subcategorías.
        _count: { select: { products: true } },
      },
    }),
    getLeadStats(),
    getActiveCatalogValue(),
    getTopBrokenLinks(5),
    getTopPageVisits(5),
    getStockConfig(),
    getLowStockProducts(),
  ]);

  // `Product.categoryId` es SIEMPRE la categoría principal (obligatoria),
  // tenga o no subcategoría además -- por eso `_count.products` de una
  // categoría principal ya es el total real (sumar `_count.subProducts` de
  // sus hijas encima sería contar dos veces el mismo producto). Solo se
  // muestran principales acá: una subcategoría siempre tiene 0 en
  // `products` (nunca es la categoría principal de nada), así que listarla
  // suelta en esta card solo agregaba ruido de "0".
  const categoryTotals = categoriesWithCounts
    .filter(category => !category.parentId)
    .map(category => ({
      id: category.id,
      name: category.name,
      total: category._count.products,
    }))
    .sort((a, b) => b.total - a.total);

  const inactiveProductCount = productCount - activeProductCount;
  const hasPendingLeads = leadStats.pendingLeadsCount > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de la tienda
        </p>
      </div>

      {/* ALERTA DE ACCIÓN REQUERIDA -- siempre lo primero que se ve. Con
          leads pendientes ocupa una card grande e imposible de ignorar;
          sin pendientes, se reduce a una línea de confirmación para no
          competir por atención con el resto del dashboard. */}
      {hasPendingLeads ? (
        <Link href="/admin/leads">
          <Card className="border-amber-500/60 bg-amber-500/10 transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                </span>
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    {leadStats.pendingLeadsCount}{' '}
                    {leadStats.pendingLeadsCount === 1
                      ? 'venta espera'
                      : 'ventas esperan'}{' '}
                    confirmación
                  </p>
                  <p className="text-sm text-amber-600/90 dark:text-amber-500/80">
                    Confirmá o rechazá cada una para mantener el stock al día.
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-400">
                Ir a Leads →
              </span>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Link
          href="/admin/leads"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <CheckCircle2 className="h-4 w-4" />
          Sin ventas pendientes de confirmación.
        </Link>
      )}

      {/* SECCIÓN 1: RENDIMIENTO GENERAL -- los 4 números que importan para
          decidir rápido: cuánto hay para vender, cuánto se cotizó, y qué
          tan activa está la demanda. Máxima jerarquía visual (texto grande,
          ícono, un solo nivel de grilla). */}
      <section>
        <SectionHeading
          title="Rendimiento General"
          description="Impacto directo en ventas"
          icon={TrendingUp}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            href="/admin/products"
            label="Valor total en venta"
            value={formatPrice(catalogValue)}
            icon={DollarSign}
          />
          <KpiCard
            href="/admin/leads"
            label="Potencial de ventas"
            value={formatPrice(leadStats.totalRevenuePotential)}
            icon={Wallet}
          />
          <KpiCard
            href="/admin/leads"
            label="Intentos de venta (semana)"
            value={leadStats.leadsThisWeek}
            icon={ShoppingCart}
          />
          <KpiCard
            href="/admin/leads"
            label="Leads (hoy)"
            value={leadStats.leadsToday}
            icon={MessageSquare}
          />
        </div>
      </section>

      {/* SECCIÓN 2: RENDIMIENTO DE PRODUCTOS -- qué mira la gente vs. qué
          pide de verdad. leadStats.topProducts ya se calculaba en
          getLeadStats() pero no se mostraba en ningún lado del dashboard;
          ahora tiene su lugar al lado de "más vistos" para comparar interés
          (vistas) contra intención de compra (cotizaciones). */}
      <section>
        <SectionHeading
          title="Rendimiento de Productos"
          description="Qué mira y qué pide la gente"
          icon={Flame}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 5 más vistos</CardTitle>
              <CardDescription>Vistas a la ficha de producto</CardDescription>
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
                        sizes="32px"
                      />
                    )}
                  </div>
                  <span className="flex-1 truncate">{product.name}</span>
                  <span className="font-semibold">{product.views}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 5 más cotizados</CardTitle>
              <CardDescription>
                Unidades pedidas vía WhatsApp (últimos 200 leads)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {leadStats.topProducts.length === 0 && (
                <p className="text-muted-foreground">
                  Todavía no hay leads registrados.
                </p>
              )}
              {leadStats.topProducts.map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex-1 truncate">{product.name}</span>
                  <span className="font-semibold">{product.count} u.</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECCIÓN 3: ESTADO DEL CATÁLOGO -- información operativa, no de
          decisión rápida. Menor peso visual a propósito (MiniStat en vez de
          KpiCard): 5 números que antes eran 5 cards separadas ahora son 3,
          agrupando activo/inactivo y categorías/subcategorías como
          principal + secundario de la misma card. */}
      <section>
        <SectionHeading
          title="Estado del Catálogo"
          description="Inventario y organización"
          icon={Package}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MiniStat
            href="/admin/products"
            label="Productos"
            value={productCount}
            secondary={{ label: 'Activos', value: activeProductCount }}
          />
          <MiniStat
            href="/admin/products"
            label="Inactivos"
            value={inactiveProductCount}
            secondary={{ label: 'Sin imágenes', value: productsWithoutImages }}
          />
          <MiniStat
            href="/admin/categories"
            label="Categorías"
            value={categoryCount}
            secondary={{ label: 'Subcategorías', value: subCategoryCount }}
          />
          {/* Solo tiene sentido con el módulo de stock activo -- con el
              switch apagado, stock queda en 0 por defecto para todos los
              productos y esta card no aportaría nada (por diseño, no se
              muestra en vez de mostrar un "0" engañoso). */}
          {stockConfig.controlStockActivo && (
            <MiniStat
              href="/admin/inventario"
              label="Stock bajo"
              value={lowStockProducts.length}
              alert={lowStockProducts.length > 0}
            />
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
            {/* Altura fija + scroll interno: con muchas categorías/subcategorías
                esta lista no debe forzar la altura de la card vecina. */}
            <CardContent className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {categoryTotals.length === 0 && (
                <p className="text-muted-foreground">Sin categorías todavía.</p>
              )}
              {categoryTotals.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{category.name}</span>
                  <span className="shrink-0 font-semibold">{category.total}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECCIÓN 4: GESTIÓN DE BANNERS -- único módulo de contenido del MVP,
          separado del catálogo porque conceptualmente es otra cosa
          (carrusel de la home, no inventario). */}
      <section>
        <SectionHeading
          title="Gestión de Banners"
          description="Carrusel de la home"
          icon={ImageIcon}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MiniStat
            href="/admin/banners"
            label="Banners activos"
            value={activeBannerCount}
            secondary={{ label: 'Total', value: bannerCount }}
          />
        </div>
      </section>

      {/* SECCIÓN 5: SALUD DEL SITIO -- la de menor prioridad: diagnóstico
          técnico, no accionable a diario. Antes eran 2 cards lado a lado
          compitiendo por el mismo espacio vertical; ahora comparten una
          sola card con Tabs, misma información, mitad del espacio. */}
      <section>
        <SectionHeading
          title="Salud del Sitio"
          description="Diagnóstico técnico"
          icon={Activity}
        />
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="broken">
              <div className="flex items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="broken">
                    Enlaces rotos
                    {topBrokenLinks.length > 0 && ` (${topBrokenLinks.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="visits">Rutas más visitadas</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="broken" className="space-y-2 text-sm">
                {topBrokenLinks.length === 0 && (
                  <p className="text-muted-foreground">
                    Sin visitas a páginas inexistentes registradas todavía.
                  </p>
                )}
                {topBrokenLinks.map(link => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-3"
                  >
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
                {topBrokenLinks.length > 0 && (
                  <div className="pt-2">
                    <ClearBrokenLinksButton />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="visits" className="space-y-2 text-sm">
                {topPageVisits.length === 0 && (
                  <p className="text-muted-foreground">
                    Todavía no hay visitas registradas.
                  </p>
                )}
                {topPageVisits.map(visit => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs">{visit.path}</p>
                      <p className="text-xs text-muted-foreground">
                        última vez: {formatDateTime(visit.lastSeenAt)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary-accent/10 px-2 py-0.5 text-xs font-semibold text-primary-accent">
                      {visit.hits} {visit.hits === 1 ? 'visita' : 'visitas'}
                    </span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
