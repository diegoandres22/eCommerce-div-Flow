// Location: components/add-to-cart.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { ButtonProps } from '@/components/ui/button';

// TODO (Paso 6): reemplazar por la lógica real de carrito -> WhatsApp.
// El server action viejo (@/server/actions/cart) se borró junto con el
// modelo Cart/CartItem, que no existe en el MVP.

interface AddToCartProps extends Omit<ButtonProps, 'onClick'> {
  productId: string;
  maxQuantity?: number;
  showQuantitySelector?: boolean;
  onAddToCart?: () => void;
}

export function AddToCart({
  productId,
  maxQuantity = 10,
  showQuantitySelector = false,
  onAddToCart,
  disabled,
  children,
  ...props
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      // Placeholder temporal: el carrito real (con botón de WhatsApp)
      // se construye en el Paso 6.
      toast('Carrito en construcción (Paso 6)');
      setIsAdded(true);
      onAddToCart?.();
      setTimeout(() => setIsAdded(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  if (showQuantitySelector) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
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
          <p className="text-sm text-muted-foreground">
            {maxQuantity > 0 ? `${maxQuantity} available` : 'Out of stock'}
          </p>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={disabled || isLoading || maxQuantity <= 0}
          className="w-full"
          {...props}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Adding to Cart...
            </div>
          ) : isAdded ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Added to Cart
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || isLoading || maxQuantity <= 0}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {props.size === 'sm' ? 'Adding...' : 'Adding to Cart...'}
        </div>
      ) : isAdded ? (
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          {props.size === 'sm' ? 'Added' : 'Added to Cart'}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          {children || (props.size === 'sm' ? 'Add to Cart' : 'Add to Cart')}
        </div>
      )}
    </Button>
  );
}

// Quick add to cart button (minimal version)
export function QuickAddToCart({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  return (
    <AddToCart
      productId={productId}
      size="icon"
      variant="secondary"
      className={className}
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="sr-only">Add to cart</span>
    </AddToCart>
  );
}
