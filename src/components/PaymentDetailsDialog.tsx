
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useOrderItems, useUpdateOrderItemPayment } from '@/hooks/useOrderItems';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/hooks/useOrders';
import { Calendar, User, Phone, Package, Percent, Scale } from 'lucide-react';

interface PaymentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

const PaymentDetailsDialog = ({ open, onOpenChange, order }: PaymentDetailsDialogProps) => {
  const { data: orderItems = [], isLoading } = useOrderItems(order.id);
  const updatePayment = useUpdateOrderItemPayment();
  const { toast } = useToast();

  console.log('PaymentDetailsDialog rendered with open:', open);
  console.log('Order items:', orderItems);
  console.log('Order pricing type:', order.pricing_type);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white z-50">
        <DialogHeader>
          <DialogTitle>Order Details & Payment Status</DialogTitle>
          <DialogDescription>
            Order #{order.order_number} - Manage payment status for individual items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    {order.customer_phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">{new Date(order.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
                <Badge className={getPriorityColor(order.priority)}>
                  {order.priority}
                </Badge>
                <Badge variant="outline">
                  {order.pricing_type === 'kg' ? 'By Weight' : 'By Items'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-medium">₹{order.subtotal?.toFixed(2) || order.amount.toFixed(2)}</p>
                </div>
                {order.discount && order.discount > 0 && (
                  <div>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Discount
                    </p>
                    <p className="font-medium">
                      {order.discount_type === 'percentage' ? `${order.discount}%` : `₹${order.discount}`}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Final Amount</p>
                  <p className="font-bold text-lg">₹{order.amount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {order.pricing_type === 'kg' ? <Scale className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                {order.pricing_type === 'kg' ? 'Weight-based Service Payment' : 'Items Payment Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">Loading items...</p>
                </div>
              ) : order.pricing_type === 'kg' ? (
                // Weight-based order display
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Weight-based Service
                      </h4>
                      <Badge variant="outline">
                        {order.total_weight}kg
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Service Type: {order.service_type_id ? 'Premium Service' : 'Standard Service'}</p>
                      <p>Total Weight: {order.total_weight}kg</p>
                      <p>Total Amount: ₹{order.amount.toFixed(2)}</p>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm font-medium text-center">
                        This is a weight-based service order. Payment is handled at the order level.
                      </p>
                    </div>
                  </div>
                </div>
              ) : orderItems.length > 0 ? (
                // Item-based order display
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
                          <span>Quantity: {item.quantity}</span>
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

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailsDialog;
