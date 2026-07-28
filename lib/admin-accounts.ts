// Location: lib/admin-accounts.ts
//
// Centraliza el parseo de las dos listas de administradores que soporta el
// login (ver lib/auth.ts) -- ambas viven en una sola línea del .env, en
// formato separado por comas, para que sumar o sacar un admin sea editar esa
// línea y redeploy, sin tocar código ni pisar el hash de los demás.

// Google: ALLOWED_ADMIN_EMAILS="correo1@gmail.com,correo2@gmail.com" --
// cualquier email de la lista puede entrar por Google. Comparación
// case-insensitive (Gmail no distingue mayúsculas/minúsculas en la parte
// local del correo).
export function getAllowedAdminEmails(): string[] {
  return (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowedAdminEmails().includes(email.trim().toLowerCase());
}

// Usuario y contraseña: ADMIN_CREDENTIALS="correo1@dominio.com:\$2b\$10\$hash1,
// diego_prueba:\$2b\$10\$hash2" -- un par "usuario:hash" por admin, hash
// generado una sola vez con bcrypt (ver .env.example), nunca la contraseña
// en texto plano. El "usuario" no tiene por qué ser un email real -- puede
// ser un correo real (admin de producción) o un usuario simple como
// "diego_prueba" (cuenta de prueba, ver lib/auth.ts sobre el email ficticio
// que se le asigna internamente). El hash de bcrypt no usa comas ni dos
// puntos, así que separar por "," y "primeros dos puntos" es seguro.
//
// OJO al cargar el .env: cada "$" del hash tiene que escaparse como "\$" --
// Next.js expande "$algo" dentro de un .env como si fuera una referencia a
// otra variable (ej. "$2a" -> variable "2a", no existe, se reemplaza por
// vacío). Sin el escape, el hash llega vacío acá y ese admin desaparece
// silenciosamente de la lista (el `.filter(cred => ... && cred.passwordHash)`
// de abajo lo descarta por no tener hash).
export interface AdminCredential {
  email: string;
  passwordHash: string;
}

export function getAdminCredentials(): AdminCredential[] {
  return (process.env.ADMIN_CREDENTIALS ?? '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
      const separatorIndex = entry.indexOf(':');
      return {
        email: entry.slice(0, separatorIndex).trim().toLowerCase(),
        passwordHash: entry.slice(separatorIndex + 1).trim(),
      };
    })
    .filter(cred => cred.email && cred.passwordHash);
}
