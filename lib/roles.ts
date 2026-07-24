// lib/roles.ts
import { redirect } from 'next/navigation';
import { auth } from './auth';

// No hay roles ni permisos: si existe sesión, es el admin
// (lib/auth.ts ya rechazó cualquier email distinto de ALLOWED_ADMIN_EMAIL).
export const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  return session.user;
};
