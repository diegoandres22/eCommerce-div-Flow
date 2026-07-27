// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { STORE_CONFIG } from './store-config';
import { checkRateLimit, getClientIp } from './rate-limit';

// Login con correo y contraseña, alternativo a Google -- gateado por
// STORE_CONFIG.permitirLoginConCredenciales (por cliente, ver
// store-config.ts) Y por tener ADMIN_LOGIN_EMAIL/ADMIN_PASSWORD_HASH
// cargadas. Si falta cualquiera de las dos cosas, el provider ni se
// registra: no hay superficie de ataque extra por accidente en un cliente
// que no pidió esta opción.
//
// La contraseña NUNCA se guarda en texto plano -- ADMIN_PASSWORD_HASH es un
// hash de bcrypt (generado una sola vez, ver .env.example). Así, alguien con
// acceso de lectura a las env vars de Vercel ve un hash, no la contraseña
// real. La comparación usa bcrypt.compare(), que además es resistente a
// ataques de timing (a diferencia de comparar strings con ===).
const credentialsLoginEnabled =
  STORE_CONFIG.permitirLoginConCredenciales &&
  !!process.env.ADMIN_LOGIN_EMAIL &&
  !!process.env.ADMIN_PASSWORD_HASH;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    ...(credentialsLoginEnabled
      ? [
          Credentials({
            id: 'credentials',
            name: 'Correo y contraseña',
            credentials: {
              email: { label: 'Correo', type: 'email' },
              password: { label: 'Contraseña', type: 'password' },
            },
            async authorize(credentials, request) {
              // 5 intentos / 15 min por IP -- es un login real de admin
              // expuesto a internet, más estricto que los endpoints
              // públicos (leads/contacto).
              const ip = getClientIp(request);
              const { allowed } = checkRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
              if (!allowed) return null;

              const email = credentials?.email;
              const password = credentials?.password;
              if (typeof email !== 'string' || typeof password !== 'string') {
                return null;
              }

              if (email !== process.env.ADMIN_LOGIN_EMAIL) return null;

              const valid = await bcrypt.compare(
                password,
                process.env.ADMIN_PASSWORD_HASH!
              );
              if (!valid) return null;

              return { id: 'admin-credentials', name: 'Administrador', email };
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
