
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PricingSelectorProps {
  value: 'item' | 'kg';
  onChange: (value: 'item' | 'kg') => void;
}

const PricingSelector = ({ value, onChange }: PricingSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Pricing Method</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-6">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="item" id="item" />
          <Label htmlFor="item">By Items</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="kg" id="kg" />
          <Label htmlFor="kg">By Weight (KG)</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default PricingSelector;
