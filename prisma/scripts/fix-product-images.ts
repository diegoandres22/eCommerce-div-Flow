// Location: prisma/scripts/fix-product-images.ts
//
// Script de mantenimiento de una sola vez: reemplaza las imágenes de
// paisajes (picsum.photos) que ya quedaron guardadas en la base de datos
// por fotos reales relacionadas con cada producto, usando loremflickr.com
// filtrado por keyword según la subcategoría (ver TAGS más abajo).
//
// No aplica al seed.ts en sí -- ese ya genera imágenes correctas para
// corridas nuevas. Este script es solo para corregir los 100 productos y
// 3 banners que ya se sembraron antes de este ajuste.
//
// Seguro de correr más de una vez: el "lock" de loremflickr se deriva de un
// hash del id del producto/banner, así que siempre recalcula la misma
// imagen para el mismo registro (idempotente, no genera nuevas imágenes
// random en cada corrida).
//
// Uso: npx tsx prisma/scripts/fix-product-images.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Debe reflejar los mismos tags usados en prisma/seed.ts para cada
// subcategoría. Si agregas una subcategoría nueva al seed, agrégala acá
// también (o cae en el fallback 'shopping').
const TAGS: Record<string, string> = {
  Smartphones: 'smartphone',
  Laptops: 'laptop',
  Audio: 'headphones',
  Calzado: 'sneakers',
  Ropa: 'clothing',
  Electrodomésticos: 'kitchen,appliance',
  Decoración: 'homedecor',
  Fitness: 'fitness',
  Ciclismo: 'bicycle',
  'Cuidado facial': 'skincare',
  Maquillaje: 'makeup',
  Consolas: 'videogames',
  'Accesorios Gaming': 'gaming',
  Perros: 'dog',
  Gatos: 'cat',
};

const BANNER_TAGS: Record<string, string> = {
  'Oferta de Temporada': 'sale',
  'Lanzamiento Exclusivo': 'smartphone',
  'Compra Fácil por WhatsApp': 'delivery',
};

function hashToLock(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 100000;
}

function productImages(tag: string, uniqueSeed: string): string[] {
  const lock = hashToLock(uniqueSeed);
  return [
    `https://loremflickr.com/1000/1000/${tag}?lock=${lock}`,
    `https://loremflickr.com/1000/1000/${tag}?lock=${lock + 1}`,
  ];
}

async function fixProducts() {
  const products = await prisma.product.findMany({
    include: { subCategory: true },
  });

  for (const product of products) {
    const tag = (product.subCategory && TAGS[product.subCategory.name]) || 'shopping';

    await prisma.product.update({
      where: { id: product.id },
      data: { images: productImages(tag, product.id) },
    });
  }

  return products.length;
}

async function fixBanners() {
  const banners = await prisma.banner.findMany();

  for (const banner of banners) {
    const tag = (banner.title && BANNER_TAGS[banner.title]) || 'shopping';

    await prisma.banner.update({
      where: { id: banner.id },
      data: {
        imageUrl: `https://loremflickr.com/1600/600/${tag}?lock=${hashToLock(banner.id)}`,
      },
    });
  }

  return banners.length;
}

async function main() {
  console.log('Actualizando imágenes de productos y banners a loremflickr.com...');

  const updatedProducts = await fixProducts();
  console.log(`Productos actualizados: ${updatedProducts}.`);

  const updatedBanners = await fixBanners();
  console.log(`Banners actualizados: ${updatedBanners}.`);

  console.log('Listo.');
}

main()
  .catch(e => {
    console.error('Error actualizando imágenes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
