// File: components/admin/admin-sidebar-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image as ImageIcon,
  TrendingUp,
  MessageSquare,
  Settings,
  Megaphone,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/banners', label: 'Banners del home', icon: ImageIcon },
  {
    href: '/admin/bulk-pricing',
    label: 'Precios masivos',
    icon: TrendingUp,
  },
  { href: '/admin/leads', label: 'Leads', icon: MessageSquare },
  { href: '/admin/inventario', label: 'Inventario', icon: Boxes },
  {
    href: '/admin/settings',
    label: 'Verificar número de WhatsApp',
    icon: Settings,
  },
  {
    href: '/admin/announcement-bar',
    label: 'Banner de la tienda',
    icon: Megaphone,
  },
];

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-3">
      {navItems.map(item => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
