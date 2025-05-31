
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
      <main className="container mx-auto py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>
          
          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>
          
          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>
          
          <TabsContent value="pricing">
            <PricingManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
