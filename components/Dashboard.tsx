import React, { useState, useEffect, useRef } from 'react';
import { User, Announcement, AppNotification, TransactionType, TransactionStatus, KycStatus } from '../types';
import { TopUpForm } from './TopUpForm';
import { fundWallet } from '../services/topupService';
import { MockDB } from '../services/mockDb';
import { SettingsService, AppSettings } from '../services/settingsService';
import { playNotification } from '../utils/audio';
import { Wallet, TrendingUp, Plus, ArrowRight, Bell, X, AlertTriangle, Smartphone, Copy, Upload, CreditCard, Landmark, CheckCircle, Gift, Share2, Loader2, Lock, Speaker, UserCheck } from 'lucide-react';
import { VerificationModal } from './VerificationModal';

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
  
  // Verification State
  const [showVerifyModal, setShowVerifyModal] = useState(false);

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
      setSimulatedUsage(user.dataUsed);
  }, [user]);

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

  const handleCopyWallet = () => {
      navigator.clipboard.writeText(user.walletNumber);
      playNotification("Wallet number copied");
  };

   const handleCopyReferral = () => {
      navigator.clipboard.writeText(user.referralCode);
      playNotification("Referral code copied");
  };

  const handleFundWallet = async () => {
    if (!fundAmount) {
        alert("Please enter amount");
        return;
    }

    if (fundingMethod === 'manual') {
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
                proofUrl: URL.createObjectURL(manualProofFile)
            });
            alert("Payment proof submitted! Pending Admin Approval.");
            refreshUser();
            setShowFundModal(false);
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
      setTimeout(() => {
          setPaymentSimulating(false);
      }, 2500);
  };

  const completePayment = async () => {
      try {
        await fundWallet(user, Number(fundAmount)); 
        playNotification("Payment Successful!");
        refreshUser();
        setShowFundModal(false);
        setActiveGateway(null);
      } catch (e: any) {
          alert("Funding failed: " + e.message);
      }
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id));
  const dataTotal = user.dataTotal || 1;
  const dataPercentage = Math.min((simulatedUsage / dataTotal) * 100, 100);
  const remainingData = Math.max(dataTotal - simulatedUsage, 0).toFixed(2);
  const isLowData = dataPercentage >= 80;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in relative">
      
      {/* Top Bar */}
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
          </div>
      </div>

      {/* Verification Alert */}
      {!user.isVerified && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full text-orange-600 dark:text-orange-400">
                      <UserCheck size={20} />
                  </div>
                  <div>
                      <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm">Verify your Identity</h4>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Complete KYC to unlock automated wallet funding and higher limits.</p>
                  </div>
              </div>
              <button 
                  onClick={() => setShowVerifyModal(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 dark:shadow-none"
              >
                  Verify Now
              </button>
          </div>
      )}
      
      {/* Wallet Banner Section */}
      <div className="bg-gradient-to-r from-green-800 to-green-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-colors duration-1000"></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
                <div>
                    <div className="flex items-center gap-2 text-green-200 mb-1"><Wallet size={18} /><span className="text-sm font-medium uppercase tracking-wider">Total Balance</span></div>
                    <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.3)]">₦{user.balance.toLocaleString()}</h1>
                </div>
                
                {!user.isVerified && (
                    <button 
                        onClick={() => setShowVerifyModal(true)}
                        className="inline-flex items-center gap-2 bg-green-300/20 hover:bg-green-300/30 transition-colors px-3 py-1.5 rounded-lg border border-green-300/30 backdrop-blur-md text-green-100 text-xs cursor-pointer"
                    >
                        <Lock size={12} /> Click to Complete KYC & Get Wallet ID
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:justify-end">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-green-500/30 flex items-center gap-4 min-w-[200px]">
                    <div className="p-3 bg-green-500/20 rounded-xl text-green-300"><TrendingUp size={24} /></div>
                    <div><p className="text-[10px] text-green-200 uppercase tracking-wide">Savings Stash</p><p className="font-mono text-xl font-bold">₦{user.savings.toLocaleString()}</p></div>
                </div>
                <button onClick={() => setShowFundModal(true)} className="py-4 px-8 bg-white text-green-900 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:bg-gray-50 flex items-center justify-center gap-2 whitespace-nowrap"><Plus size={20} /> Fund Wallet</button>
            </div>
        </div>
      </div>
      
      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-7 xl:col-span-8 space-y-6">
             <TopUpForm user={user} onSuccess={refreshUser} onViewReceipt={onViewReceipt} />
         </div>

         <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div><h3 className="font-bold flex items-center gap-2"><Gift size={18}/> Refer & Earn</h3><p className="text-xs text-purple-200 mt-1">Share code, earn bonus, buy free data.</p></div>
                    <div className="bg-white/20 p-2 rounded-lg"><Share2 size={18} /></div>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/10 mb-4 relative z-10">
                    <p className="text-xs text-purple-200 uppercase font-bold mb-1">Your Referral Code</p>
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-2xl font-bold tracking-wider text-white">{user.referralCode}</span>
                        <button onClick={handleCopyReferral} className="p-1 hover:text-purple-300"><Copy size={16}/></button>
                    </div>
                </div>
                <div className="flex justify-between items-end relative z-10">
                    <div><p className="text-xs text-purple-200">Bonus Balance</p><p className="font-mono text-xl font-bold">₦{user.bonusBalance?.toLocaleString() || '0'}</p></div>
                </div>
            </div>
            {/* Data Monitor */}
            <div className={`bg-white dark:bg-gray-900 p-6 rounded-3xl border shadow-sm relative overflow-hidden transition-colors ${isLowData ? 'border-red-200 dark:border-red-900/50' : 'border-gray-100 dark:border-gray-800'}`}>
                 <div className="flex items-center justify-between mb-4 relative z-10"><h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2"><Smartphone size={16}/> Data Plan Usage</h3>{isLowData && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> Low</span>}</div>
                 <div className="text-center mt-2"><p className="text-xs text-gray-500 dark:text-gray-400">{simulatedUsage.toFixed(2)} GB used of {dataTotal.toFixed(1)} GB</p></div>
            </div>
         </div>
      </div>
      
      {showVerifyModal && <VerificationModal user={user} onClose={() => setShowVerifyModal(false)} onSuccess={refreshUser} />}
    </div>
  );
};
