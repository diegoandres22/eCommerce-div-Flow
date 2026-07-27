// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';

// La cuenta de prueba da acceso admin completo sin pasar por Google -- solo
// debe existir en demos/staging. Requiere un opt-in explícito
// (ALLOW_TEST_ADMIN=true) ADEMÁS de TEST_ADMIN_USER/TEST_ADMIN_PASS: así,
// si un cliente nuevo clona el repo y se olvida de borrar esas variables de
// un .env de desarrollo, el provider ni siquiera se registra en producción
// -- no hay superficie de ataque que además intentar fuerza bruta.
const allowTestAdmin = process.env.ALLOW_TEST_ADMIN === 'true';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Cuenta de prueba (sin DB, sin Google) para que terceros puedan entrar
    // al panel con acceso completo. Ver ALLOW_TEST_ADMIN/TEST_ADMIN_USER/
    // TEST_ADMIN_PASS en .env -- nunca debe estar activa en producción.
    ...(allowTestAdmin
      ? [
          Credentials({
            id: 'credentials',
            name: 'Cuenta de prueba',
            credentials: {
              username: { label: 'Usuario', type: 'text' },
              password: { label: 'Contraseña', type: 'password' },
            },
            async authorize(credentials) {
              if (
                credentials?.username === process.env.TEST_ADMIN_USER &&
                credentials?.password === process.env.TEST_ADMIN_PASS
              ) {
                return { id: 'test-admin', name: 'Usuario de prueba', email: 'test-admin@local' };
              }
              return null;
            },
          }),
        ]
      : []),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    // Dos caminos de acceso, ambos con acceso completo (no hay roles ni tabla
    // de permisos): (1) Google, solo el email configurado en ALLOWED_ADMIN_EMAIL;
    // (2) credenciales de prueba, ya validadas dentro de authorize() arriba.
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true;
      return user.email === process.env.ALLOWED_ADMIN_EMAIL;
    },
  },
});
