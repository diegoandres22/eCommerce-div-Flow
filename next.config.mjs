// Content-Security-Policy real, acotada a los dominios que el proyecto
// efectivamente usa. `script-src`/`style-src` necesitan 'unsafe-inline'
// porque Next.js App Router inyecta scripts y estilos inline en el HTML
// (hidratación, streaming) -- hacerlo sin eso requiere nonces generados por
// middleware en cada request, complejidad que no se justifica para este
// MVP. Igual protege lo que más importa: bloquea cargar scripts/estilos
// desde un dominio externo inyectado por un atacante (la forma más común de
// explotar un XSS), que es el riesgo real de no tener CSP en absoluto.
// loremflickr.com es solo para el seed de desarrollo (prisma/seed.ts) --
// sacarlo de acá junto con el remotePatterns de abajo antes de producción
// con un cliente real.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co https://loremflickr.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Solo para imágenes de prueba del seed de desarrollo (prisma/seed.ts):
      // fotos reales de Flickr (CC) filtradas por keyword, no paisajes
      // aleatorios como picsum.photos. Quitar este bloque antes de pasar a
      // producción con un cliente real.
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/sitemap',
      },
      {
        source: '/robots.txt',
        destination: '/robots',
      },
    ];
  },
  async headers() {
    return [
      {
        // Headers de seguridad en TODAS las rutas.
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
