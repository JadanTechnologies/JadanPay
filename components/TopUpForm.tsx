
import React, { useState, useEffect } from 'react';
import { Provider, Bundle, User, TransactionType, Transaction, PlanType, BillProvider } from '../types';
import { PROVIDER_COLORS, PROVIDER_LOGOS, BILL_PROVIDERS, CABLE_PLANS } from '../constants';
import { processAirtimePurchase, processDataPurchase, processBillPayment } from '../services/topupService';
import { SettingsService } from '../services/settingsService';
import { MockDB } from '../services/mockDb';
import { playNotification } from '../utils/audio';
import { Smartphone, Wifi, PiggyBank, Loader2, Sparkles, Star, Check, AlertTriangle, Info, Share2, Ban, Activity, ChevronDown, Tv, Zap, User as UserIcon, Phone, RefreshCw, X, Receipt, QrCode, BarChart3, Lock, Key } from 'lucide-react';

interface TopUpFormProps {
  user: User;
  onSuccess: () => void;
  onViewReceipt: (txId: string) => void;
}

// Define specific limits per provider
const PROVIDER_LIMITS: Record<string, { min: number; max: number }> = {
  [Provider.MTN]: { min: 100, max: 50000 },
  [Provider.GLO]: { min: 100, max: 50000 },
  [Provider.AIRTEL]: { min: 100, max: 50000 },
  [Provider.NMOBILE]: { min: 100, max: 50000 },
  // Electricity min 1000
  [BillProvider.IKEDC]: { min: 1000, max: 200000 },
  [BillProvider.EKEDC]: { min: 1000, max: 200000 },
  [BillProvider.AEDC]: { min: 1000, max: 200000 },
  [BillProvider.IBEDC]: { min: 1000, max: 200000 },
  [BillProvider.KEDCO]: { min: 1000, max: 200000 },
};

// Constant Service Fee for Bills
const BILL_SERVICE_FEE = 100;

// Helper for Signal Bars
const SignalBars = ({ level, colorClass }: { level: number, colorClass: string }) => (
    <div className="flex gap-[2px] items-end h-3">
        {[1, 2, 3, 4].map(bar => (
            <div 
                key={bar} 
                className={`w-[3px] rounded-sm transition-all duration-500 ${bar <= level ? colorClass : 'bg-gray-200 dark:bg-gray-700 opacity-30'}`}
                style={{ height: `${bar * 25}%` }}
            ></div>
        ))}
    </div>
);

export const TopUpForm: React.FC<TopUpFormProps> = ({ user, onSuccess, onViewReceipt }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.AIRTIME);
  
  // General State
  const [provider, setProvider] = useState<string>(Provider.MTN);
  const [phone, setPhone] = useState<string>(''); // Acts as Phone, Meter No, or IUC
  const [amount, setAmount] = useState<number | ''>('');
  
  // Data State
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>(PlanType.SME);
  const [availablePlanTypes, setAvailablePlanTypes] = useState<PlanType[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);

  // Bill Verification State
  const [isValidating, setIsValidating] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Common State
  const [loading, setLoading] = useState(false);
  const [roundUp, setRoundUp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  
  // PIN States
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<'verify' | 'create'>('verify');
  const [confirmPinInput, setConfirmPinInput] = useState(''); // For creation
  
  // Dynamic Settings
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});
  const [providerStats, setProviderStats] = useState<Record<string, number>>({});
  
  // Result View State
  const [resultState, setResultState] = useState<'idle' | 'success' | 'error'>('idle');
  
  // QR State
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      try {
        const settings = await SettingsService.getSettings();
        setProviderStatus(settings.providerStatus || {});
        setProviderStats(settings.providerStats || {});
        const dbBundles = await MockDB.getBundles();
        setBundles(dbBundles);
      } catch (e) {
        console.error("Failed to load top-up data", e);
      }
  };

  // Smart Suggest for Telcos
  useEffect(() => {
    if ((type === TransactionType.AIRTIME || type === TransactionType.DATA) && phone.length === 11) {
      let suggested: Provider | null = null;
      if (phone.startsWith('0803') || phone.startsWith('0806') || phone.startsWith('0813') || phone.startsWith('0816')) suggested = Provider.MTN;
      else if (phone.startsWith('0805') || phone.startsWith('0815') || phone.startsWith('0811')) suggested = Provider.GLO;
      else if (phone.startsWith('0802') || phone.startsWith('0812') || phone.startsWith('0902')) suggested = Provider.AIRTEL;
      else if (phone.startsWith('0809') || phone.startsWith('0819') || phone.startsWith('0909')) suggested = Provider.NMOBILE;

      if (suggested && providerStatus[suggested] !== false) {
         setProvider(suggested);
      }
    }
  }, [phone, providerStatus, type]);

  // Handle Bill Verification Simulation
  useEffect(() => {
    if ((type === TransactionType.ELECTRICITY || type === TransactionType.CABLE) && phone.length >= 10) {
        // Debounce verification
        const timer = setTimeout(() => {
            validateBillCustomer();
        }, 1200);
        return () => clearTimeout(timer);
    } else {
        setCustomerName(null);
        setValidationError(null);
    }
  }, [phone, provider, type]);

  const validateBillCustomer = async () => {
      setIsValidating(true);
      setCustomerName(null);
      setValidationError(null);
      
      // Simulate API verification
      setTimeout(() => {
          if (Math.random() > 0.15) {
              setCustomerName("MOCK USER: " + (Math.random() + 1).toString(36).substring(7).toUpperCase() + " FAMILY");
          } else {
              setValidationError("Invalid Number. Please check and try again.");
          }
          setIsValidating(false);
      }, 1500);
  };

  // Update Data Plan Types
  useEffect(() => {
      if (type === TransactionType.DATA) {
          const typesForProvider = Array.from(new Set(
              bundles.filter(b => b.provider === provider).map(b => b.type)
          ));
          setAvailablePlanTypes(typesForProvider as PlanType[]);
          
          if (typesForProvider.includes(PlanType.SME)) setSelectedPlanType(PlanType.SME);
          else if (typesForProvider.length > 0) setSelectedPlanType(typesForProvider[0] as PlanType);
      }
  }, [provider, bundles, type]);

  const handleTabChange = (newType: TransactionType) => {
      setType(newType);
      setPhone('');
      setAmount('');
      setSelectedBundle(null);
      setCustomerName(null);
      setError(null);
      setValidationError(null);
      setResultState('idle');
      setShowQr(false);
      
      // Set default provider based on type
      if (newType === TransactionType.CABLE) setProvider(BillProvider.DSTV);
      else if (newType === TransactionType.ELECTRICITY) setProvider(BillProvider.IKEDC);
      else setProvider(Provider.MTN);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLastTx(null);
    setResultState('idle');
    setShowQr(false);

    if (!phone) {
        setError("Please enter the number");
        return;
    }

    if (type === TransactionType.AIRTIME || type === TransactionType.DATA) {
        if (phone.length !== 11) { setError("Phone number must be 11 digits"); return; }
    } else {
        if (!customerName && !isValidating) { setError("Please verify customer details first"); return; }
        if (validationError) { setError(validationError); return; }
    }

    if ((type === TransactionType.AIRTIME || type === TransactionType.ELECTRICITY)) {
        if (!amount || Number(amount) <= 0) { setError("Enter a valid amount"); return; }
        const limits = PROVIDER_LIMITS[provider] || { min: 100, max: 50000 };
        if (Number(amount) < limits.min) { setError(`Minimum amount is ₦${limits.min}`); return; }
    }

    if ((type === TransactionType.DATA || type === TransactionType.CABLE) && !selectedBundle) {
        setError("Please select a plan");
        return;
    }

    // Extra Validation for Data Bundle Availability
    if (type === TransactionType.DATA && selectedBundle && selectedBundle.isAvailable === false) {
        setError("Selected plan is currently unavailable.");
        return;
    }

    // Check if User needs to create a PIN first
    if (!user.transactionPin) {
        setPinMode('create');
        setShowPinModal(true);
        setPinInput('');
        setConfirmPinInput('');
        setPinError(null);
        return;
    }

    setShowConfirm(true);
  };

  const initiatePinVerification = () => {
      setShowConfirm(false);
      setPinMode('verify');
      setShowPinModal(true);
      setPinInput('');
      setPinError(null);
  };

  const handlePinSubmit = async () => {
      setPinError(null);

      if (pinMode === 'create') {
          if (pinInput.length !== 4) {
              setPinError("PIN must be 4 digits.");
              return;
          }
          if (pinInput !== confirmPinInput) {
              setPinError("PINs do not match.");
              return;
          }
          
          // Create PIN
          try {
              const updatedUser = await MockDB.updateUser({ ...user, transactionPin: pinInput });
              // Update local user prop roughly (better to use the callback in real app, but user prop is readonly)
              user.transactionPin = pinInput; 
              setPinMode('verify');
              setShowPinModal(false);
              alert("PIN Created Successfully! Please proceed with your transaction.");
              setShowConfirm(true); // Re-open confirm modal to proceed
          } catch(e) {
              setPinError("Failed to save PIN.");
          }
          return;
      }

      // Verify Mode
      if (pinInput === user.transactionPin) {
          setShowPinModal(false);
          executeTransaction();
      } else {
          setPinError("Incorrect PIN.");
      }
  };

  const executeTransaction = async () => {
    setShowConfirm(false);
    setLoading(true);
    setResultState('idle');
    setError(null);
    
    try {
      let tx: Transaction;
      if (type === TransactionType.AIRTIME) {
        tx = await processAirtimePurchase(user, provider as Provider, Number(amount), phone, roundUp);
      } else if (type === TransactionType.DATA) {
        tx = await processDataPurchase(user, selectedBundle!, phone, roundUp);
      } else {
        // Bills
        const baseAmt = type === TransactionType.CABLE ? selectedBundle!.price : Number(amount);
        const totalDeduct = baseAmt + BILL_SERVICE_FEE;
        
        tx = await processBillPayment(user, type, provider as BillProvider, phone, totalDeduct, selectedBundle || undefined);
      }
      
      setLastTx(tx);
      setResultState('success');
      onSuccess();
      
      // --- DYNAMIC AUDIO NOTIFICATION START ---
      let successMessage = "Transaction successful.";
      const provName = PROVIDER_LOGOS[provider as Provider] || provider;
      // Split phone for clearer TTS pronunciation
      const targetPhone = phone.split('').join(' '); 

      if (type === TransactionType.DATA && selectedBundle) {
          successMessage = `${provName} data worth of ${selectedBundle.dataAmount} has been sent to ${targetPhone} successfully.`;
      } else if (type === TransactionType.AIRTIME) {
          successMessage = `${provName} airtime worth of ${amount} Naira has been sent to ${targetPhone} successfully.`;
      } else {
          successMessage = `${type} payment for ${provName} was successful.`;
      }
      playNotification(successMessage);
      // --- DYNAMIC AUDIO NOTIFICATION END ---

    } catch (err: any) {
      setError(err.message || "Transaction failed");
      setResultState('error');
      
      // --- ERROR AUDIO NOTIFICATION START ---
      // User specific wording: "transaction failed due to insufficient balance or network issue"
      let errorMsg = "Transaction failed due to insufficient balance or network issue.";
      playNotification(errorMsg, 'error');
      // --- ERROR AUDIO NOTIFICATION END ---

    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
      setResultState('idle');
      setAmount('');
      setSelectedBundle(null);
      setShowQr(false);
      if (type !== TransactionType.DATA && type !== TransactionType.AIRTIME) {
          setPhone(''); 
          setCustomerName(null);
      }
      setLastTx(null);
  };

  const handleShareReceipt = async () => {
      if (!lastTx) return;
      const shareText = `JadanPay Receipt\nType: ${lastTx.type}\nAmount: ₦${lastTx.amount.toLocaleString()}\nRef: ${lastTx.reference}\nTo: ${lastTx.destinationNumber}\nStatus: Successful`;
      if (navigator.share) {
          try {
              await navigator.share({ title: 'Transaction Receipt', text: shareText });
          } catch (e) { console.log(e); }
      } else {
          navigator.clipboard.writeText(shareText);
          alert("Receipt copied to clipboard!");
      }
  };

  const getTransactionDetails = () => {
     let cost = 0;
     let desc = "";
     let serviceFee = 0;

     if (type === TransactionType.AIRTIME || type === TransactionType.ELECTRICITY) {
         cost = Number(amount);
         desc = type === TransactionType.ELECTRICITY ? "Electricity Token" : "Airtime Top-up";
         if (type === TransactionType.ELECTRICITY) serviceFee = BILL_SERVICE_FEE;
     } else {
         cost = selectedBundle ? selectedBundle.price : 0;
         desc = selectedBundle ? selectedBundle.name : '';
         if (type === TransactionType.CABLE) serviceFee = BILL_SERVICE_FEE;
     }
     
     // Roundup Calculation for display
     let roundupAmt = 0;
     if (roundUp && (type === TransactionType.AIRTIME || type === TransactionType.DATA)) {
        const nextHundred = Math.ceil(cost / 100) * 100;
        if (nextHundred > cost) {
            roundupAmt = nextHundred - cost;
        }
     }

     return { cost, desc, total: cost + roundupAmt + serviceFee, roundupAmt, serviceFee };
  };
  
  // Unique Network Visualizer Logic
  const getNetworkStatus = (p: string) => {
      const isOnline = providerStatus[p] !== false;
      const stat = providerStats[p] || 98; // Default high if missing for better UX

      if (!isOnline) return { label: 'OFFLINE', color: 'bg-red-500', text: 'text-red-600', bars: 0, ping: '---' };
      if (stat >= 90) return { label: 'EXCELLENT', color: 'bg-emerald-500', text: 'text-emerald-600', bars: 4, ping: '24ms' };
      if (stat >= 70) return { label: 'GOOD', color: 'bg-green-500', text: 'text-green-600', bars: 3, ping: '45ms' };
      if (stat >= 50) return { label: 'FAIR', color: 'bg-yellow-500', text: 'text-yellow-600', bars: 2, ping: '120ms' };
      return { label: 'CRITICAL', color: 'bg-orange-500', text: 'text-orange-600', bars: 1, ping: '300ms' };
  };

  const details = getTransactionDetails();

  // --- RESULT VIEW ---
  if (resultState === 'success' && lastTx) {
      return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 text-center animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200 dark:shadow-green-900/10">
                  <Check size={40} strokeWidth={4} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Transaction Successful!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                  You successfully sent <span className="font-bold text-gray-900 dark:text-white">{lastTx.bundleName || `₦${lastTx.amount}`}</span> to <span className="font-mono text-gray-800 dark:text-gray-200">{lastTx.destinationNumber}</span>.
              </p>
              
              {showQr && (
                  <div className="mb-6 p-4 bg-white rounded-xl shadow-inner border border-gray-100 flex flex-col items-center animate-in zoom-in slide-in-from-bottom-2">
                      <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://jadanpay.com/receipt/${lastTx.id}`)}`}
                          alt="Receipt QR"
                          className="rounded-lg mix-blend-multiply"
                      />
                      <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Scan to view receipt</p>
                  </div>
              )}

              <div className="flex flex-col gap-3 w-full max-w-xs">
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                          onClick={handleShareReceipt}
                          className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2 text-sm"
                      >
                          <Share2 size={16}/> Share
                      </button>
                      <button 
                          onClick={() => setShowQr(!showQr)}
                          className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border transition-colors ${
                              showQr 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
                                : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                      >
                          <QrCode size={16}/> {showQr ? 'Hide QR' : 'Code'}
                      </button>
                  </div>

                  <button 
                      onClick={() => onViewReceipt(lastTx.id)}
                      className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2 text-sm"
                  >
                      <Receipt size={16}/> View Full Receipt
                  </button>

                  {(type === TransactionType.AIRTIME || type === TransactionType.DATA) && (
                       <a 
                          href={`tel:${lastTx.destinationNumber}`}
                          className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-green-900/20"
                       >
                           <Phone size={18}/> Call Recipient
                       </a>
                  )}
                  
                  <button 
                      onClick={resetForm}
                      className="w-full py-3 text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium mt-2"
                  >
                      Perform Another Transaction
                  </button>
              </div>
          </div>
      );
  }

  if (resultState === 'error') {
      return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 text-center animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-200 dark:shadow-red-900/10">
                  <X size={40} strokeWidth={4} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Transaction Failed</h2>
              <p className="text-red-500 mb-8 max-w-xs mx-auto text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
                  {error || "Something went wrong. Please try again."}
              </p>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button 
                      onClick={executeTransaction}
                      disabled={loading}
                      className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg shadow-red-200 dark:shadow-red-900/20"
                  >
                      {loading ? <Loader2 className="animate-spin"/> : <><RefreshCw size={18}/> Retry Transaction</>}
                  </button>
                  <button 
                      onClick={() => setResultState('idle')}
                      className="w-full py-3 text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium mt-2"
                  >
                      Edit Details
                  </button>
              </div>
          </div>
      );
  }

  // --- FORM VIEW ---
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/20 rounded-bl-full -z-0 opacity-50"></div>
      
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10 text-gray-900 dark:text-white">
        <Sparkles className="text-yellow-500" size={20} />
        Quick Pay
      </h2>

      {/* TABS */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 relative z-10 overflow-x-auto no-scrollbar">
        {[
            { id: TransactionType.AIRTIME, icon: Smartphone, label: 'Airtime' },
            { id: TransactionType.DATA, icon: Wifi, label: 'Data' },
            { id: TransactionType.CABLE, icon: Tv, label: 'Cable' },
            { id: TransactionType.ELECTRICITY, icon: Zap, label: 'Power' },
        ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                type === tab.id 
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-green-700 dark:text-green-400 scale-[1.02]' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
        ))}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5 relative z-10 animate-fade-in">
        
        {/* Advanced Network Visualizer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(type === TransactionType.AIRTIME || type === TransactionType.DATA 
                ? Object.values(Provider) 
                : type === TransactionType.CABLE 
                    ? BILL_PROVIDERS.CABLE 
                    : BILL_PROVIDERS.ELECTRICITY
            ).map((p) => {
                const { label: statusLabel, color: statusColor, text: statusText, bars, ping } = getNetworkStatus(p);
                const isSelected = provider === p;
                
                // Determine Theme Color for Selected State
                let themeClass = "border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900";
                if (isSelected) {
                    // Dynamic Border & Shadow based on brand if available, else default green
                    if (p === Provider.MTN) themeClass = "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 ring-1 ring-yellow-400 shadow-lg shadow-yellow-200 dark:shadow-none";
                    else if (p === Provider.GLO) themeClass = "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500 shadow-lg shadow-green-200 dark:shadow-none";
                    else if (p === Provider.AIRTEL) themeClass = "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500 shadow-lg shadow-red-200 dark:shadow-none";
                    else if (p === Provider.NMOBILE) themeClass = "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none";
                    else themeClass = "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500 shadow-lg shadow-blue-200 dark:shadow-none";
                }

                return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`relative overflow-hidden rounded-xl transition-all duration-300 group border flex flex-col min-h-[80px] ${themeClass}`}
                >
                  {/* Top Row: Status Dot & Bars */}
                  <div className="w-full flex justify-between items-start p-2">
                      <div className={`w-2 h-2 rounded-full ${statusColor} shadow-sm ${bars > 0 ? 'animate-pulse' : ''}`} title={statusLabel}></div>
                      <SignalBars level={bars} colorClass={isSelected ? 'bg-current' : statusColor.replace('bg-', 'bg-')} />
                  </div>

                  {/* Center: Logo/Name */}
                  <div className="flex-1 flex items-center justify-center -mt-1">
                      <span className={`font-black tracking-tight ${isSelected ? 'scale-110' : 'grayscale group-hover:grayscale-0'} transition-all duration-300 ${p.length > 8 ? 'text-xs' : 'text-lg'}`}>
                          {PROVIDER_LOGOS[p] || p}
                      </span>
                  </div>
                  
                  {/* Bottom: HUD Stats */}
                  <div className={`w-full flex justify-between items-center px-2 py-1 text-[8px] font-mono font-bold uppercase border-t ${isSelected ? 'border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5' : 'border-transparent text-gray-400'}`}>
                      <span>{statusLabel}</span>
                      <span className="opacity-70">{ping}</span>
                  </div>
                </button>
            )})}
        </div>

        {/* Input Field (Phone/Meter/IUC) */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              {type === TransactionType.ELECTRICITY ? 'Meter Number' : type === TransactionType.CABLE ? 'Smartcard / IUC' : 'Phone Number'}
          </label>
          <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder={type === TransactionType.ELECTRICITY ? "Enter Meter No" : type === TransactionType.CABLE ? "Enter IUC Number" : "080..."}
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-lg text-black dark:text-white transition-colors"
                required
              />
              {isValidating && <div className="absolute right-3 top-3.5"><Loader2 className="animate-spin text-green-600" size={20}/></div>}
          </div>
          
          {/* Customer Validation Result */}
          {customerName && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg flex items-center gap-2 text-xs text-green-700 dark:text-green-400 font-bold animate-in slide-in-from-top-2">
                  <UserIcon size={12} /> {customerName}
              </div>
          )}
          {validationError && (
              <div className="mt-2 text-xs text-red-500 font-bold flex items-center gap-1">
                  <AlertTriangle size={12}/> {validationError}
              </div>
          )}
        </div>

        {/* Amount Input (Airtime & Electricity) */}
        {(type === TransactionType.AIRTIME || type === TransactionType.ELECTRICITY) && (
             <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-lg text-black dark:text-white transition-colors placeholder:text-gray-400"
                  required
                />
             </div>
        )}

        {/* Plan Selection (Data) */}
        {type === TransactionType.DATA && (
             <div className="animate-fade-in">
                 <div className="mb-4">
                     <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Plan Type</label>
                     <div className="relative">
                        <select
                            value={selectedPlanType}
                            onChange={(e) => { setSelectedPlanType(e.target.value as PlanType); setSelectedBundle(null); }}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none appearance-none font-medium text-gray-900 dark:text-white"
                        >
                            {availablePlanTypes.map(pt => (
                                <option key={pt} value={pt}>{pt}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {bundles.filter(b => b.provider === provider && b.type === selectedPlanType).map((b) => {
                        const isUnavailable = b.isAvailable === false;
                        return (
                        <div
                            key={b.id}
                            onClick={() => {
                                if (isUnavailable) {
                                    setError(`${b.dataAmount} plan is currently unavailable.`);
                                    return;
                                }
                                setSelectedBundle(b);
                                setError(null);
                            }}
                            className={`p-3 rounded-xl border-2 transition-all relative ${
                                isUnavailable 
                                    ? 'opacity-60 cursor-not-allowed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900' 
                                    : selectedBundle?.id === b.id 
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md cursor-pointer' 
                                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-200 dark:hover:border-green-700 cursor-pointer'
                            }`}
                        >
                             {isUnavailable && (
                                <div className="absolute top-2 right-2">
                                    <Ban size={16} className="text-gray-400"/>
                                </div>
                            )}
                            <div className={`text-lg font-black ${isUnavailable ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>{b.dataAmount}</div>
                            <div className="text-xs text-gray-400">{b.validity}</div>
                            <div className={`mt-2 font-bold ${isUnavailable ? 'text-gray-400' : 'text-green-700 dark:text-green-400'}`}>₦{b.price.toLocaleString()}</div>
                        </div>
                    )})}
                 </div>
             </div>
        )}

        {/* Plan Selection (Cable) */}
        {type === TransactionType.CABLE && (
            <div className="animate-fade-in">
                 <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Select Package</label>
                 <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                     {CABLE_PLANS.filter(b => b.provider === provider).map((b) => (
                        <div
                            key={b.id}
                            onClick={() => setSelectedBundle(b)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                                selectedBundle?.id === b.id 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-700'
                            }`}
                        >
                            <div>
                                <div className="font-bold text-gray-800 dark:text-white">{b.name}</div>
                                <div className="text-xs text-gray-400">{b.validity}</div>
                            </div>
                            <div className="font-bold text-blue-700 dark:text-blue-400">₦{b.price.toLocaleString()}</div>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* Round Up */}
        {(type === TransactionType.AIRTIME || type === TransactionType.DATA) && (
            <div 
                onClick={() => setRoundUp(!roundUp)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    roundUp 
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                }`}
            >
                <div className={`p-2 rounded-full ${roundUp ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}><PiggyBank size={20} /></div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Round-up & Save</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Add small change to your savings.</p>
                </div>
                {roundUp && <Check size={16} className="text-blue-600 dark:text-blue-400"/>}
            </div>
        )}

        {/* Fee Summary for Bills */}
        {(type === TransactionType.CABLE || type === TransactionType.ELECTRICITY) && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800 mb-4 animate-fade-in">
                <div className="flex justify-between items-center text-xs text-orange-800 dark:text-orange-300">
                    <span className="font-medium">Transaction Amount</span>
                    <span className="font-bold">₦{type === TransactionType.CABLE ? (selectedBundle?.price || 0) : (Number(amount) || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-orange-800 dark:text-orange-300 mt-1">
                     <span className="font-medium">Service Fee</span>
                     <span className="font-bold">+₦{BILL_SERVICE_FEE}</span>
                </div>
                <div className="border-t border-orange-200 dark:border-orange-800 my-2"></div>
                <div className="flex justify-between items-center text-sm font-bold text-orange-900 dark:text-orange-200">
                     <span>Total Payable</span>
                     <span>₦{((type === TransactionType.CABLE ? (selectedBundle?.price || 0) : (Number(amount) || 0)) + BILL_SERVICE_FEE).toLocaleString()}</span>
                </div>
            </div>
        )}

        <button
          type="submit"
          disabled={loading || (type !== TransactionType.AIRTIME && type !== TransactionType.DATA && !customerName)}
          className="w-full py-4 bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Pay Now"}
        </button>
      </form>
      
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Confirm Transaction</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3 mb-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 text-sm">Service</span><span className="font-medium text-gray-900 dark:text-white">{details.desc}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 text-sm">Provider</span><span className="font-medium text-gray-900 dark:text-white">{provider}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 text-sm">Target</span><span className="font-mono text-gray-900 dark:text-white">{phone}</span></div>
                {customerName && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 text-sm">Name</span><span className="font-bold text-xs text-green-700 dark:text-green-400">{customerName}</span></div>}
                
                {details.roundupAmt > 0 && (
                     <div className="flex justify-between text-blue-600 dark:text-blue-400 text-xs font-medium">
                         <span>Round-up Savings</span>
                         <span>+₦{details.roundupAmt}</span>
                     </div>
                )}
                
                {details.serviceFee > 0 && (
                     <div className="flex justify-between text-orange-600 dark:text-orange-400 text-xs font-medium">
                         <span>Service Charge</span>
                         <span>+₦{details.serviceFee}</span>
                     </div>
                )}

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                <div className="flex justify-between"><span className="font-bold text-gray-800 dark:text-gray-200">Total Deduct</span><span className="font-bold text-xl text-green-700 dark:text-green-400">₦{details.total.toLocaleString()}</span></div>
            </div>
            <div className="flex gap-3">
                 <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                 <button 
                    onClick={initiatePinVerification} 
                    className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 flex items-center justify-center gap-2"
                 >
                    <Lock size={16}/> Authorize
                 </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal (Create / Verify) */}
      {showPinModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-fade-in-up border border-gray-100 dark:border-gray-700">
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Key size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {pinMode === 'create' ? 'Create Transaction PIN' : 'Enter PIN'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {pinMode === 'create' ? 'Secure your wallet with a 4-digit PIN.' : 'Verify your identity to proceed.'}
                      </p>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <input 
                              type="password" 
                              maxLength={4}
                              value={pinInput}
                              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                              className="w-full p-3 text-center font-mono text-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-green-500 tracking-widest text-gray-900 dark:text-white"
                              placeholder="••••"
                              autoFocus
                          />
                      </div>

                      {pinMode === 'create' && (
                          <div>
                              <input 
                                  type="password" 
                                  maxLength={4}
                                  value={confirmPinInput}
                                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                                  className="w-full p-3 text-center font-mono text-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-green-500 tracking-widest text-gray-900 dark:text-white"
                                  placeholder="Confirm"
                              />
                          </div>
                      )}

                      {pinError && <p className="text-center text-red-500 text-xs font-bold">{pinError}</p>}

                      <div className="flex gap-3">
                          <button 
                              onClick={() => { setShowPinModal(false); if(pinMode === 'create') setShowConfirm(false); }}
                              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl font-bold text-xs"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={handlePinSubmit}
                              className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold text-xs"
                          >
                              {pinMode === 'create' ? 'Set PIN' : 'Submit'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
