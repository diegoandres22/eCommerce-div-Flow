// File: server/queries/settings.ts
import prisma from '@/lib/prisma';

export async function getWhatsappNumber() {
  const config = await prisma.configuracionTienda.findFirst();
  return config?.whatsappNumber ?? null;
}

export async function getStoreBanner() {
  const config = await prisma.configuracionTienda.findFirst();
  return {
    bannerText: config?.bannerText ?? null,
    showBanner: config?.showBanner ?? false,
  };
}

// Interruptor global del módulo de stock -- lo consulta cada página pública
// que necesita saber si debe mostrar disponibilidad real (stock) o el
// comportamiento manual de siempre (isOutOfStock). Ver lib/stock.ts.
export async function getStockConfig() {
  const config = await prisma.configuracionTienda.findFirst();
  return { controlStockActivo: config?.controlStockActivo ?? false };
}
