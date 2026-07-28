// File: app/(store)/categories/page.tsx
import Link from 'next/link';
import { Metadata } from 'next';
import { FolderTree } from 'lucide-react';
import { getAllCategoriesWithChildren } from '@/server/queries/categories';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Categorías',
  description: 'Explora todas las categorías de la tienda.',
};

export default async function CategoriesPage() {
  const categories = await getAllCategoriesWithChildren();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        Todas las categorías
      </h1>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay categorías.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(category => (
            <div key={category.id} className="rounded-lg border p-4">
              <Link
                href={`/category/${category.slug}`}
                className="flex items-center gap-2 font-semibold hover:text-primary-accent"
              >
                <FolderTree className="h-4 w-4" />
                {category.name}
              </Link>
              {category.children.length > 0 && (
                <ul className="mt-3 space-y-1 border-l pl-3">
                  {category.children.map(child => (
                    <li key={child.id}>
                      <Link
                        href={`/category/${child.slug}`}
                        className="text-sm text-muted-foreground hover:text-primary-accent"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
