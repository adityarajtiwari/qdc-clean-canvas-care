
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Package, Weight, Clock } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useLaundryItems, useServiceTypes } from '@/hooks/useLaundryItems';

const InventoryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pricingFilter, setPricingFilter] = useState('all');
  
  // Get all pending orders (not completed)
  const { data: ordersData, isLoading } = useOrders(1, 1000, searchTerm, 'all');
  const { data: laundryItems } = useLaundryItems();
  const { data: serviceTypes } = useServiceTypes();

  const orders = ordersData?.orders || [];
  const pendingOrders = orders.filter(order => order.status !== 'completed');

  // Group by item types for item-based orders
  const itemInventory = pendingOrders
    .filter(order => order.pricing_type === 'item' && order.items_detail)
    .reduce((acc, order) => {
      if (order.items_detail) {
        Object.values(order.items_detail).forEach(item => {
          if (!acc[item.name]) {
            acc[item.name] = { quantity: 0, orders: [] };
          }
          acc[item.name].quantity += item.quantity;
          acc[item.name].orders.push({
            orderNumber: order.order_number,
            customerName: order.customer_name,
            status: order.status,
            quantity: item.quantity
          });
        });
      }
      return acc;
    }, {} as Record<string, { quantity: number; orders: Array<{ orderNumber: string; customerName: string; status: string; quantity: number }> }>);

  // Group by service types for kg-based orders
  const kgInventory = pendingOrders
    .filter(order => order.pricing_type === 'kg' && order.service_type_id)
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
        status: order.status,
        weight: order.total_weight || 0
      });
      return acc;
    }, {} as Record<string, { totalWeight: number; orders: Array<{ orderNumber: string; customerName: string; status: string; weight: number }> }>);

  const getStatusColor = (status: string) => {
    const colors = {
      'received': 'bg-blue-100 text-blue-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'ready': 'bg-green-100 text-green-800',
      'delayed': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
                Item-based Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(itemInventory)
                  .filter(([itemName]) => 
                    searchTerm === '' || itemName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(([itemName, data]) => (
                    <div key={itemName} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{itemName}</h3>
                        <Badge variant="outline">{data.quantity} items</Badge>
                      </div>
                      <div className="space-y-2">
                        {data.orders.map((order, index) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                            <div>
                              <span className="font-medium">{order.orderNumber}</span>
                              <span className="text-gray-600 ml-2">{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{order.quantity} pcs</span>
                              <Badge className={getStatusColor(order.status)} size="sm">
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                {Object.keys(itemInventory).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    No item-based orders pending
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
                Weight-based Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(kgInventory)
                  .filter(([serviceName]) => 
                    searchTerm === '' || serviceName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(([serviceName, data]) => (
                    <div key={serviceName} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{serviceName}</h3>
                        <Badge variant="outline">{data.totalWeight.toFixed(1)} kg</Badge>
                      </div>
                      <div className="space-y-2">
                        {data.orders.map((order, index) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                            <div>
                              <span className="font-medium">{order.orderNumber}</span>
                              <span className="text-gray-600 ml-2">{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{order.weight.toFixed(1)} kg</span>
                              <Badge className={getStatusColor(order.status)} size="sm">
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                {Object.keys(kgInventory).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Weight className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    No weight-based orders pending
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
