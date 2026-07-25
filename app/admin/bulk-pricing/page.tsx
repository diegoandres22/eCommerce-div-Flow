// File: app/admin/bulk-pricing/page.tsx
import prisma from '@/lib/prisma';
import { BulkPricingForm } from '@/components/admin/bulk-pricing-form';

export const dynamic = 'force-dynamic';

export default async function BulkPricingPage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        categoryId: true,
        subCategoryId: true,
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Actualización masiva de precios</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Sube o baja precios de muchos productos a la vez, por porcentaje o
        por un monto fijo. Elige a quién afecta antes de confirmar.
      </p>
      <BulkPricingForm categories={categories} products={products} />
    </div>
  );
}
