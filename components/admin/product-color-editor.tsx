// File: components/admin/product-color-editor.tsx
'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  parseProductColors,
  serializeProductColors,
  type ProductColor,
} from '@/lib/product-colors';

// Editor de colores del producto (opcional, "cuando aplique"). Reutiliza
// `campoTextoGeneral` -- un string simple del schema -- serializando la
// lista como "Nombre:#hex,Nombre:#hex". El componente remonta cada vez que
// se abre el formulario (ver product-manager.tsx), así que inicializar el
// estado local a partir de `value` una sola vez es seguro.
export function ProductColorEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (serialized: string) => void;
}) {
  const [colors, setColors] = useState<ProductColor[]>(() =>
    parseProductColors(value)
  );
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#171717');

  const update = (next: ProductColor[]) => {
    setColors(next);
    onChange(serializeProductColors(next));
  };

  const addColor = () => {
    if (!name.trim()) return;
    update([...colors, { name: name.trim(), hex }]);
    setName('');
  };

  const removeColor = (index: number) => {
    update(colors.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <span
              key={`${color.name}-${index}`}
              className="flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-1.5 pr-2 text-xs"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border"
                style={{ backgroundColor: color.hex }}
              />
              {color.name}
              <button
                type="button"
                onClick={() => removeColor(index)}
                aria-label={`Quitar ${color.name}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={e => setHex(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
          aria-label="Elegir color"
        />
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del color (ej. Rojo)"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addColor();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addColor}
          disabled={!name.trim()}
          aria-label="Agregar color"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
