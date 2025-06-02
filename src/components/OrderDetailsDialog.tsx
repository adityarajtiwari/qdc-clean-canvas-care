
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrderItems, useUpdateOrderItemPayment } from '@/hooks/useOrderItems';
import { useUpdateOrder, useUpdateOrderStatus, Order } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { Calendar, User, Phone, Package, Scale, Edit, Trash2, Plus } from 'lucide-react';

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

const OrderDetailsDialog = ({ open, onOpenChange, order }: OrderDetailsDialogProps) => {
  const { data: orderItems = [], isLoading } = useOrderItems(order.id);
  const updatePayment = useUpdateOrderItemPayment();
  const updateOrder = useUpdateOrder();
  const updateOrderStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  
  // Form state
  const [customerName, setCustomerName] = useState(order.customer_name);
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone || '');
  const [items, setItems] = useState(order.items);
  const [status, setStatus] = useState<Order['status']>(order.status);
  const [priority, setPriority] = useState<Order['priority']>(order.priority);
  const [amount, setAmount] = useState(order.amount.toString());
  const [dueDate, setDueDate] = useState(new Date(order.due_date).toISOString().split('T')[0]);
  const [pricingType, setPricingType] = useState<Order['pricing_type']>(order.pricing_type);
  const [totalWeight, setTotalWeight] = useState(order.total_weight?.toString() || '');

  console.log('OrderDetailsDialog rendered for order:', order.id);
  console.log('Order items:', orderItems);

  const handleSave = async () => {
    try {
      await updateOrder.mutateAsync({
        id: order.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        items,
        status,
        priority,
        amount: parseFloat(amount),
        due_date: new Date(dueDate).toISOString(),
        pricing_type: pricingType,
        total_weight: totalWeight ? parseFloat(totalWeight) : null,
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

  const getStatusColor = (status: string) => {
    const colors = {
      'received': 'bg-blue-100 text-blue-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'ready': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'delayed': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800',
      'normal': 'bg-blue-100 text-blue-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const paidItemsCount = orderItems.filter(item => !item.payment_pending).length;
  const totalItemsCount = orderItems.length;
  const totalPaidAmount = orderItems
    .filter(item => !item.payment_pending)
    .reduce((sum, item) => sum + item.total_price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Order #{order.order_number}
          </DialogTitle>
          <DialogDescription>
            Update order details, status, and manage payment tracking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="items">Items Description</Label>
                <Textarea
                  id="items"
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value: Order['status']) => setStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
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
                  <Select value={priority} onValueChange={(value: Order['priority']) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pricingType">Pricing Type</Label>
                  <Select value={pricingType} onValueChange={(value: Order['pricing_type']) => setPricingType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="item">By Items</SelectItem>
                      <SelectItem value="kg">By Weight (KG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Total Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                {pricingType === 'kg' && (
                  <div>
                    <Label htmlFor="totalWeight">Total Weight (KG)</Label>
                    <Input
                      id="totalWeight"
                      type="number"
                      step="0.01"
                      value={totalWeight}
                      onChange={(e) => setTotalWeight(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Badge className={getStatusColor(status)}>
                  {status}
                </Badge>
                <Badge className={getPriorityColor(priority)}>
                  {priority}
                </Badge>
                <Badge variant="outline">
                  {pricingType === 'kg' ? 'By Weight' : 'By Items'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {pricingType === 'kg' ? <Scale className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                Payment Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">Loading items...</p>
                </div>
              ) : pricingType === 'kg' ? (
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Weight-based Service
                      </h4>
                      <Badge variant="outline">
                        {totalWeight}kg
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Total Weight: {totalWeight}kg</p>
                      <p>Total Amount: ₹{amount}</p>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm font-medium text-center">
                        This is a weight-based service order. Payment is managed at the order level.
                      </p>
                    </div>
                  </div>
                </div>
              ) : orderItems.length > 0 ? (
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
                        <div className="ml-4 flex items-center space-x-2">
                          <Checkbox
                            id={`payment-${item.id}`}
                            checked={!item.payment_pending}
                            onCheckedChange={(checked) => 
                              handlePaymentStatusChange(item.id, !checked)
                            }
                            disabled={updatePayment.isPending}
                          />
                          <label 
                            htmlFor={`payment-${item.id}`} 
                            className="text-sm font-medium cursor-pointer"
                          >
                            Mark as Paid
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No individual items found for this order</p>
                  <p className="text-sm">This might be a weight-based order or items are still being processed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateOrder.isPending}
          >
            {updateOrder.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
