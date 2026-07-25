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
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'NextJS E-commerce Store',
    template: '%s | NextJS E-commerce',
  },
  description: 'Modern e-commerce store built with Next.js and Prisma',
  keywords: ['ecommerce', 'nextjs', 'store', 'shopping'],
  authors: [{ name: 'NextJS E-commerce' }],
  creator: 'NextJS E-commerce',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'NextJS E-commerce Store',
    description: 'Modern e-commerce store built with Next.js',
    siteName: 'NextJS E-commerce',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextJS E-commerce Store',
    description: 'Modern e-commerce store built with Next.js',
    creator: '@nextjsecommerce',
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextTopLoader color="hsl(var(--primary))" showSpinner={false} height={3} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CartProvider>
            <WishlistProvider>
              <div className="flex min-h-screen flex-col">
                <SiteChrome
                  announcementBar={<AnnouncementBar />}
                  header={<Header />}
                  footer={<Footer />}
                  whatsappButton={<WhatsAppFloatButton />}
                >
                  {children}
                </SiteChrome>
              </div>
              <Toaster />
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
