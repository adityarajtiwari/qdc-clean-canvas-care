
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Weight, Clock, Calendar, User } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useLaundryItems, useServiceTypes } from '@/hooks/useLaundryItems';

const InventoryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pricingFilter, setPricingFilter] = useState('all');
  
  // Get all orders without status filter to handle filtering manually
  const { data: ordersData, isLoading } = useOrders(1, 1000, searchTerm, 'all');
  const { data: laundryItems } = useLaundryItems();
  const { data: serviceTypes } = useServiceTypes();

  const orders = ordersData?.orders || [];
  
  // Filter out only completed orders - show all others (received, processing, ready, delayed)
  const pendingOrders = orders.filter(order => order.status !== 'completed');

  console.log('All orders:', orders.length);
  console.log('Pending orders:', pendingOrders.length);
  console.log('Pending orders details:', pendingOrders.map(o => ({ 
    orderNumber: o.order_number, 
    status: o.status, 
    pricingType: o.pricing_type,
    hasItems: !!o.items_detail && Object.keys(o.items_detail).length > 0
  })));

  // Group by item types for item-based orders
  const itemInventory = pendingOrders
    .filter(order => order.pricing_type === 'item')
    .reduce((acc, order) => {
      console.log('Processing item order:', order.order_number, order.items_detail);
      
      if (order.items_detail && Object.keys(order.items_detail).length > 0) {
        Object.entries(order.items_detail).forEach(([itemId, item]) => {
          const itemName = item.name;
          if (!acc[itemName]) {
            acc[itemName] = { quantity: 0, orders: [] };
          }
          acc[itemName].quantity += item.quantity;
          acc[itemName].orders.push({
            orderNumber: order.order_number,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            status: order.status,
            quantity: item.quantity,
            dueDate: order.due_date,
            dateReceived: order.date_received,
            priority: order.priority
          });
        });
      } else {
        // Handle orders with items but no items_detail (fallback)
        const itemName = 'Mixed Items';
        if (!acc[itemName]) {
          acc[itemName] = { quantity: 0, orders: [] };
        }
        acc[itemName].quantity += 1;
        acc[itemName].orders.push({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          status: order.status,
          quantity: 1,
          dueDate: order.due_date,
          dateReceived: order.date_received,
          priority: order.priority
        });
      }
      return acc;
    }, {} as Record<string, { 
      quantity: number; 
      orders: Array<{ 
        orderNumber: string; 
        customerName: string; 
        customerPhone?: string;
        status: string; 
        quantity: number;
        dueDate: string;
        dateReceived: string;
        priority: string;
      }> 
    }>);

  // Group by service types for kg-based orders
  const kgInventory = pendingOrders
    .filter(order => order.pricing_type === 'kg')
    .reduce((acc, order) => {
      const serviceType = serviceTypes?.find(s => s.id === order.service_type_id);
      const serviceName = serviceType?.name || 'Unknown Service';
      
      if (!acc[serviceName]) {
        acc[serviceName] = { totalWeight: 0, orders: [] };
      }
      acc[serviceName].totalWeight += order.total_weight || 0;
      acc[serviceName].orders.push({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        status: order.status,
        weight: order.total_weight || 0,
        dueDate: order.due_date,
        dateReceived: order.date_received,
        priority: order.priority
      });
      return acc;
    }, {} as Record<string, { 
      totalWeight: number; 
      orders: Array<{ 
        orderNumber: string; 
        customerName: string; 
        customerPhone?: string;
        status: string; 
        weight: number;
        dueDate: string;
        dateReceived: string;
        priority: string;
      }> 
    }>);

  const getStatusColor = (status: string) => {
    const colors = {
      'received': 'bg-blue-100 text-blue-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'ready': 'bg-green-100 text-green-800',
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="text-center py-20">
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Track pending orders and inventory levels</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={pricingFilter} onValueChange={setPricingFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="item">By Items</SelectItem>
                <SelectItem value="kg">By Weight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item-based Inventory */}
        {(pricingFilter === 'all' || pricingFilter === 'item') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item-based Inventory ({Object.keys(itemInventory).length} types)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(itemInventory)
                  .filter(([itemName]) => 
                    searchTerm === '' || itemName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(([itemName, data]) => (
                    <div key={itemName} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg">{itemName}</h3>
                        <Badge variant="outline" className="bg-blue-50">{data.quantity} items</Badge>
                      </div>
                      <div className="space-y-3">
                        {data.orders.map((order, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-blue-600">{order.orderNumber}</span>
                                  <Badge className={getPriorityColor(order.priority)}>
                                    {order.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <User className="h-3 w-3" />
                                  <span>{order.customerName}</span>
                                  {order.customerPhone && (
                                    <span className="text-gray-500">({order.customerPhone})</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{order.quantity} pcs</span>
                                  <Badge className={getStatusColor(order.status)}>
                                    {order.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Received: {new Date(order.dateReceived).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                {Object.keys(itemInventory).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No item-based inventory</h3>
                    <p>No pending orders with item-based pricing found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weight-based Inventory */}
        {(pricingFilter === 'all' || pricingFilter === 'kg') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Weight className="h-5 w-5" />
                Weight-based Inventory ({Object.keys(kgInventory).length} services)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(kgInventory)
                  .filter(([serviceName]) => 
                    searchTerm === '' || serviceName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(([serviceName, data]) => (
                    <div key={serviceName} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg">{serviceName}</h3>
                        <Badge variant="outline" className="bg-purple-50">{data.totalWeight.toFixed(1)} kg</Badge>
                      </div>
                      <div className="space-y-3">
                        {data.orders.map((order, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-purple-500">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-purple-600">{order.orderNumber}</span>
                                  <Badge className={getPriorityColor(order.priority)}>
                                    {order.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <User className="h-3 w-3" />
                                  <span>{order.customerName}</span>
                                  {order.customerPhone && (
                                    <span className="text-gray-500">({order.customerPhone})</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{order.weight.toFixed(1)} kg</span>
                                  <Badge className={getStatusColor(order.status)}>
                                    {order.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Received: {new Date(order.dateReceived).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                {Object.keys(kgInventory).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Weight className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No weight-based inventory</h3>
                    <p>No pending orders with weight-based pricing found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">
                  {Object.values(itemInventory).reduce((sum, data) => sum + data.quantity, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Weight (KG)</p>
                <p className="text-2xl font-bold">
                  {Object.values(kgInventory).reduce((sum, data) => sum + data.totalWeight, 0).toFixed(1)}
                </p>
              </div>
              <Weight className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryManagement;
