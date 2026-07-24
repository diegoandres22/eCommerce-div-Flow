// lib/whatsapp.ts
import { formatPrice } from './utils';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
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
      `- ${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`
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
