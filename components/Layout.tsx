import React from 'react';
import { User, UserRole } from '../types';
import { Home, History, Settings, LogOut, ShieldCheck, Briefcase } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, activeTab, onTabChange, onLogout }) => {
  
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
             onClick={onLogout}
           />
           <div className="absolute right-0 top-12 bg-white shadow-lg rounded-lg p-2 text-xs w-24 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
             Click to Logout
           </div>
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
          
          <button onClick={onLogout} className="flex flex-col items-center justify-center w-full p-2 text-red-500 hover:text-red-700">
             <LogOut size={24} />
             <span className="text-xs mt-1 font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};