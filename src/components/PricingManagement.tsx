
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash } from 'lucide-react';
import { useLaundryItems, useServiceTypes, useUpdateLaundryItem, useUpdateServiceType } from '@/hooks/useLaundryItems';
import { useCreateLaundryItem, useCreateServiceType, useDeleteLaundryItem, useDeleteServiceType } from '@/hooks/usePricingManagement';
import { toast } from '@/hooks/use-toast';

const PricingManagement = () => {
  const { data: laundryItems, isLoading: itemsLoading } = useLaundryItems();
  const { data: serviceTypes, isLoading: servicesLoading } = useServiceTypes();
  const updateLaundryItem = useUpdateLaundryItem();
  const updateServiceType = useUpdateServiceType();
  const createLaundryItem = useCreateLaundryItem();
  const createServiceType = useCreateServiceType();
  const deleteLaundryItem = useDeleteLaundryItem();
  const deleteServiceType = useDeleteServiceType();

  const [newItem, setNewItem] = useState({ name: '', price_per_item: 0 });
  const [newService, setNewService] = useState({ name: '', price_per_kg: 0, description: '' });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);

  const handleCreateItem = async () => {
    if (!newItem.name || newItem.price_per_item <= 0) {
      toast({ title: "Error", description: "Please enter valid item name and price", variant: "destructive" });
      return;
    }

    try {
      await createLaundryItem.mutateAsync(newItem);
      setNewItem({ name: '', price_per_item: 0 });
      setIsAddItemOpen(false);
      toast({ title: "Success", description: "Item created successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create item", variant: "destructive" });
    }
  };

  const handleCreateService = async () => {
    if (!newService.name || newService.price_per_kg <= 0) {
      toast({ title: "Error", description: "Please enter valid service name and price", variant: "destructive" });
      return;
    }

    try {
      await createServiceType.mutateAsync(newService);
      setNewService({ name: '', price_per_kg: 0, description: '' });
      setIsAddServiceOpen(false);
      toast({ title: "Success", description: "Service created successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create service", variant: "destructive" });
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem.name || editingItem.price_per_item <= 0) {
      toast({ title: "Error", description: "Please enter valid item name and price", variant: "destructive" });
      return;
    }

    try {
      await updateLaundryItem.mutateAsync(editingItem);
      setEditingItem(null);
      setIsEditItemOpen(false);
      toast({ title: "Success", description: "Item updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    }
  };

  const handleUpdateService = async () => {
    if (!editingService.name || editingService.price_per_kg <= 0) {
      toast({ title: "Error", description: "Please enter valid service name and price", variant: "destructive" });
      return;
    }

    try {
      await updateServiceType.mutateAsync(editingService);
      setEditingService(null);
      setIsEditServiceOpen(false);
      toast({ title: "Success", description: "Service updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update service", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteLaundryItem.mutateAsync(id);
        toast({ title: "Success", description: "Item deleted successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
      }
    }
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteServiceType.mutateAsync(id);
        toast({ title: "Success", description: "Service deleted successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
      }
    }
  };

  const handleToggleItemStatus = async (item: any) => {
    try {
      await updateLaundryItem.mutateAsync({
        ...item,
        is_active: !item.is_active
      });
      toast({ title: "Success", description: `Item ${item.is_active ? 'deactivated' : 'activated'} successfully` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update item status", variant: "destructive" });
    }
  };

  const handleToggleServiceStatus = async (service: any) => {
    try {
      await updateServiceType.mutateAsync({
        ...service,
        is_active: !service.is_active
      });
      toast({ title: "Success", description: `Service ${service.is_active ? 'deactivated' : 'activated'} successfully` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update service status", variant: "destructive" });
    }
  };

  if (itemsLoading || servicesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pricing Management</h2>
        <p className="text-muted-foreground">Manage laundry items and service types with their pricing</p>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Laundry Items</TabsTrigger>
          <TabsTrigger value="services">Service Types</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Laundry Items</CardTitle>
                  <CardDescription>Manage individual laundry items and their per-item pricing</CardDescription>
                </div>
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Laundry Item</DialogTitle>
                      <DialogDescription>Create a new laundry item with pricing</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input
                          id="item-name"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          placeholder="e.g., Shirt, Pants, etc."
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-price">Price per Item (₹)</Label>
                        <Input
                          id="item-price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newItem.price_per_item}
                          onChange={(e) => setNewItem({ ...newItem, price_per_item: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateItem}>Create Item</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price per Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laundryItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>₹{item.price_per_item}</TableCell>
                      <TableCell>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleItemStatus(item)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditItemOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Service Types</CardTitle>
                  <CardDescription>Manage service types and their per-kg pricing</CardDescription>
                </div>
                <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Service Type</DialogTitle>
                      <DialogDescription>Create a new service type with per-kg pricing</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="service-name">Service Name</Label>
                        <Input
                          id="service-name"
                          value={newService.name}
                          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                          placeholder="e.g., Wash & Fold, Dry Cleaning"
                        />
                      </div>
                      <div>
                        <Label htmlFor="service-price">Price per Kg (₹)</Label>
                        <Input
                          id="service-price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newService.price_per_kg}
                          onChange={(e) => setNewService({ ...newService, price_per_kg: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="service-description">Description (Optional)</Label>
                        <Textarea
                          id="service-description"
                          value={newService.description}
                          onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                          placeholder="Brief description of the service"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsAddServiceOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateService}>Create Service</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price per Kg</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceTypes?.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>₹{service.price_per_kg}</TableCell>
                      <TableCell>{service.description || '-'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={service.is_active}
                          onCheckedChange={() => handleToggleServiceStatus(service)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingService(service);
                              setIsEditServiceOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Laundry Item</DialogTitle>
            <DialogDescription>Update item details and pricing</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-item-name">Item Name</Label>
                <Input
                  id="edit-item-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-item-price">Price per Item (₹)</Label>
                <Input
                  id="edit-item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingItem.price_per_item}
                  onChange={(e) => setEditingItem({ ...editingItem, price_per_item: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditItemOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateItem}>Update Item</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditServiceOpen} onOpenChange={setIsEditServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service Type</DialogTitle>
            <DialogDescription>Update service details and pricing</DialogDescription>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-service-name">Service Name</Label>
                <Input
                  id="edit-service-name"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-service-price">Price per Kg (₹)</Label>
                <Input
                  id="edit-service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingService.price_per_kg}
                  onChange={(e) => setEditingService({ ...editingService, price_per_kg: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit-service-description">Description (Optional)</Label>
                <Textarea
                  id="edit-service-description"
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditServiceOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateService}>Update Service</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagement;
