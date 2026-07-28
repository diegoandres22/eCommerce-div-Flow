// lib/whatsapp.ts
import { formatPrice } from './utils';

interface OrderItem {
  name: string;
  colorName?: string;
  talla?: string;
  quantity: number;
  price: number;
}

// Color y talla son independientes entre sí -- un ítem puede traer los dos,
// uno solo, o ninguno. Arma "(Color, Talla)" con lo que haya, sin paréntesis
// vacíos cuando no hay ninguno de los dos.
function formatItemDetails(item: OrderItem): string {
  const details = [item.colorName, item.talla].filter(Boolean);
  return details.length > 0 ? ` (${details.join(', ')})` : '';
}

// Arma el link wa.me con el resumen del pedido preformateado.
// whatsappNumber debe venir ya limpio (solo dígitos, formato internacional).
export function buildWhatsAppOrderLink(
  whatsappNumber: string,
  items: OrderItem[],
  total: number
) {
  const lines = items.map(
    item =>
      `- ${item.name}${formatItemDetails(item)} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`
  );

  const message = [
    'Hola! Quiero hacer un pedido:',
    '',
    ...lines,
    '',
    `Total: ${formatPrice(total)}`,
  ].join('\n');

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// Link genérico para el botón flotante: consultas o asesoría, sin resumen de pedido.
export function buildWhatsAppGeneralLink(whatsappNumber: string) {
  const message = 'Hola! Tengo una consulta / quiero recibir asesoría técnica.';
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
