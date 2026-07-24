// File: components/contact-form.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const emptyForm = { name: '', email: '', phone: '', message: '' };

export function ContactForm() {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'No se pudo enviar',
          description:
            data.error?.formErrors?.join(', ') ||
            data.error ||
            'Intenta de nuevo en unos minutos.',
          variant: 'destructive',
        });
        return;
      }

      setSent(true);
      setForm(emptyForm);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <h3 className="text-lg font-semibold">¡Solicitud enviada!</h3>
        <p className="text-sm text-muted-foreground">
          Te contactaremos pronto para asesorarte.
        </p>
        <Button variant="outline" size="sm" onClick={() => setSent(false)}>
          Enviar otra solicitud
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="phone">Teléfono (opcional)</Label>
        <Input
          id="phone"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="message">¿En qué necesitas asesoría?</Label>
        <textarea
          id="message"
          className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Cuéntanos qué producto o solución estás buscando..."
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
        <Send className="h-4 w-4" />
        {isSubmitting ? 'Enviando...' : 'Solicitar asesoría'}
      </Button>
    </form>
  );
}
