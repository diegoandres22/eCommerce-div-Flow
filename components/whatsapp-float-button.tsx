// File: components/whatsapp-float-button.tsx
import { getWhatsappNumber } from '@/server/queries/settings';
import { buildWhatsAppGeneralLink } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

// Server Component: lee el número desde ConfiguracionTienda en cada render.
// Si no hay número configurado todavía, simplemente no se muestra el botón.
export async function WhatsAppFloatButton() {
  const whatsappNumber = await getWhatsappNumber();
  if (!whatsappNumber) return null;

  return (
    <a
      href={buildWhatsAppGeneralLink(whatsappNumber)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
