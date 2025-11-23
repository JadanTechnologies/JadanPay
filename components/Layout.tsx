import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Home, History, LogOut, ShieldCheck, Briefcase, User as UserIcon, Menu, LayoutDashboard } from 'lucide-react';

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
  
  const NavItem = ({ id, icon: Icon, label, mobile = false }: { id: string; icon: any; label: string, mobile?: boolean }) => (
    <button
      onClick={() => onTabChange(id)}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full
        ${mobile ? 'flex-col justify-center p-2 gap-1' : ''}
        ${activeTab === id 
          ? 'bg-green-50 text-green-700 font-bold shadow-sm' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
      `}
    >
      <Icon size={mobile ? 24 : 20} className={activeTab === id ? 'fill-current' : ''} />
      <span className={mobile ? "text-[10px] font-medium" : "text-sm font-medium"}>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
         <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-green-700 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center text-white text-lg font-black">J</div>
              JadanPay
            </h1>
         </div>
         
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {user.role === UserRole.ADMIN ? (
                // ADMIN NAVIGATION ONLY
                <>
                    <div className="px-4 py-2 mb-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</p>
                    </div>
                    <NavItem id="admin" icon={LayoutDashboard} label="Admin Overview" />
                </>
            ) : (
                // USER / RESELLER NAVIGATION
                <>
                    <NavItem id="dashboard" icon={Home} label="Dashboard" />
                    <NavItem id="history" icon={History} label="Transactions" />
                    
                    {user.role === UserRole.RESELLER && (
                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Business</p>
                        <NavItem id="reseller" icon={Briefcase} label="Reseller Zone" />
                    </div>
                    )}
                </>
            )}
         </nav>

         <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3 border border-gray-100">
               <img src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`} className="w-10 h-10 rounded-full" alt="" />
               <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
               </div>
            </div>
            <button onClick={handleLogoutClick} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 w-full transition-colors group">
               <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
               <span className="text-sm font-medium">Sign Out</span>
            </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0 h-screen transition-all">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white px-4 py-3 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center text-white font-bold">J</div>
                <h1 className="text-lg font-bold text-gray-900">JadanPay</h1>
            </div>
            <div className="relative" onClick={handleLogoutClick}>
               <img 
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full border-2 border-green-50"
               />
               <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex bg-white px-8 py-5 border-b justify-between items-center sticky top-0 z-20 shadow-sm/50 backdrop-blur-sm bg-white/90">
           <div>
              <h2 className="text-xl font-bold text-gray-800 capitalize">
                {activeTab === 'dashboard' 
                    ? `Welcome back, ${user.name.split(' ')[0]} 👋` 
                    : activeTab === 'admin' 
                        ? 'Administrator Portal' 
                        : activeTab.replace(/([A-Z])/g, ' $1').trim()}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                 {activeTab === 'dashboard' 
                    ? 'Here is what is happening with your wallet today.' 
                    : activeTab === 'admin' 
                        ? 'Manage platform activities and users.' 
                        : 'Manage your activities.'}
              </p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right hidden lg:block">
                 <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Wallet Balance</p>
                 <p className="text-lg font-bold text-green-700 font-mono">₦{user.balance.toLocaleString()}</p>
              </div>
              <div className="h-8 w-px bg-gray-200 hidden lg:block"></div>
              <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors">
                 <UserIcon size={20} />
              </button>
           </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-gray-50/50">
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-30 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16">
              {user.role === UserRole.ADMIN ? (
                 // ADMIN MOBILE NAV
                 <NavItem id="admin" icon={LayoutDashboard} label="Admin" mobile />
              ) : (
                 // USER MOBILE NAV
                 <>
                    <NavItem id="dashboard" icon={Home} label="Home" mobile />
                    <NavItem id="history" icon={History} label="History" mobile />
                    
                    {user.role === UserRole.RESELLER && (
                        <NavItem 
                            id="reseller" 
                            icon={Briefcase} 
                            label="Reseller" 
                            mobile 
                        />
                    )}
                 </>
              )}
               
              <button onClick={handleLogoutClick} className="flex flex-col items-center justify-center w-full p-2 text-gray-400 hover:text-red-500 gap-1 transition-colors">
                 <LogOut size={24} />
                 <span className="text-[10px] font-medium">Logout</span>
              </button>
            </div>
        </nav>

      </div>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-fade-in-up transform transition-all scale-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto text-red-600">
                <LogOut size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900 text-center">Sign Out?</h3>
            <p className="text-gray-500 text-sm mb-6 text-center">Are you sure you want to log out of JadanPay?</p>
            <div className="flex gap-3">
                <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={confirmLogout}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
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