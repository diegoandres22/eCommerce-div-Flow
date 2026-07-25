'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: CartProduct;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  // true recién cuando terminó de leer localStorage: permite a los
  // consumidores (ej. animación del ícono del carrito) distinguir la carga
  // inicial del carrito de un agregado real hecho por el usuario.
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        // localStorage corrupto o de una versión vieja del carrito: ignorar.
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (product: CartProduct, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { productId: product.id, quantity, product }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev =>
      prev.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
