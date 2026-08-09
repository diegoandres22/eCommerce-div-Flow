// File: app/(store)/terminos/page.tsx
import { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal-page-layout';
import { STORE_CONFIG } from '@/lib/store-config';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Condiciones de uso y de compra de esta tienda.',
};

export default function TerminosPage() {
  const { nombre } = STORE_CONFIG;

  return (
    <LegalPageLayout title="Términos y Condiciones" updatedAt="agosto de 2026">
      <section>
        <h2>1. Objeto</h2>
        <p>
          {nombre} es un catálogo online. La compra no se procesa dentro del sitio: al confirmar tu
          carrito, se abre una conversación de WhatsApp con el detalle de tu pedido para coordinar
          pago y entrega directamente con nuestro equipo. No se procesan pagos ni se guardan datos
          de tarjetas en este sitio.
        </p>
      </section>

      <section>
        <h2>2. Precios y disponibilidad</h2>
        <p>
          Los precios y el stock mostrados pueden actualizarse sin previo aviso. La disponibilidad
          final de un producto se confirma al coordinar el pedido por WhatsApp.
        </p>
      </section>

      <section>
        <h2>3. Pago, entrega, cambios y devoluciones</h2>
        <p>
          Las condiciones de pago, tiempos y costos de entrega, y la política de cambios o
          devoluciones se acuerdan directamente por WhatsApp al confirmar cada pedido, ya que
          pueden variar según el producto, la zona de entrega o el medio de pago elegido.
        </p>
      </section>

      <section>
        <h2>4. Cuentas y acceso</h2>
        <p>
          Este sitio no requiere que el comprador cree una cuenta. El panel de administración
          (/admin) es de uso exclusivo del equipo de la tienda.
        </p>
      </section>

      <section>
        <h2>5. Propiedad del contenido</h2>
        <p>
          Las imágenes, textos y marca mostrados en este sitio pertenecen a {nombre} o a sus
          proveedores. Su reproducción con fines comerciales sin autorización queda prohibida.
        </p>
      </section>

      <section>
        <h2>6. Contacto</h2>
        <p>
          Para consultas sobre estos términos, usa el <a href="/contacto">formulario de contacto</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
