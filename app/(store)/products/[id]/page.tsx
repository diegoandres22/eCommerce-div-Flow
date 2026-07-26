// File: app/(store)/products/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import type { Product as ProductJsonLd, WithContext } from 'schema-dts';
import { SmartImage } from '@/components/ui/smart-image';
import {
  getProductById,
  getRelatedProducts,
  incrementProductViews,
} from '@/server/queries/products';
import { WishlistButton } from '@/components/wishlist-button';
import { ShareButtons } from '@/components/share-buttons';
import { ProductCarousel } from '@/components/product-carousel';
import { RecentlyViewedCarousel } from '@/components/recently-viewed-carousel';
import { TrackRecentlyViewed } from '@/components/track-recently-viewed';
import { ProductPurchasePanel } from '@/components/product-purchase-panel';
import { TrustBadges } from '@/components/trust-badges';
import { parseProductColors } from '@/lib/product-colors';
import { formatPrice } from '@/lib/utils';
import { isPrefetchRequest } from '@/lib/route-tracking';
import { isEffectivelyOutOfStock, withEffectiveStock } from '@/lib/stock';
import { getStockConfig } from '@/server/queries/settings';

// Next.js 15: params es una Promise, hay que resolverla antes de leer sus
// propiedades (ver nextjs.org/docs/messages/sync-dynamic-apis).
interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

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
  const { id } = await params;
  const product = await getProductById(id);

  if (!product || !product.isActive) {
    notFound();
  }

  // Fire-and-forget: no bloquea el render de la página. Se descartan los
  // prefetches silenciosos de Next.js (ver lib/route-tracking.ts) para que
  // una sola visita real sume exactamente una vista, no dos.
  const headersList = await headers();
  if (!isPrefetchRequest(headersList)) {
    incrementProductViews(product.id);
  }

  const [relatedProductsRaw, { controlStockActivo }] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId, product.subCategoryId),
    getStockConfig(),
  ]);
  const relatedProducts = withEffectiveStock(relatedProductsRaw, controlStockActivo);

  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${product.id}`;
  const colors = parseProductColors(product.colores);
  const outOfStock = isEffectivelyOutOfStock(product, controlStockActivo);

  // Datos estructurados para resultados enriquecidos de Google (precio,
  // disponibilidad, imagen) en la ficha de producto.
  const productJsonLd: WithContext<ProductJsonLd> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images.length > 0 ? product.images : undefined,
    category: product.category.name,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'USD',
      price: Number(product.price).toFixed(2),
      availability: outOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
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
            <SmartImage
              src={product.images[0] || '/images/placeholder.svg'}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((url, index) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  <SmartImage
                    src={url}
                    alt={`${product.name} ${index + 2}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 25vw, 12vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <span className="mt-2 block text-3xl font-bold">
                {formatPrice(Number(product.price))}
              </span>
            </div>
            <WishlistButton
              product={{
                id: product.id,
                name: product.name,
                price: Number(product.price),
                images: product.images,
              }}
              className="shrink-0"
            />
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          <ProductPurchasePanel
            product={{
              id: product.id,
              name: product.name,
              price: Number(product.price),
              images: product.images,
            }}
            colors={colors}
            controlStockActivo={controlStockActivo}
            stock={product.stock}
            colorStocks={product.colorStocks}
            isOutOfStock={outOfStock}
          />

          <ShareButtons productName={product.name} url={productUrl} />

          <TrustBadges />

          <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Marca</p>
              <p className="font-medium">{product.marca}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Modelo</p>
              <p className="font-medium">{product.modelo}</p>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <ProductCarousel
            title="También te puede interesar"
            products={relatedProducts}
          />
        </div>
      )}

      <div className="mt-16">
        <RecentlyViewedCarousel excludeId={product.id} />
      </div>

      <TrackRecentlyViewed
        product={{
          id: product.id,
          name: product.name,
          price: Number(product.price),
          images: product.images,
          category: product.category,
        }}
      />
    </div>
  );
}
