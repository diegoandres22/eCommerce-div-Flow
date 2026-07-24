// File: components/admin/banner-manager.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Banner } from '@prisma/client';
import { Pencil, Trash2, Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CloudinaryUploadButton } from './cloudinary-upload-button';
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

interface BannerForm {
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  order: number;
  isActive: boolean;
}

const emptyForm: BannerForm = {
  imageUrl: '',
  title: '',
  subtitle: '',
  linkUrl: '',
  order: 0,
  isActive: true,
};

export function BannerManager({
  initialBanners,
}: {
  initialBanners: Banner[];
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const startEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      imageUrl: banner.imageUrl,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      linkUrl: banner.linkUrl || '',
      order: banner.order,
      isActive: banner.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editing
        ? `/api/admin/banners/${editing.id}`
        : '/api/admin/banners';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

      setBanners(prev =>
        editing
          ? prev.map(b => (b.id === data.id ? data : b))
          : [data, ...prev]
      );
      toast({ title: editing ? 'Banner actualizado' : 'Banner creado' });
      resetForm();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const banner = deleteTarget;
    setDeleteTarget(null);

    const res = await fetch(`/api/admin/banners/${banner.id}`, {
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

    setBanners(prev => prev.filter(b => b.id !== banner.id));
    toast({ title: 'Banner borrado' });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo banner
        </Button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
          <div>
            <Label htmlFor="imageUrl">Imagen (URL de Cloudinary)</Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://res.cloudinary.com/..."
                required
              />
              <CloudinaryUploadButton
                onUploaded={urls =>
                  setForm(f => ({ ...f, imageUrl: urls[0] || f.imageUrl }))
                }
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={e => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="linkUrl">Enlace al hacer clic (opcional)</Label>
              <Input
                id="linkUrl"
                value={form.linkUrl}
                onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="/products o https://..."
              />
            </div>
            <div>
              <Label htmlFor="order">Orden</Label>
              <Input
                id="order"
                type="number"
                value={form.order}
                onChange={e =>
                  setForm({ ...form, order: Number(e.target.value) })
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
            Activo (visible en el home)
          </label>
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

      <div className="space-y-2">
        {banners.length === 0 && (
          <p className="rounded-md border p-6 text-center text-muted-foreground">
            Sin banners todavía.
          </p>
        )}
        {banners.map(banner => (
          <div
            key={banner.id}
            className="flex items-center gap-3 rounded-md border p-3"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-muted">
              <Image
                src={banner.imageUrl}
                alt={banner.title || 'Banner'}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {banner.title || '(sin título)'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                orden {banner.order} ·{' '}
                {banner.isActive ? 'activo' : 'inactivo'}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => startEdit(banner)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDeleteTarget(banner)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a borrar &quot;{deleteTarget?.title || deleteTarget?.imageUrl}
              &quot;. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Borrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
