// File: app/(store)/cookies/page.tsx
import { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal-page-layout';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Qué cookies usa esta tienda.',
};

export default function CookiesPage() {
  return (
    <LegalPageLayout title="Política de Cookies" updatedAt="agosto de 2026">
      <section>
        <h2>1. Qué usamos hoy</h2>
        <p>
          Este sitio guarda en tu navegador (localStorage, no una cookie tradicional) únicamente tu
          elección sobre el banner de cookies (&quot;Aceptar&quot; o &quot;Rechazar&quot;), y el
          contenido de tu carrito de compras para que no se pierda al recargar la página. No se
          instalan cookies de analítica, publicidad ni seguimiento de terceros.
        </p>
      </section>

      <section>
        <h2>2. Qué cambia si aceptás o rechazás</h2>
        <p>
          Hoy no cargamos ninguna cookie de analítica o publicidad, así que tu elección no cambia
          nada de inmediato: solo queda guardada para el futuro. Si más adelante incorporamos
          herramientas de analítica, solo se activarán si elegiste &quot;Aceptar&quot;.
        </p>
      </section>

      <section>
        <h2>3. Estadísticas internas</h2>
        <p>
          Registramos, sin cookies ni identificadores personales, cuántas veces se visita cada
          página del sitio, para un panel interno de administración. Esto no te identifica ni te
          sigue entre sitios.
        </p>
      </section>

      <section>
        <h2>4. Cómo cambiar tu elección</h2>
        <p>
          Podés borrar la preferencia guardada eliminando los datos de sitio almacenados por tu
          navegador para este dominio; el banner volverá a aparecer en tu siguiente visita.
        </p>
      </section>
    </LegalPageLayout>
  );
}
