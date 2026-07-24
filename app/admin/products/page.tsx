// File: app/admin/products/page.tsx
import prisma from '@/lib/prisma';
import { ProductManager } from '@/components/admin/product-manager';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Productos</h1>
      <ProductManager initialProducts={products} categories={categories} />
    </div>
  );
}
