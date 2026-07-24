// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    // Único guardián de acceso: solo el admin configurado por env puede
    // crear sesión. No hay roles ni tabla de permisos.
    async signIn({ user }) {
      return user.email === process.env.ALLOWED_ADMIN_EMAIL;
    },
  },
});
