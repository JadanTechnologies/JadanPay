
import React, { useState, useEffect } from 'react';
import { User, Announcement, AppNotification, TransactionType, TransactionStatus } from '../types';
import { TopUpForm } from './TopUpForm';
import { fundWallet } from '../services/topupService';
import { MockDB } from '../services/mockDb';
import { playNotification } from '../utils/audio';
import { Wallet, TrendingUp, Plus, ArrowRight, Activity, Zap, Bell, X, PieChart, AlertTriangle, Smartphone, Copy, Upload, CreditCard, Landmark, CheckCircle } from 'lucide-react';

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Funding State
  const [fundingMethod, setFundingMethod] = useState<'card' | 'manual'>('card');
  const [manualProofFile, setManualProofFile] = useState<File | null>(null);
  const [fundAmount, setFundAmount] = useState<string>('');
  
  // Mock Data Usage State
  const [dataBalance, setDataBalance] = useState({ total: 10, used: 8.2, unit: 'GB' });

  useEffect(() => {
      loadAnnouncements();
      loadNotifications();
      checkLowData();
  }, []);

  const loadAnnouncements = async () => {
      const data = await MockDB.getAnnouncements();
      // Filter active ones
      setAnnouncements(data.filter(a => a.isActive));
  };

  const loadNotifications = async () => {
      const notes = await MockDB.getNotifications(user.id);
      setNotifications(notes);
  };

  const markNotificationsRead = async () => {
      await MockDB.markNotificationsRead(user.id);
      loadNotifications();
      setShowNotifications(!showNotifications);
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

  const handleCopyWallet = () => {
      navigator.clipboard.writeText(user.walletNumber);
      playNotification("Wallet number copied");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setManualProofFile(e.target.files[0]);
      }
  };

  const handleFundWallet = async () => {
    if (!fundAmount) return;
    setIsFunding(true);
    
    try {
        if (fundingMethod === 'manual') {
            if (!manualProofFile) {
                alert("Please upload payment proof.");
                setIsFunding(false);
                return;
            }
            // Create pending transaction
            await MockDB.addTransaction({
                id: Math.random().toString(36),
                userId: user.id,
                type: TransactionType.WALLET_FUND,
                amount: Number(fundAmount),
                status: TransactionStatus.PENDING,
                date: new Date().toISOString(),
                reference: 'MNL-' + Math.floor(Math.random() * 1000000),
                paymentMethod: 'Manual Transfer',
                proofUrl: URL.createObjectURL(manualProofFile) // Mock URL
            });
            alert("Payment proof submitted! Pending Admin Approval.");
            playNotification("Proof submitted successfully. Awaiting approval.");
        } else {
            // Mock Card Payment (Instant)
            await fundWallet(user, Number(fundAmount)); 
            playNotification("Payment Received. Your wallet has been funded successfully.");
            alert("Wallet funded successfully!");
        }
        
        refreshUser();
        setShowFundModal(false);
        setManualProofFile(null);
        setFundAmount('');
    } catch(e: any) {
        alert("Funding failed: " + e.message);
        playNotification("Funding failed. Please try again.", 'error');
    } finally {
        setIsFunding(false);
    }
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id));
  const dataPercentage = (dataBalance.used / dataBalance.total) * 100;
  const remainingData = (dataBalance.total - dataBalance.used).toFixed(2);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in relative">
      
      {/* Top Bar with Notifications */}
      <div className="flex justify-end relative">
          <button onClick={markNotificationsRead} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell size={24} className="text-gray-600"/>
              {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
              )}
          </button>
          
          {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100 font-bold text-sm text-gray-700">Notifications</div>
                  <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400">No new notifications</div>
                      ) : (
                          notifications.map(n => (
                              <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 ${!n.isRead ? 'bg-green-50/30' : ''}`}>
                                  <p className="text-xs font-bold text-gray-800">{n.title}</p>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{n.message}</p>
                                  <p className="text-[9px] text-gray-300 mt-1 text-right">{new Date(n.date).toLocaleDateString()}</p>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}
      </div>

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
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-400/10 rounded-full -ml-8 -mb-8 blur-xl"></div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
                <div>
                    <div className="flex items-center gap-2 text-green-200 mb-1">
                        <Wallet size={18} />
                        <span className="text-sm font-medium uppercase tracking-wider">Total Balance</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight">₦{user.balance.toLocaleString()}</h1>
                </div>
                
                {/* Wallet ID Display */}
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md">
                    <span className="text-xs text-green-200 uppercase tracking-widest font-bold">Wallet ID:</span>
                    <span className="font-mono text-sm font-bold tracking-wider">{user.walletNumber}</span>
                    <button onClick={handleCopyWallet} className="ml-2 text-white hover:text-green-300"><Copy size={12}/></button>
                </div>
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
         <div className="lg:col-span-7 xl:col-span-8 space-y-6">
             <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Zap className="text-yellow-500 fill-current" size={20}/> Quick Action
                </h3>
             </div>
             <TopUpForm user={user} onSuccess={refreshUser} onViewReceipt={onViewReceipt} />
         </div>

         <div className="lg:col-span-5 xl:col-span-4 space-y-6">
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
            </div>

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
                    <p className="text-gray-500 text-sm mt-1">Select payment method below.</p>
                </div>
                
                {/* Method Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => setFundingMethod('card')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${fundingMethod === 'card' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}
                    >
                        <CreditCard size={14}/> Card / Instant
                    </button>
                    <button 
                         onClick={() => setFundingMethod('manual')}
                         className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${fundingMethod === 'manual' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}
                    >
                        <Landmark size={14}/> Manual Transfer
                    </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Amount (₦)</label>
                    <input 
                        type="number" 
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent text-2xl font-mono font-bold text-gray-800 outline-none placeholder:text-gray-300"
                    />
                </div>

                {fundingMethod === 'manual' && (
                    <div className="mb-6 space-y-4 animate-fade-in">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                            <p className="font-bold">Bank: GTBank</p>
                            <p>Account: 0123456789</p>
                            <p>Name: JadanPay LTD</p>
                        </div>
                        
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                            <input 
                                type="file" 
                                onChange={handleFileChange}
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {manualProofFile ? (
                                <div className="text-green-600 flex flex-col items-center">
                                    <CheckCircle size={24} className="mb-1"/>
                                    <span className="text-xs font-bold">{manualProofFile.name}</span>
                                </div>
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <Upload size={24} className="mb-1"/>
                                    <span className="text-xs">Upload Receipt</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button 
                        onClick={() => { setShowFundModal(false); setManualProofFile(null); }}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleFundWallet}
                        disabled={isFunding}
                        className="flex-1 py-3.5 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                    >
                         {isFunding ? 'Processing...' : (fundingMethod === 'manual' ? 'Submit Proof' : 'Pay Now')}
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};
