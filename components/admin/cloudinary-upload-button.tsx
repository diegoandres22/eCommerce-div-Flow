// File: components/admin/cloudinary-upload-button.tsx
'use client';

import { useState } from 'react';
import Script from 'next/script';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

declare global {
  interface Window {
    cloudinary?: any;
  }
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function CloudinaryUploadButton({
  onUploaded,
}: {
  onUploaded: (urls: string[]) => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const { toast } = useToast();

  const openWidget = () => {
    if (!cloudName || !uploadPreset) {
      toast({
        title: 'Cloudinary no configurado',
        description:
          'Faltan NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET en .env.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.cloudinary) return;

    const uploadedUrls: string[] = [];

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ['local', 'camera'],
        multiple: true,
        folder: 'products',
      },
      (error: unknown, result: any) => {
        if (error) return;

        if (result?.event === 'success') {
          uploadedUrls.push(result.info.secure_url);
        }

        if (result?.event === 'queues-end') {
          if (uploadedUrls.length > 0) {
            onUploaded(uploadedUrls);
            toast({ title: `${uploadedUrls.length} imagen(es) subida(s)` });
          }
        }
      }
    );

    widget.open();
  };

  return (
    <>
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={openWidget}
        disabled={!scriptReady}
      >
        <Upload className="mr-2 h-4 w-4" />
        Subir desde el dispositivo
      </Button>
    </>
  );
}
