
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Support } from './components/Support';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminSettings } from './components/AdminSettings';
import { AdminUsers } from './components/AdminUsers';
import { AdminSupport } from './components/AdminSupport';
import { AdminStaff } from './components/AdminStaff';
import { AdminCommunication } from './components/AdminCommunication';
import { AdminPayments } from './components/AdminPayments';
import { ResellerZone } from './components/ResellerZone';
import { LandingPage } from './components/LandingPage';
import { UserProfile } from './components/UserProfile';
import { User, UserRole } from './types';
import { MockDB } from './services/mockDb';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | undefined>(undefined);
  const [showLanding, setShowLanding] = useState(true);
  
  // Theme Management
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
       setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
      const loadUserSession = async () => {
          try {
              const savedUserId = localStorage.getItem('JADANPAY_CURRENT_USER_ID');
              if (savedUserId && !user) {
                  const users = await MockDB.getUsers();
                  const found = users.find(u => u.id === savedUserId);
                  if (found) {
                      setUser(found);
                      setShowLanding(false);
                  } else {
                      // Session invalid
                      localStorage.removeItem('JADANPAY_CURRENT_USER_ID');
                  }
              }
          } catch (e) {
              console.error("Critical session error", e);
              // Fail safe: Clear storage if corrupt
              localStorage.removeItem('JADANPAY_CURRENT_USER_ID');
              setUser(null);
          }
      };
      
      loadUserSession();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleRefreshUser = async () => {
    if(!user) return;
    setIsLoadingUser(true);
    try {
        const updatedUserList = await MockDB.getUsers();
        const currentUser = updatedUserList.find(u => u.id === user.id);
        if(currentUser) setUser(currentUser);
    } catch (e) {
        console.error("Failed to refresh user", e);
    } finally {
        setIsLoadingUser(false);
    }
  };

  const handleViewReceipt = (txId: string) => {
    setSelectedTxId(txId);
    setActiveTab('history');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedTxId(undefined);
  };
  
  const handleAuthSuccess = (u: User) => {
      setUser(u);
      localStorage.setItem('JADANPAY_CURRENT_USER_ID', u.id); 
      if (u.role === UserRole.ADMIN) {
          setActiveTab('admin');
      } else {
          setActiveTab('dashboard');
      }
      setShowLanding(false);
  };

  if (!user) {
    if (showLanding) {
        return <LandingPage 
            onGetStarted={() => setShowLanding(false)} 
            onLogin={() => setShowLanding(false)}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
        />;
    }
    
    return <Auth 
        onAuthSuccess={handleAuthSuccess} 
        onBack={() => setShowLanding(true)}
    />;
  }

  const renderContent = () => {
    // Permission Guard
    if (activeTab.startsWith('admin') && user.role !== UserRole.ADMIN) {
        return <div className="p-10 text-center dark:text-white">Unauthorized Access</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return user.role === UserRole.ADMIN ? <AdminDashboard /> : <Dashboard user={user} refreshUser={handleRefreshUser} onViewReceipt={handleViewReceipt} />;
      case 'history':
        return <History user={user} highlightId={selectedTxId} />;
      case 'profile':
        return <UserProfile user={user} onUpdate={handleRefreshUser} />;
      case 'support':
        return <Support user={user} />;
      case 'admin':
         return <AdminDashboard />;
      case 'admin-users':
         return <AdminUsers />;
      case 'admin-payments':
         return <AdminPayments />;
      case 'admin-support':
         return <AdminSupport />;
      case 'admin-communication':
         return <AdminCommunication />;
      case 'admin-staff':
         return <AdminStaff />;
      case 'admin-settings':
         return <AdminSettings />;
      case 'reseller':
         return user.role === UserRole.RESELLER ? <ResellerZone /> : <div className="p-10 text-center dark:text-white">Unauthorized</div>;
      default:
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
            localStorage.removeItem('JADANPAY_CURRENT_USER_ID');
            setActiveTab('dashboard'); 
            setShowLanding(true); 
        }}
    >
      {renderContent()}
    </Layout>
  );
}
