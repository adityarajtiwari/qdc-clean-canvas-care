
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import OrderManagement from "@/components/OrderManagement";
import CustomerManagement from "@/components/CustomerManagement";
import QualityControl from "@/components/QualityControl";
import InventoryManagement from "@/components/InventoryManagement";
import PricingManagement from "@/components/PricingManagement";
import Navigation from "@/components/Navigation";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={activeTab} onPageChange={setActiveTab} />
      <main className="container mx-auto py-4 px-4 sm:py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Hide tab list on mobile since navigation is in the header */}
          <TabsList className="hidden lg:grid w-full grid-cols-5 max-w-4xl mx-auto">
            <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="orders" className="text-sm">Orders</TabsTrigger>
            <TabsTrigger value="customers" className="text-sm">Customers</TabsTrigger>
            <TabsTrigger value="inventory" className="text-sm">Inventory</TabsTrigger>
            <TabsTrigger value="pricing" className="text-sm">Pricing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-0">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="orders" className="mt-0">
            <OrderManagement />
          </TabsContent>
          
          <TabsContent value="customers" className="mt-0">
            <CustomerManagement />
          </TabsContent>
          
          <TabsContent value="inventory" className="mt-0">
            <InventoryManagement />
          </TabsContent>
          
          <TabsContent value="pricing" className="mt-0">
            <PricingManagement />
          </TabsContent>
          
          <TabsContent value="quality" className="mt-0">
            <QualityControl />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
