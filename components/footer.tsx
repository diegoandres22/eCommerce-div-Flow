// Location: components/footer.tsx
import Link from 'next/link';
import { Instagram, Facebook, Music2, Mail, MapPin } from 'lucide-react';
import { STORE_CONFIG } from '@/lib/store-config';

export function Footer() {
  const { nombre, correoSoporte, direccion, instagram, tiktok, facebook } =
    STORE_CONFIG;
  const hasSocial = instagram || tiktok || facebook;
  const hasContactLine = correoSoporte || direccion;

  return (
    <footer className="mt-12 border-t bg-card">
      <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-8 text-center">
        <Link
          href="/contacto"
          className="text-sm font-medium text-primary-accent hover:underline"
        >
          Solicitar asesoría tecnológica
        </Link>

        {/* Redes y datos de contacto adicionales: todo opcional, solo se
            renderiza lo que el cliente cargó en lib/store-config.ts. */}
        {hasSocial && (
          <div className="flex items-center gap-4">
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-muted-foreground transition-colors hover:text-primary-accent"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {tiktok && (
              <a
                href={tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-muted-foreground transition-colors hover:text-primary-accent"
              >
                <Music2 className="h-5 w-5" />
              </a>
            )}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-muted-foreground transition-colors hover:text-primary-accent"
              >
                <Facebook className="h-5 w-5" />
              </a>
            )}
          </div>
        )}

        {hasContactLine && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {correoSoporte && (
              <a
                href={`mailto:${correoSoporte}`}
                className="flex items-center gap-1 hover:text-primary-accent"
              >
                <Mail className="h-3.5 w-3.5" />
                {correoSoporte}
              </a>
            )}
            {direccion && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {direccion}
              </span>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {nombre}. Todos los derechos reservados.
        </p>
        <p className="text-sm text-muted-foreground">
          Hecho por{' '}
          <a
            href="https://diego-dev-psi.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground transition-colors hover:text-primary-accent"
          >
            &lt;div&gt;Flow c.a.
          </a>
        </p>
      </div>
    </footer>
  );
}
