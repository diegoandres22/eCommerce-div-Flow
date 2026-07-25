// File: app/manifest.ts
// Next.js sirve este archivo automáticamente en /manifest.webmanifest y
// agrega el <link rel="manifest"> al <head> sin configuración adicional.
import type { MetadataRoute } from 'next';
import { STORE_CONFIG } from '@/lib/store-config';

export default function manifest(): MetadataRoute.Manifest {
  const { nombre, descripcion } = STORE_CONFIG;

  return {
    name: nombre,
    short_name: nombre,
    description: descripcion,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
