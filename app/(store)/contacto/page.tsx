// File: app/(store)/contacto/page.tsx
import { Metadata } from 'next';
import { MessageCircle, Sparkles, Headphones } from 'lucide-react';
import { ContactForm } from '@/components/contact-form';

export const metadata: Metadata = {
  title: 'Asesoría tecnológica',
  description: 'Solicita información o asesoría personalizada de productos.',
};

const highlights = [
  {
    icon: Sparkles,
    title: 'Asesoría a tu medida',
    description:
      'Cuéntanos qué necesitas y te ayudamos a encontrar la solución tecnológica correcta.',
  },
  {
    icon: MessageCircle,
    title: 'Respuesta directa',
    description:
      'Tu mensaje llega directo a nuestro equipo, sin formularios eternos ni esperas largas.',
  },
  {
    icon: Headphones,
    title: 'Soporte cercano',
    description:
      'Coordinamos contigo por el medio que prefieras para resolver todas tus dudas.',
  },
];

export default function ContactoPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Solicita asesoría tecnológica
          </h1>
          <p className="mt-3 text-muted-foreground">
            Explora nuestro catálogo y déjanos ayudarte a elegir. Completa el
            formulario y un asesor te contactará.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            {highlights.map(item => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-accent/10 text-primary-accent">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
