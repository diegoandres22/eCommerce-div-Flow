// File: components/admin/product-size-editor.tsx
'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseProductSizes, serializeProductSizes } from '@/lib/product-sizes';

// Editor de tallas del producto (opcional, independiente de los colores).
// Mismo patrón que ProductColorEditor pero sin selector de color: cada
// talla es solo texto libre (numérico o letra). El componente remonta cada
// vez que se abre el formulario (ver product-manager.tsx), así que
// inicializar el estado local a partir de `value` una sola vez es seguro.
export function ProductSizeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (serialized: string) => void;
}) {
  const [sizes, setSizes] = useState<string[]>(() => parseProductSizes(value));
  const [size, setSize] = useState('');

  const update = (next: string[]) => {
    setSizes(next);
    onChange(serializeProductSizes(next));
  };

  const addSize = () => {
    const trimmed = size.trim();
    if (!trimmed || sizes.includes(trimmed)) return;
    update([...sizes, trimmed]);
    setSize('');
  };

  const removeSize = (index: number) => {
    update(sizes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {sizes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sizes.map((s, index) => (
            <span
              key={`${s}-${index}`}
              className="flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-2.5 pr-2 text-xs"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSize(index)}
                aria-label={`Quitar talla ${s}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={size}
          onChange={e => setSize(e.target.value)}
          placeholder="Talla (ej. M o 42)"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSize();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addSize}
          disabled={!size.trim()}
          aria-label="Agregar talla"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
