
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Tag, FileText } from 'lucide-react';

interface WeightBasedItem {
  name: string;
  notes?: string;
  tags?: string[];
}

interface WeightBasedItemListProps {
  items: WeightBasedItem[];
  onChange: (items: WeightBasedItem[]) => void;
}

const commonTags = ['stained', 'torn', 'delicate', 'new', 'heavily soiled', 'dry clean only'];

const WeightBasedItemList = ({ items, onChange }: WeightBasedItemListProps) => {
  const [newItemName, setNewItemName] = useState('');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const addItem = () => {
    if (!newItemName.trim()) return;
    
    const updatedItems = [...items, {
      name: newItemName,
      notes: '',
      tags: []
    }];
    
    onChange(updatedItems);
    setNewItemName('');
  };

  const updateNotes = (index: number, notes: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], notes };
    onChange(updatedItems);
  };

  const addTag = (index: number, tag: string) => {
    const updatedItems = [...items];
    const currentTags = updatedItems[index].tags || [];
    if (!currentTags.includes(tag)) {
      updatedItems[index] = {
        ...updatedItems[index],
        tags: [...currentTags, tag]
      };
      onChange(updatedItems);
    }
  };

  const removeTag = (index: number, tagToRemove: string) => {
    const updatedItems = [...items];
    const currentTags = updatedItems[index].tags || [];
    updatedItems[index] = {
      ...updatedItems[index],
      tags: currentTags.filter(tag => tag !== tagToRemove)
    };
    onChange(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
    if (expandedItem === index) {
      setExpandedItem(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Items List ({items.length} items)</Label>
        <span className="text-xs text-gray-500">Pricing determined by weight and service type</span>
      </div>
      
      {/* Display existing items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex-1 text-sm font-medium">{item.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                className="text-blue-600 hover:text-blue-800"
              >
                <FileText className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Tags display */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.tags.map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1"
                      onClick={() => removeTag(index, tag)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Expanded section for notes and tags */}
            {expandedItem === index && (
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Notes
                  </Label>
                  <Textarea
                    placeholder="Add notes about this item (e.g., condition, special instructions...)"
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(index, e.target.value)}
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
                        onClick={() => addTag(index, tag)}
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
        <Input
          placeholder="Item name (e.g., Shirts, Pants, Bedsheets)"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1"
        />
        <Button type="button" onClick={addItem} variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WeightBasedItemList;
