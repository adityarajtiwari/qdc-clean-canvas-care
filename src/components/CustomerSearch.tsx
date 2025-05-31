
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { cn } from '@/lib/utils';

interface CustomerSearchProps {
  value?: string;
  onSelect: (customerId: string, customerName: string, customerPhone?: string) => void;
  onNewCustomer: (name: string, phone: string) => void;
}

const CustomerSearch = ({ value, onSelect, onNewCustomer }: CustomerSearchProps) => {
  const { data: customersData, isLoading, error } = useCustomers();
  const customers = Array.isArray(customersData) ? customersData : [];
  
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const selectedCustomer = customers.find(customer => customer.id === value);

  const filteredCustomers = customers.filter(customer => {
    if (!customer || !customer.name || !customer.email) return false;
    const searchLower = searchValue.toLowerCase();
    return customer.name.toLowerCase().includes(searchLower) ||
           customer.email.toLowerCase().includes(searchLower) ||
           (customer.phone && customer.phone.includes(searchValue));
  });

  const handleNewCustomerSubmit = () => {
    if (!newCustomerName.trim()) return;
    
    onNewCustomer(newCustomerName, newCustomerPhone);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowNewCustomerForm(false);
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Customer</Label>
        <Button variant="outline" className="w-full justify-between" disabled>
          Loading customers...
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Customer</Label>
        <Button variant="outline" className="w-full justify-between" disabled>
          Error loading customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Customer</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomer
              ? `${selectedCustomer.name} (${selectedCustomer.email})`
              : "Select customer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search customers..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>
              <div className="p-2">
                <p className="text-sm text-gray-500 mb-2">No customer found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCustomerForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Customer
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => {
                    onSelect(customer.id, customer.name, customer.phone || undefined);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-sm text-gray-500">{customer.email}</span>
                    {customer.phone && (
                      <span className="text-sm text-gray-500">{customer.phone}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
              {filteredCustomers.length > 0 && (
                <CommandItem
                  onSelect={() => setShowNewCustomerForm(true)}
                  className="border-t"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Customer
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
          
          {showNewCustomerForm && (
            <div className="p-3 border-t space-y-3">
              <h4 className="font-medium text-sm">Add New Customer</h4>
              <Input
                placeholder="Customer name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
              <Input
                placeholder="Phone number (optional)"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleNewCustomerSubmit}
                  disabled={!newCustomerName.trim()}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewCustomerForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CustomerSearch;
