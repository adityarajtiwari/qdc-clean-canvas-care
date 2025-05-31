import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Calendar, Percent } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrders, useCreateOrder, Order, OrderItem } from '@/hooks/useOrders';
import { useCreateCustomer } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';
import OrderActions from '@/components/OrderActions';
import Pagination from '@/components/Pagination';
import CustomerSearch from '@/components/CustomerSearch';
import PricingSelector from '@/components/PricingSelector';
import ItemPricingInput from '@/components/ItemPricingInput';
import KgPricingInput from '@/components/KgPricingInput';

const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  
  const itemsPerPage = 5; // Fixed to show only 5 orders per page
  const { data, isLoading } = useOrders(currentPage, itemsPerPage, searchTerm, statusFilter);
  const createOrder = useCreateOrder();
  const createCustomer = useCreateCustomer();
  const { toast } = useToast();

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || 0;

  const [newOrder, setNewOrder] = useState<{
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
  }>({
    customer_name: '',
    customer_phone: '',
    items: '',
    items_detail: {},
    priority: 'normal',
    amount: 0,
    due_date: '',
    pricing_type: 'item',
    total_weight: 0,
    subtotal: 0,
    discount: 0,
    discount_type: 'percentage'
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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCustomerSelect = (customerId: string, customerName: string, customerPhone?: string) => {
    setNewOrder(prev => ({
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
    
    setNewOrder(prev => ({
      ...prev,
      items: itemsString,
      items_detail: items
    }));
  };

  const handleAmountCalculated = (amount: number) => {
    setNewOrder(prev => ({
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
    setNewOrder(prev => ({
      ...prev,
      discount,
      amount: calculateFinalAmount(prev.subtotal, discount, prev.discount_type)
    }));
  };

  const handleDiscountTypeChange = (discountType: 'percentage' | 'fixed') => {
    setNewOrder(prev => ({
      ...prev,
      discount_type: discountType,
      amount: calculateFinalAmount(prev.subtotal, prev.discount, discountType)
    }));
  };

  const handlePricingTypeChange = (pricingType: 'item' | 'kg') => {
    setNewOrder(prev => ({
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

  const handleCreateOrder = async () => {
    if (!newOrder.customer_name || !newOrder.due_date || newOrder.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (newOrder.pricing_type === 'item' && Object.keys(newOrder.items_detail).length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive"
      });
      return;
    }

    if (newOrder.pricing_type === 'kg' && (!newOrder.service_type_id || !newOrder.total_weight)) {
      toast({
        title: "Error",
        description: "Please select service type and enter weight",
        variant: "destructive"
      });
      return;
    }

    try {
      await createOrder.mutateAsync({
        ...newOrder,
        items: newOrder.pricing_type === 'kg' ? `Weight-based service: ${newOrder.total_weight}kg` : newOrder.items,
        status: 'received' as const,
        quality_score: 0,
        date_received: new Date().toISOString()
      });
      
      setIsNewOrderOpen(false);
      setNewOrder({
        customer_name: '',
        customer_phone: '',
        items: '',
        items_detail: {},
        priority: 'normal',
        amount: 0,
        due_date: '',
        pricing_type: 'item',
        total_weight: 0,
        subtotal: 0,
        discount: 0,
        discount_type: 'percentage'
      });
      
      toast({
        title: "Success",
        description: "Order created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="text-center py-20">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600">Track and manage all laundry orders</p>
        </div>
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Enter the details for the new laundry order.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <CustomerSearch
                value={newOrder.customer_id}
                onSelect={handleCustomerSelect}
                onNewCustomer={handleNewCustomer}
              />
              
              <PricingSelector
                value={newOrder.pricing_type}
                onChange={handlePricingTypeChange}
              />
              
              {newOrder.pricing_type === 'item' ? (
                <ItemPricingInput
                  items={newOrder.items_detail}
                  onChange={handleItemsChange}
                  onAmountCalculated={handleAmountCalculated}
                />
              ) : (
                <KgPricingInput
                  serviceTypeId={newOrder.service_type_id || ''}
                  weight={newOrder.total_weight || 0}
                  onServiceTypeChange={(serviceTypeId) => setNewOrder(prev => ({ ...prev, service_type_id: serviceTypeId }))}
                  onWeightChange={(weight) => setNewOrder(prev => ({ ...prev, total_weight: weight }))}
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
                    <Select value={newOrder.discount_type} onValueChange={handleDiscountTypeChange}>
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
                      step={newOrder.discount_type === 'percentage' ? "1" : "0.01"}
                      max={newOrder.discount_type === 'percentage' ? "100" : undefined}
                      value={newOrder.discount || ''}
                      onChange={(e) => handleDiscountChange(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtotal">Subtotal (₹)</Label>
                    <Input 
                      id="subtotal" 
                      type="number" 
                      value={newOrder.subtotal || ''}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newOrder.priority} onValueChange={(value: Order['priority']) => setNewOrder(prev => ({ ...prev, priority: value }))}>
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
                    value={newOrder.amount || ''}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate" 
                  type="date"
                  value={newOrder.due_date}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} disabled={createOrder.isPending}>
                {createOrder.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders by customer name or order ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-48">
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
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items/Service</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        {order.customer_phone && (
                          <p className="text-sm text-gray-600">{order.customer_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{order.items}</p>
                        {order.pricing_type === 'kg' && order.total_weight && (
                          <p className="text-xs text-gray-500">{order.total_weight}kg</p>
                        )}
                        {order.pricing_type === 'item' && order.items_detail && Object.keys(order.items_detail).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.values(order.items_detail).reduce((sum, item) => sum + item.quantity, 0)} items
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order.pricing_type === 'kg' ? 'By Weight' : 'By Items'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(order.due_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>₹{order.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${order.quality_score >= 95 ? 'bg-green-500' : order.quality_score >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        {order.quality_score}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <OrderActions order={order} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-6 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;
