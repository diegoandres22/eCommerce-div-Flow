// File: components/admin/category-manager.tsx
'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@prisma/client';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import {
  Pencil,
  Trash2,
  Plus,
  FolderTree,
  CornerDownRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { useToast } from '@/components/ui/use-toast';
import { RequiredMark } from '@/components/ui/required-mark';
import { cn, formatAdminDateTime } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Etiquetas en español para el selector de columnas (DataTableViewOptions)
// -- "nombre"/"acciones" tienen enableHiding: false y ni aparecen ahí.
const CATEGORY_COLUMN_LABELS: Record<string, string> = {
  slug: 'Slug',
  tipo: 'Tipo',
  createdAt: 'Creado',
  updatedAt: 'Editado',
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function CategoryManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [slugTouched, setSlugTouched] = useState(false);

  // Solo categorías principales pueden ser "padre" (un solo nivel de
  // anidamiento), y una categoría no puede ser padre de sí misma.
  const parentOptions = categories.filter(
    c => !c.parentId && c.id !== editing?.id
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Orden por defecto: cada categoría principal seguida de sus
  // subcategorías (agrupadas), no alfabético plano -- así la jerarquía se
  // lee de un vistazo antes de que el usuario toque un header para ordenar.
  const groupedCategories = useMemo(() => {
    const mains = categories
      .filter(c => !c.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    const result: Category[] = [];
    for (const main of mains) {
      result.push(main);
      const subs = categories
        .filter(c => c.parentId === main.id)
        .sort((a, b) => a.name.localeCompare(b.name));
      result.push(...subs);
    }
    // Salvaguarda: subcategorías cuyo padre no está en la lista (no debería
    // pasar, pero así no desaparecen silenciosamente de la tabla).
    const includedIds = new Set(result.map(c => c.id));
    const orphans = categories.filter(c => !includedIds.has(c.id));
    return [...result, ...orphans];
  }, [categories]);

  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setSlug('');
    setParentId('');
    setSlugTouched(false);
    setShowForm(false);
  };

  const startEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setSlug(category.slug);
    setParentId(category.parentId || '');
    setSlugTouched(true);
    setShowForm(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editing
        ? `/api/admin/categories/${editing.id}`
        : '/api/admin/categories';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, parentId: parentId || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error',
          description:
            data.error?.formErrors?.join(', ') ||
            data.error ||
            'No se pudo guardar',
          variant: 'destructive',
        });
        return;
      }

      setCategories(prev =>
        editing
          ? prev.map(c => (c.id === data.id ? data : c))
          : [data, ...prev]
      );
      toast({ title: editing ? 'Categoría actualizada' : 'Categoría creada' });
      resetForm();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const category = deleteTarget;
    setDeleteTarget(null);

    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (!res.ok) {
      toast({
        title: 'Error',
        description: data.error || 'No se pudo borrar',
        variant: 'destructive',
      });
      return;
    }

    setCategories(prev => prev.filter(c => c.id !== category.id));
    toast({ title: 'Categoría borrada' });
    router.refresh();
  };

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ row }) => {
          const category = row.original;
          const isSub = !!category.parentId;
          return (
            <div className={cn('flex items-center gap-2', isSub && 'pl-6')}>
              {isSub ? (
                <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <FolderTree className="h-3.5 w-3.5 shrink-0 text-primary-accent" />
              )}
              <span className={isSub ? 'text-muted-foreground' : 'font-medium'}>
                {category.name}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'slug',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Slug" />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'tipo',
        accessorFn: category => (category.parentId ? 'subcategoria' : 'principal'),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tipo" />
        ),
        filterFn: (row, id, value: string[]) =>
          value.includes(row.getValue<string>(id)),
        cell: ({ row }) => {
          const category = row.original;
          if (!category.parentId) {
            return (
              <Badge className="w-fit gap-1 font-normal">
                <FolderTree className="h-3 w-3" />
                Principal
              </Badge>
            );
          }
          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant="outline"
                className="w-fit gap-1 font-normal text-muted-foreground"
              >
                <CornerDownRight className="h-3 w-3" />
                Subcategoría
              </Badge>
              <span className="text-xs text-muted-foreground">
                de {parentNameById.get(category.parentId) || '—'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Creado" />
        ),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatAdminDateTime(getValue<Date>())}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Editado" />
        ),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatAdminDateTime(getValue<Date>())}
          </span>
        ),
      },
      {
        id: 'acciones',
        header: () => <div className="text-right">Acciones</div>,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => startEdit(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    // parentNameById se recalcula con `categories`, así que basta con
    // depender de esa referencia para mantener las celdas al día.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parentNameById]
  );

  const renderToolbar = (table: TanstackTable<Category>) => {
    const hasFilters =
      table.getState().columnFilters.length > 0 ||
      !!table.getState().globalFilter;

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por nombre o slug..."
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={e => table.setGlobalFilter(e.target.value)}
            className="h-9 max-w-xs"
          />
          <DataTableFacetedFilter
            column={table.getColumn('tipo')}
            title="Tipo"
            options={[
              { label: 'Principal', value: 'principal' },
              { label: 'Subcategoría', value: 'subcategoria' },
            ]}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => {
                table.resetColumnFilters();
                table.setGlobalFilter('');
              }}
            >
              Limpiar
              <X className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} columnLabels={CATEGORY_COLUMN_LABELS} />
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva categoría
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
          <div>
            <Label htmlFor="name">
              Nombre
              <RequiredMark />
            </Label>
            <Input
              id="name"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">
              Slug
              <RequiredMark />
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={e => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
            />
          </div>
          <div>
            <Label>Categoría padre (opcional)</Label>
            <Select
              value={parentId || 'none'}
              onValueChange={value => setParentId(value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ninguna (categoría principal)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna (categoría principal)</SelectItem>
                {parentOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {editing ? 'Guardar cambios' : 'Crear'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {!showForm && (
        <DataTable
          columns={columns}
          data={groupedCategories}
          toolbar={renderToolbar}
          emptyMessage="Sin categorías todavía."
          getRowId={category => category.id}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a borrar &quot;{deleteTarget?.name}&quot;. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
