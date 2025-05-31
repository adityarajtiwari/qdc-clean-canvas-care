
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, X } from 'lucide-react';
import { OrderItem } from '@/hooks/useOrders';

interface ItemQuantityInputProps {
  items: Record<string, OrderItem>;
  onChange: (items: Record<string, OrderItem>) => void;
}

const ItemQuantityInput = ({ items, onChange }: ItemQuantityInputProps) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);

  const addItem = () => {
    if (!newItemName.trim()) return;
    
    const updatedItems = {
      ...items,
      [newItemName]: {
        name: newItemName,
        quantity: newItemQuantity
      }
    };
    
    onChange(updatedItems);
    setNewItemName('');
    setNewItemQuantity(1);
  };

  const updateQuantity = (itemName: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemName);
      return;
    }
    
    const updatedItems = {
      ...items,
      [itemName]: {
        ...items[itemName],
        quantity
      }
    };
    
    onChange(updatedItems);
  };

  const removeItem = (itemName: string) => {
    const updatedItems = { ...items };
    delete updatedItems[itemName];
    onChange(updatedItems);
  };

  const totalItems = Object.values(items).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Items ({totalItems} total)</Label>
      </div>
      
      {/* Display existing items */}
      <div className="space-y-2">
        {Object.entries(items).map(([itemName, item]) => (
          <div key={itemName} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span className="flex-1 text-sm">{item.name}</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(itemName, item.quantity - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(itemName, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(itemName)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          placeholder="Item name (e.g., Shirts, Pants)"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1"
        />
        <Input
          type="number"
          min="1"
          value={newItemQuantity}
          onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
          className="w-20"
        />
        <Button type="button" onClick={addItem} variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ItemQuantityInput;
