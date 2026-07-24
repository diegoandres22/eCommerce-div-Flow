// File: components/logout-button.tsx
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/lib/actions/auth-actions';

// Botón de logout reutilizable (navbar público y sidebar del admin), siempre
// en rojo (variant="destructive") e invocando signOut() de Auth.js v5.
export function LogoutButton({
  iconOnly = false,
  className,
}: {
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant="destructive"
        size={iconOnly ? 'icon' : 'sm'}
        className={className ? `gap-1 ${className}` : 'gap-1'}
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
        {!iconOnly && 'Cerrar sesión'}
      </Button>
    </form>
  );
}
