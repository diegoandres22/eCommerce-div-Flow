// Location: components/ui/required-mark.tsx

// Asterisco rojo estándar para etiquetas de campos obligatorios en
// formularios de Admin (según lo que cada schema de lib/validators.ts
// exige realmente, no una convención visual arbitraria).
export function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {' '}
      *
    </span>
  );
}
