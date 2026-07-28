'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  // Color elegido en la ficha de producto (ver product-purchase-panel.tsx),
  // solo si el producto tiene colores definidos. Viaja con el ítem del
  // carrito hasta el Lead, para que la confirmación de venta en
  // /admin/leads sepa de qué color descontar stock (ver
  // app/api/admin/leads/[id]/route.ts) en vez de descontar siempre del
  // agregado del producto.
  colorName?: string;
  // Talla elegida en la ficha de producto, si el producto tiene tallas
  // definidas -- independiente del color (puede venir con uno, el otro, los
  // dos, o ninguno). A diferencia del color, no afecta el descuento de
  // stock (no hay stock por talla, solo por color o agregado).
  talla?: string;
}

export interface CartItem {
  productId: string;
  colorName?: string;
  talla?: string;
  quantity: number;
  product: CartProduct;
}

// Dos combinaciones distintas de color/talla del mismo producto son líneas
// de carrito distintas -- se identifican por productId + colorName + talla,
// no solo por productId (antes de sumar colores, productId alcanzaba como
// identidad).
function sameLine(
  item: CartItem,
  productId: string,
  colorName?: string,
  talla?: string
) {
  return (
    item.productId === productId &&
    (item.colorName ?? undefined) === (colorName ?? undefined) &&
    (item.talla ?? undefined) === (talla ?? undefined)
  );
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string, colorName?: string, talla?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    colorName?: string,
    talla?: string
  ) => void;
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
      const existing = prev.find(i =>
        sameLine(i, product.id, product.colorName, product.talla)
      );
      if (existing) {
        return prev.map(i =>
          sameLine(i, product.id, product.colorName, product.talla)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          colorName: product.colorName,
          talla: product.talla,
          quantity,
          product,
        },
      ];
    });
  };

  const removeItem = (productId: string, colorName?: string, talla?: string) => {
    setItems(prev => prev.filter(i => !sameLine(i, productId, colorName, talla)));
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    colorName?: string,
    talla?: string
  ) => {
    if (quantity < 1) return;
    setItems(prev =>
      prev.map(i =>
        sameLine(i, productId, colorName, talla) ? { ...i, quantity } : i
      )
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
