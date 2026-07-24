// File: app/auth/signin/page.tsx
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { GoogleIcon } from '@/components/icons/google-icon';

async function signInWithGoogle() {
  'use server';
  await signIn('google', { redirectTo: '/admin' });
}

async function signInWithCredentials(formData: FormData) {
  'use server';
  await signIn('credentials', {
    username: formData.get('username'),
    password: formData.get('password'),
    redirectTo: '/admin',
  });
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-xl font-bold">Acceso administrador</h1>
          <p className="text-sm text-muted-foreground">
            Entra con el email autorizado o con la cuenta de prueba.
          </p>
        </div>

        {searchParams?.error && (
          <p className="rounded-md bg-destructive/10 p-2 text-center text-sm text-destructive">
            Usuario o contraseña incorrectos.
          </p>
        )}

        <form action={signInWithGoogle}>
          <Button
            type="submit"
            variant="outline"
            className="w-full gap-2 bg-white text-gray-700 hover:bg-gray-50 dark:bg-white dark:hover:bg-gray-100"
          >
            <GoogleIcon className="h-5 w-5" />
            Entrar con Google
          </Button>
        </form>

        <div className="relative flex items-center">
          <div className="flex-1 border-t" />
          <span className="px-3 text-xs text-muted-foreground">
            o cuenta de prueba
          </span>
          <div className="flex-1 border-t" />
        </div>

        <form action={signInWithCredentials} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              name="username"
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" variant="outline" className="w-full">
            Entrar como invitado
          </Button>
        </form>
      </div>
    </div>
  );
}
