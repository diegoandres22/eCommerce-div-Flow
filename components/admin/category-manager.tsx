// File: components/admin/category-manager.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@prisma/client';
import { Pencil, Trash2, Plus } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
        </Button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                Sin categorías todavía.
              </TableCell>
            </TableRow>
          )}
          {categories.map(category => (
            <TableRow key={category.id}>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.slug}</TableCell>
              <TableCell className="text-muted-foreground">
                {category.parentId
                  ? `Sub de ${categories.find(c => c.id === category.parentId)?.name || '—'}`
                  : 'Principal'}
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => startEdit(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteTarget(category)}
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
