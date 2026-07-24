// Location: components/footer.tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-12 border-t bg-card">
      <div className="container mx-auto flex flex-col items-center gap-2 px-4 py-8 text-center">
        <Link
          href="/contacto"
          className="text-sm font-medium text-primary hover:underline"
        >
          Solicitar asesoría tecnológica
        </Link>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} E-commerce Store. Todos los derechos
          reservados.
        </p>
        <p className="text-sm text-muted-foreground">
          Hecho por{' '}
          <a
            href="https://diego-dev-psi.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground transition-colors hover:text-primary"
          >
            &lt;div&gt;Flow c.a.
          </a>
        </p>
      </div>
    </footer>
  );
}
