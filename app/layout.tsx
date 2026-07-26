// File: app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import '@/styles/globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnnouncementBar } from '@/components/announcement-bar';
import { WhatsAppFloatButton } from '@/components/whatsapp-float-button';
import { SiteChrome } from '@/components/site-chrome';
import { CartProvider } from '@/components/cart-provider';
import { WishlistProvider } from '@/components/wishlist-provider';
import { RecentlyViewedProvider } from '@/components/recently-viewed-provider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { PwaRegister } from '@/components/pwa-register';
import { STORE_CONFIG } from '@/lib/store-config';
import { generateThemeStyleTag } from '@/lib/theme';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

const { nombre: storeName, descripcion: storeDescription } = STORE_CONFIG;

export const metadata: Metadata = {
  title: {
    default: storeName,
    template: `%s | ${storeName}`,
  },
  description: storeDescription,
  keywords: ['ecommerce', 'nextjs', 'store', 'shopping'],
  authors: [{ name: storeName }],
  creator: storeName,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    title: storeName,
    description: storeDescription,
    siteName: storeName,
  },
  twitter: {
    card: 'summary_large_image',
    title: storeName,
    description: storeDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Colores de marca desde STORE_CONFIG (lib/theme.ts): mismas
            variables que styles/globals.css, declaradas después para que
            ganen por cascada sin tocar Tailwind ni usar !important. */}
        <style
          dangerouslySetInnerHTML={{
            __html: generateThemeStyleTag(STORE_CONFIG),
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Color fijo (no ligado a --primary): el banner de anuncios usa
            bg-primary, y con el primario actual (#1c1917, casi negro) la
            barra de carga quedaba invisible sobre él. Un color propio, ajeno
            a la paleta de marca, garantiza contraste tanto sobre el banner
            negro como sobre el fondo claro/oscuro del resto del sitio. */}
        <NextTopLoader color="#f59e0b" showSpinner={false} height={3} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CartProvider>
            <WishlistProvider>
              <RecentlyViewedProvider>
                <div className="flex min-h-screen flex-col">
                  <SiteChrome
                    announcementBar={
                      STORE_CONFIG.mostrarBannerAnuncios ? <AnnouncementBar /> : null
                    }
                    header={<Header />}
                    footer={<Footer />}
                    whatsappButton={<WhatsAppFloatButton />}
                  >
                    {children}
                  </SiteChrome>
                </div>
                <Toaster />
                <PwaRegister />
              </RecentlyViewedProvider>
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
