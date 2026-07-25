// File: components/share-buttons.tsx
'use client';

import { Facebook, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { useToast } from '@/components/ui/use-toast';

export function ShareButtons({
  productName,
  url,
}: {
  productName: string;
  url: string;
}) {
  const { toast } = useToast();

  const message = `Mira este producto: ${productName} - ${url}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Enlace copiado al portapapeles' });
    } catch {
      toast({
        title: 'No se pudo copiar el enlace',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Compartir:</span>
      <Button asChild variant="outline" size="icon" className="h-9 w-9">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir por WhatsApp"
        >
          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
        </a>
      </Button>
      <Button asChild variant="outline" size="icon" className="h-9 w-9">
        <a
          href={facebookHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en Facebook"
        >
          <Facebook className="h-4 w-4 text-[#1877F2]" />
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={copyLink}
        aria-label="Copiar enlace"
      >
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
