// File: components/logout-button.tsx
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/lib/actions/auth-actions';
import { cn } from '@/lib/utils';

// Botón de logout reutilizable, invoca signOut() de Auth.js v5.
// variant="solid" (admin sidebar): botón rojo sólido.
// variant="ghost" (navbar público): fondo blanco/transparente sin borde,
// solo el ícono en rojo.
export function LogoutButton({
  iconOnly = false,
  variant = 'solid',
  className,
}: {
  iconOnly?: boolean;
  variant?: 'solid' | 'ghost';
  className?: string;
}) {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant={variant === 'ghost' ? 'ghost' : 'destructive'}
        size={iconOnly ? 'icon' : 'sm'}
        className={cn(
          'gap-1',
          variant === 'ghost' &&
            'text-red-600 hover:bg-transparent hover:text-red-700 dark:text-red-500 dark:hover:text-red-400',
          className
        )}
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
        {!iconOnly && 'Cerrar sesión'}
      </Button>
    </form>
  );
}
