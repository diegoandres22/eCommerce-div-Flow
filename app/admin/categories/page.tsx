// File: app/admin/categories/page.tsx
import prisma from '@/lib/prisma';
import { CategoryManager } from '@/components/admin/category-manager';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorías</h1>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
