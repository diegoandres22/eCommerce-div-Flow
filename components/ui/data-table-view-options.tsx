// Location: components/ui/data-table-view-options.tsx
//
// Selector de columnas visibles: antes, ocultar una columna desde el menú
// de orden del header (DataTableColumnHeader) no tenía forma de deshacerse
// -- una vez oculta, no había manera de volver a mostrarla sin recargar la
// página. Este dropdown lista TODAS las columnas ocultables
// (`column.getCanHide()`) con checkbox, así prender/apagar cualquiera es
// reversible en el momento, sin perder ninguna. `columnLabels` es un mapa
// id -> texto en español porque el `header` de cada columna es un
// componente (DataTableColumnHeader), no un string listo para mostrar acá.
'use client';

import { type Table } from '@tanstack/react-table';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DataTableViewOptions<TData>({
  table,
  columnLabels,
}: {
  table: Table<TData>;
  columnLabels: Record<string, string>;
}) {
  const columns = table.getAllColumns().filter(column => column.getCanHide());

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
          Columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map(column => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onSelect={e => e.preventDefault()}
            onCheckedChange={value => column.toggleVisibility(!!value)}
          >
            {columnLabels[column.id] ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
