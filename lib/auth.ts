// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { STORE_CONFIG } from './store-config';
import { checkRateLimit, getClientIp } from './rate-limit';
import { getAdminCredentials, isAllowedAdminEmail } from './admin-accounts';

// Login con correo y contraseña, alternativo a Google -- gateado por
// STORE_CONFIG.permitirLoginConCredenciales (por cliente, ver
// store-config.ts) Y por tener al menos un admin cargado en
// ADMIN_CREDENTIALS (ver lib/admin-accounts.ts, soporta varios). Si falta
// cualquiera de las dos cosas, el provider ni se registra: no hay superficie
// de ataque extra por accidente en un cliente que no pidió esta opción.
//
// La contraseña NUNCA se guarda en texto plano -- cada entrada de
// ADMIN_CREDENTIALS lleva un hash de bcrypt (generado una sola vez, ver
// .env.example). Así, alguien con acceso de lectura a las env vars de Vercel
// ve un hash, no la contraseña real. La comparación usa bcrypt.compare(),
// que además es resistente a ataques de timing (a diferencia de comparar
// strings con ===).
const adminCredentials = getAdminCredentials();
const credentialsLoginEnabled =
  STORE_CONFIG.permitirLoginConCredenciales && adminCredentials.length > 0;

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
            name: 'Usuario y contraseña',
            // "usuario" (no "email"): el identificador de cada fila de
            // ADMIN_CREDENTIALS no tiene por qué ser un correo real -- sirve
            // tanto para un admin real (su email) como para una cuenta de
            // prueba con un usuario simple (ej. "diego_prueba"), ya que la
            // comparación es un simple match de string, no una validación de
            // formato de email.
            credentials: {
              usuario: { label: 'Usuario o correo', type: 'text' },
              password: { label: 'Contraseña', type: 'password' },
            },
            async authorize(credentials, request) {
              // 5 intentos / 15 min por IP -- es un login real de admin
              // expuesto a internet, más estricto que los endpoints
              // públicos (leads/contacto).
              const ip = getClientIp(request);
              const { allowed } = checkRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
              if (!allowed) return null;

              const usuario = credentials?.usuario;
              const password = credentials?.password;
              if (typeof usuario !== 'string' || typeof password !== 'string') {
                return null;
              }

              const account = adminCredentials.find(
                c => c.email === usuario.trim().toLowerCase()
              );
              if (!account) return null;

              const valid = await bcrypt.compare(password, account.passwordHash);
              if (!valid) return null;

              // Auth.js/Prisma exigen un `email` en el objeto de usuario --
              // si el identificador de esta cuenta no tiene forma de email
              // (ej. "diego_prueba"), se le agrega un dominio interno ficticio
              // solo para satisfacer ese requisito; nunca se usa para enviar
              // correos ni se muestra tal cual en ningún lado sensible.
              const email = account.email.includes('@')
                ? account.email
                : `${account.email}@admin.local`;

              return {
                id: `admin-credentials:${account.email}`,
                name: 'Administrador',
                email,
              };
            },
          }),
        ]
      : []),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    // Dos caminos de acceso, ambos con acceso completo (no hay roles ni tabla
    // de permisos): (1) Google, cualquier email de ALLOWED_ADMIN_EMAILS
    // (lista, ver lib/admin-accounts.ts); (2) credenciales, ya validadas
    // dentro de authorize() arriba (busca el email en ADMIN_CREDENTIALS).
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true;
      return isAllowedAdminEmail(user.email);
    },
  },
});
