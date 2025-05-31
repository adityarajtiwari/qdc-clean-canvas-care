
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { Order, useUpdateOrderStatus, useDeleteOrder, useUpdateOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';

interface OrderActionsProps {
  order: Order;
}

const OrderActions = ({ order }: OrderActionsProps) => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const updateOrder = useUpdateOrder();
  const { toast } = useToast();

  const [editData, setEditData] = useState({
    customer_name: order.customer_name,
    customer_phone: order.customer_phone || '',
    items: order.items,
    priority: order.priority,
    amount: order.amount,
    due_date: order.due_date.split('T')[0],
    total_weight: order.total_weight || 0
  });

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

  const handleStatusChange = async (newStatus: Order['status']) => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status: newStatus });
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder.mutateAsync(order.id);
      toast({
        title: "Success",
        description: "Order deleted successfully"
      });
      setIsDeleteOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive"
      });
    }
  };

  const handleEditSubmit = async () => {
    try {
      await updateOrder.mutateAsync({
        id: order.id,
        customer_name: editData.customer_name,
        customer_phone: editData.customer_phone,
        items: editData.items,
        priority: editData.priority,
        amount: editData.amount,
        due_date: editData.due_date,
        total_weight: editData.total_weight
      });
      
      toast({
        title: "Success",
        description: "Order updated successfully"
      });
      setIsEditOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      {/* Status Update */}
      <Select value={order.status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-32">
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

      {/* View Order */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {order.order_number}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Customer Information</h3>
                <p className="text-lg font-medium">{order.customer_name}</p>
                {order.customer_phone && (
                  <p className="text-gray-600">{order.customer_phone}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Order Status</h3>
                <div className="flex gap-2 mt-1">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                  <Badge className={getPriorityColor(order.priority)}>
                    {order.priority}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">Items</h3>
              <p className="text-gray-700">{order.items}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Amount</h3>
                <p className="text-lg font-medium">₹{order.amount.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quality Score</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${order.quality_score >= 95 ? 'bg-green-500' : order.quality_score >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  {order.quality_score}%
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Due Date</h3>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(order.due_date).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Date Received</h3>
                <p className="text-gray-600">{new Date(order.date_received).toLocaleDateString()}</p>
              </div>
              {order.completed_date && (
                <div>
                  <h3 className="font-semibold text-gray-900">Completed Date</h3>
                  <p className="text-gray-600">{new Date(order.completed_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Order */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order - {order.order_number}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={editData.customer_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Phone</Label>
                <Input
                  value={editData.customer_phone}
                  onChange={(e) => setEditData(prev => ({ ...prev, customer_phone: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Items</Label>
              <Input
                value={editData.items}
                onChange={(e) => setEditData(prev => ({ ...prev, items: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editData.priority} onValueChange={(value: Order['priority']) => setEditData(prev => ({ ...prev, priority: value }))}>
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
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.amount}
                  onChange={(e) => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={editData.due_date}
                  onChange={(e) => setEditData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>
            
            {order.pricing_type === 'kg' && (
              <div className="space-y-2">
                <Label>Total Weight (KG)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editData.total_weight}
                  onChange={(e) => setEditData(prev => ({ ...prev, total_weight: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateOrder.isPending}>
              {updateOrder.isPending ? 'Updating...' : 'Update Order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Order */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete order {order.order_number}? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteOrder.isPending}
              >
                {deleteOrder.isPending ? 'Deleting...' : 'Delete Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderActions;
