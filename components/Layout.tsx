import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Home, History, LogOut, ShieldCheck, Briefcase } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, activeTab, onTabChange, onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };
  
  const NavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => (
    <button
      onClick={() => onTabChange(id)}
      className={`flex flex-col items-center justify-center w-full p-2 transition-colors ${
        activeTab === id ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon size={24} className={activeTab === id ? 'fill-current' : ''} />
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-gray-200">
      {/* Header */}
      <header className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-green-700 tracking-tight">JadanPay</h1>
          <p className="text-xs text-gray-500">Welcome, {user.name.split(' ')[0]}</p>
        </div>
        <div className="relative group">
           <img 
             src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`} 
             alt="Profile" 
             className="w-10 h-10 rounded-full border-2 border-green-100 cursor-pointer"
             onClick={handleLogoutClick}
           />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full max-w-md z-30 pb-safe">
        <div className="flex justify-around items-center h-16">
          <NavItem id="dashboard" icon={Home} label="Home" />
          <NavItem id="history" icon={History} label="History" />
          
          {user.role === UserRole.RESELLER && (
             <NavItem id="reseller" icon={Briefcase} label="Reseller" />
          )}
          
          {user.role === UserRole.ADMIN && (
             <NavItem id="admin" icon={ShieldCheck} label="Admin" />
          )}
          
          <button onClick={handleLogoutClick} className="flex flex-col items-center justify-center w-full p-2 text-red-500 hover:text-red-700">
             <LogOut size={24} />
             <span className="text-xs mt-1 font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold mb-2 text-gray-900">Sign Out?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to log out of JadanPay?</p>
            <div className="flex gap-3">
                <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={confirmLogout}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                    Logout
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};