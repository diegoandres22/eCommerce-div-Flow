// File: components/legal-page-layout.tsx
//
// Wrapper compartido por las 4 páginas legales (privacidad, términos,
// aviso-legal, cookies) para no repetir el mismo contenedor/tipografía en
// cada una.
export function LegalPageLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última actualización: {updatedAt}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_a]:text-primary-accent [&_a]:underline [&_a:hover]:no-underline">
        {children}
      </div>

      <p className="mt-12 border-t pt-6 text-xs text-muted-foreground">
        Este documento es un modelo de referencia y no reemplaza la revisión de un abogado,
        especialmente en función de tu jurisdicción y la de tus clientes.
      </p>
    </div>
  );
}
