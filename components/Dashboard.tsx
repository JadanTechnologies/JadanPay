
import React, { useState, useEffect } from 'react';
import { User, Announcement } from '../types';
import { TopUpForm } from './TopUpForm';
import { fundWallet } from '../services/topupService';
import { MockDB } from '../services/mockDb';
import { playNotification } from '../utils/audio';
import { Wallet, TrendingUp, Plus, ArrowRight, Activity, Zap, Bell, X, PieChart, AlertTriangle, Smartphone } from 'lucide-react';

interface DashboardProps {
  user: User;
  refreshUser: () => void;
  onViewReceipt: (txId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, refreshUser, onViewReceipt }) => {
  const [showFundModal, setShowFundModal] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  
  // Mock Data Usage State
  const [dataBalance, setDataBalance] = useState({ total: 10, used: 8.2, unit: 'GB' });

  useEffect(() => {
      loadAnnouncements();
      checkLowData();
  }, []);

  const loadAnnouncements = async () => {
      const data = await MockDB.getAnnouncements();
      // Filter active ones
      setAnnouncements(data.filter(a => a.isActive));
  };

  const checkLowData = () => {
      // Simulate a check. If used > 80%, warn user.
      const percentageUsed = (dataBalance.used / dataBalance.total) * 100;
      if (percentageUsed >= 80) {
          // Only play if not recently dismissed (logic simplified for demo)
          // setTimeout(() => playNotification("Warning. Your data bundle is about to finish."), 3000);
      }
  };

  const handleDismiss = (id: string) => {
      setDismissedAnnouncements([...dismissedAnnouncements, id]);
  };

  const handleFundWallet = async () => {
    setIsFunding(true);
    try {
        await fundWallet(user, 10000); // Mock funding fixed amount
        refreshUser();
        setShowFundModal(false);
        playNotification("Payment Received. Your wallet has been funded successfully.");
        alert("Wallet funded with ₦10,000 successfully!");
    } catch(e) {
        alert("Funding failed");
        playNotification("Funding failed. Please try again.", 'error');
    } finally {
        setIsFunding(false);
    }
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id));
  const dataPercentage = (dataBalance.used / dataBalance.total) * 100;

  // Calculate remaining data and ensure it doesn't wrap
  const remainingData = (dataBalance.total - dataBalance.used).toFixed(2);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      
      {/* Announcements Section */}
      {visibleAnnouncements.length > 0 && (
          <div className="space-y-2">
              {visibleAnnouncements.map(ann => (
                  <div 
                    key={ann.id} 
                    className={`p-4 rounded-xl border flex items-start gap-3 relative ${
                        ann.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' :
                        ann.type === 'warning' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' :
                        ann.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' :
                        'bg-purple-50 border-purple-100 text-purple-800'
                    }`}
                  >
                      <Bell size={20} className="shrink-0 mt-0.5" />
                      <div className="flex-1 pr-6">
                          <h4 className="font-bold text-sm">{ann.title}</h4>
                          <p className="text-xs opacity-90 mt-1">{ann.message}</p>
                      </div>
                      <button 
                        onClick={() => handleDismiss(ann.id)}
                        className="absolute top-3 right-3 text-current opacity-50 hover:opacity-100"
                      >
                          <X size={16} />
                      </button>
                  </div>
              ))}
          </div>
      )}
      
      {/* Wallet Banner Section */}
      <div className="bg-gradient-to-r from-green-800 to-green-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden group">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-400/10 rounded-full -ml-8 -mb-8 blur-xl"></div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-200 mb-2">
                    <Wallet size={18} />
                    <span className="text-sm font-medium uppercase tracking-wider">Total Balance</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight">₦{user.balance.toLocaleString()}</h1>
                <p className="text-green-300 text-xs md:text-sm mt-2">Safe & Secure Payments handled by JadanPay.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:justify-end">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-green-500/30 flex items-center gap-4 min-w-[200px]">
                    <div className="p-3 bg-green-500/20 rounded-xl text-green-300">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-green-200 uppercase tracking-wide">Savings Stash</p>
                        <p className="font-mono text-xl font-bold">₦{user.savings.toLocaleString()}</p>
                    </div>
                </div>

                <button 
                    onClick={() => setShowFundModal(true)}
                    className="py-4 px-8 bg-white text-green-900 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    <Plus size={20} /> Fund Wallet
                </button>
            </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         
         {/* Left Column: Top Up Form */}
         <div className="lg:col-span-7 xl:col-span-8 space-y-6">
             <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Zap className="text-yellow-500 fill-current" size={20}/> Quick Action
                </h3>
             </div>
             
             {/* The Form Component */}
             <TopUpForm user={user} onSuccess={refreshUser} onViewReceipt={onViewReceipt} />
         </div>

         {/* Right Column: Quick Repay & Stats */}
         <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* Data Usage Monitor Widget */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <Smartphone size={16} className="text-gray-400"/>
                        Data Monitor
                    </h3>
                    {dataPercentage > 80 && (
                         <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                             <AlertTriangle size={10} /> Low Data
                         </span>
                    )}
                </div>

                <div className="relative flex items-center justify-center py-4">
                    {/* Circular Progress (CSS/SVG Mock) */}
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                className="text-gray-100 stroke-current"
                                strokeWidth="10"
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                            ></circle>
                            <circle
                                className={`${dataPercentage > 90 ? 'text-red-500' : 'text-green-500'} progress-ring__circle stroke-current transition-all duration-1000 ease-out`}
                                strokeWidth="10"
                                strokeLinecap="round"
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                strokeDasharray="251.2"
                                strokeDashoffset={251.2 - (251.2 * dataPercentage) / 100}
                                transform="rotate(-90 50 50)"
                            ></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
                            <span className="text-2xl font-bold text-gray-800 tracking-tighter">{remainingData}</span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase whitespace-nowrap">{dataBalance.unit} Left</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
                    <div className="text-center">
                        <p className="mb-1">Used</p>
                        <p className="font-bold text-gray-800">{dataBalance.used} {dataBalance.unit}</p>
                    </div>
                    <div className="text-center">
                        <p className="mb-1">Total</p>
                        <p className="font-bold text-gray-800">{dataBalance.total} {dataBalance.unit}</p>
                    </div>
                </div>
                
                {dataPercentage > 80 && (
                    <p className="text-xs text-red-500 text-center mt-4 bg-red-50 p-2 rounded-lg">
                        You have used {dataPercentage.toFixed(0)}% of your data plan. Top up now to stay connected.
                    </p>
                )}
            </div>

            {/* Quick Repay Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-sm">Quick Repay</h3>
                    <button className="text-green-600 text-xs font-bold hover:underline flex items-center gap-1">
                        Edit <ArrowRight size={12}/>
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border-2 border-transparent group-hover:border-green-500 group-hover:bg-green-50 transition-all relative overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} className="w-full h-full object-cover" alt="" />
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 group-hover:text-green-700">Fam {i}</span>
                        </div>
                    ))}
                    <div className="flex flex-col items-center gap-2 cursor-pointer group">
                         <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:border-green-400 group-hover:text-green-500 transition-colors">
                            <Plus size={20} />
                         </div>
                         <span className="text-[10px] font-medium text-gray-400">Add</span>
                    </div>
                </div>
            </div>

            {/* Promo / Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
                        <Activity size={18} />
                        <h3>Usage Insight</h3>
                    </div>
                    <p className="text-sm text-blue-800/80 leading-relaxed mb-4">
                        You've spent <span className="font-bold text-blue-900">₦4,500</span> on Data this month. That's 12% less than last month!
                    </p>
                    <div className="h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[70%] rounded-full"></div>
                    </div>
                </div>
                <div className="absolute -bottom-4 -right-4 text-blue-100 opacity-50">
                    <TrendingUp size={100} />
                </div>
            </div>

         </div>
      </div>

       {/* Fund Modal */}
       {showFundModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-fade-in-up">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Fund Wallet</h3>
                    <p className="text-gray-500 text-sm mt-1">Add funds securely via bank transfer or card.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 text-center">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Amount to add</p>
                    <p className="text-3xl font-mono font-bold text-gray-800">₦10,000.00</p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowFundModal(false)}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleFundWallet}
                        disabled={isFunding}
                        className="flex-1 py-3.5 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-colors shadow-lg shadow-green-200"
                    >
                        {isFunding ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};
