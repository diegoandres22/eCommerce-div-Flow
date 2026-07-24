// File: app/admin/page.tsx
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [productCount, categoryCount] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/products">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Productos</p>
              <p className="text-3xl font-bold">{productCount}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/categories">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Categorías</p>
              <p className="text-3xl font-bold">{categoryCount}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
