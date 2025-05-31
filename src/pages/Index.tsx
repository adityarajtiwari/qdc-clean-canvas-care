
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Auth from '@/components/Auth';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import OrderManagement from '@/components/OrderManagement';
import QualityControl from '@/components/QualityControl';
import CustomerManagement from '@/components/CustomerManagement';

const Index = () => {
  const { user, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

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
