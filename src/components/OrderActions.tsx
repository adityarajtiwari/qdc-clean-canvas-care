
import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Edit, Trash2, Eye, CreditCard } from 'lucide-react';
import { useUpdateOrderStatus, useDeleteOrder, Order } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import PaymentDetailsDialog from './PaymentDetailsDialog';

interface OrderActionsProps {
  order: Order;
}

const OrderActions = ({ order }: OrderActionsProps) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>(order.status);
  
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const { toast } = useToast();

  console.log('OrderActions rendered for order:', order.id);
  console.log('showPaymentDialog state:', showPaymentDialog);

  const handleStatusUpdate = async () => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status: newStatus });
      setShowStatusDialog(false);
      toast({
        title: "Success",
        description: "Order status updated successfully"
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
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder.mutateAsync(order.id);
        toast({
          title: "Success",
          description: "Order deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete order",
          variant: "destructive"
        });
      }
    }
  };

  const handlePaymentDetailsClick = () => {
    console.log('Payment Details clicked for order:', order.id);
    setShowPaymentDialog(true);
  };

  const handlePaymentDialogClose = (open: boolean) => {
    console.log('Payment dialog close called with:', open);
    setShowPaymentDialog(open);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border shadow-lg z-50">
          <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Update Status
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePaymentDetailsClick}>
            <CreditCard className="mr-2 h-4 w-4" />
            Payment Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of order #{order.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newStatus} onValueChange={(value: Order['status']) => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={updateStatus.isPending}>
                {updateStatus.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentDetailsDialog 
        open={showPaymentDialog}
        onOpenChange={handlePaymentDialogClose}
        order={order}
      />
    </>
  );
};

export default OrderActions;
