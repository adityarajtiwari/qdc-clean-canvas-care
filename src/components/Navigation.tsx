
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Package, 
  CheckCircle, 
  Users, 
  Warehouse, 
  Settings,
  Bell,
  User
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation = ({ currentPage, onPageChange }: NavigationProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package, badge: '12' },
    { id: 'quality', label: 'Quality Control', icon: CheckCircle, badge: '3' },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">QDC Laundry</h1>
              <p className="text-xs text-gray-500">Quality Data Control</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`relative ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => onPageChange(item.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {item.badge && (
                    <Badge className="ml-2 bg-red-500 text-white text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5">
                5
              </Badge>
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t bg-gray-50">
        <div className="grid grid-cols-3 gap-1 p-2">
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`flex flex-col h-auto py-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                onClick={() => onPageChange(item.id)}
              >
                <div className="relative">
                  <Icon className="h-4 w-4" />
                  {item.badge && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1rem] h-4 flex items-center justify-center">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
