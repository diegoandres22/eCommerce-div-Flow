// File: app/(store)/products/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  getProductById,
  getRelatedProducts,
  incrementProductViews,
} from '@/server/queries/products';
import { AddToCart } from '@/components/add-to-cart';
import { ProductGrid } from '@/components/product-grid';
import { formatPrice } from '@/lib/utils';

interface ProductPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductById(params.id);

  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  return {
    title: product.name,
    description: product.description || undefined,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductById(params.id);

  if (!product || !product.isActive) {
    notFound();
  }

  // Fire-and-forget: no bloquea el render de la página.
  incrementProductViews(product.id);

  const relatedProducts = await getRelatedProducts(
    product.id,
    product.categoryId
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/products" className="hover:text-foreground">
              Productos
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <Image
              src={product.images[0] || '/images/placeholder.svg'}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((url, index) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={url}
                    alt={`${product.name} ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <span className="mt-2 block text-3xl font-bold">
              {formatPrice(Number(product.price))}
            </span>
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          <AddToCart
            product={{
              id: product.id,
              name: product.name,
              price: Number(product.price),
              images: product.images,
            }}
            showQuantitySelector
          />
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            Productos relacionados
          </h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </div>
  );
}
