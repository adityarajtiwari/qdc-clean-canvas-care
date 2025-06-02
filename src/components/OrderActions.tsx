
import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, CreditCard } from 'lucide-react';
import { useDeleteOrder, Order } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import OrderDetailsDialog from './OrderDetailsDialog';

interface OrderActionsProps {
  order: Order;
}

const OrderActions = ({ order }: OrderActionsProps) => {
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  
  const deleteOrder = useDeleteOrder();
  const { toast } = useToast();

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
          <DropdownMenuItem onClick={() => setShowOrderDetailsDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Order
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowOrderDetailsDialog(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Payment Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <OrderDetailsDialog 
        open={showOrderDetailsDialog}
        onOpenChange={setShowOrderDetailsDialog}
        order={order}
      />
    </>
  );
};

export default OrderActions;
