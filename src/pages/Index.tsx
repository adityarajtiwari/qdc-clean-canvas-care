
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import OrderManagement from '@/components/OrderManagement';
import QualityControl from '@/components/QualityControl';
import CustomerManagement from '@/components/CustomerManagement';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrderManagement />;
      case 'quality':
        return <QualityControl />;
      case 'customers':
        return <CustomerManagement />;
      case 'inventory':
        return (
          <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="text-center py-20">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Inventory Management</h1>
              <p className="text-gray-600">Coming soon - Track supplies and equipment</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="text-center py-20">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings</h1>
              <p className="text-gray-600">Coming soon - Configure system preferences</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="w-full">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Index;
