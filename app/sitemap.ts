// File: app/sitemap.ts
import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true } }),
    prisma.category.findMany(),
  ]);

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: new Date(), priority: 0.5 },
  ];

  const productRoutes = products.map(product => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.updatedAt,
    priority: 0.7,
  }));

  const categoryRoutes = categories.map(category => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: category.updatedAt,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
