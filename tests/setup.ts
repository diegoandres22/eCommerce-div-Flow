// tests/setup.ts
// Setup mínimo para tests/unit: son funciones puras (lib/utils.ts), no
// componentes ni server actions -- no hace falta mockear React, next-auth,
// Prisma ni Stripe (el proyecto no usa Stripe).

// Timezone fija para que los tests de fechas sean deterministas.
process.env.TZ = 'UTC';
