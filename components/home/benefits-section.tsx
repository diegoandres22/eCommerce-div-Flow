// File: components/home/benefits-section.tsx
import { ShoppingCart, MessageCircle, Laptop2 } from 'lucide-react';

const benefits = [
  {
    icon: ShoppingCart,
    title: 'Compra directa y ágil',
    description:
      'Arma tu carrito y coordina tu compra al instante, sin registros ni pasos innecesarios.',
  },
  {
    icon: MessageCircle,
    title: 'Gestión por WhatsApp',
    description:
      'Tu pedido llega preformateado directo al chat del vendedor para acordar la entrega.',
  },
  {
    icon: Laptop2,
    title: 'Catálogo tecnológico',
    description:
      'Explora soluciones y solicita asesorías personalizadas, todo en un solo lugar.',
  },
];

export function BenefitsSection() {
  return (
    <section className="border-y bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {benefits.map(benefit => (
            <div key={benefit.title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
