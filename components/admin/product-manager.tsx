// File: components/admin/product-manager.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Product } from '@prisma/client';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { RequiredMark } from '@/components/ui/required-mark';
import { ImageDropzone } from '@/components/admin/image-dropzone';
import { ProductColorEditor } from '@/components/admin/product-color-editor';
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
};

const emptyForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  subCategoryId: '',
  images: [] as string[],
  campoTexto1: '',
  campoNumero2: '',
  campoTextoGeneral: '',
  isActive: true,
};

export function ProductManager({
  initialProducts,
  categories,
}: {
  initialProducts: ProductWithCategory[];
  categories: Category[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
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

  // Filtro en vivo de la tabla por nombre o categoría/subcategoría.
  const query = search.trim().toLowerCase();
  const filteredProducts = query
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.category.name.toLowerCase().includes(query) ||
          p.subCategory?.name.toLowerCase().includes(query)
      )
    : products;

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
      campoTexto1: product.campoTexto1,
      campoNumero2: String(product.campoNumero2),
      campoTextoGeneral: product.campoTextoGeneral,
      isActive: product.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || null,
        images: form.images,
        campoTexto1: form.campoTexto1,
        campoNumero2: parseFloat(form.campoNumero2),
        campoTextoGeneral: form.campoTextoGeneral,
        isActive: form.isActive,
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

  return (
    <div className="space-y-4">
      {!showForm && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={() => setShowForm(true)} disabled={categories.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Button>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o categoría..."
              className="pl-9"
            />
          </div>
        </div>
      )}
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
              <Label htmlFor="campoTexto1">
                campoTexto1
                <RequiredMark />
              </Label>
              <Input
                id="campoTexto1"
                value={form.campoTexto1}
                onChange={e => setForm({ ...form, campoTexto1: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="campoNumero2">
                campoNumero2
                <RequiredMark />
              </Label>
              <Input
                id="campoNumero2"
                type="number"
                step="any"
                value={form.campoNumero2}
                onChange={e => setForm({ ...form, campoNumero2: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Colores disponibles (opcional)</Label>
            <div className="mt-2">
              <ProductColorEditor
                value={form.campoTextoGeneral}
                onChange={serialized =>
                  setForm(prev => ({ ...prev, campoTextoGeneral: serialized }))
                }
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
            />
            Activo (visible en la tienda)
          </label>

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
      <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/80 dark:bg-muted/40 hover:bg-muted/80 [&_th]:font-semibold [&_th]:text-foreground">
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Subcategoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {products.length === 0
                  ? 'Sin productos todavía.'
                  : 'Ningún producto coincide con tu búsqueda.'}
              </TableCell>
            </TableRow>
          )}
          {filteredProducts.map(product => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {product.subCategory?.name || '—'}
              </TableCell>
              <TableCell>${Number(product.price).toFixed(2)}</TableCell>
              <TableCell>{product.isActive ? 'Sí' : 'No'}</TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button size="icon" variant="ghost" onClick={() => startEdit(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteTarget(product)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
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
