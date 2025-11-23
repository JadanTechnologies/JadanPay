
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

  // Initialize theme from system preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
       setIsDarkMode(true);
    }
  }, []);

  // Update HTML class for Tailwind Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Try to load user if we have a "session" (simplified logic for this mock)
  useEffect(() => {
      // In a real app, we check for a token. Here we rely on Auth component to set state.
      // But if we want persistence across reload without re-login for the user:
      // We could store the loggedInUserId in localStorage.
      const savedUserId = localStorage.getItem('JADANPAY_CURRENT_USER_ID');
      if (savedUserId && !user) {
          MockDB.getUsers().then(users => {
              const found = users.find(u => u.id === savedUserId);
              if (found) {
                  setUser(found);
                  setShowLanding(false);
              }
          });
      }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

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
    setSelectedTxId(undefined);
  };
  
  const handleAuthSuccess = (u: User) => {
      setUser(u);
      localStorage.setItem('JADANPAY_CURRENT_USER_ID', u.id); // Persist session
      // Redirect Admin strictly to admin dashboard, others to user dashboard
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
      
      // Admin Routes
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
            localStorage.removeItem('JADANPAY_CURRENT_USER_ID');
            setActiveTab('dashboard'); 
            setShowLanding(true); 
        }}
    >
      {renderContent()}
    </Layout>
  );
}
