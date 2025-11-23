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
  const [selectedTxId, setSelectedTxId] = useState<string | undefined>(undefined);

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

  const handleViewReceipt = (txId: string) => {
    setSelectedTxId(txId);
    setActiveTab('history');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // If switching tabs manually, clear the selected transaction to avoid auto-opening old receipts
    setSelectedTxId(undefined);
  };

  if (!user) {
    return <Auth onAuthSuccess={(u) => {
        setUser(u);
        // Redirect Admin strictly to admin dashboard, others to user dashboard
        if (u.role === UserRole.ADMIN) {
            setActiveTab('admin');
        } else {
            setActiveTab('dashboard');
        }
    }} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} refreshUser={handleRefreshUser} onViewReceipt={handleViewReceipt} />;
      case 'history':
        return <History user={user} highlightId={selectedTxId} />;
      case 'admin':
         return user.role === UserRole.ADMIN ? <AdminDashboard /> : <div className="p-10 text-center">Unauthorized</div>;
      case 'reseller':
         return user.role === UserRole.RESELLER ? <ResellerZone /> : <div className="p-10 text-center">Unauthorized</div>;
      default:
        // Fallback based on role
        if (user.role === UserRole.ADMIN) return <AdminDashboard />;
        return <Dashboard user={user} refreshUser={handleRefreshUser} onViewReceipt={handleViewReceipt} />;
    }
  };

  return (
    <Layout 
        user={user} 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onLogout={() => {
            setUser(null);
            setActiveTab('dashboard'); // Reset tab on logout
        }}
    >
      {renderContent()}
    </Layout>
  );
}