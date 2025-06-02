import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOrder, Order, OrderItem } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { Plus, Percent } from 'lucide-react';
import CustomerSearch from '@/components/CustomerSearch';
import PricingSelector from '@/components/PricingSelector';
import ItemPricingInput from '@/components/ItemPricingInput';
import KgPricingInput from '@/components/KgPricingInput';

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewOrderDialog = ({ open, onOpenChange }: NewOrderDialogProps) => {
  const createOrder = useCreateOrder();
  const { toast } = useToast();
  
  // Form state - exactly like OrderDetailsDialog
  const [formData, setFormData] = useState<{
    customer_id?: string;
    customer_name: string;
    customer_phone: string;
    items: string;
    items_detail: Record<string, OrderItem>;
    priority: Order['priority'];
    amount: number;
    due_date: string;
    pricing_type: 'item' | 'kg';
    service_type_id?: string;
    total_weight?: number;
    subtotal: number;
    discount: number;
    discount_type: 'percentage' | 'fixed';
  }>({
    customer_name: '',
    customer_phone: '',
    items: '',
    items_detail: {},
    priority: 'normal',
    amount: 0,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
    pricing_type: 'item',
    total_weight: 0,
    subtotal: 0,
    discount: 0,
    discount_type: 'percentage'
  });

  const handleCustomerSelect = (customerId: string, customerName: string, customerPhone?: string) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone || ''
    }));
  };

  const handleItemsChange = (items: Record<string, OrderItem>) => {
    const itemsString = Object.values(items)
      .map(item => `${item.name} (${item.quantity})`)
      .join(', ');
    
    setFormData(prev => ({
      ...prev,
      items: itemsString,
      items_detail: items
    }));
  };

  const handleAmountCalculated = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      subtotal: amount,
      amount: calculateFinalAmount(amount, prev.discount, prev.discount_type)
    }));
  };

  const calculateFinalAmount = (subtotal: number, discount: number, discountType: 'percentage' | 'fixed') => {
    if (discountType === 'percentage') {
      return subtotal - (subtotal * discount / 100);
    } else {
      return Math.max(0, subtotal - discount);
    }
  };

  const handleDiscountChange = (discount: number) => {
    setFormData(prev => ({
      ...prev,
      discount,
      amount: calculateFinalAmount(prev.subtotal, discount, prev.discount_type)
    }));
  };

  const handleDiscountTypeChange = (discountType: 'percentage' | 'fixed') => {
    setFormData(prev => ({
      ...prev,
      discount_type: discountType,
      amount: calculateFinalAmount(prev.subtotal, prev.discount, discountType)
    }));
  };

  const handlePricingTypeChange = (pricingType: 'item' | 'kg') => {
    setFormData(prev => ({
      ...prev,
      pricing_type: pricingType,
      items: pricingType === 'kg' ? `Weight-based service: ${prev.total_weight}kg` : '',
      items_detail: pricingType === 'item' ? prev.items_detail : {},
      service_type_id: pricingType === 'kg' ? prev.service_type_id : undefined,
      total_weight: pricingType === 'kg' ? prev.total_weight : 0,
      subtotal: 0,
      amount: 0,
      discount: 0
    }));
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      items: '',
      items_detail: {},
      priority: 'normal',
      amount: 0,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pricing_type: 'item',
      total_weight: 0,
      subtotal: 0,
      discount: 0,
      discount_type: 'percentage'
    });
  };

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.due_date || formData.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.pricing_type === 'item' && Object.keys(formData.items_detail).length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive"
      });
      return;
    }

    if (formData.pricing_type === 'kg' && (!formData.service_type_id || !formData.total_weight)) {
      toast({
        title: "Error",
        description: "Please select service type and enter weight",
        variant: "destructive"
      });
      return;
    }

    try {
      await createOrder.mutateAsync({
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        items: formData.items,
        items_detail: formData.items_detail,
        status: 'received',
        priority: formData.priority,
        amount: formData.amount,
        quality_score: 0,
        date_received: new Date().toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        pricing_type: formData.pricing_type,
        service_type_id: formData.service_type_id,
        total_weight: formData.total_weight,
        subtotal: formData.subtotal,
        discount: formData.discount,
        discount_type: formData.discount_type
      });
      
      toast({
        title: "Success",
        description: "Order created successfully"
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Order
          </DialogTitle>
          <DialogDescription>
            Create a new laundry order for a customer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Customer Search */}
          <CustomerSearch
            value={formData.customer_id}
            onSelect={handleCustomerSelect}
            onNewCustomer={(name, phone) => {
              setFormData(prev => ({
                ...prev,
                customer_name: name,
                customer_phone: phone
              }));
            }}
          />
          
          {/* Pricing Type Selector */}
          <PricingSelector
            value={formData.pricing_type}
            onChange={handlePricingTypeChange}
          />
          
          {/* Pricing Input */}
          {formData.pricing_type === 'item' ? (
            <ItemPricingInput
              items={formData.items_detail}
              onChange={handleItemsChange}
              onAmountCalculated={handleAmountCalculated}
            />
          ) : (
            <KgPricingInput
              serviceTypeId={formData.service_type_id || ''}
              weight={formData.total_weight || 0}
              onServiceTypeChange={(serviceTypeId) => setFormData(prev => ({ ...prev, service_type_id: serviceTypeId }))}
              onWeightChange={(weight) => setFormData(prev => ({ ...prev, total_weight: weight }))}
              onAmountCalculated={handleAmountCalculated}
            />
          )}
          
          {/* Discount Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-gray-600" />
              <Label className="text-sm font-medium">Discount</Label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Type</Label>
                <Select value={formData.discount_type} onValueChange={handleDiscountTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount</Label>
                <Input
                  id="discount"
                  type="number"
                  placeholder="0"
                  min="0"
                  step={formData.discount_type === 'percentage' ? "1" : "0.01"}
                  max={formData.discount_type === 'percentage' ? "100" : undefined}
                  value={formData.discount || ''}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal (₹)</Label>
                <Input 
                  id="subtotal" 
                  type="number" 
                  value={formData.subtotal || ''}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>
          
          {/* Priority, Amount, Due Date */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: Order['priority']) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Final Amount (₹)</Label>
              <Input 
                id="amount" 
                type="number" 
                placeholder="0.00" 
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input 
                id="dueDate" 
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>
        </div>
        
        {/* Footer Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createOrder.isPending}>
            {createOrder.isPending ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderDialog;
