// File: app/(store)/cart/page.tsx
import prisma from '@/lib/prisma';
import { CartCheckout } from '@/components/cart-checkout';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const config = await prisma.configuracionTienda.findFirst();

  return <CartCheckout whatsappNumber={config?.whatsappNumber ?? null} />;
}
