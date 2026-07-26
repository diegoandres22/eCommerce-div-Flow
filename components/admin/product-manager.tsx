// File: components/admin/product-manager.tsx
'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Product } from '@prisma/client';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import { Pencil, Trash2, Plus, ImageOff, X } from 'lucide-react';
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
import { SmartImage } from '@/components/ui/smart-image';
import { useToast } from '@/components/ui/use-toast';
import { RequiredMark } from '@/components/ui/required-mark';
import { ImageDropzone } from '@/components/admin/image-dropzone';
import { ProductColorEditor } from '@/components/admin/product-color-editor';
import { ProductColorStockEditor } from '@/components/admin/product-color-stock-editor';
import { STORE_CONFIG } from '@/lib/store-config';
import { formatPrice } from '@/lib/utils';
import { parseProductColors } from '@/lib/product-colors';
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

type ProductWithCategory = Product & {
  category: { id: string; name: string };
  subCategory: { id: string; name: string } | null;
  colorStocks: { colorName: string; stock: number }[];
};

const emptyForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  subCategoryId: '',
  images: [] as string[],
  marca: '',
  modelo: '',
  colores: '',
  isActive: true,
  isOutOfStock: false,
  stock: '0',
  stockMinimo: '3',
  colorStocks: {} as Record<string, number>,
};

export function ProductManager({
  initialProducts,
  categories,
  controlStockActivo,
}: {
  initialProducts: ProductWithCategory[];
  categories: Category[];
  controlStockActivo: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithCategory | null>(
    null
  );
  const { toast } = useToast();
  const router = useRouter();

  // Subcategorías disponibles para la categoría elegida en el formulario.
  const subCategoryOptions = categories.filter(
    c => c.parentId === form.categoryId
  );

  const mainCategories = useMemo(
    () => categories.filter(c => !c.parentId),
    [categories]
  );

  // Con el módulo de stock activo, "agotado" se deriva de `stock <= 0` en vez
  // del checkbox manual `isOutOfStock` (que solo se usa cuando el switch
  // global está apagado -- ver ConfiguracionTienda.controlStockActivo).
  const isOutOfStock = (product: ProductWithCategory) =>
    controlStockActivo ? product.stock <= 0 : product.isOutOfStock;

  // Conteo real para el filtro "Estado" -- ver la nota en
  // DataTableFacetedFilter sobre por qué no se puede confiar en
  // column.getFacetedUniqueValues() para una columna de valor-array.
  const estadoCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      const activeKey = product.isActive ? 'activo' : 'inactivo';
      map.set(activeKey, (map.get(activeKey) ?? 0) + 1);
      if (isOutOfStock(product)) {
        map.set('agotado', (map.get('agotado') ?? 0) + 1);
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, controlStockActivo]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const startEdit = (product: ProductWithCategory) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId || '',
      images: product.images,
      marca: product.marca,
      modelo: product.modelo,
      colores: product.colores,
      isActive: product.isActive,
      isOutOfStock: product.isOutOfStock,
      stock: String(product.stock),
      stockMinimo: String(product.stockMinimo),
      colorStocks: Object.fromEntries(
        product.colorStocks.map(c => [c.colorName, c.stock])
      ),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Solo las filas de color que siguen existiendo en `form.colores` en
      // este momento (si se borró un color en ProductColorEditor, su fila de
      // stock no se reenvía). El total (`stock`) se recalcula server-side
      // como la suma de estas filas cuando hay al menos una.
      const currentColors = parseProductColors(form.colores);
      const colorStocksPayload = currentColors.map(color => ({
        colorName: color.name,
        stock: form.colorStocks[color.name] ?? 0,
      }));

      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || null,
        images: form.images,
        marca: form.marca,
        modelo: form.modelo,
        colores: form.colores,
        isActive: form.isActive,
        isOutOfStock: form.isOutOfStock,
        stock: parseInt(form.stock) || 0,
        stockMinimo: parseInt(form.stockMinimo) || 0,
        colorStocks: colorStocksPayload,
      };

      const url = editing
        ? `/api/admin/products/${editing.id}`
        : '/api/admin/products';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error',
          description:
            data.error?.formErrors?.join(', ') ||
            data.error?.fieldErrors
              ? JSON.stringify(data.error.fieldErrors)
              : data.error || 'No se pudo guardar',
          variant: 'destructive',
        });
        return;
      }

      setProducts(prev =>
        editing
          ? prev.map(p => (p.id === data.id ? data : p))
          : [data, ...prev]
      );
      toast({ title: editing ? 'Producto actualizado' : 'Producto creado' });
      resetForm();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const product = deleteTarget;
    setDeleteTarget(null);

    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const data = await res.json();
      toast({
        title: 'Error',
        description: data.error || 'No se pudo borrar',
        variant: 'destructive',
      });
      return;
    }

    setProducts(prev => prev.filter(p => p.id !== product.id));
    toast({ title: 'Producto borrado' });
    router.refresh();
  };

  const stockColumn: ColumnDef<ProductWithCategory> = {
    id: 'stock',
    accessorFn: product => product.stock,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
    cell: ({ row }) => {
      const product = row.original;
      const low = product.stock > 0 && product.stock <= product.stockMinimo;
      return (
        <span
          className={
            low ? 'font-semibold text-amber-600 dark:text-amber-500' : 'font-medium'
          }
        >
          {product.stock}
        </span>
      );
    },
  };

  const columns = useMemo<ColumnDef<ProductWithCategory>[]>(
    () => [
      {
        id: 'imagen',
        header: () => <span className="sr-only">Imagen</span>,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
              {product.images[0] ? (
                <SmartImage
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageOff className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue<string>()}</span>
        ),
      },
      {
        id: 'categoria',
        accessorFn: product => product.categoryId,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Categoría" />
        ),
        filterFn: (row, id, value: string[]) =>
          value.includes(row.getValue<string>(id)),
        sortingFn: (rowA, rowB) =>
          rowA.original.category.name.localeCompare(rowB.original.category.name),
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex flex-col">
              <span>{product.category.name}</span>
              {product.subCategory && (
                <span className="text-xs text-muted-foreground">
                  {product.subCategory.name}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'precio',
        accessorFn: product => Number(product.price),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Precio" />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{formatPrice(getValue<number>())}</span>
        ),
      },
      {
        id: 'estado',
        // Valor múltiple para que un mismo producto pueda coincidir con más
        // de una opción del filtro (ej. "Activo" + "Agotado" a la vez).
        accessorFn: product => {
          const tags: string[] = [product.isActive ? 'activo' : 'inactivo'];
          if (isOutOfStock(product)) tags.push('agotado');
          return tags;
        },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Estado" />
        ),
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant={product.isActive ? 'default' : 'outline'}
                className="font-normal"
              >
                {product.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
              {isOutOfStock(product) && (
                <Badge variant="destructive" className="font-normal">
                  Agotado
                </Badge>
              )}
            </div>
          );
        },
      },
      ...(controlStockActivo ? [stockColumn] : []),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlStockActivo]
  );

  const renderToolbar = (table: TanstackTable<ProductWithCategory>) => {
    const hasFilters =
      table.getState().columnFilters.length > 0 ||
      !!table.getState().globalFilter;

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por nombre..."
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={e => table.setGlobalFilter(e.target.value)}
            className="h-9 max-w-xs"
          />
          <DataTableFacetedFilter
            column={table.getColumn('categoria')}
            title="Categoría"
            options={mainCategories.map(c => ({ label: c.name, value: c.id }))}
          />
          <DataTableFacetedFilter
            column={table.getColumn('estado')}
            title="Estado"
            options={[
              { label: 'Activo', value: 'activo' },
              { label: 'Inactivo', value: 'inactivo' },
              { label: 'Agotado', value: 'agotado' },
            ]}
            counts={estadoCounts}
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
        <Button
          onClick={() => setShowForm(true)}
          disabled={categories.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo producto
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Crea al menos una categoría antes de agregar productos.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
          <div>
            <Label htmlFor="name">
              Nombre
              <RequiredMark />
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="price">
                Precio
                <RequiredMark />
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>
                Categoría
                <RequiredMark />
              </Label>
              <Select
                value={form.categoryId}
                onValueChange={value =>
                  setForm({ ...form, categoryId: value, subCategoryId: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(category => !category.parentId)
                    .map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Subcategoría (opcional)</Label>
            <Select
              value={form.subCategoryId || 'none'}
              onValueChange={value =>
                setForm({ ...form, subCategoryId: value === 'none' ? '' : value })
              }
              disabled={!form.categoryId || subCategoryOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ninguna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {subCategoryOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.categoryId && subCategoryOptions.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Esta categoría no tiene subcategorías todavía.
              </p>
            )}
          </div>

          <div>
            <Label>Imágenes</Label>
            <div className="mt-2">
              <ImageDropzone
                images={form.images}
                onChange={urls => setForm(prev => ({ ...prev, images: urls }))}
                multiple
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="marca">
                Marca
                <RequiredMark />
              </Label>
              <Input
                id="marca"
                value={form.marca}
                onChange={e => setForm({ ...form, marca: e.target.value })}
                placeholder="Ej: Samsung"
                required
              />
            </div>
            <div>
              <Label htmlFor="modelo">
                Modelo
                <RequiredMark />
              </Label>
              <Input
                id="modelo"
                value={form.modelo}
                onChange={e => setForm({ ...form, modelo: e.target.value })}
                placeholder="Ej: Galaxy S23"
                required
              />
            </div>
          </div>

          {STORE_CONFIG.mostrarColoresDeProducto && (
            <div>
              <Label>Colores disponibles (opcional)</Label>
              <div className="mt-2">
                <ProductColorEditor
                  value={form.colores}
                  onChange={serialized =>
                    setForm(prev => ({ ...prev, colores: serialized }))
                  }
                />
              </div>
            </div>
          )}

          {controlStockActivo && (() => {
            const parsedColors = parseProductColors(form.colores);
            return (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {parsedColors.length > 0 ? (
                  <div className="sm:col-span-2">
                    <ProductColorStockEditor
                      colors={parsedColors}
                      stocks={form.colorStocks}
                      onChange={(colorName, stock) =>
                        setForm(prev => ({
                          ...prev,
                          colorStocks: { ...prev.colorStocks, [colorName]: stock },
                        }))
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="stockMinimo">Alertar cuando baje de</Label>
                  <Input
                    id="stockMinimo"
                    type="number"
                    min="0"
                    value={form.stockMinimo}
                    onChange={e =>
                      setForm({ ...form, stockMinimo: e.target.value })
                    }
                  />
                </div>
              </div>
            );
          })()}

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
              />
              Activo (visible en la tienda)
            </label>
            {controlStockActivo ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                &quot;Agotado&quot; se calcula solo según el stock cargado
                arriba -- no hace falta tildarlo a mano.
              </p>
            ) : (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isOutOfStock}
                  onChange={e =>
                    setForm({ ...form, isOutOfStock: e.target.checked })
                  }
                />
                Agotado (visible, pero no se puede comprar)
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || !form.categoryId}>
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
          data={products}
          toolbar={renderToolbar}
          emptyMessage="Sin productos todavía."
          getRowId={product => product.id}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar producto?</AlertDialogTitle>
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
