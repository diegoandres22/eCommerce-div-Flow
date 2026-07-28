// File: app/admin/leads/page.tsx
import { Suspense } from 'react';
import { getLeads, getLeadStats } from '@/server/queries/leads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { LeadActions } from '@/components/admin/lead-actions';
import { formatPrice, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function LeadsPage({
  searchParams,
}: {
  // Next.js 15: searchParams es una Promise, hay que resolverla antes de leer
  // sus propiedades (ver nextjs.org/docs/messages/sync-dynamic-apis).
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = pageParam ? Number(pageParam) : 1;
  const [stats, { leads, totalPages }] = await Promise.all([
    getLeadStats(),
    getLeads(page),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leads (intención de compra)</h1>
        <p className="text-sm text-muted-foreground">
          Cada clic en &quot;Pedir por WhatsApp&quot; queda registrado acá,
          incluso si el cliente nunca llega a escribir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total de leads</p>
            <p className="text-3xl font-bold">{stats.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Potencial de ventas</p>
            <p className="text-3xl font-bold">
              {formatPrice(stats.totalRevenuePotential)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Hoy</p>
            <p className="text-3xl font-bold">{stats.leadsToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Esta semana</p>
            <p className="text-3xl font-bold">{stats.leadsThisWeek}</p>
          </CardContent>
        </Card>
        {/* Alerta visual cuando hay algo esperando: mientras un lead siga
            pendiente, el stock no refleja con certeza lo que se vendió de
            verdad (ver app/api/admin/leads/[id]/route.ts). */}
        <Card
          className={
            stats.pendingLeadsCount > 0
              ? 'border-amber-500/50 bg-amber-500/5'
              : undefined
          }
        >
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Esperando confirmación
            </p>
            <p
              className={
                stats.pendingLeadsCount > 0
                  ? 'text-3xl font-bold text-amber-600 dark:text-amber-500'
                  : 'text-3xl font-bold'
              }
            >
              {stats.pendingLeadsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos más cotizados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {stats.topProducts.length === 0 && (
            <p className="text-muted-foreground">
              Todavía no hay suficientes datos.
            </p>
          )}
          {stats.topProducts.map(product => (
            <div
              key={product.name}
              className="flex items-center justify-between"
            >
              <span className="truncate">{product.name}</span>
              <span className="font-semibold">{product.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/80 dark:bg-muted/40 hover:bg-muted/80 [&_th]:font-semibold [&_th]:text-foreground">
              <TableHead>Fecha</TableHead>
              <TableHead>Productos cotizados</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Todavía no hay leads registrados.
                </TableCell>
              </TableRow>
            )}
            {leads.map(lead => (
              <TableRow key={lead.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(lead.createdAt)}
                </TableCell>
                <TableCell>
                  {lead.items
                    .map(item => {
                      const details = [item.colorName, item.talla]
                        .filter(Boolean)
                        .join(', ');
                      return `${item.name}${details ? ` (${details})` : ''} x${item.quantity}`;
                    })
                    .join(', ')}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatPrice(lead.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      lead.estado === 'confirmado'
                        ? 'default'
                        : lead.estado === 'cancelado'
                          ? 'outline'
                          : 'secondary'
                    }
                    className="font-normal"
                  >
                    {lead.estado === 'pendiente'
                      ? 'Pendiente'
                      : lead.estado === 'confirmado'
                        ? 'Confirmado'
                        : 'Cancelado'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <LeadActions id={lead.id} estado={lead.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Suspense fallback={null}>
        <Pagination page={page} totalPages={totalPages} />
      </Suspense>
    </div>
  );
}
