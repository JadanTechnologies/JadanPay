
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Home, History, LogOut, Briefcase, User as UserIcon, LayoutDashboard, Settings, Users, MessageSquare, Lock, Megaphone, CreditCard, LifeBuoy, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { SettingsService } from '../services/settingsService';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, activeTab, onTabChange, onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [appName, setAppName] = useState('JadanPay');
  
  // Persist collapsed state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  useEffect(() => {
      SettingsService.getSettings().then(s => {
          setLogoUrl(s.logoUrl);
          setAppName(s.appName);
      });
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
  };
  
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
        ${isCollapsed && !mobile ? 'justify-center px-2' : ''}
        ${activeTab === id 
          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold shadow-sm' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}
      `}
      title={isCollapsed ? label : ''}
    >
      <Icon size={mobile ? 24 : 20} className={activeTab === id ? 'fill-current' : ''} />
      {!isCollapsed && !mobile && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
      {mobile && <span className="text-[10px] font-medium">{label}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row font-sans transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
         <div className={`p-6 border-b border-gray-100 dark:border-gray-800 flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
                <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center text-white text-lg font-black shrink-0">{appName.charAt(0)}</div>
            )}
            {!isCollapsed && (
                <h1 className="text-xl font-bold text-green-700 dark:text-green-500 tracking-tight ml-2 whitespace-nowrap overflow-hidden">{appName}</h1>
            )}
         </div>
         
         <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
            {user.role === UserRole.ADMIN ? (
                <>
                    {!isCollapsed && <div className="px-4 py-2 mb-2"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p></div>}
                    <NavItem id="admin" icon={LayoutDashboard} label="Overview" />
                    <NavItem id="admin-payments" icon={CreditCard} label="Payments" />
                    <NavItem id="admin-users" icon={Users} label="Users" />
                    <NavItem id="admin-support" icon={MessageSquare} label="Tickets" />
                    <NavItem id="admin-communication" icon={Megaphone} label="Comm." />
                    <NavItem id="admin-staff" icon={Lock} label="Staff" />
                    <NavItem id="admin-access" icon={ShieldAlert} label="Access" />
                    <NavItem id="admin-settings" icon={Settings} label="Settings" />
                </>
            ) : (
                <>
                    <NavItem id="dashboard" icon={Home} label="Dashboard" />
                    <NavItem id="history" icon={History} label="Transactions" />
                    <NavItem id="support" icon={LifeBuoy} label="Support" />
                    <NavItem id="profile" icon={UserIcon} label="Profile" />
                    
                    {user.role === UserRole.RESELLER && (
                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                        {!isCollapsed && <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Business</p>}
                        <NavItem id="reseller" icon={Briefcase} label="Reseller" />
                    </div>
                    )}
                </>
            )}
         </nav>

         <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {!isCollapsed && (
                <div 
                   onClick={() => onTabChange('profile')}
                   className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                   <img src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`} className="w-8 h-8 rounded-full shrink-0" alt="" />
                   <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                   </div>
                </div>
            )}
            
            <button 
                onClick={handleLogoutClick} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
                title="Sign Out"
            >
               <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
               {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
            </button>
            
            {/* Collapse Toggle */}
            <button 
                onClick={toggleSidebar}
                className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg mt-2 transition-colors"
            >
                {isCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
            </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-black px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 z-20 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center text-white font-bold">{appName.charAt(0)}</div>
                )}
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{appName}</h1>
            </div>
            <div className="relative" onClick={() => onTabChange('profile')}>
               <img 
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full border-2 border-green-50 dark:border-gray-700"
               />
               <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-black rounded-full"></div>
            </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex bg-white/90 dark:bg-black/90 px-8 py-5 border-b border-gray-200 dark:border-gray-800 justify-between items-center sticky top-0 z-20 shadow-sm/50 backdrop-blur-sm transition-colors duration-300">
           <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize">
                {activeTab === 'dashboard' ? `Welcome back, ${user.name.split(' ')[0]} 👋` : activeTab.replace(/([A-Z])/g, ' $1').replace('-', ' ').trim()}
              </h2>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right hidden lg:block">
                 <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Wallet Balance</p>
                 <p className="text-lg font-bold text-green-700 dark:text-green-500 font-mono">₦{user.balance.toLocaleString()}</p>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden lg:block"></div>
              <button 
                onClick={() => onTabChange('profile')}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full transition-colors"
              >
                 <UserIcon size={20} />
              </button>
           </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 px-4 py-2 z-30 flex justify-between items-center safe-area-pb">
           {user.role === UserRole.ADMIN ? (
              <>
                <NavItem id="admin" icon={LayoutDashboard} label="Admin" mobile />
                <NavItem id="admin-users" icon={Users} label="Users" mobile />
                <NavItem id="admin-payments" icon={CreditCard} label="Pay" mobile />
                <NavItem id="admin-settings" icon={Settings} label="Settings" mobile />
              </>
           ) : (
              <>
                <NavItem id="dashboard" icon={Home} label="Home" mobile />
                <NavItem id="history" icon={History} label="History" mobile />
                <NavItem id="support" icon={LifeBuoy} label="Support" mobile />
                <NavItem id="profile" icon={UserIcon} label="Account" mobile />
              </>
           )}
        </nav>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sign Out</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to sign out of your account?</p>
                <div className="flex gap-3">
                   <button 
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={confirmLogout}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                   >
                      Sign Out
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
