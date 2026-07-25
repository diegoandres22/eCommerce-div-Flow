// File: components/wishlist-provider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Favoritos 100% cliente (localStorage), sin costo de base de datos.
export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
}

interface WishlistContextType {
  items: WishlistProduct[];
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (product: WishlistProduct) => void;
  removeItem: (id: string) => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
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
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const isWishlisted = (id: string) => items.some(i => i.id === id);

  const toggleWishlist = (product: WishlistProduct) => {
    setItems(prev =>
      prev.some(i => i.id === product.id)
        ? prev.filter(i => i.id !== product.id)
        : [...prev, product]
    );
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        isWishlisted,
        toggleWishlist,
        removeItem,
        totalItems: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
