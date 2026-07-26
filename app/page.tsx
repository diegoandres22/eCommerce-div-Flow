// File: app/page.tsx
import { Metadata } from 'next';
import { BannerCarousel } from '@/components/home/banner-carousel';
import { BenefitsSection } from '@/components/home/benefits-section';
import { ProductCarousel } from '@/components/product-carousel';
import { getActiveBanners } from '@/server/queries/banners';
import {
  getTopViewedProducts,
  getCategoriesWithActiveProducts,
} from '@/server/queries/products';
import { getStockConfig } from '@/server/queries/settings';
import { withEffectiveStock } from '@/lib/stock';
import { STORE_CONFIG } from '@/lib/store-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inicio',
  description: STORE_CONFIG.descripcion,
};

export default async function HomePage() {
  const [banners, topViewed, categories, { controlStockActivo }] =
    await Promise.all([
      getActiveBanners(),
      getTopViewedProducts(10),
      getCategoriesWithActiveProducts(10),
      getStockConfig(),
    ]);
  const effectiveTopViewed = withEffectiveStock(topViewed, controlStockActivo);

  return (
    <>
      <BannerCarousel banners={banners} />

      <div className="space-y-14 py-14">
        {effectiveTopViewed.length > 0 && (
          <ProductCarousel
            title="Los más vistos"
            products={effectiveTopViewed}
            viewAllHref="/products"
          />
        )}

        {categories.map(category => (
          <ProductCarousel
            key={category.id}
            title={category.name}
            products={withEffectiveStock(category.products, controlStockActivo)}
            viewAllHref={`/category/${category.slug}`}
          />
        ))}

        {topViewed.length === 0 && categories.length === 0 && (
          <p className="mx-auto max-w-7xl px-4 py-12 text-center text-muted-foreground sm:px-6 lg:px-8">
            Todavía no hay productos activos que mostrar.
          </p>
        )}
      </div>

      <BenefitsSection />
    </>
  );
}
