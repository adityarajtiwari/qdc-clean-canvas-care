
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrderItems, useUpdateOrderItemPayment } from '@/hooks/useOrderItems';
import { useUpdateOrder, Order, OrderItem } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { Edit, Percent, Package, Scale } from 'lucide-react';
import CustomerSearch from '@/components/CustomerSearch';
import PricingSelector from '@/components/PricingSelector';
import ItemPricingInput from '@/components/ItemPricingInput';
import KgPricingInput from '@/components/KgPricingInput';

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

const OrderDetailsDialog = ({ open, onOpenChange, order }: OrderDetailsDialogProps) => {
  const { data: orderItems = [], isLoading } = useOrderItems(order.id);
  const updatePayment = useUpdateOrderItemPayment();
  const updateOrder = useUpdateOrder();
  const { toast } = useToast();
  
  // Form state - exactly like create order
  const [editOrder, setEditOrder] = useState<{
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
    status: Order['status'];
  }>({
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone || '',
    items: order.items,
    items_detail: order.items_detail || {},
    priority: order.priority,
    amount: order.amount,
    due_date: new Date(order.due_date).toISOString().split('T')[0],
    pricing_type: order.pricing_type,
    service_type_id: order.service_type_id,
    total_weight: order.total_weight || 0,
    subtotal: order.subtotal || order.amount,
    discount: order.discount || 0,
    discount_type: order.discount_type || 'percentage',
    status: order.status
  });

  console.log('OrderDetailsDialog rendered for order:', order.id);
  console.log('Order items:', orderItems);

  const handleCustomerSelect = (customerId: string, customerName: string, customerPhone?: string) => {
    setEditOrder(prev => ({
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
    
    setEditOrder(prev => ({
      ...prev,
      items: itemsString,
      items_detail: items
    }));
  };

  const handleAmountCalculated = (amount: number) => {
    setEditOrder(prev => ({
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
    setEditOrder(prev => ({
      ...prev,
      discount,
      amount: calculateFinalAmount(prev.subtotal, discount, prev.discount_type)
    }));
  };

  const handleDiscountTypeChange = (discountType: 'percentage' | 'fixed') => {
    setEditOrder(prev => ({
      ...prev,
      discount_type: discountType,
      amount: calculateFinalAmount(prev.subtotal, prev.discount, discountType)
    }));
  };

  const handlePricingTypeChange = (pricingType: 'item' | 'kg') => {
    setEditOrder(prev => ({
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

  const handleSave = async () => {
    if (!editOrder.customer_name || !editOrder.due_date || editOrder.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (editOrder.pricing_type === 'item' && Object.keys(editOrder.items_detail).length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive"
      });
      return;
    }

    if (editOrder.pricing_type === 'kg' && (!editOrder.service_type_id || !editOrder.total_weight)) {
      toast({
        title: "Error",
        description: "Please select service type and enter weight",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateOrder.mutateAsync({
        id: order.id,
        customer_id: editOrder.customer_id,
        customer_name: editOrder.customer_name,
        customer_phone: editOrder.customer_phone,
        items: editOrder.items,
        items_detail: editOrder.items_detail,
        status: editOrder.status,
        priority: editOrder.priority,
        amount: editOrder.amount,
        due_date: new Date(editOrder.due_date).toISOString(),
        pricing_type: editOrder.pricing_type,
        service_type_id: editOrder.service_type_id,
        total_weight: editOrder.total_weight,
        subtotal: editOrder.subtotal,
        discount: editOrder.discount,
        discount_type: editOrder.discount_type
      });
      
      toast({
        title: "Success",
        description: "Order updated successfully"
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };

  const handlePaymentStatusChange = async (itemId: string, paymentPending: boolean) => {
    try {
      await updatePayment.mutateAsync({ id: itemId, payment_pending: paymentPending });
      toast({
        title: "Success",
        description: `Payment status updated successfully`,
      });
    } catch (error) {
      console.error('Payment update error:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsPaid = async () => {
    try {
      for (const item of orderItems) {
        if (item.payment_pending) {
          await updatePayment.mutateAsync({ id: item.id, payment_pending: false });
        }
      }
      toast({
        title: "Success",
        description: "All items marked as paid",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsPending = async () => {
    try {
      for (const item of orderItems) {
        if (!item.payment_pending) {
          await updatePayment.mutateAsync({ id: item.id, payment_pending: true });
        }
      }
      toast({
        title: "Success",
        description: "All items marked as payment pending",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const paidItemsCount = orderItems.filter(item => !item.payment_pending).length;
  const totalItemsCount = orderItems.length;
  const totalPaidAmount = orderItems
    .filter(item => !item.payment_pending)
    .reduce((sum, item) => sum + item.total_price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Order #{order.order_number}
          </DialogTitle>
          <DialogDescription>
            Update the details for this laundry order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <CustomerSearch
            value={editOrder.customer_id}
            onSelect={handleCustomerSelect}
            onNewCustomer={(name, phone) => {
              setEditOrder(prev => ({
                ...prev,
                customer_name: name,
                customer_phone: phone
              }));
            }}
          />
          
          <PricingSelector
            value={editOrder.pricing_type}
            onChange={handlePricingTypeChange}
          />
          
          {editOrder.pricing_type === 'item' ? (
            <ItemPricingInput
              items={editOrder.items_detail}
              onChange={handleItemsChange}
              onAmountCalculated={handleAmountCalculated}
            />
          ) : (
            <KgPricingInput
              serviceTypeId={editOrder.service_type_id || ''}
              weight={editOrder.total_weight || 0}
              onServiceTypeChange={(serviceTypeId) => setEditOrder(prev => ({ ...prev, service_type_id: serviceTypeId }))}
              onWeightChange={(weight) => setEditOrder(prev => ({ ...prev, total_weight: weight }))}
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
                <Select value={editOrder.discount_type} onValueChange={handleDiscountTypeChange}>
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
                  step={editOrder.discount_type === 'percentage' ? "1" : "0.01"}
                  max={editOrder.discount_type === 'percentage' ? "100" : undefined}
                  value={editOrder.discount || ''}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal (₹)</Label>
                <Input 
                  id="subtotal" 
                  type="number" 
                  value={editOrder.subtotal || ''}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editOrder.status} onValueChange={(value: Order['status']) => setEditOrder(prev => ({ ...prev, status: value }))}>
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
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={editOrder.priority} onValueChange={(value: Order['priority']) => setEditOrder(prev => ({ ...prev, priority: value }))}>
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
                value={editOrder.amount || ''}
                onChange={(e) => setEditOrder(prev => ({ ...prev, amount: Number(e.target.value) }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input 
              id="dueDate" 
              type="date"
              value={editOrder.due_date}
              onChange={(e) => setEditOrder(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>

          {/* Payment Management Section - Only for item-based orders */}
          {editOrder.pricing_type === 'item' && orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Payment Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600">Loading items...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Payment Summary */}
                    <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded">
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-bold text-lg">₹{order.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Paid Amount</p>
                        <p className="font-medium text-green-600">₹{totalPaidAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Payment Status</p>
                        <p className="font-medium">{paidItemsCount}/{totalItemsCount} items paid</p>
                      </div>
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex gap-2 pb-3 border-b">
                      <Button
                        onClick={handleMarkAllAsPaid}
                        size="sm"
                        variant="outline"
                        disabled={updatePayment.isPending}
                      >
                        Mark All as Paid
                      </Button>
                      <Button
                        onClick={handleMarkAllAsPending}
                        size="sm"
                        variant="outline"
                        disabled={updatePayment.isPending}
                      >
                        Mark All as Pending
                      </Button>
                    </div>

                    {/* Individual Items */}
                    <div className="space-y-3">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{item.item_name}</h4>
                              <Badge variant={item.payment_pending ? "destructive" : "default"}>
                                {item.payment_pending ? "Payment Pending" : "Paid"}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span>Qty: {item.quantity}</span>
                              <span className="mx-2">•</span>
                              <span>Price: ₹{item.price_per_item.toFixed(2)}</span>
                              <span className="mx-2">•</span>
                              <span>Total: ₹{item.total_price.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button
                              size="sm"
                              variant={item.payment_pending ? "default" : "outline"}
                              onClick={() => handlePaymentStatusChange(item.id, !item.payment_pending)}
                              disabled={updatePayment.isPending}
                            >
                              {item.payment_pending ? "Mark Paid" : "Mark Pending"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateOrder.isPending}>
            {updateOrder.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
