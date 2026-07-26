// Location: components/ui/data-table-faceted-filter.tsx
//
// Filtro de columna por checklist (ej. "Tipo: Principal / Subcategoría", o
// "Estado: Activo / Inactivo / Agotado"), con contador por opción tomado de
// column.getFacetedUniqueValues(). Patrón estándar de TanStack Table +
// shadcn/ui, reconstruido acá sobre DropdownMenu (ya existente en el
// proyecto) en vez de sumar Popover/Command como dependencias nuevas.
'use client';

import * as React from 'react';
import { type Column } from '@tanstack/react-table';
import { ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FacetedOption {
  label: string;
  value: string;
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title: string;
  options: FacetedOption[];
  // Override manual de conteos por opción. `column.getFacetedUniqueValues()`
  // no cuenta bien columnas cuyo valor es un array (ej. `estado` en
  // product-manager.tsx, que devuelve ['activo'|'inactivo', 'agotado'?] para
  // que un filtro cubra ambos ejes) -- para esas, el caller precalcula el
  // conteo real sobre los datos y lo pasa acá en vez de confiar en TanStack.
  counts?: Map<string, number>;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  counts,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = counts ?? column?.getFacetedUniqueValues();
  const selectedValues = new Set((column?.getFilterValue() as string[]) ?? []);

  const toggle = (value: string) => {
    const next = new Set(selectedValues);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    const asArray = Array.from(next);
    column?.setFilterValue(asArray.length ? asArray : undefined);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <ListFilter className="mr-2 h-3.5 w-3.5" />
          {title}
          {selectedValues.size > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 rounded-sm px-1.5 font-normal"
            >
              {selectedValues.size}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {options.map(option => {
          const count = facets?.get(option.value);
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selectedValues.has(option.value)}
              onSelect={e => e.preventDefault()}
              onCheckedChange={() => toggle(option.value)}
              className="flex items-center gap-2"
            >
              <span className="flex-1 truncate">{option.label}</span>
              {count != null && (
                <span className="font-mono text-xs text-muted-foreground">
                  {count}
                </span>
              )}
            </DropdownMenuCheckboxItem>
          );
        })}
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => column?.setFilterValue(undefined)}
              className="justify-center text-center text-muted-foreground"
            >
              Limpiar filtro
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
