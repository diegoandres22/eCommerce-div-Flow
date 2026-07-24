// File: app/auth/signin/page.tsx
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8 text-center">
        <h1 className="text-xl font-bold">Acceso administrador</h1>
        <p className="text-sm text-muted-foreground">
          Solo el email autorizado puede entrar al panel.
        </p>
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/admin' });
          }}
        >
          <Button type="submit" className="w-full">
            Entrar con Google
          </Button>
        </form>
      </div>
    </div>
  );
}
