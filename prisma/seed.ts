// Location: prisma/seed.ts
//
// Seed de datos de prueba para entorno de desarrollo: taxonomía de
// categorías/subcategorías, 100 productos distribuidos coherentemente y 3
// banners simulando contenido de producción.
//
// Nota de adaptación (leer antes de modificar): el pedido original incluía
// campos `slug` en Product, `sku`, `inventory` y `status: "PUBLISHED"`. Ese
// esquema NO existe en este proyecto -- Product no tiene slug (solo
// Category), y el MVP excluye explícitamente SKU/inventario (ver CLAUDE.md,
// "Exclusiones actuales"). Este seed usa los campos reales del modelo:
// name, description, price, categoryId, subCategoryId, images[], marca,
// modelo, colores (opcional), isActive, isOutOfStock,
// views. `isActive: true` ya cumple el rol de "PUBLISHED".
//
// Idempotencia: las categorías se crean con upsert (por name, que es
// @unique). Los productos y banners solo se crean si la tabla está vacía,
// para poder correr `npm run db:seed` más de una vez sin duplicar datos.

import { PrismaClient } from '@prisma/client';
import { slugify } from '../lib/utils';

const prisma = new PrismaClient();

// loremflickr.com sirve fotos reales de Flickr (licencia Creative Commons)
// filtradas por palabra clave -- a diferencia de picsum.photos, que devuelve
// fotos aleatorias sin relación con el producto (paisajes, texturas, etc).
// "lock" fija una foto específica del pool de esa keyword para que la
// imagen no cambie en cada visita; se deriva con un hash simple del id
// único del producto, así que no hace falta llevar un contador global.
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

interface ProductSeed {
  name: string;
  marca: string;
  modelo: string;
  price: number;
  colors?: string; // "Nombre:#hex,Nombre:#hex" (lib/product-colors.ts)
}

interface SubCategorySeed {
  name: string;
  // Keyword de loremflickr.com para que las imágenes generadas correspondan
  // de verdad al tipo de producto de esta subcategoría.
  tag: string;
  products: ProductSeed[];
}

interface CategorySeed {
  name: string;
  subcategories: SubCategorySeed[];
}

const CATALOG: CategorySeed[] = [
  {
    name: 'Electrónica',
    subcategories: [
      {
        name: 'Smartphones',
        tag: 'smartphone',
        products: [
          { name: 'Samsung Galaxy S23', marca: 'Samsung', modelo: 'Galaxy S23', price: 799 },
          { name: 'Samsung Galaxy S23 Ultra', marca: 'Samsung', modelo: 'Galaxy S23 Ultra', price: 1199 },
          { name: 'Samsung Galaxy A54', marca: 'Samsung', modelo: 'Galaxy A54', price: 449 },
          { name: 'Apple iPhone 14', marca: 'Apple', modelo: 'iPhone 14', price: 899 },
          { name: 'Apple iPhone 14 Pro', marca: 'Apple', modelo: 'iPhone 14 Pro', price: 1099 },
          { name: 'Apple iPhone SE', marca: 'Apple', modelo: 'iPhone SE (2022)', price: 429 },
          { name: 'Xiaomi Redmi Note 12', marca: 'Xiaomi', modelo: 'Redmi Note 12', price: 269 },
          { name: 'Xiaomi Poco X5', marca: 'Xiaomi', modelo: 'Poco X5', price: 299 },
          { name: 'Motorola Edge 40', marca: 'Motorola', modelo: 'Edge 40', price: 549 },
          { name: 'Google Pixel 7', marca: 'Google', modelo: 'Pixel 7', price: 599 },
        ],
      },
      {
        name: 'Laptops',
        tag: 'laptop',
        products: [
          { name: 'Apple MacBook Air M2', marca: 'Apple', modelo: 'MacBook Air M2', price: 1199 },
          { name: 'Apple MacBook Pro 14"', marca: 'Apple', modelo: 'MacBook Pro 14" M2 Pro', price: 2199 },
          { name: 'Dell XPS 13', marca: 'Dell', modelo: 'XPS 13', price: 1099 },
          { name: 'Dell Inspiron 15', marca: 'Dell', modelo: 'Inspiron 15 3000', price: 549 },
          { name: 'HP Pavilion 15', marca: 'HP', modelo: 'Pavilion 15', price: 599 },
          { name: 'HP Envy x360', marca: 'HP', modelo: 'Envy x360', price: 899 },
          { name: 'Lenovo ThinkPad E14', marca: 'Lenovo', modelo: 'ThinkPad E14', price: 749 },
          { name: 'Lenovo IdeaPad 3', marca: 'Lenovo', modelo: 'IdeaPad 3', price: 479 },
          { name: 'Asus Vivobook 15', marca: 'Asus', modelo: 'Vivobook 15', price: 529 },
        ],
      },
      {
        name: 'Audio',
        tag: 'headphones',
        products: [
          { name: 'Sony WH-1000XM5', marca: 'Sony', modelo: 'WH-1000XM5', price: 349 },
          { name: 'JBL Tune 510BT', marca: 'JBL', modelo: 'Tune 510BT', price: 39 },
          { name: 'Bose QuietComfort 45', marca: 'Bose', modelo: 'QuietComfort 45', price: 329 },
          { name: 'Apple AirPods Pro (2ª Gen)', marca: 'Apple', modelo: 'AirPods Pro 2', price: 249 },
          { name: 'Xiaomi Redmi Buds 4', marca: 'Xiaomi', modelo: 'Redmi Buds 4', price: 29 },
          { name: 'Samsung Galaxy Buds2', marca: 'Samsung', modelo: 'Galaxy Buds2', price: 99 },
        ],
      },
    ],
  },
  {
    name: 'Moda',
    subcategories: [
      {
        name: 'Calzado',
        tag: 'sneakers',
        products: [
          { name: 'Nike Air Max 90', marca: 'Nike', modelo: 'Air Max 90', price: 129, colors: 'Blanco:#ffffff,Negro:#111111,Rojo:#dc2626' },
          { name: "Nike Air Force 1 '07", marca: 'Nike', modelo: "Air Force 1 '07", price: 109, colors: 'Blanco:#ffffff,Negro:#111111' },
          { name: 'Adidas Superstar', marca: 'Adidas', modelo: 'Superstar', price: 99, colors: 'Blanco:#ffffff,Negro:#111111,Verde:#16a34a' },
          { name: 'Adidas Ultraboost 22', marca: 'Adidas', modelo: 'Ultraboost 22', price: 179, colors: 'Negro:#111111,Gris:#9ca3af' },
          { name: 'Puma Suede Classic', marca: 'Puma', modelo: 'Suede Classic', price: 79, colors: 'Azul:#2563eb,Rojo:#dc2626' },
          { name: 'New Balance 574', marca: 'New Balance', modelo: '574', price: 89, colors: 'Gris:#9ca3af,Verde:#16a34a' },
          { name: 'Vans Old Skool', marca: 'Vans', modelo: 'Old Skool', price: 69, colors: 'Negro:#111111,Blanco:#ffffff' },
        ],
      },
      {
        name: 'Ropa',
        tag: 'clothing',
        products: [
          { name: "Levi's 501 Jean Clásico", marca: "Levi's", modelo: '501 Original', price: 79, colors: 'Azul:#2563eb,Negro:#111111' },
          { name: 'Nike Dri-FIT Camiseta', marca: 'Nike', modelo: 'Dri-FIT Basic', price: 29, colors: 'Negro:#111111,Blanco:#ffffff,Gris:#9ca3af' },
          { name: 'Adidas Chaqueta Track', marca: 'Adidas', modelo: 'Track Jacket', price: 69, colors: 'Azul:#2563eb,Negro:#111111' },
          { name: 'Zara Camisa Lino Regular', marca: 'Zara', modelo: 'Camisa Lino Regular', price: 39 },
          { name: 'H&M Sudadera Básica', marca: 'H&M', modelo: 'Sudadera Básica', price: 25, colors: 'Beige:#e7d8c9,Negro:#111111' },
          { name: 'Puma Short Deportivo', marca: 'Puma', modelo: 'Short Deportivo', price: 22 },
          { name: 'Tommy Hilfiger Polo Clásico', marca: 'Tommy Hilfiger', modelo: 'Polo Clásico', price: 59, colors: 'Azul:#2563eb,Blanco:#ffffff' },
          { name: 'Under Armour HeatGear Leggings', marca: 'Under Armour', modelo: 'HeatGear Leggings', price: 45 },
        ],
      },
    ],
  },
  {
    name: 'Hogar',
    subcategories: [
      {
        name: 'Electrodomésticos',
        tag: 'kitchen,appliance',
        products: [
          { name: 'Samsung Refrigerador RT38 No Frost', marca: 'Samsung', modelo: 'RT38 No Frost', price: 899 },
          { name: 'LG Lavadora Carga Frontal 18kg', marca: 'LG', modelo: 'Lavadora 18kg', price: 649 },
          { name: 'Oster Licuadora Pro 1000', marca: 'Oster', modelo: 'Licuadora Pro 1000', price: 79 },
          { name: 'Black+Decker Cafetera Programable', marca: 'Black+Decker', modelo: 'Cafetera 12 Tazas', price: 59 },
          { name: 'Philips Airfryer XXL', marca: 'Philips', modelo: 'Airfryer XXL', price: 199 },
          { name: 'Whirlpool Microondas 20L', marca: 'Whirlpool', modelo: 'Microondas 20L', price: 129 },
          { name: 'Electrolux Aspiradora Robot Pure i9', marca: 'Electrolux', modelo: 'Pure i9', price: 349 },
        ],
      },
      {
        name: 'Decoración',
        tag: 'homedecor',
        products: [
          { name: 'Set de Cojines Decorativos x4', marca: 'Home Deco', modelo: 'Set Cojines x4', price: 39 },
          { name: 'Espejo Redondo Nórdico 60cm', marca: 'Home Deco', modelo: 'Espejo Nórdico 60cm', price: 79 },
          { name: 'Lámpara de Mesa Minimalista LED', marca: 'Home Deco', modelo: 'Lámpara Minimal LED', price: 45 },
          { name: 'Jarrón Cerámico Artesanal', marca: 'Home Deco', modelo: 'Jarrón Artesanal Grande', price: 55 },
          { name: 'Cuadro Abstracto Tríptico 120x60', marca: 'Home Deco', modelo: 'Tríptico Abstracto', price: 89 },
          { name: 'Alfombra Vintage 200x150', marca: 'Home Deco', modelo: 'Alfombra Vintage', price: 149 },
        ],
      },
    ],
  },
  {
    name: 'Deportes',
    subcategories: [
      {
        name: 'Fitness',
        tag: 'fitness',
        products: [
          { name: 'Set Mancuernas Ajustables 2-24kg', marca: 'PowerFit', modelo: 'Set Mancuernas 2-24kg', price: 189 },
          { name: 'Bicicleta Estática BH Sonic', marca: 'BH', modelo: 'Sonic', price: 449 },
          { name: 'Kit 5 Bandas de Resistencia', marca: 'PowerFit', modelo: 'Kit 5 Bandas', price: 25 },
          { name: 'Colchoneta de Yoga Premium 6mm', marca: 'Liforme', modelo: 'Premium 6mm', price: 59 },
          { name: 'Kettlebell 12kg', marca: 'PowerFit', modelo: 'Kettlebell 12kg', price: 39 },
          { name: 'Barra Olímpica 20kg', marca: 'PowerFit', modelo: 'Barra Olímpica 20kg', price: 129 },
          { name: 'Reloj Inteligente Fitness Garmin Forerunner 55', marca: 'Garmin', modelo: 'Forerunner 55', price: 249 },
        ],
      },
      {
        name: 'Ciclismo',
        tag: 'bicycle',
        products: [
          { name: 'Bicicleta MTB Trek Marlin 7', marca: 'Trek', modelo: 'Marlin 7', price: 999 },
          { name: 'Bicicleta Ruta Specialized Allez', marca: 'Specialized', modelo: 'Allez', price: 1199 },
          { name: 'Casco Ciclismo Giro Fixture MIPS', marca: 'Giro', modelo: 'Fixture MIPS', price: 69 },
          { name: 'Guantes Ciclismo Pro Gel', marca: 'ProCycle', modelo: 'Guantes Pro Gel', price: 25 },
          { name: 'Kit Luces LED Bicicleta', marca: 'ProCycle', modelo: 'Kit Luces LED', price: 19 },
          { name: 'Botella Térmica Ciclismo 750ml', marca: 'ProCycle', modelo: 'Botella Térmica 750ml', price: 15 },
        ],
      },
    ],
  },
  {
    name: 'Belleza',
    subcategories: [
      {
        name: 'Cuidado facial',
        tag: 'skincare',
        products: [
          { name: 'Serum Vitamina C 10', marca: 'La Roche-Posay', modelo: 'Serum Vit C 10', price: 39 },
          { name: 'Crema Hidratante 24h', marca: 'Nivea', modelo: 'Crema Hidratante 24h', price: 12 },
          { name: 'Fotoprotector FPS50', marca: 'Isdin', modelo: 'Fotoprotector FPS50', price: 29 },
          { name: 'Limpiador Facial Hidratante', marca: 'CeraVe', modelo: 'Limpiador Hidratante', price: 18 },
          { name: 'Mascarilla de Arcilla Verde', marca: 'The Body Shop', modelo: 'Mascarilla Arcilla Verde', price: 22 },
          { name: 'Tónico Facial Hidra Boost', marca: 'Neutrogena', modelo: 'Tónico Hidra Boost', price: 14 },
        ],
      },
      {
        name: 'Maquillaje',
        tag: 'makeup',
        products: [
          { name: 'Base Líquida Fit Me Matte', marca: 'Maybelline', modelo: 'Fit Me Matte', price: 15 },
          { name: 'Paleta de Sombras Naked3', marca: 'Urban Decay', modelo: 'Naked3', price: 45 },
          { name: 'Labial Mate Ruby Woo', marca: 'MAC', modelo: 'Ruby Woo', price: 22 },
          { name: 'Máscara de Pestañas Voluminous Lash', marca: "L'Oréal", modelo: 'Voluminous Lash', price: 13 },
          { name: 'Delineador Líquido Epic Ink Liner', marca: 'NYX', modelo: 'Epic Ink Liner', price: 11 },
          { name: 'Rubor en Polvo Dandelion', marca: 'Benefit', modelo: 'Dandelion', price: 34 },
        ],
      },
    ],
  },
  {
    name: 'Gaming',
    subcategories: [
      {
        name: 'Consolas',
        tag: 'videogames',
        products: [
          { name: 'PlayStation 5', marca: 'Sony', modelo: 'PlayStation 5', price: 549 },
          { name: 'Xbox Series X', marca: 'Microsoft', modelo: 'Xbox Series X', price: 549 },
          { name: 'Nintendo Switch OLED', marca: 'Nintendo', modelo: 'Switch OLED', price: 349 },
          { name: 'PlayStation 5 Digital', marca: 'Sony', modelo: 'PlayStation 5 Digital', price: 449 },
          { name: 'Xbox Series S', marca: 'Microsoft', modelo: 'Xbox Series S', price: 299 },
          { name: 'Nintendo Switch Lite', marca: 'Nintendo', modelo: 'Switch Lite', price: 199 },
        ],
      },
      {
        name: 'Accesorios Gaming',
        tag: 'gaming',
        products: [
          { name: 'Control DualSense PS5', marca: 'Sony', modelo: 'DualSense', price: 69 },
          { name: 'Auriculares Gamer Cloud II', marca: 'HyperX', modelo: 'Cloud II', price: 89 },
          { name: 'Teclado Mecánico G Pro X', marca: 'Logitech', modelo: 'G Pro X', price: 129 },
          { name: 'Mouse Gamer DeathAdder V3', marca: 'Razer', modelo: 'DeathAdder V3', price: 69 },
          { name: 'Silla Gamer Titan Evo', marca: 'Secretlab', modelo: 'Titan Evo', price: 449 },
          { name: 'Volante Gamer G29 Driving Force', marca: 'Logitech', modelo: 'G29 Driving Force', price: 249 },
        ],
      },
    ],
  },
  {
    name: 'Mascotas',
    subcategories: [
      {
        name: 'Perros',
        tag: 'dog',
        products: [
          { name: 'Alimento Premium Perro Adulto 15kg', marca: 'Pro Plan', modelo: 'Adulto 15kg', price: 69 },
          { name: 'Cama Ortopédica para Perro L', marca: 'PetComfort', modelo: 'Cama Ortopédica L', price: 45 },
          { name: 'Correa Retráctil Reforzada 5m', marca: 'PetComfort', modelo: 'Correa Retráctil 5m', price: 18 },
          { name: 'Juguete Kong Classic Medium', marca: 'Kong', modelo: 'Classic Medium', price: 14 },
          { name: 'Shampoo Antipulgas para Perro 500ml', marca: 'PetComfort', modelo: 'Shampoo Antipulgas 500ml', price: 12 },
        ],
      },
      {
        name: 'Gatos',
        tag: 'cat',
        products: [
          { name: 'Alimento Gato Esterilizado 7kg', marca: 'Pro Plan', modelo: 'Esterilizado 7kg', price: 39 },
          { name: 'Arenero Autolimpiante', marca: 'PetComfort', modelo: 'Arenero Auto', price: 59 },
          { name: 'Rascador Torre para Gato XL', marca: 'PetComfort', modelo: 'Torre Rascador XL', price: 55 },
          { name: 'Transportadora para Gato M', marca: 'PetComfort', modelo: 'Transportadora M', price: 29 },
          { name: 'Juguete Láser Interactivo', marca: 'PetComfort', modelo: 'Láser Interactivo', price: 9 },
        ],
      },
    ],
  },
];

const BANNERS = [
  {
    title: 'Oferta de Temporada',
    subtitle: 'Hasta 30% OFF en electrónica seleccionada',
    imageUrl: 'https://loremflickr.com/1600/600/sale?lock=90001',
    linkUrl: '/category/electronica',
    order: 0,
  },
  {
    title: 'Lanzamiento Exclusivo',
    subtitle: 'Descubre los nuevos smartphones 2026',
    imageUrl: 'https://loremflickr.com/1600/600/smartphone?lock=90002',
    linkUrl: '/category/smartphones',
    order: 1,
  },
  {
    title: 'Compra Fácil por WhatsApp',
    subtitle: 'Arma tu pedido y confírmalo en un solo mensaje',
    imageUrl: 'https://loremflickr.com/1600/600/delivery?lock=90003',
    linkUrl: '/products',
    order: 2,
  },
];

async function seedCatalog() {
  let created = 0;

  for (const category of CATALOG) {
    const mainCategory = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: { name: category.name, slug: slugify(category.name) },
    });

    for (const sub of category.subcategories) {
      const subCategory = await prisma.category.upsert({
        where: { name: sub.name },
        update: {},
        create: {
          name: sub.name,
          slug: slugify(sub.name),
          parentId: mainCategory.id,
        },
      });

      for (const [index, product] of sub.products.entries()) {
        const uniqueSeed = `${slugify(category.name)}-${slugify(sub.name)}-${index}`;

        await prisma.product.create({
          data: {
            name: product.name,
            description: `${product.name} de ${product.marca}. Buena relación calidad-precio, ideal para uso diario. Coordina tu compra directo por WhatsApp.`,
            price: product.price,
            images: productImages(sub.tag, uniqueSeed),
            marca: product.marca,
            modelo: product.modelo,
            colores: product.colors ?? '',
            categoryId: mainCategory.id,
            subCategoryId: subCategory.id,
            isActive: true,
            isOutOfStock: index % 11 === 0, // ~1 de cada 11, variedad sin exagerar
            views: Math.floor(Math.random() * 400),
          },
        });
        created += 1;
      }
    }
  }

  return created;
}

async function seedBanners() {
  let created = 0;

  for (const banner of BANNERS) {
    const existing = await prisma.banner.findFirst({
      where: { title: banner.title },
    });
    if (existing) continue;

    await prisma.banner.create({
      data: {
        imageUrl: banner.imageUrl,
        title: banner.title,
        subtitle: banner.subtitle,
        linkUrl: banner.linkUrl,
        order: banner.order,
        isActive: true,
      },
    });
    created += 1;
  }

  return created;
}

async function main() {
  // Guardrail: este seed es solo para probar la app en desarrollo (100
  // productos falsos con fotos de loremflickr.com). Nunca debe correr
  // contra la base de datos real de un cliente -- si alguien ejecuta
  // `npm run db:seed` apuntando por error a producción, esto corta antes de
  // insertar nada. Confirmar explícitamente con SEED_CONFIRM=true si de
  // verdad hace falta re-sembrar un entorno que se identifica como producción.
  if (process.env.NODE_ENV === 'production' && process.env.SEED_CONFIRM !== 'true') {
    console.error(
      'NODE_ENV=production: este seed no corre acá para evitar cargar datos de prueba en el catálogo real de un cliente.\n' +
        'Si de verdad querés sembrar este entorno, corré con SEED_CONFIRM=true.'
    );
    process.exit(1);
  }

  console.log('Seeding categorías, subcategorías y productos...');

  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log(
      `Ya existen ${existingProducts} productos en la base de datos. Se omite la carga de catálogo (idempotencia). Borra la tabla Product manualmente si quieres re-sembrar desde cero.`
    );
  } else {
    const createdProducts = await seedCatalog();
    console.log(`Catálogo sembrado: ${createdProducts} productos creados.`);
  }

  const createdBanners = await seedBanners();
  console.log(`Banners sembrados: ${createdBanners} nuevos (se omiten los que ya existían por título).`);

  console.log('Seed finalizado.');
}

main()
  .catch(e => {
    console.error('Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
