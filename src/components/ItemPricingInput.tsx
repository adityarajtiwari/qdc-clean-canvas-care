
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash, Plus } from 'lucide-react';
import { useActiveItemsOnly } from '@/hooks/useLaundryItems';
import { OrderItem } from '@/hooks/useOrders';

interface ItemPricingInputProps {
  items: Record<string, OrderItem>;
  onChange: (items: Record<string, OrderItem>) => void;
  onAmountCalculated: (amount: number) => void;
}

const ItemPricingInput = ({ items, onChange, onAmountCalculated }: ItemPricingInputProps) => {
  const { data: laundryItems, isLoading } = useActiveItemsOnly();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const addItem = () => {
    if (!selectedItemId || quantity <= 0) return;
    
    const selectedLaundryItem = laundryItems?.find(l => l.id === selectedItemId);
    if (!selectedLaundryItem) return;

    const newItems = {
      ...items,
      [selectedItemId]: {
        name: selectedLaundryItem.name,
        quantity: (items[selectedItemId]?.quantity || 0) + quantity,
        price: selectedLaundryItem.price_per_item,
        notes: items[selectedItemId]?.notes || '',
        tags: items[selectedItemId]?.tags || []
      }
    };
    
    onChange(newItems);
    setSelectedItemId('');
    setQuantity(1);
  };

  const removeItem = (itemId: string) => {
    const newItems = { ...items };
    delete newItems[itemId];
    onChange(newItems);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const newItems = {
      ...items,
      [itemId]: {
        ...items[itemId],
        quantity: newQuantity
      }
    };
    onChange(newItems);
  };

  React.useEffect(() => {
    const totalAmount = Object.values(items).reduce((sum, item) => {
      return sum + (item.quantity * (item.price || 0));
    }, 0);
    onAmountCalculated(totalAmount);
  }, [items, onAmountCalculated]);

  if (isLoading) {
    return <div>Loading items...</div>;
  }

  const totalAmount = Object.values(items).reduce((sum, item) => {
    return sum + (item.quantity * (item.price || 0));
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label>Select Item</Label>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose laundry item" />
            </SelectTrigger>
            <SelectContent>
              {laundryItems?.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} - ₹{item.price_per_item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-24 space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>
        
        <Button onClick={addItem} disabled={!selectedItemId}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {Object.keys(items).length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price/Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(items).map(([itemId, item]) => (
                <TableRow key={itemId}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(itemId, parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>₹{item.price?.toFixed(2)}</TableCell>
                  <TableCell>₹{((item.quantity * (item.price || 0))).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(itemId)}
                      className="text-red-600"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center font-semibold">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemPricingInput;
