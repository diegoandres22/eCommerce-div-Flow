// File: server/queries/leads.ts
import prisma from '@/lib/prisma';

export interface LeadItem {
  productId: string;
  name: string;
  // Color elegido en el carrito (si el producto tiene colores) -- ver
  // app/api/admin/leads/[id]/route.ts para el descuento por color.
  colorName?: string;
  price: number;
  quantity: number;
}

const DEFAULT_PAGE_SIZE = 20;

export async function getLeads(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const [leads, totalCount] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count(),
  ]);

  return {
    leads: leads.map(lead => ({
      ...lead,
      items: lead.items as unknown as LeadItem[],
    })),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    page,
  };
}

export async function getLeadStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [
    totalLeads,
    revenueAgg,
    leadsToday,
    leadsThisWeek,
    pendingLeadsCount,
    recentLeads,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.aggregate({ _sum: { totalAmount: true } }),
    prisma.lead.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.lead.count({ where: { createdAt: { gte: startOfWeek } } }),
    // Leads sin confirmar ni rechazar todavía: mientras haya alguno, el stock
    // no refleja con certeza lo que realmente se vendió (ver
    // app/api/admin/leads/[id]/route.ts). Alimenta la card de alerta del
    // dashboard.
    prisma.lead.count({ where: { estado: 'pendiente' } }),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { items: true },
    }),
  ]);

  // Productos más cotizados: se agrega en JS sobre los últimos 200 leads.
  // Suficiente para el tamaño de un MVP -- evita una consulta JSON compleja
  // en Postgres solo para un ranking aproximado.
  const productCounts = new Map<string, { name: string; count: number }>();
  for (const lead of recentLeads) {
    const items = lead.items as unknown as LeadItem[];
    for (const item of items) {
      const existing = productCounts.get(item.productId);
      if (existing) {
        existing.count += item.quantity;
      } else {
        productCounts.set(item.productId, {
          name: item.name,
          count: item.quantity,
        });
      }
    }
  }
  const topProducts = Array.from(productCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalLeads,
    totalRevenuePotential: revenueAgg._sum.totalAmount ?? 0,
    leadsToday,
    leadsThisWeek,
    pendingLeadsCount,
    topProducts,
  };
}
