
import React, { useState, useEffect, useRef } from 'react';
import { User, Announcement, AppNotification, TransactionType, TransactionStatus } from '../types';
import { TopUpForm } from './TopUpForm';
import { fundWallet } from '../services/topupService';
import { MockDB } from '../services/mockDb';
import { SettingsService, AppSettings } from '../services/settingsService';
import { playNotification } from '../utils/audio';
import { Wallet, TrendingUp, Plus, ArrowRight, Bell, X, AlertTriangle, Smartphone, Copy, Upload, CreditCard, Landmark, CheckCircle, Gift, Share2, Loader2, Lock, Speaker } from 'lucide-react';

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
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Funding State
  const [fundingMethod, setFundingMethod] = useState<'card' | 'manual'>('card');
  const [manualProofFile, setManualProofFile] = useState<File | null>(null);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', accountName: '' });
  
  // Simulated Payment Modal State
  const [activeGateway, setActiveGateway] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'MONNIFY' | null>(null);
  const [paymentSimulating, setPaymentSimulating] = useState(false);

  // Data Simulation State
  const [simulatedUsage, setSimulatedUsage] = useState(user.dataUsed || 0);
  const notificationSentRef = useRef(false);

  useEffect(() => {
      loadAnnouncements();
      loadNotifications();
      loadSettings();
      // Reset ref when user changes or top-up happens (simulated by dataUsed decreasing or total increasing)
      if (user.dataUsed < simulatedUsage || user.dataTotal > (user.dataTotal || 0)) {
           notificationSentRef.current = false;
      }
      setSimulatedUsage(user.dataUsed);
  }, [user]);

  // Simulate Data Consumption Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedUsage(prev => {
        const next = prev + 0.005; // Consume 5MB every interval
        // Cap at total
        return next > user.dataTotal ? user.dataTotal : next;
      });
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [user.dataTotal]);

  // Check Low Data
  useEffect(() => {
      if (user.dataTotal > 0) {
          const percentageUsed = (simulatedUsage / user.dataTotal) * 100;
          if (percentageUsed >= 80 && !notificationSentRef.current) {
              playNotification("Warning: Your data plan is running low.", 'error');
              MockDB.addNotification({
                  userId: user.id,
                  title: "Low Data Warning",
                  message: `You have used ${percentageUsed.toFixed(0)}% of your data plan. Top up now to stay connected.`,
                  type: 'error'
              });
              notificationSentRef.current = true; // Prevent spamming
              loadNotifications();
          }
      }
  }, [simulatedUsage, user.dataTotal]);

  const loadSettings = async () => {
      const s = await SettingsService.getSettings();
      setSettings(s);
      setBankDetails({
          bankName: s.bankName,
          accountNumber: s.accountNumber,
          accountName: s.accountName
      });
  };

  const loadAnnouncements = async () => {
      const data = await MockDB.getAnnouncements();
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

  const handleDismiss = (id: string) => {
      setDismissedAnnouncements([...dismissedAnnouncements, id]);
  };

  const handleCopyWallet = () => {
      navigator.clipboard.writeText(user.walletNumber);
      playNotification("Wallet number copied");
  };

   const handleCopyReferral = () => {
      navigator.clipboard.writeText(user.referralCode);
      playNotification("Referral code copied");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setManualProofFile(e.target.files[0]);
      }
  };

  const handleFundWallet = async () => {
    if (!fundAmount) {
        alert("Please enter amount");
        return;
    }

    if (fundingMethod === 'manual') {
        // Manual Flow
        setIsFunding(true);
        try {
            if (!manualProofFile) {
                alert("Please upload payment proof.");
                setIsFunding(false);
                return;
            }
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
            refreshUser();
            setShowFundModal(false);
            setManualProofFile(null);
            setFundAmount('');
        } catch(e: any) {
            alert("Error: " + e.message);
        } finally {
            setIsFunding(false);
        }
    }
  };

  const initiatePayment = (gateway: 'PAYSTACK' | 'FLUTTERWAVE' | 'MONNIFY') => {
      if (!fundAmount || Number(fundAmount) <= 0) {
          alert("Please enter a valid amount");
          return;
      }
      setActiveGateway(gateway);
      setPaymentSimulating(true);
      
      // Simulate Payment Processing Time
      setTimeout(() => {
          setPaymentSimulating(false); // Stop loading, show success modal
      }, 2500);
  };

  const completePayment = async () => {
      // Called when user clicks "Authorize" or "Return" on mock modal
      try {
        await fundWallet(user, Number(fundAmount)); 
        playNotification("Payment Successful! Wallet funded.");
        
        refreshUser();
        setShowFundModal(false);
        setActiveGateway(null);
        setFundAmount('');
      } catch (e: any) {
          alert("Funding failed: " + e.message);
      }
  };

  const handleRedeemBonus = async () => {
      if(user.bonusBalance <= 0) return;
      if(!window.confirm("Convert your bonus balance to main wallet balance?")) return;

      setIsRedeeming(true);
      try {
          await MockDB.redeemBonus(user.id);
          playNotification("Bonus redeemed successfully.");
          refreshUser();
      } catch (e: any) {
          alert(e.message);
      } finally {
          setIsRedeeming(false);
      }
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id));
  
  // Data Logic
  const dataTotal = user.dataTotal || 1; // Avoid div by zero
  const dataPercentage = Math.min((simulatedUsage / dataTotal) * 100, 100);
  const remainingData = Math.max(dataTotal - simulatedUsage, 0).toFixed(2);
  const isLowData = dataPercentage >= 80;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in relative">
      
      {/* Top Bar with Notifications */}
      <div className="flex justify-between items-center relative">
          <div>
               <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{new Date().toDateString()}</h3>
          </div>
          <div className="relative">
              <button onClick={markNotificationsRead} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Bell size={24} className="text-gray-600 dark:text-gray-300"/>
                  {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-gray-900 animate-pulse"></span>
                  )}
              </button>
              
              {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in-up">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-bold text-sm text-gray-700 dark:text-gray-200">Notifications</div>
                      <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? (
                              <div className="p-4 text-center text-xs text-gray-400">No new notifications</div>
                          ) : (
                              notifications.map(n => (
                                  <div key={n.id} className={`p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!n.isRead ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}>
                                      <p className="text-xs font-bold text-gray-800 dark:text-white">{n.title}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                                      <p className="text-[9px] text-gray-300 dark:text-gray-500 mt-1 text-right">{new Date(n.date).toLocaleDateString()}</p>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Announcements Section - Ensure this is visible */}
      {visibleAnnouncements.length > 0 && (
          <div className="space-y-3">
              {visibleAnnouncements.map(ann => (
                  <div 
                    key={ann.id} 
                    className={`p-4 rounded-xl border flex items-start gap-3 relative shadow-sm animate-in slide-in-from-top-4 ${
                        ann.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-300' :
                        ann.type === 'warning' ? 'bg-yellow-50 border-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900 dark:text-yellow-300' :
                        ann.type === 'success' ? 'bg-green-50 border-green-100 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300' :
                        'bg-purple-50 border-purple-100 text-purple-800 dark:bg-purple-900/20 dark:border-purple-900 dark:text-purple-300'
                    }`}
                  >
                      <Speaker size={20} className="shrink-0 mt-0.5" />
                      <div className="flex-1 pr-6">
                          <h4 className="font-bold text-sm uppercase tracking-wide mb-1">{ann.title}</h4>
                          <p className="text-sm opacity-90 leading-relaxed">{ann.message}</p>
                      </div>
                      <button 
                        onClick={() => handleDismiss(ann.id)}
                        className="absolute top-3 right-3 text-current opacity-50 hover:opacity-100 hover:bg-black/5 p-1 rounded transition-all"
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
             <TopUpForm user={user} onSuccess={refreshUser} onViewReceipt={onViewReceipt} />
         </div>

         <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* Referral Card */}
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <h3 className="font-bold flex items-center gap-2"><Gift size={18}/> Refer & Earn</h3>
                        <p className="text-xs text-purple-200 mt-1">Share code, earn bonus, buy free data.</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Share2 size={18} />
                    </div>
                </div>

                <div className="bg-black/20 p-4 rounded-xl border border-white/10 mb-4 relative z-10">
                    <p className="text-xs text-purple-200 uppercase font-bold mb-1">Your Referral Code</p>
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-2xl font-bold tracking-wider text-white">{user.referralCode}</span>
                        <button onClick={handleCopyReferral} className="p-1 hover:text-purple-300"><Copy size={16}/></button>
                    </div>
                </div>

                <div className="flex justify-between items-end relative z-10">
                    <div>
                        <p className="text-xs text-purple-200">Bonus Balance</p>
                        <p className="font-mono text-xl font-bold">₦{user.bonusBalance?.toLocaleString() || '0'}</p>
                    </div>
                    {user.bonusBalance > 0 && (
                        <button 
                            onClick={handleRedeemBonus}
                            disabled={isRedeeming}
                            className="px-4 py-2 bg-white text-purple-900 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                        >
                            {isRedeeming ? '...' : 'Redeem to Wallet'}
                        </button>
                    )}
                </div>
            </div>

            {/* Data Monitor */}
            <div className={`bg-white dark:bg-gray-900 p-6 rounded-3xl border shadow-sm relative overflow-hidden transition-colors ${isLowData ? 'border-red-200 dark:border-red-900/50' : 'border-gray-100 dark:border-gray-800'}`}>
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                        <Smartphone size={16} className="text-gray-400"/>
                        Data Plan Usage
                    </h3>
                    {isLowData && (
                         <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                             <AlertTriangle size={10} /> Low Data
                         </span>
                    )}
                </div>

                <div className="relative flex items-center justify-center py-4">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                className="text-gray-100 dark:text-gray-800 stroke-current"
                                strokeWidth="10"
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                            ></circle>
                            <circle
                                className={`${isLowData ? 'text-red-500' : 'text-green-500'} progress-ring__circle stroke-current transition-all duration-1000 ease-out`}
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
                            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tighter">{remainingData}</span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase whitespace-nowrap">GB Left</span>
                        </div>
                    </div>
                </div>
                
                <div className="text-center mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {simulatedUsage.toFixed(2)} GB used of {dataTotal.toFixed(1)} GB
                    </p>
                </div>
            </div>
         </div>
      </div>

       {/* Fund Modal */}
       {showFundModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fund Wallet</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Secure online payment or transfer.</p>
                </div>
                
                {/* Method Switcher */}
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => setFundingMethod('card')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${fundingMethod === 'card' ? 'bg-white dark:bg-gray-700 shadow text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <CreditCard size={14}/> Online / Card
                    </button>
                    <button 
                         onClick={() => setFundingMethod('manual')}
                         className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${fundingMethod === 'manual' ? 'bg-white dark:bg-gray-700 shadow text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <Landmark size={14}/> Transfer
                    </button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-4 border border-gray-100 dark:border-gray-700">
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Amount (₦)</label>
                    <input 
                        type="number" 
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent text-2xl font-mono font-bold text-gray-900 dark:text-white outline-none placeholder:text-gray-400 border-b-2 border-gray-200 dark:border-gray-700 pb-2"
                    />
                </div>

                {fundingMethod === 'card' && (
                    <div className="space-y-3 mb-6">
                         <p className="text-xs font-bold text-gray-400 uppercase">Select Gateway</p>
                         
                         {settings?.enablePaystack ? (
                             <button onClick={() => initiatePayment('PAYSTACK')} className="w-full p-4 border dark:border-gray-700 rounded-xl flex items-center gap-3 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">P</div>
                                 <div className="text-left">
                                     <span className="block font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">Paystack</span>
                                     <span className="text-[10px] text-gray-400">Cards, USSD, Transfer</span>
                                 </div>
                             </button>
                         ) : null}

                         {settings?.enableFlutterwave ? (
                             <button onClick={() => initiatePayment('FLUTTERWAVE')} className="w-full p-4 border dark:border-gray-700 rounded-xl flex items-center gap-3 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group">
                                 <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">F</div>
                                  <div className="text-left">
                                     <span className="block font-bold text-gray-700 dark:text-gray-200 group-hover:text-orange-700 dark:group-hover:text-orange-400">Flutterwave</span>
                                     <span className="text-[10px] text-gray-400">International Cards, Bank</span>
                                 </div>
                             </button>
                         ) : null}

                         {settings?.enableMonnify ? (
                             <button onClick={() => initiatePayment('MONNIFY')} className="w-full p-4 border dark:border-gray-700 rounded-xl flex items-center gap-3 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
                                 <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">M</div>
                                 <div className="text-left">
                                     <span className="block font-bold text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Monnify</span>
                                     <span className="text-[10px] text-gray-400">Account Transfer</span>
                                 </div>
                             </button>
                         ) : null}

                         {!settings?.enablePaystack && !settings?.enableFlutterwave && !settings?.enableMonnify && (
                             <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-xl text-xs font-bold text-center border border-yellow-100 dark:border-yellow-800">
                                 Online payment is currently disabled by Admin. Please use Manual Transfer.
                             </div>
                         )}
                    </div>
                )}

                {fundingMethod === 'manual' && (
                    <div className="mb-6 space-y-4 animate-fade-in">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                            <p className="font-bold">Bank: {bankDetails.bankName}</p>
                            <p className="font-mono mt-1">Acct: {bankDetails.accountNumber}</p>
                            <p className="mt-1">Name: {bankDetails.accountName}</p>
                        </div>
                        
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative h-24 flex items-center justify-center">
                            <input 
                                type="file" 
                                onChange={handleFileChange}
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {manualProofFile ? (
                                <div className="text-green-600 dark:text-green-400 flex flex-col items-center">
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
                         <button 
                            onClick={handleFundWallet}
                            disabled={isFunding}
                            className="w-full py-3.5 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2 mt-4"
                        >
                            {isFunding ? 'Submitting...' : 'Submit Proof'}
                        </button>
                    </div>
                )}
                
                <button 
                    onClick={() => { setShowFundModal(false); setManualProofFile(null); setActiveGateway(null); }}
                    className="w-full py-3 text-gray-400 text-sm font-bold hover:text-gray-600 dark:hover:text-gray-300"
                >
                    Cancel
                </button>
             </div>
        </div>
      )}

      {/* Simulated Payment Gateway Modal */}
      {activeGateway && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative animate-fade-in-up">
                  {/* Mock Gateway Header */}
                  <div className={`p-4 flex items-center justify-between ${
                      activeGateway === 'PAYSTACK' ? 'bg-[#09A5DB]' : 
                      activeGateway === 'FLUTTERWAVE' ? 'bg-[#f5a623]' : 'bg-[#035BA8]'
                  } text-white`}>
                      <span className="font-bold flex items-center gap-2">
                          <Lock size={14} /> Secured by {activeGateway.charAt(0) + activeGateway.slice(1).toLowerCase()}
                      </span>
                      <button onClick={() => setActiveGateway(null)}><X size={18} /></button>
                  </div>
                  
                  <div className="p-8 text-center bg-gray-50/50">
                      {paymentSimulating ? (
                          <div className="py-8">
                               <Loader2 className="animate-spin mx-auto text-gray-400 mb-4" size={40} />
                               <p className="text-gray-800 font-bold text-lg">Processing...</p>
                               <p className="text-xs text-gray-400 mt-2">Connecting to bank...</p>
                          </div>
                      ) : (
                          <div className="py-4 animate-fade-in">
                              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                                  <CheckCircle size={32} />
                              </div>
                              <h3 className="text-xl font-bold text-gray-800">Transaction Approved</h3>
                              <p className="text-gray-500 text-sm mb-6 mt-2">Your payment of <span className="text-gray-900 font-bold">₦{Number(fundAmount).toLocaleString()}</span> was successful.</p>
                              <button 
                                onClick={completePayment}
                                className={`w-full py-3.5 text-white rounded-lg font-bold shadow-lg ${
                                    activeGateway === 'PAYSTACK' ? 'bg-[#09A5DB] hover:bg-[#0894c4]' : 
                                    activeGateway === 'FLUTTERWAVE' ? 'bg-[#f5a623] hover:bg-[#e0961f]' : 'bg-[#035BA8] hover:bg-[#024a8a]'
                                }`}
                              >
                                  Return to Merchant
                              </button>
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4 border-t text-center text-[10px] text-gray-400 bg-white">
                      <p>Test Mode enabled. No real money is charged.</p>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};