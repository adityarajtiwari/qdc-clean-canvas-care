
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceTypes } from '@/hooks/useLaundryItems';

interface KgPricingInputProps {
  serviceTypeId: string;
  weight: number;
  onServiceTypeChange: (serviceTypeId: string) => void;
  onWeightChange: (weight: number) => void;
  onAmountCalculated: (amount: number) => void;
}

const KgPricingInput = ({ 
  serviceTypeId, 
  weight, 
  onServiceTypeChange, 
  onWeightChange, 
  onAmountCalculated 
}: KgPricingInputProps) => {
  const { data: serviceTypes, isLoading } = useServiceTypes();

  React.useEffect(() => {
    if (serviceTypeId && weight > 0 && serviceTypes) {
      const selectedService = serviceTypes.find(s => s.id === serviceTypeId);
      if (selectedService) {
        const amount = weight * selectedService.price_per_kg;
        onAmountCalculated(amount);
      }
    }
  }, [serviceTypeId, weight, serviceTypes, onAmountCalculated]);

  if (isLoading) {
    return <div>Loading service types...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Service Type</Label>
        <Select value={serviceTypeId} onValueChange={onServiceTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            {serviceTypes?.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} - ₹{service.price_per_kg}/kg
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Total Weight (KG)</Label>
        <Input
          type="number"
          step="0.1"
          min="0"
          value={weight || ''}
          onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
          placeholder="Enter total weight"
        />
      </div>
      
      {serviceTypeId && weight > 0 && serviceTypes && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            {serviceTypes.find(s => s.id === serviceTypeId)?.name}: {weight} kg × ₹{serviceTypes.find(s => s.id === serviceTypeId)?.price_per_kg}/kg = ₹{(weight * (serviceTypes.find(s => s.id === serviceTypeId)?.price_per_kg || 0)).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default KgPricingInput;
