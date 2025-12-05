
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
import { AdminAccessControl } from './components/AdminAccessControl';
import { AdminAuditLog } from './components/AdminAuditLog';
import { ResellerZone } from './components/ResellerZone';
import { DeveloperApi } from './components/DeveloperApi';
import { LandingPage } from './components/LandingPage';
import { UserProfile } from './components/UserProfile';
import { User, UserRole } from './types';
import { SettingsService } from './services/settingsService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTxId, setSelectedTxId] = useState<string | undefined>(undefined);
  const [showLanding, setShowLanding] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme Management
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

  // Apply Favicon and App Name
  useEffect(() => {
    const applySettings = async () => {
      try {
        const s = await SettingsService.getSettings();
        document.title = s.appName;
        if (s.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = s.faviconUrl;
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    applySettings();
  }, []);

  // Handle Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    );
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleRefreshUser = async () => {
    // Configured in AuthContext, can expose if needed
  };

  const handleViewReceipt = (txId: string) => {
    setSelectedTxId(txId);
    setActiveTab('history');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedTxId(undefined);
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
      onAuthSuccess={() => setShowLanding(false)}
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
        return user.role === UserRole.ADMIN ? <AdminDashboard onNavigate={handleTabChange} /> : <Dashboard user={user} refreshUser={handleRefreshUser} onViewReceipt={handleViewReceipt} />;
      case 'history':
        return <History user={user} highlightId={selectedTxId} />;
      case 'profile':
        return <UserProfile user={user} onUpdate={handleRefreshUser} />;
      case 'support':
        return <Support user={user} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleTabChange} />;
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
      case 'admin-access':
        return <AdminAccessControl />;
      case 'admin-audit':
        return <AdminAuditLog />;
      case 'admin-settings':
        return <AdminSettings />;
      case 'reseller':
        return user.role === UserRole.RESELLER ? <ResellerZone /> : <div className="p-10 text-center dark:text-white">Unauthorized</div>;
      case 'api-docs':
        return (user.role === UserRole.RESELLER || user.apiKey) ? <DeveloperApi user={user} /> : <div className="p-10 text-center dark:text-white">Unauthorized</div>;
      default:
        if (user.role === UserRole.ADMIN) return <AdminDashboard onNavigate={handleTabChange} />;
        return <Dashboard user={user} refreshUser={handleRefreshUser} onViewReceipt={handleViewReceipt} />;
    }
  };

  return (
    <Layout
      user={user}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={signOut}
    >
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}