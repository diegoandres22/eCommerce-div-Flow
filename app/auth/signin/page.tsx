// File: app/auth/signin/page.tsx
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';
import { STORE_CONFIG } from '@/lib/store-config';
import { getAdminCredentials } from '@/lib/admin-accounts';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { GoogleIcon } from '@/components/icons/google-icon';
import { Logo } from '@/components/logo';

async function signInWithGoogle() {
  'use server';
  await signIn('google', { redirectTo: '/admin' });
}

async function signInWithCredentials(formData: FormData) {
  'use server';
  try {
    await signIn('credentials', {
      usuario: formData.get('usuario'),
      password: formData.get('password'),
      redirectTo: '/admin',
    });
  } catch (error) {
    // signIn() también usa "throw" para su propia redirección en el caso
    // de éxito (NEXT_REDIRECT), así que solo interceptamos los errores
    // reales de Auth.js y dejamos pasar cualquier otro throw.
    if (error instanceof AuthError) {
      redirect('/auth/signin?error=CredentialsSignin');
    }
    throw error;
  }
}

export default async function SignInPage({
  searchParams,
}: {
  // Next.js 15: searchParams es una Promise, hay que resolverla antes de leer
  // sus propiedades (ver nextjs.org/docs/messages/sync-dynamic-apis).
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // Mismo criterio que lib/auth.ts: si este cliente no tiene habilitado el
  // login con credenciales, ni siquiera se muestra el formulario (evita
  // confundir/invitar a probar un login que siempre va a fallar).
  const credentialsLoginEnabled =
    STORE_CONFIG.permitirLoginConCredenciales &&
    getAdminCredentials().length > 0;
  return (
    <div className="flex min-h-screen">
      {/* Panel de imagen: solo visible md+, la imagen y el overlay no
          afectan el formulario en absoluto. */}
      <div className="relative hidden w-1/2 md:block">
        <Image
          src="/images/robot-login.jpg"
          alt="Flow eCommerce"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-black/10 to-black/40" />
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-8 px-4 md:w-1/2">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <h1 className="text-2xl font-bold sm:text-3xl">E-commerce Store</h1>
        </div>

        <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold">Panel de Administrador</h2>
          <p className="text-sm text-muted-foreground">
            {credentialsLoginEnabled
              ? 'Entra con un email autorizado o con tu usuario y contraseña'
              : 'Entra con un email autorizado'}
          </p>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 p-2 text-center text-sm text-destructive">
            Usuario o contraseña incorrectos.
          </p>
        )}

        <form action={signInWithGoogle}>
          <SubmitButton
            variant="outline"
            loadingText="Conectando..."
            className="w-full bg-white text-gray-700 hover:bg-gray-50 dark:bg-white dark:hover:bg-gray-100"
          >
            <GoogleIcon className="h-5 w-5" />
            Entrar con Google
          </SubmitButton>
        </form>

        {credentialsLoginEnabled && (
          <>
            <div className="relative flex items-center">
              <div className="flex-1 border-t" />
              <span className="px-3 text-xs text-muted-foreground">
                o usuario y contraseña
              </span>
              <div className="flex-1 border-t" />
            </div>

            <form action={signInWithCredentials} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="usuario">Usuario o correo</Label>
                <Input
                  id="usuario"
                  name="usuario"
                  type="text"
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
              <SubmitButton
                variant="outline"
                loadingText="Verificando..."
                className="w-full"
              >
                Ingresar
              </SubmitButton>
            </form>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
