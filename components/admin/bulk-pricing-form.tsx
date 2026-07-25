// File: components/admin/bulk-pricing-form.tsx
'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@prisma/client';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';

type Scope = 'category' | 'manual' | 'all';
type AdjustmentType = 'percentage' | 'fixed';

interface ProductRow {
  id: string;
  name: string;
  price: number | string;
  categoryId: string;
  subCategoryId: string | null;
  category: { name: string };
}

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: 'category', label: 'Por categoría o subcategoría' },
  { value: 'manual', label: 'Selección manual' },
  { value: 'all', label: 'Todo el catálogo' },
];

export function BulkPricingForm({
  categories,
  products,
}: {
  categories: Category[];
  products: ProductRow[];
}) {
  const [scope, setScope] = useState<Scope>('category');
  const [categoryId, setCategoryId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>(
    'percentage'
  );
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const filteredProducts = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : products;

  // Preview: a cuántos productos afectaría esta configuración ahora mismo.
  const affectedCount = useMemo(() => {
    if (scope === 'all') return products.length;
    if (scope === 'manual') return selectedIds.size;
    if (scope === 'category' && categoryId) {
      return products.filter(
        p => p.categoryId === categoryId || p.subCategoryId === categoryId
      ).length;
    }
    return 0;
  }, [scope, categoryId, selectedIds, products]);

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds(prev => {
      const allSelected = filteredProducts.every(p => prev.has(p.id));
      const next = new Set(prev);
      filteredProducts.forEach(p =>
        allSelected ? next.delete(p.id) : next.add(p.id)
      );
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericValue = Number(value);

    if (!numericValue || Number.isNaN(numericValue)) {
      toast({
        title: 'Ingresa un valor válido',
        description: 'Usa un número distinto de 0 (negativo para bajar).',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/bulk-pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          categoryId: scope === 'category' ? categoryId : undefined,
          productIds: scope === 'manual' ? Array.from(selectedIds) : undefined,
          adjustmentType,
          value: numericValue,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'No se pudo actualizar',
          description: data.error?.formErrors?.join(', ') || data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: `Precios actualizados: ${data.updatedCount} producto(s)`,
      });
      setValue('');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Label>Alcance</Label>
        <div className="flex flex-wrap gap-2">
          {SCOPE_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              type="button"
              variant={scope === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScope(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {scope === 'category' && (
        <div className="max-w-sm">
          <Label>Categoría o subcategoría</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Elige una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.parentId ? `— ${category.name}` : category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {scope === 'manual' && (
        <div className="space-y-2 rounded-md border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  filteredProducts.length > 0 &&
                  filteredProducts.every(p => selectedIds.has(p.id))
                }
                onChange={toggleAllFiltered}
              />
              Seleccionar todos los visibles
            </label>
            <span className="text-muted-foreground">
              {selectedIds.size} seleccionado(s)
            </span>
          </div>

          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filteredProducts.map(product => (
              <label
                key={product.id}
                className="flex items-center gap-3 rounded p-2 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => toggleProduct(product.id)}
                />
                <span className="flex-1 truncate">{product.name}</span>
                <span className="text-muted-foreground">
                  {product.category.name}
                </span>
                <span className="font-medium">
                  {formatPrice(Number(product.price))}
                </span>
              </label>
            ))}
            {filteredProducts.length === 0 && (
              <p className="p-2 text-sm text-muted-foreground">
                Sin productos que coincidan.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Tipo de ajuste</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={adjustmentType === 'percentage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAdjustmentType('percentage')}
            >
              Porcentaje (%)
            </Button>
            <Button
              type="button"
              variant={adjustmentType === 'fixed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAdjustmentType('fixed')}
            >
              Monto fijo ($)
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="value">Valor</Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={adjustmentType === 'percentage' ? 'Ej: 10 o -5' : 'Ej: 500 o -200'}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Usa un valor negativo para bajar precios.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3 text-sm">
        <span>
          Esto afectará a <strong>{affectedCount}</strong> producto(s).
        </span>
      </div>

      <Button type="submit" disabled={isSubmitting || affectedCount === 0}>
        {isSubmitting ? 'Aplicando...' : 'Aplicar actualización de precios'}
      </Button>
    </form>
  );
}
