import React, { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Package, CreditCard, Download } from 'lucide-react';
import OrderActions from './OrderActions';
import CreateOrderDialog from './CreateOrderDialog';
import Pagination from './Pagination';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

const OrderManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data, isLoading, error } = useOrders(currentPage, 10, searchTerm, statusFilter, paymentFilter);
  const { toast } = useToast();

  const generateInvoice = (order: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 44, 52);
    doc.text('LAUNDRY INVOICE', 20, 30);
    
    // Order details
    doc.setFontSize(12);
    doc.text(`Order Number: ${order.order_number}`, 20, 50);
    doc.text(`Customer: ${order.customer_name}`, 20, 60);
    doc.text(`Phone: ${order.customer_phone || 'N/A'}`, 20, 70);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 80);
    doc.text(`Due Date: ${new Date(order.due_date).toLocaleDateString()}`, 20, 90);
    doc.text(`Status: ${order.status.toUpperCase()}`, 20, 100);
    
    // Items
    doc.text('Items:', 20, 120);
    doc.text(order.items, 20, 130);
    
    // Amount
    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0);
    doc.text(`Total Amount: ₹${order.amount.toFixed(2)}`, 20, 160);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing our laundry service!', 20, 280);
    
    doc.save(`invoice-${order.order_number}.pdf`);
    
    toast({
      title: "Success",
      description: "Invoice downloaded successfully"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (order: any) => {
    if (order.pricing_type === 'kg') {
      return 'bg-green-100 text-green-800'; // KG orders are always considered paid
    }
    
    if (order.has_pending_payments) {
      return 'bg-red-100 text-red-800';
    }
    
    return 'bg-green-100 text-green-800';
  };

  const getPaymentStatusText = (order: any) => {
    if (order.pricing_type === 'kg') {
      return 'Paid';
    }
    
    if (order.has_pending_payments) {
      return 'Pending';
    }
    
    return 'Paid';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading orders: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending Payment</SelectItem>
                <SelectItem value="completed">Payment Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders ({data?.totalCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.orders && data.orders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Order #</th>
                      <th className="text-left p-3 font-medium">Customer</th>
                      <th className="text-left p-3 font-medium">Items</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Priority</th>
                      <th className="text-left p-3 font-medium">Payment</th>
                      <th className="text-left p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">Due Date</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{order.order_number}</td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{order.customer_name}</div>
                            {order.customer_phone && (
                              <div className="text-sm text-gray-500">{order.customer_phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="truncate text-sm">{order.items}</div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getPaymentStatusColor(order)}>
                            {getPaymentStatusText(order)}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">₹{order.amount.toFixed(2)}</td>
                        <td className="p-3 text-sm">
                          {new Date(order.due_date).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateInvoice(order)}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Invoice
                            </Button>
                            <OrderActions order={order} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {data.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={data.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? "Try adjusting your filters to see more results."
                  : "Get started by creating your first order."}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateDialog && (
        <CreateOrderDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
};

export default OrderManagement;
