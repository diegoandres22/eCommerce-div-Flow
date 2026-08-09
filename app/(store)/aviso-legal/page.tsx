// File: app/(store)/aviso-legal/page.tsx
import { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal-page-layout';
import { STORE_CONFIG } from '@/lib/store-config';

export const metadata: Metadata = {
  title: 'Aviso Legal',
  description: 'Identificación del responsable de esta tienda.',
};

export default function AvisoLegalPage() {
  const { nombre, correoSoporte, direccion } = STORE_CONFIG;

  return (
    <LegalPageLayout title="Aviso Legal" updatedAt="agosto de 2026">
      <section>
        <h2>1. Titular del sitio</h2>
        <p>
          Este sitio web es operado bajo el nombre comercial <strong>{nombre}</strong>
          {direccion ? <>, con domicilio en {direccion}</> : null}.
        </p>
        <p>
          {correoSoporte ? (
            <>
              Contacto: <a href={`mailto:${correoSoporte}`}>{correoSoporte}</a>.
            </>
          ) : (
            <>
              Contacto disponible a través del <a href="/contacto">formulario de contacto</a>.
            </>
          )}
        </p>
      </section>

      <section>
        <h2>2. Naturaleza del sitio</h2>
        <p>
          Este sitio funciona como catálogo online con confirmación de pedido por WhatsApp. No
          procesa pagos ni almacena datos de tarjetas, y no requiere registro de cuenta para
          navegar o consultar productos.
        </p>
      </section>

      <section>
        <h2>3. Desarrollo</h2>
        <p>
          Sitio desarrollado por{' '}
          <a href="https://diego-dev-psi.vercel.app/" target="_blank" rel="noopener noreferrer">
            &lt;div&gt;Flow c.a.
          </a>
          . Las consultas técnicas sobre el desarrollo del sitio no reemplazan el contacto
          comercial con {nombre} para temas de compra o pedidos.
        </p>
      </section>
    </LegalPageLayout>
  );
}
