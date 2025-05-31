
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Package, 
  CheckCircle, 
  Users, 
  Warehouse, 
  DollarSign,
  Bell,
  User,
  LogOut,
  Menu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation = ({ currentPage, onPageChange }: NavigationProps) => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package, badge: '12' },
    { id: 'quality', label: 'Quality Control', icon: CheckCircle, badge: '3' },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    { id: 'pricing', label: 'Pricing', icon: DollarSign }
  ];

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Signed out successfully"
      });
    }
  };

  const handleNavClick = (itemId: string) => {
    onPageChange(itemId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">QDC Laundry</h1>
              <p className="text-xs text-gray-500">Quality Data Control</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-900">QDC</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`relative ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="xl:hidden">{item.label.split(' ')[0]}</span>
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="relative hidden sm:flex">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5">
                5
              </Badge>
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">{user?.email || 'User'}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-white shadow-lg absolute top-16 left-0 right-0 z-40">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                  {item.badge && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
            
            {/* Mobile user actions */}
            <div className="border-t pt-2 mt-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-gray-600">
                <Bell className="h-4 w-4 mr-3" />
                Notifications
                <Badge className="ml-auto bg-red-500 text-white text-xs">5</Badge>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-600">
                <User className="h-4 w-4 mr-3" />
                {user?.email || 'User'}
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-600" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navigation;
