// File: app/(store)/privacidad/page.tsx
import { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal-page-layout';
import { STORE_CONFIG } from '@/lib/store-config';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo tratamos tus datos en esta tienda.',
};

export default function PrivacidadPage() {
  const { nombre, correoSoporte } = STORE_CONFIG;
  const hasEmail = Boolean(correoSoporte);

  return (
    <LegalPageLayout title="Política de Privacidad" updatedAt="agosto de 2026">
      <section>
        <h2>1. Responsable</h2>
        <p>
          Esta tienda ({nombre}) es operada como un canal de venta por catálogo con confirmación
          de pedido por WhatsApp.{' '}
          {hasEmail ? (
            <>
              Para cualquier consulta sobre esta política, escríbenos a{' '}
              <a href={`mailto:${correoSoporte}`}>{correoSoporte}</a>.
            </>
          ) : (
            <>
              Para cualquier consulta sobre esta política, usa el{' '}
              <a href="/contacto">formulario de contacto</a>.
            </>
          )}
        </p>
      </section>

      <section>
        <h2>2. Qué datos recopilamos</h2>
        <p>
          No hay creación de cuentas de cliente ni pasarela de pago en este sitio. Los datos que
          podemos llegar a recibir son:
        </p>
        <p>
          <strong>Formulario de asesoría (/contacto):</strong> nombre, email, teléfono opcional y
          el mensaje que escribas. Se envía directo por correo a nuestro equipo y no queda
          guardado en nuestra base de datos.
        </p>
        <p>
          <strong>Carrito y confirmación por WhatsApp:</strong> al tocar &quot;Confirmar pedido&quot;
          guardamos internamente los productos y el monto del carrito (sin tu nombre ni contacto)
          para nuestro panel de seguimiento de pedidos. Tu nombre, teléfono y dirección solo los
          compartes vos, directamente, dentro de la conversación de WhatsApp que se abre — nosotros
          no los capturamos por otra vía.
        </p>
        <p>
          <strong>Estadísticas de navegación:</strong> registramos internamente cuántas veces se
          visita cada página del sitio (para saber qué se visita más), sin asociar esa cifra a tu
          identidad, tu IP ni ningún identificador personal.
        </p>
      </section>

      <section>
        <h2>3. Cookies</h2>
        <p>
          Actualmente no usamos cookies de analítica, publicidad ni seguimiento de ningún tipo. Si
          en el futuro se incorpora alguna, se pedirá tu consentimiento explícito antes de
          activarla. Ver{' '}
          <a href="/cookies">Política de Cookies</a>.
        </p>
      </section>

      <section>
        <h2>4. Con quién compartimos tus datos</h2>
        <p>
          No vendemos ni compartimos tus datos con terceros con fines publicitarios. El mensaje del
          formulario de asesoría se envía mediante un proveedor de correo (SMTP) exclusivamente
          para hacerlo llegar a nuestro equipo.
        </p>
      </section>

      <section>
        <h2>5. Tus derechos</h2>
        <p>
          Podés pedir en cualquier momento que eliminemos un mensaje que nos hayas enviado, o
          consultar qué datos tuyos conservamos, escribiendo por los mismos medios de contacto de
          esta página.
        </p>
      </section>
    </LegalPageLayout>
  );
}
