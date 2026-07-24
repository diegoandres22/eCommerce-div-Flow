// File: components/admin/admin-mobile-nav.tsx
'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AdminSidebarNav } from './admin-sidebar-nav';

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-6">
          <SheetTitle>Admin Panel</SheetTitle>
        </SheetHeader>
        <AdminSidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
