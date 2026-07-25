// File: components/recently-viewed-provider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Mismo patrón que wishlist-provider.tsx: 100% cliente (localStorage), sin
// costo de base de datos ni de servidor.
export interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  category?: { name: string; slug: string } | null;
}

const MAX_ITEMS = 12;

interface RecentlyViewedContextType {
  items: RecentlyViewedProduct[];
  trackView: (product: RecentlyViewedProduct) => void;
}

const RecentlyViewedContext = createContext<
  RecentlyViewedContextType | undefined
>(undefined);

export function RecentlyViewedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('recently-viewed');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        // localStorage corrupto o de una versión vieja: ignorar.
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('recently-viewed', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const trackView = (product: RecentlyViewedProduct) => {
    setItems(prev => {
      const withoutCurrent = prev.filter(i => i.id !== product.id);
      return [product, ...withoutCurrent].slice(0, MAX_ITEMS);
    });
  };

  return (
    <RecentlyViewedContext.Provider value={{ items, trackView }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error(
      'useRecentlyViewed must be used within RecentlyViewedProvider'
    );
  }
  return context;
}
