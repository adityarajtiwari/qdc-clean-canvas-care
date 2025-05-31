
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Edit, Trash2, Calendar, FileText, Percent } from 'lucide-react';
import { Order, useUpdateOrderStatus, useDeleteOrder, useUpdateOrder, OrderItem } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import CustomerSearch from '@/components/CustomerSearch';
import PricingSelector from '@/components/PricingSelector';
import ItemPricingInput from '@/components/ItemPricingInput';
import KgPricingInput from '@/components/KgPricingInput';
import { useCreateCustomer } from '@/hooks/useCustomers';
import jsPDF from 'jspdf';

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
  const createCustomer = useCreateCustomer();
  const { toast } = useToast();

  const [editData, setEditData] = useState({
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone || '',
    items: order.items,
    items_detail: order.items_detail || {},
    priority: order.priority,
    amount: order.amount,
    due_date: order.due_date.split('T')[0],
    pricing_type: order.pricing_type,
    service_type_id: order.service_type_id,
    total_weight: order.total_weight || 0,
    subtotal: (order as any).subtotal || order.amount,
    discount: (order as any).discount || 0,
    discount_type: (order as any).discount_type || 'percentage' as 'percentage' | 'fixed'
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

  const handleCustomerSelect = (customerId: string, customerName: string, customerPhone?: string) => {
    setEditData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone || ''
    }));
  };

  const handleNewCustomer = async (name: string, phone: string) => {
    try {
      const newCustomer = await createCustomer.mutateAsync({
        name,
        phone,
        email: `${name.toLowerCase().replace(/\s+/g, '')}@temp.com`,
        status: 'active' as const,
        loyalty_tier: 'bronze' as const,
        total_orders: 0,
        total_spent: 0,
        rating: 0
      });
      
      handleCustomerSelect(newCustomer.id, newCustomer.name, newCustomer.phone || undefined);
      
      toast({
        title: "Success",
        description: "Customer created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive"
      });
    }
  };

  const handleItemsChange = (items: Record<string, OrderItem>) => {
    const itemsString = Object.values(items)
      .map(item => `${item.name} (${item.quantity})`)
      .join(', ');
    
    setEditData(prev => ({
      ...prev,
      items: itemsString,
      items_detail: items
    }));
  };

  const handleAmountCalculated = (amount: number) => {
    setEditData(prev => ({
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
    setEditData(prev => ({
      ...prev,
      discount,
      amount: calculateFinalAmount(prev.subtotal, discount, prev.discount_type)
    }));
  };

  const handleDiscountTypeChange = (discountType: 'percentage' | 'fixed') => {
    setEditData(prev => ({
      ...prev,
      discount_type: discountType,
      amount: calculateFinalAmount(prev.subtotal, prev.discount, discountType)
    }));
  };

  const handlePricingTypeChange = (pricingType: 'item' | 'kg') => {
    setEditData(prev => ({
      ...prev,
      pricing_type: pricingType,
      items: '',
      items_detail: {},
      service_type_id: undefined,
      total_weight: 0,
      subtotal: 0,
      amount: 0,
      discount: 0
    }));
  };

  const handleEditSubmit = async () => {
    if (!editData.customer_name || !editData.due_date || editData.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (editData.pricing_type === 'item' && Object.keys(editData.items_detail).length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive"
      });
      return;
    }

    if (editData.pricing_type === 'kg' && (!editData.service_type_id || !editData.total_weight)) {
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
        customer_id: editData.customer_id,
        customer_name: editData.customer_name,
        customer_phone: editData.customer_phone,
        items: editData.pricing_type === 'kg' ? `Weight-based service: ${editData.total_weight}kg` : editData.items,
        items_detail: editData.items_detail,
        priority: editData.priority,
        amount: editData.amount,
        due_date: editData.due_date,
        pricing_type: editData.pricing_type,
        service_type_id: editData.service_type_id,
        total_weight: editData.total_weight,
        subtotal: editData.subtotal,
        discount: editData.discount,
        discount_type: editData.discount_type
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

  const generateInvoicePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const rightMargin = pageWidth - margin;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, 30, { align: 'center' });
    
    // Company details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Laundry Management System', margin, 50);
    doc.text('123 Business Street', margin, 60);
    doc.text('City, State 12345', margin, 70);
    doc.text('Phone: (555) 123-4567', margin, 80);
    
    // Invoice details
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details:', margin, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order Number: ${order.order_number}`, margin, 110);
    doc.text(`Date: ${new Date(order.date_received).toLocaleDateString()}`, margin, 120);
    doc.text(`Due Date: ${new Date(order.due_date).toLocaleDateString()}`, margin, 130);
    doc.text(`Status: ${order.status.toUpperCase()}`, margin, 140);
    
    // Customer details
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Details:', 120, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${order.customer_name}`, 120, 110);
    if (order.customer_phone) {
      doc.text(`Phone: ${order.customer_phone}`, 120, 120);
    }
    doc.text(`Priority: ${order.priority.toUpperCase()}`, 120, 130);
    
    // Items/Services
    doc.setFont('helvetica', 'bold');
    doc.text('Items/Services:', margin, 160);
    doc.setFont('helvetica', 'normal');
    
    let yPosition = 170;
    if (order.pricing_type === 'item' && order.items_detail) {
      Object.values(order.items_detail).forEach((item, index) => {
        doc.text(`${index + 1}. ${item.name} - Qty: ${item.quantity}`, margin + 5, yPosition);
        if (item.price) {
          doc.text(`₹${item.price.toFixed(2)}`, 150, yPosition, { align: 'right' });
        }
        yPosition += 10;
      });
    } else {
      doc.text(order.items, margin + 5, yPosition);
      if (order.total_weight) {
        yPosition += 10;
        doc.text(`Total Weight: ${order.total_weight}kg`, margin + 5, yPosition);
      }
      yPosition += 10;
    }
    
    // Pricing breakdown
    yPosition += 20;
    const subtotal = order.subtotal || order.amount;
    const discount = order.discount || 0;
    const discountType = order.discount_type || 'percentage';
    
    doc.line(margin, yPosition, rightMargin, yPosition);
    yPosition += 15;
    
    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', rightMargin - 60, yPosition);
    doc.text(`₹${subtotal.toFixed(2)}`, rightMargin, yPosition, { align: 'right' });
    
    // Discount (if any)
    if (discount > 0) {
      yPosition += 10;
      const discountAmount = discountType === 'percentage' ? (subtotal * discount / 100) : discount;
      doc.text(`Discount (${discountType === 'percentage' ? `${discount}%` : `₹${discount}`}):`, rightMargin - 60, yPosition);
      doc.text(`-₹${discountAmount.toFixed(2)}`, rightMargin, yPosition, { align: 'right' });
    }
    
    yPosition += 15;
    doc.line(margin, yPosition, rightMargin, yPosition);
    yPosition += 15;
    
    // Final total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Total Amount:', rightMargin - 60, yPosition);
    doc.text(`₹${order.amount.toFixed(2)}`, rightMargin, yPosition, { align: 'right' });
    
    // Quality Score
    if (order.quality_score > 0) {
      yPosition += 20;
      doc.setFontSize(12);
      doc.text(`Quality Score: ${order.quality_score}%`, margin, yPosition);
    }
    
    // Footer
    yPosition = doc.internal.pageSize.height - 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
    
    // Save the PDF
    doc.save(`invoice-${order.order_number}.pdf`);
    
    toast({
      title: "Success",
      description: "Invoice downloaded successfully"
    });
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order - {order.order_number}</DialogTitle>
            <DialogDescription>
              Update the details for this laundry order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <CustomerSearch
              value={editData.customer_id}
              onSelect={handleCustomerSelect}
              onNewCustomer={handleNewCustomer}
            />
            
            <PricingSelector
              value={editData.pricing_type}
              onChange={handlePricingTypeChange}
            />
            
            {editData.pricing_type === 'item' ? (
              <ItemPricingInput
                items={editData.items_detail}
                onChange={handleItemsChange}
                onAmountCalculated={handleAmountCalculated}
              />
            ) : (
              <KgPricingInput
                serviceTypeId={editData.service_type_id || ''}
                weight={editData.total_weight || 0}
                onServiceTypeChange={(serviceTypeId) => setEditData(prev => ({ ...prev, service_type_id: serviceTypeId }))}
                onWeightChange={(weight) => setEditData(prev => ({ ...prev, total_weight: weight }))}
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
                  <Select value={editData.discount_type} onValueChange={handleDiscountTypeChange}>
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
                    step={editData.discount_type === 'percentage' ? "1" : "0.01"}
                    max={editData.discount_type === 'percentage' ? "100" : undefined}
                    value={editData.discount || ''}
                    onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal (₹)</Label>
                  <Input 
                    id="subtotal" 
                    type="number" 
                    value={editData.subtotal || ''}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={editData.priority} onValueChange={(value: Order['priority']) => setEditData(prev => ({ ...prev, priority: value }))}>
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
                  value={editData.amount || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input 
                id="dueDate" 
                type="date"
                value={editData.due_date}
                onChange={(e) => setEditData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
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

      {/* Generate Invoice */}
      <Button variant="ghost" size="sm" onClick={generateInvoicePDF} className="text-blue-600 hover:text-blue-800">
        <FileText className="h-4 w-4" />
      </Button>

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
