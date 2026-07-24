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
import { CloudinaryUploadButton } from '@/components/admin/cloudinary-upload-button';
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
  images: '',
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
      images: product.images.join('\n'),
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
        images: form.images
          .split('\n')
          .map(url => url.trim())
          .filter(Boolean),
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
        <Button onClick={() => setShowForm(true)} disabled={categories.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo producto
        </Button>
      )}
      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Crea al menos una categoría antes de agregar productos.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
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
              <Label htmlFor="price">Precio</Label>
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
              <Label>Categoría</Label>
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
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="images">Imágenes (una URL de Cloudinary por línea)</Label>
              <CloudinaryUploadButton
                onUploaded={urls =>
                  setForm(prev => ({
                    ...prev,
                    images: [prev.images, ...urls].filter(Boolean).join('\n'),
                  }))
                }
              />
            </div>
            <textarea
              id="images"
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.images}
              onChange={e => setForm({ ...form, images: e.target.value })}
              placeholder={'https://res.cloudinary.com/...\nhttps://res.cloudinary.com/...'}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Sube desde el dispositivo con el botón, o pega URLs manualmente.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="campoTexto1">campoTexto1</Label>
              <Input
                id="campoTexto1"
                value={form.campoTexto1}
                onChange={e => setForm({ ...form, campoTexto1: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="campoNumero2">campoNumero2</Label>
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
            <Label htmlFor="campoTextoGeneral">campoTextoGeneral</Label>
            <Input
              id="campoTextoGeneral"
              value={form.campoTextoGeneral}
              onChange={e => setForm({ ...form, campoTextoGeneral: e.target.value })}
              required
            />
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

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o categoría..."
          className="pl-9"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
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
