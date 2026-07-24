// Location: components/add-to-cart.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCart, type CartProduct } from '@/components/cart-provider';
import type { ButtonProps } from '@/components/ui/button';

interface AddToCartProps extends Omit<ButtonProps, 'onClick'> {
  product: CartProduct;
  maxQuantity?: number;
  showQuantitySelector?: boolean;
  onAddToCart?: () => void;
}

export function AddToCart({
  product,
  maxQuantity = 10,
  showQuantitySelector = false,
  onAddToCart,
  disabled,
  children,
  ...props
}: AddToCartProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.name} agregado al carrito`);
    setIsAdded(true);
    onAddToCart?.();
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (showQuantitySelector) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad</Label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || disabled}
              className="h-8 w-8"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={e =>
                handleQuantityChange(parseInt(e.target.value) || 1)
              }
              disabled={disabled}
              className="h-8 w-16 text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= maxQuantity || disabled}
              className="h-8 w-8"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={disabled}
          className="w-full"
          {...props}
        >
          {isAdded ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Agregado
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Agregar al carrito
            </div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleAddToCart} disabled={disabled} {...props}>
      {isAdded ? (
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          {props.size === 'sm' ? 'Agregado' : 'Agregado al carrito'}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          {children || 'Agregar'}
        </div>
      )}
    </Button>
  );
}
