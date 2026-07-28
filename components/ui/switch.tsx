// File: components/ui/switch.tsx
'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Micro-spinner en el thumb + bloquea el control mientras una request está en curso. */
  loading?: boolean;
}

// Switch accesible (role="switch") sin depender de @radix-ui/react-switch --
// el proyecto no la tenía instalada y el control es simple de replicar a
// mano con el mismo criterio que ya se usó para el selector de país
// (components/admin/phone-number-input.tsx): evitar una dependencia nueva
// para algo que no la necesita.
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, loading, disabled, className, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-busy={loading}
        disabled={isDisabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed',
          // bg-primary-accent (no bg-primary): el track "on" es un fondo
          // sólido sin texto encima que lo pareje -- si el color de marca es
          // oscuro, en dark mode quedaba casi del mismo tono que el fondo de
          // la card contenedora, y el switch encendido se volvía difícil de
          // distinguir del apagado a simple vista.
          checked ? 'bg-primary-accent' : 'bg-input',
          loading && 'opacity-70',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-lg transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        >
          {loading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </span>
      </button>
    );
  }
);
Switch.displayName = 'Switch';
