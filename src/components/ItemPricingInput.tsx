
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash, Plus, X, Tag, FileText } from 'lucide-react';
import { useActiveItemsOnly } from '@/hooks/useLaundryItems';
import { OrderItem } from '@/hooks/useOrders';

interface ItemPricingInputProps {
  items: Record<string, OrderItem>;
  onChange: (items: Record<string, OrderItem>) => void;
  onAmountCalculated: (amount: number) => void;
}

const commonTags = ['stained', 'torn', 'delicate', 'new', 'heavily soiled', 'dry clean only'];

const ItemPricingInput = ({ items, onChange, onAmountCalculated }: ItemPricingInputProps) => {
  const { data: laundryItems, isLoading } = useActiveItemsOnly();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
    if (expandedItem === itemId) {
      setExpandedItem(null);
    }
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

  const updateNotes = (itemId: string, notes: string) => {
    const newItems = {
      ...items,
      [itemId]: {
        ...items[itemId],
        notes
      }
    };
    onChange(newItems);
  };

  const addTag = (itemId: string, tag: string) => {
    const currentTags = items[itemId].tags || [];
    if (!currentTags.includes(tag)) {
      const newItems = {
        ...items,
        [itemId]: {
          ...items[itemId],
          tags: [...currentTags, tag]
        }
      };
      onChange(newItems);
    }
  };

  const removeTag = (itemId: string, tagToRemove: string) => {
    const currentTags = items[itemId].tags || [];
    const newItems = {
      ...items,
      [itemId]: {
        ...items[itemId],
        tags: currentTags.filter(tag => tag !== tagToRemove)
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
                <TableHead>Notes/Tags</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(items).map(([itemId, item]) => (
                <React.Fragment key={itemId}>
                  <TableRow>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
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
                        onClick={() => setExpandedItem(expandedItem === itemId ? null : itemId)}
                        className="text-blue-600"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
                  
                  {expandedItem === itemId && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-gray-50">
                        <div className="space-y-3 p-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Notes
                            </Label>
                            <Textarea
                              placeholder="Add notes about this item..."
                              value={item.notes || ''}
                              onChange={(e) => updateNotes(itemId, e.target.value)}
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
                                  onClick={() => addTag(itemId, tag)}
                                  disabled={item.tags?.includes(tag)}
                                >
                                  {tag}
                                </Button>
                              ))}
                            </div>
                            
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-3 w-3 p-0 ml-1"
                                      onClick={() => removeTag(itemId, tag)}
                                    >
                                      <X className="h-2 w-2" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
