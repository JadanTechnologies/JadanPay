import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { ResellerZone } from './components/ResellerZone';
import { User, UserRole } from './types';
import { MockDB } from './services/mockDb';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Simulate session check or persistence if we were using localStorage
  useEffect(() => {
     // In a real app, check localStorage token here
  }, []);

  const handleRefreshUser = async () => {
    if(!user) return;
    setIsLoadingUser(true);
    // Fetch latest user state (balance updates etc)
    const updatedUserList = await MockDB.getUsers();
    const currentUser = updatedUserList.find(u => u.id === user.id);
    if(currentUser) setUser(currentUser);
    setIsLoadingUser(false);
  };

  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} refreshUser={handleRefreshUser} />;
      case 'history':
        return <History user={user} />;
      case 'admin':
         return user.role === UserRole.ADMIN ? <AdminDashboard /> : <div className="p-10 text-center">Unauthorized</div>;
      case 'reseller':
         return user.role === UserRole.RESELLER ? <ResellerZone /> : <div className="p-10 text-center">Unauthorized</div>;
      default:
        return <Dashboard user={user} refreshUser={handleRefreshUser} />;
    }
  };

  return (
    <Layout 
        user={user} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={() => setUser(null)}
    >
      {renderContent()}
    </Layout>
  );
}