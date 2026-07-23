// Location: prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Limpiar tablas para evitar errores de duplicados
  await prisma.productImage.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Admin User',
      role: 'ADMIN', // Cambiado a String
    },
  });

  console.log(`👤 Created admin user: ${admin.email}`);

  // Create test customer
  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      name: 'John Doe',
      role: 'USER', // Cambiado a String
    },
  });

  console.log(`👤 Created customer: ${customer.email}`);

  // Create categories
  const electronicsCategory = await prisma.category.create({
    data: {
      id: 'c-electronics',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      image: 'https://unsplash.com',
    },
  });

  const clothingCategory = await prisma.category.create({
    data: {
      id: 'c-clothing',
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      image: 'https://unsplash.com',
    },
  });

  console.log('📂 Created categories');

  // Create subcategories
  const smartphonesCategory = await prisma.category.create({
    data: {
      id: 'c-smartphones',
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Latest smartphones and mobile devices',
      parentId: electronicsCategory.id,
    },
  });

  const laptopsCategory = await prisma.category.create({
    data: {
      id: 'c-laptops',
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptops and notebooks',
      parentId: electronicsCategory.id,
    },
  });

  const mensClothingCategory = await prisma.category.create({
    data: {
      id: 'c-mens-clothing',
      name: "Men's Clothing",
      slug: 'mens-clothing',
      description: 'Clothing for men',
      parentId: clothingCategory.id,
    },
  });

  console.log('📂 Created subcategories');

  // Create products
  const products = [
    {
      id: 'p-iphone',
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: 'Latest iPhone with advanced camera system',
      content: 'The iPhone 15 Pro features a titanium design, advanced camera system, and A17 Pro chip.',
      price: 999.99,
      comparePrice: 1099.99,
      costPrice: 750.0,
      categoryId: smartphonesCategory.id,
      status: 'PUBLISHED', // Cambiado a String
      sku: 'IPH15PRO-128-NT',
      tags: 'smartphone, apple, ios, premium', // Adaptado a un string simple
      seoTitle: 'iPhone 15 Pro - Premium Smartphone | Your Store',
      seoDescription: 'Get the latest iPhone 15 Pro with titanium design and advanced camera system.',
    },
    {
      id: 'p-macbook',
      name: 'MacBook Air M2',
      slug: 'macbook-air-m2',
      description: 'Lightweight laptop with M2 chip',
      content: 'The MacBook Air with M2 chip delivers incredible performance in a thin and light design.',
      price: 1199.99,
      comparePrice: 1299.99,
      costPrice: 900.0,
      categoryId: laptopsCategory.id,
      status: 'PUBLISHED',
      sku: 'MBA-M2-256-SG',
      tags: 'laptop, apple, macos, m2',
      seoTitle: 'MacBook Air M2 - Ultra-thin Laptop | Your Store',
      seoDescription: 'Experience incredible performance with the MacBook Air M2.',
    },
    {
      id: 'p-samsung',
      name: 'Samsung Galaxy S24',
      slug: 'samsung-galaxy-s24',
      description: 'Flagship Android smartphone',
      content: 'The Galaxy S24 features AI-powered camera, long-lasting battery, and stunning display.',
      price: 899.99,
      comparePrice: 999.99,
      costPrice: 650.0,
      categoryId: smartphonesCategory.id,
      status: 'PUBLISHED',
      sku: 'SGS24-256-PH',
      tags: 'smartphone, samsung, android, galaxy',
      seoTitle: 'Samsung Galaxy S24 - AI-Powered Smartphone | Your Store',
      seoDescription: 'Discover the Samsung Galaxy S24 with AI-powered features.',
    },
    {
      id: 'p-tshirt',
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-tshirt',
      description: 'Comfortable and stylish cotton t-shirt',
      content: 'Made from 100% organic cotton, this t-shirt offers comfort and style.',
      price: 29.99,
      comparePrice: 39.99,
      costPrice: 15.0,
      categoryId: mensClothingCategory.id,
      status: 'PUBLISHED',
      sku: 'TSHIRT-COT-M-BLU',
      tags: 'clothing, cotton, casual, organic',
      seoTitle: 'Premium Cotton T-Shirt - Organic & Comfortable | Your Store',
      seoDescription: 'Shop our premium organic cotton t-shirt for ultimate comfort.',
    },
    {
      id: 'p-headphones',
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      content: 'Experience superior sound quality with active noise cancellation and 30-hour battery life.',
      price: 199.99,
      comparePrice: 249.99,
      costPrice: 120.0,
      categoryId: electronicsCategory.id,
      status: 'PUBLISHED',
      sku: 'WH-NC-BLK-BT',
      tags: 'headphones, wireless, bluetooth, noise-cancelling',
      seoTitle: 'Wireless Noise-Cancelling Headphones | Your Store',
      seoDescription: 'Premium wireless headphones with active noise cancellation.',
    },
  ];

  // Imágenes reales de Unsplash para que luzca increíble
  const productImages: Record<string, string[]> = {
    'iphone-15-pro': [
      'https://unsplash.com',
      'https://unsplash.com',
    ],
    'macbook-air-m2': [
      'https://unsplash.com',
      'https://unsplash.com',
    ],
    'samsung-galaxy-s24': [
      'https://unsplash.com',
      'https://unsplash.com',
    ],
    'premium-cotton-tshirt': [
      'https://unsplash.com',
      'https://unsplash.com',
    ],
    'wireless-headphones': [
      'https://unsplash.com',
      'https://unsplash.com',
    ],
  };

  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData,
    });

    const images = productImages[product.slug] || [
      'https://unsplash.com',
      'https://unsplash.com',
    ];

    // Create product images
    await prisma.productImage.createMany({
      data: [
        {
          productId: product.id,
          url: images[0]!,
          altText: `${product.name} - Main Image`,
          position: 0,
        },
        {
          productId: product.id,
          url: images[1]!,
          altText: `${product.name} - Secondary Image`,
          position: 1,
        },
      ],
    });

    // Create inventory
    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: 50,
        reserved: 0,
        available: 50,
      },
    });

    // Create product variants for iPhone
    if (product.slug === 'iphone-15-pro') {
      await prisma.productVariant.createMany({
        data: [
          { productId: product.id, name: 'Storage', value: '128GB', position: 0 },
          { productId: product.id, name: 'Storage', value: '256GB', position: 1 },
        ],
      });
    }
  }

  console.log('✨ Seed complete! Database populated successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
