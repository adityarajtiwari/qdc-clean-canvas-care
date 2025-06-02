import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUpdateOrder, useUpdateOrderStatus, Order } from '@/hooks/useOrders';
import { useOrderItems, useUpdateOrderItemPayment, useCreateOrderItems } from '@/hooks/useOrderItems';
import { useLaundryItems, useServiceTypes } from '@/hooks/useLaundryItems';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Package, CreditCard, CheckCircle, XCircle } from 'lucide-react';

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

interface NewItem {
  id: string;
  item_name: string;
  quantity: number;
  price_per_item: number;
  total_price: number;
  payment_pending: boolean;
  isNew: boolean;
}

interface ExistingItem {
  id: string;
  item_name: string;
  quantity: number;
  price_per_item: number;
  total_price: number;
  payment_pending: boolean;
  isFromDB: boolean;
  isUpdated: boolean;
}

type CombinedItem = NewItem | ExistingItem;

const OrderDetailsDialog = ({ open, onOpenChange, order }: OrderDetailsDialogProps) => {
  const [editedOrder, setEditedOrder] = useState<Order>(order);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'payments'>('details');
  const [newItems, setNewItems] = useState<NewItem[]>([]);
  
  const { toast } = useToast();
  const updateOrderMutation = useUpdateOrder();
  const updateStatusMutation = useUpdateOrderStatus();
  const updatePaymentMutation = useUpdateOrderItemPayment();
  const createOrderItemsMutation = useCreateOrderItems();
  
  const { data: orderItems = [] } = useOrderItems(order.id);
  const { data: laundryItems = [] } = useLaundryItems();
  const { data: serviceTypes = [] } = useServiceTypes();

  useEffect(() => {
    setEditedOrder(order);
    setNewItems([]);
  }, [order]);

  const handleSave = async () => {
    try {
      // Update basic order details first
      await updateOrderMutation.mutateAsync({
        id: editedOrder.id,
        customer_name: editedOrder.customer_name,
        customer_phone: editedOrder.customer_phone,
        items: editedOrder.items,
        status: editedOrder.status,
        priority: editedOrder.priority,
        amount: editedOrder.amount,
        due_date: editedOrder.due_date,
        total_weight: editedOrder.total_weight,
        service_type_id: editedOrder.service_type_id,
        pricing_type: editedOrder.pricing_type,
        items_detail: editedOrder.items_detail,
        subtotal: editedOrder.subtotal,
        discount: editedOrder.discount,
        discount_type: editedOrder.discount_type,
      });

      // Create new items in the order_items table if any
      if (newItems.length > 0) {
        const itemsToCreate = newItems
          .filter(item => item.item_name && item.quantity > 0) // Only create valid items
          .map(item => ({
            order_id: editedOrder.id,
            item_name: item.item_name,
            quantity: item.quantity,
            price_per_item: item.price_per_item,
            total_price: item.total_price,
            payment_pending: item.payment_pending,
          }));

        if (itemsToCreate.length > 0) {
          await createOrderItemsMutation.mutateAsync(itemsToCreate);
        }
      }

      toast({
        title: "Success",
        description: "Order updated successfully"
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };

  const addNewItem = () => {
    const newItem: NewItem = {
      id: `temp-${Date.now()}`,
      item_name: '',
      quantity: 1,
      price_per_item: 0,
      total_price: 0,
      payment_pending: true,
      isNew: true
    };
    setNewItems([...newItems, newItem]);
  };

  const updateNewItem = (index: number, field: keyof NewItem, value: any) => {
    const updated = [...newItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'price_per_item') {
      updated[index].total_price = updated[index].quantity * updated[index].price_per_item;
    }
    
    setNewItems(updated);
  };

  const removeNewItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const handlePaymentToggle = async (itemId: string, currentStatus: boolean) => {
    try {
      await updatePaymentMutation.mutateAsync({
        id: itemId,
        payment_pending: !currentStatus
      });
      
      toast({
        title: "Success",
        description: `Payment status updated`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  // Combine existing order items with new items for payment management
  const combinedItems: CombinedItem[] = [
    ...orderItems.map(item => ({
      id: item.id,
      item_name: item.item_name,
      quantity: item.quantity,
      price_per_item: item.price_per_item,
      total_price: item.total_price,
      payment_pending: item.payment_pending,
      isFromDB: true,
      isUpdated: false
    } as ExistingItem)),
    ...newItems.map(item => ({
      id: item.id,
      item_name: item.item_name,
      quantity: item.quantity,
      price_per_item: item.price_per_item,
      total_price: item.total_price,
      payment_pending: item.payment_pending,
      isNew: true
    } as NewItem))
  ];

  const totalPendingAmount = combinedItems
    .filter(item => item.payment_pending)
    .reduce((sum, item) => sum + item.total_price, 0);

  const totalPaidAmount = combinedItems
    .filter(item => !item.payment_pending)
    .reduce((sum, item) => sum + item.total_price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Order - {order.order_number}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'details' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Order Details
          </button>
          {editedOrder.pricing_type === 'item' && (
            <>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'items' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('items')}
              >
                Manage Items
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'payments' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('payments')}
              >
                Payment Management
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input
                      id="customer_name"
                      value={editedOrder.customer_name}
                      onChange={(e) => setEditedOrder({...editedOrder, customer_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Customer Phone</Label>
                    <Input
                      id="customer_phone"
                      value={editedOrder.customer_phone || ''}
                      onChange={(e) => setEditedOrder({...editedOrder, customer_phone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="items">Items Description</Label>
                  <Textarea
                    id="items"
                    value={editedOrder.items}
                    onChange={(e) => setEditedOrder({...editedOrder, items: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={editedOrder.status} onValueChange={(value) => setEditedOrder({...editedOrder, status: value as Order['status']})}>
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
                    <Select value={editedOrder.priority} onValueChange={(value) => setEditedOrder({...editedOrder, priority: value as Order['priority']})}>
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
                    <Label htmlFor="amount">Total Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={editedOrder.amount}
                      onChange={(e) => setEditedOrder({...editedOrder, amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={editedOrder.due_date ? new Date(editedOrder.due_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditedOrder({...editedOrder, due_date: e.target.value})}
                  />
                </div>

                {editedOrder.pricing_type === 'kg' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="total_weight">Total Weight (kg)</Label>
                      <Input
                        id="total_weight"
                        type="number"
                        step="0.1"
                        value={editedOrder.total_weight || ''}
                        onChange={(e) => setEditedOrder({...editedOrder, total_weight: parseFloat(e.target.value) || undefined})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_type">Service Type</Label>
                      <Select 
                        value={editedOrder.service_type_id || ''} 
                        onValueChange={(value) => setEditedOrder({...editedOrder, service_type_id: value || undefined})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map((serviceType) => (
                            <SelectItem key={serviceType.id} value={serviceType.id}>
                              {serviceType.name} (₹{serviceType.price_per_kg}/kg)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Details */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subtotal">Subtotal (₹)</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      step="0.01"
                      value={editedOrder.subtotal || ''}
                      onChange={(e) => setEditedOrder({...editedOrder, subtotal: parseFloat(e.target.value) || undefined})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount">Discount</Label>
                    <div className="flex gap-2">
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        value={editedOrder.discount || ''}
                        onChange={(e) => setEditedOrder({...editedOrder, discount: parseFloat(e.target.value) || undefined})}
                      />
                      <Select 
                        value={editedOrder.discount_type || 'percentage'} 
                        onValueChange={(value) => setEditedOrder({...editedOrder, discount_type: value as 'percentage' | 'fixed'})}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">₹</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'items' && editedOrder.pricing_type === 'item' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Add New Items</span>
                  <Button onClick={addNewItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {newItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-5 gap-4 items-end p-4 border rounded-lg">
                      <div>
                        <Label>Item Name</Label>
                        <Select 
                          value={item.item_name} 
                          onValueChange={(value) => {
                            const selectedItem = laundryItems.find(li => li.name === value);
                            updateNewItem(index, 'item_name', value);
                            if (selectedItem) {
                              updateNewItem(index, 'price_per_item', selectedItem.price_per_item || 0);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {laundryItems.map((laundryItem) => (
                              <SelectItem key={laundryItem.id} value={laundryItem.name}>
                                {laundryItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateNewItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Price per Item (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price_per_item}
                          onChange={(e) => updateNewItem(index, 'price_per_item', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Total (₹)</Label>
                        <Input
                          type="number"
                          value={item.total_price.toFixed(2)}
                          disabled
                        />
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeNewItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {newItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No new items added yet</p>
                      <p className="text-sm">Click "Add Item" to start adding items</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'payments' && editedOrder.pricing_type === 'item' && (
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold">₹{(totalPendingAmount + totalPaidAmount).toFixed(2)}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                      <p className="text-2xl font-bold text-green-600">₹{totalPaidAmount.toFixed(2)}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                      <p className="text-2xl font-bold text-red-600">₹{totalPendingAmount.toFixed(2)}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items Payment Management */}
            <Card>
              <CardHeader>
                <CardTitle>Items Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {combinedItems.length > 0 ? (
                    combinedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.item_name}</h4>
                            {'isNew' in item && item.isNew && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                New Item
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × ₹{item.price_per_item.toFixed(2)} = ₹{item.total_price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            className={item.payment_pending 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                            }
                          >
                            {item.payment_pending ? 'Pending' : 'Paid'}
                          </Badge>
                          {'isFromDB' in item && item.isFromDB && (
                            <Button
                              size="sm"
                              variant={item.payment_pending ? "default" : "outline"}
                              onClick={() => handlePaymentToggle(item.id, item.payment_pending)}
                            >
                              {item.payment_pending ? 'Mark as Paid' : 'Mark as Pending'}
                            </Button>
                          )}
                          {'isNew' in item && item.isNew && (
                            <Badge variant="secondary">
                              Will be created on save
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No items found</p>
                      <p className="text-sm">Add items in the "Manage Items" tab to see payment options</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateOrderMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateOrderMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
