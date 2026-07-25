// File: components/trust-badges.tsx
import { ShieldCheck, Truck, Headphones } from 'lucide-react';

const badges = [
  { icon: Headphones, label: 'Asesoría técnica incluida' },
  { icon: ShieldCheck, label: 'Compra 100% segura' },
  { icon: Truck, label: 'Entrega coordinada por WhatsApp' },
];

export function TrustBadges() {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/40 p-4 sm:grid-cols-3">
      {badges.map(badge => (
        <div key={badge.label} className="flex items-center gap-2 text-sm">
          <badge.icon className="h-5 w-5 shrink-0 text-primary" />
          <span>{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
