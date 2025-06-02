
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save } from 'lucide-react';

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewOrderDialog = ({ open, onOpenChange }: NewOrderDialogProps) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    items: '',
    status: 'received' as const,
    priority: 'normal' as const,
    amount: 0,
    quality_score: 0,
    date_received: new Date().toISOString().slice(0, 16),
    due_date: '',
    pricing_type: 'item' as const,
    total_weight: undefined as number | undefined,
    service_type_id: undefined as string | undefined,
    subtotal: undefined as number | undefined,
    discount: undefined as number | undefined,
    discount_type: 'percentage' as const,
    items_detail: {},
  });

  const { toast } = useToast();
  const createOrderMutation = useCreateOrder();

  const handleSave = async () => {
    try {
      if (!formData.customer_name || !formData.items || !formData.due_date) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      await createOrderMutation.mutateAsync(formData);

      toast({
        title: "Success",
        description: "New order created successfully"
      });
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_phone: '',
        items: '',
        status: 'received',
        priority: 'normal',
        amount: 0,
        quality_score: 0,
        date_received: new Date().toISOString().slice(0, 16),
        due_date: '',
        pricing_type: 'item',
        total_weight: undefined,
        service_type_id: undefined,
        subtotal: undefined,
        discount: undefined,
        discount_type: 'percentage',
        items_detail: {},
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_phone">Customer Phone</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="items">Items Description *</Label>
                <Textarea
                  id="items"
                  value={formData.items}
                  onChange={(e) => setFormData({...formData, items: e.target.value})}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Total Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_received">Date Received</Label>
                  <Input
                    id="date_received"
                    type="datetime-local"
                    value={formData.date_received}
                    onChange={(e) => setFormData({...formData, date_received: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createOrderMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderDialog;
