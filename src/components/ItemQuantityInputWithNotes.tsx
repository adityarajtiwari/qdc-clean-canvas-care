
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, X, Tag, FileText } from 'lucide-react';
import { OrderItem } from '@/hooks/useOrders';
import { useActiveItemsOnly } from '@/hooks/useLaundryItems';

interface ItemQuantityInputWithNotesProps {
  items: Record<string, OrderItem>;
  onChange: (items: Record<string, OrderItem>) => void;
}

const commonTags = ['stained', 'torn', 'delicate', 'new', 'heavily soiled', 'dry clean only'];

const ItemQuantityInputWithNotes = ({ items, onChange }: ItemQuantityInputWithNotesProps) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  const { data: laundryItems, isLoading } = useActiveItemsOnly();

  const addItem = () => {
    if (!selectedItemId) return;
    
    const selectedItem = laundryItems?.find(item => item.id === selectedItemId);
    if (!selectedItem) return;
    
    const updatedItems = {
      ...items,
      [selectedItem.name]: {
        name: selectedItem.name,
        quantity: newItemQuantity,
        notes: '',
        tags: []
      }
    };
    
    onChange(updatedItems);
    setSelectedItemId('');
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

  const updateNotes = (itemName: string, notes: string) => {
    const updatedItems = {
      ...items,
      [itemName]: {
        ...items[itemName],
        notes
      }
    };
    
    onChange(updatedItems);
  };

  const addTag = (itemName: string, tag: string) => {
    const currentTags = items[itemName].tags || [];
    if (!currentTags.includes(tag)) {
      const updatedItems = {
        ...items,
        [itemName]: {
          ...items[itemName],
          tags: [...currentTags, tag]
        }
      };
      onChange(updatedItems);
    }
  };

  const removeTag = (itemName: string, tagToRemove: string) => {
    const currentTags = items[itemName].tags || [];
    const updatedItems = {
      ...items,
      [itemName]: {
        ...items[itemName],
        tags: currentTags.filter(tag => tag !== tagToRemove)
      }
    };
    onChange(updatedItems);
  };

  const removeItem = (itemName: string) => {
    const updatedItems = { ...items };
    delete updatedItems[itemName];
    onChange(updatedItems);
    if (expandedItem === itemName) {
      setExpandedItem(null);
    }
  };

  const totalItems = Object.values(items).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Items ({totalItems} total)</Label>
      </div>
      
      {/* Display existing items */}
      <div className="space-y-3">
        {Object.entries(items).map(([itemName, item]) => (
          <div key={itemName} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex-1 text-sm font-medium">{item.name}</span>
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
                  onClick={() => setExpandedItem(expandedItem === itemName ? null : itemName)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FileText className="h-3 w-3" />
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

            {/* Tags display */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1"
                      onClick={() => removeTag(itemName, tag)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Expanded section for notes and tags */}
            {expandedItem === itemName && (
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Notes
                  </Label>
                  <Textarea
                    placeholder="Add notes about this item (e.g., condition, special instructions...)"
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(itemName, e.target.value)}
                    className="min-h-[60px] text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Quick Tags
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {commonTags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => addTag(itemName, tag)}
                        disabled={item.tags?.includes(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={isLoading ? "Loading items..." : "Select item"} />
          </SelectTrigger>
          <SelectContent>
            {laundryItems?.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min="1"
          value={newItemQuantity}
          onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
          className="w-20"
        />
        <Button 
          type="button" 
          onClick={addItem} 
          variant="outline"
          disabled={!selectedItemId}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ItemQuantityInputWithNotes;
