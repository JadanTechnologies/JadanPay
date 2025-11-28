import React, { useState, useEffect } from 'react';
import { Provider, Bundle, User, TransactionType, Transaction, PlanType, BillProvider } from '../types';
import { PROVIDER_LOGOS, BILL_PROVIDERS, CABLE_PLANS, PROVIDER_IMAGES } from '../constants';
import { processAirtimePurchase, processDataPurchase, processBillPayment } from '../services/topupService';
import { SettingsService } from '../services/settingsService';
import { MockDB } from '../services/mockDb';
import { playNotification } from '../utils/audio';
import { Smartphone, Wifi, PiggyBank, Loader2, Sparkles, Star, Check, AlertTriangle, Info, Share2, Ban, Activity, ChevronDown, Tv, Zap, User as UserIcon, Phone, RefreshCw, X, Receipt, QrCode, BarChart3, Lock, Key, Eye, EyeOff } from 'lucide-react';

interface TopUpFormProps {
  user: User;
  onSuccess: () => void;
  onViewReceipt: (txId: string) => void;
}

export const TopUpForm: React.FC<TopUpFormProps> = ({ user, onSuccess, onViewReceipt }) => {
  const [activeTab, setActiveTab] = useState<'airtime' | 'data' | 'data_refill' | 'cable' | 'power'>('airtime');
  const [type, setType] = useState<TransactionType>(TransactionType.AIRTIME);
  
  const [provider, setProvider] = useState<string>(Provider.MTN);
  const [phone, setPhone] = useState<string>(''); // Also used for meter/IUC
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [serviceFees, setServiceFees] = useState<any>({});
  
  // Bill Payment State
  const [isValidating, setIsValidating] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [resultState, setResultState] = useState<'idle' | 'success' | 'error'>('idle');

  // PIN State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);


  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      try {
        const dbBundles = await MockDB.getBundles();
        setBundles(dbBundles);
        const settings = await SettingsService.getSettings();
        setServiceFees(settings.serviceFees || {});
      } catch (e) { console.error("Failed to load top-up data", e); }
  };
  
  const handleTabChange = (newTab: 'airtime' | 'data' | 'data_refill' | 'cable' | 'power') => {
      setActiveTab(newTab);
      setPhone('');
      setAmount('');
      setSelectedBundle(null);
      setError(null);
      setResultState('idle');
      setCustomerName(null);
      setValidationError(null);

      switch(newTab) {
          case 'airtime':
              setType(TransactionType.AIRTIME);
              setProvider(Provider.MTN);
              break;
          case 'data':
              setType(TransactionType.DATA);
              setProvider(Provider.MTN);
              break;
          case 'data_refill':
              setType(TransactionType.DATA);
              setPhone(user.phone);
              setProvider(Provider.MTN);
              break;
          case 'cable':
              setType(TransactionType.CABLE);
              setProvider(BillProvider.DSTV);
              break;
          case 'power':
              setType(TransactionType.ELECTRICITY);
              setProvider(BillProvider.IKEDC);
              break;
      }
  };

  const handleVerifyCustomer = async () => {
      if (!phone) return;
      setIsValidating(true);
      setValidationError(null);
      await new Promise(r => setTimeout(r, 1500)); // Simulate API call
      
      // Mock logic
      if (phone.length < 10) {
          setValidationError("Invalid number. Please check and try again.");
          setCustomerName(null);
      } else {
          setCustomerName("JABIR MUSA"); // Mock name
      }
      setIsValidating(false);
  };
  
  useEffect(() => {
      // Reset validation when number changes, except for data refill
      if (activeTab !== 'data_refill') {
          setCustomerName(null);
          setValidationError(null);
      }
  }, [phone, activeTab]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultState('idle');

    if (!phone) {
        setError("Please enter the account/meter/phone number.");
        return;
    }
    
    // For bills, require verification
    if ((type === TransactionType.CABLE || type === TransactionType.ELECTRICITY) && !customerName) {
        setError("Please verify the account holder's name before proceeding.");
        return;
    }
    
    setShowConfirm(true);
  };

  const handleProceedToPin = () => {
      setShowConfirm(false);
      setShowPinModal(true);
      setPin('');
      setPinError(null);
  };

  const executeTransaction = async () => {
    if (pin.length !== 4) {
        setPinError("PIN must be 4 digits.");
        return;
    }

    setLoading(true);
    setPinError(null);
    
    try {
      let tx: Transaction;
      if (type === TransactionType.AIRTIME) {
        tx = await processAirtimePurchase(user, provider as Provider, Number(amount), phone, false, pin);
      } else if (type === TransactionType.DATA) {
        tx = await processDataPurchase(user, selectedBundle!, phone, false, pin);
      } else {
        const baseAmt = type === TransactionType.CABLE ? selectedBundle!.price : Number(amount);
        tx = await processBillPayment(user, type, provider as BillProvider, phone, baseAmt, pin, selectedBundle || undefined);
      }
      
      setShowPinModal(false);
      setPin('');
      setLastTx(tx);
      setResultState('success');
      
      // Play audio confirmation
      let audioMsg = 'Transaction successful';
      if (tx.type === TransactionType.AIRTIME) {
        audioMsg = `${tx.provider} airtime worth ₦${Number(amount)} has been sent to ${phone} successfully.`;
      } else if (tx.type === TransactionType.DATA) {
        audioMsg = `Data plan ${tx.bundleName} has been sent to ${phone} successfully.`;
      }
      playNotification(audioMsg);

      onSuccess();
    } catch (err: any) {
      playNotification(err.message || "An error occurred", 'error');
      if (err.message.includes("Incorrect transaction PIN")) {
          setPinError(err.message);
          setPin(''); // Clear input for re-entry
      } else if (err.message.includes("Transaction PIN not set")) {
          setShowPinModal(false);
          setError(err.message + ' You can set it on the Profile page.');
      } else {
          setShowPinModal(false);
          setError(err.message || "Transaction failed");
          setResultState('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = () => {
    setShowPinModal(false);
    alert("To reset your transaction PIN, please go to your Profile page and look for the 'Security' section.");
  };
  
  const getTransactionDetails = () => {
     let cost = 0, desc = "";
     let serviceFee = 0;

     if (type === TransactionType.AIRTIME) {
         cost = Number(amount);
         desc = `${provider} Airtime`;
         serviceFee = serviceFees.airtime || 0;
     } else if (type === TransactionType.ELECTRICITY) {
         cost = Number(amount);
         desc = "Electricity Top-up";
         serviceFee = serviceFees.electricity || 0;
     } else if (type === TransactionType.DATA) {
         cost = selectedBundle?.price || 0;
         desc = selectedBundle?.name || 'Data';
         serviceFee = serviceFees.data || 0;
     } else if (type === TransactionType.CABLE) {
         cost = selectedBundle?.price || 0;
         desc = selectedBundle ? `Cable - ${selectedBundle.name}` : 'Cable';
         serviceFee = serviceFees.cable || 0;
     }
     return { cost, desc, total: cost + serviceFee, serviceFee };
  };

  const details = getTransactionDetails();

  const isBillPayment = type === TransactionType.CABLE || type === TransactionType.ELECTRICITY;
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-colors">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10 text-gray-900 dark:text-white">
        <Sparkles className="text-yellow-500" size={20} />
        Quick Pay
      </h2>

      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 relative z-10 overflow-x-auto no-scrollbar">
        {[
            { id: 'airtime', icon: Phone, label: 'Airtime' }, 
            { id: 'data', icon: Wifi, label: 'Data' },
            { id: 'data_refill', icon: RefreshCw, label: 'Data Refill' },
            { id: 'cable', icon: Tv, label: 'Cable' }, 
            { id: 'power', icon: Zap, label: 'Power' }
        ].map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 shadow-sm text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
        ))}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5 relative z-10 animate-fade-in">
        <div className="flex flex-wrap gap-3">
            {(activeTab.includes('data') || activeTab === 'airtime' ? Object.values(Provider) : activeTab === 'cable' ? BILL_PROVIDERS.CABLE : BILL_PROVIDERS.ELECTRICITY).map((p) => {
                const isSelected = provider === p;
                return (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setProvider(p)}
                        className={`relative overflow-hidden rounded-xl transition-all duration-300 group border-2 flex items-center justify-center min-h-[60px] flex-1 basis-[calc(25%-0.75rem)] min-w-[60px] ${isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                        <img src={PROVIDER_IMAGES[p]} alt={p} className="h-8 object-contain" />
                    </button>
                )
            })}
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              {type === TransactionType.CABLE ? 'Smartcard / IUC Number' : type === TransactionType.ELECTRICITY ? 'Meter Number' : 'Phone Number'}
          </label>
          <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder={isBillPayment ? 'Enter number...' : '080...'}
                className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono text-lg text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                required
                disabled={activeTab === 'data_refill'}
              />
              {isBillPayment && (
                  <button type="button" onClick={handleVerifyCustomer} disabled={isValidating || !phone} className="px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center">
                      {isValidating ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                  </button>
              )}
          </div>
          {validationError && <p className="text-red-500 text-xs mt-1">{validationError}</p>}
          {customerName && <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-lg flex items-center gap-2"><UserIcon size={16} /> {customerName}</div>}
        </div>

        {type === TransactionType.AIRTIME && (
             <div className="animate-in fade-in">
                 <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Amount (₦)</label>
                 <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="100 - 50,000"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-lg text-gray-900 dark:text-white"
                  required
                />
            </div>
        )}
        
        {type === TransactionType.DATA && (
            <div className="animate-in fade-in">
                 <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Select Data Plan</label>
                 <select 
                    onChange={e => setSelectedBundle(bundles.find(b => b.id === e.target.value) || null)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                    required
                >
                    <option value="">Choose a data plan</option>
                    {bundles.filter(b => b.provider === provider && b.isAvailable).map(bundle => (
                        <option key={bundle.id} value={bundle.id}>
                            {bundle.name} - ₦{bundle.price.toLocaleString()}
                        </option>
                    ))}
                </select>
                {selectedBundle && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Info size={14} className="text-blue-500" />
                        This plan is valid for <strong>{selectedBundle.validity}</strong>.
                    </div>
                )}
            </div>
        )}
        
        {type === TransactionType.CABLE && (
            <div className="animate-in fade-in">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Select Plan</label>
                <select 
                    onChange={e => setSelectedBundle(CABLE_PLANS.find(p => p.id === e.target.value) || null)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                >
                    <option value="">Choose a bouquet</option>
                    {CABLE_PLANS.filter(p => p.provider === provider).map(plan => (
                        <option key={plan.id} value={plan.id}>
                            {plan.name} - ₦{plan.price.toLocaleString()}
                        </option>
                    ))}
                </select>
            </div>
        )}

        {type === TransactionType.ELECTRICITY && (
            <div className="animate-in fade-in">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Amount (₦)</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Enter amount"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-lg text-gray-900 dark:text-white"
                    required
                />
            </div>
        )}
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        <button type="submit" disabled={loading || (isBillPayment && !customerName)} className="w-full py-4 bg-green-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-green-700/20 hover:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          Continue
        </button>
      </form>
      
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Confirm Transaction</h3>
             <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 mb-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Service:</span><span className="font-medium text-gray-900 dark:text-white text-right">{details.desc}</span></div>
                {customerName && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Name:</span><span className="font-medium text-gray-900 dark:text-white">{customerName}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">To:</span><span className="font-mono text-gray-900 dark:text-white">{phone}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Amount:</span><span className="font-mono text-gray-900 dark:text-white">₦{details.cost.toLocaleString()}</span></div>
                {details.serviceFee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Service Fee:</span><span className="font-mono text-gray-900 dark:text-white">₦{details.serviceFee.toLocaleString()}</span></div>}
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                <div className="flex justify-between font-bold text-lg"><span className="text-gray-800 dark:text-white">Total to Pay:</span><span className="text-green-700 dark:text-green-400">₦{details.total.toLocaleString()}</span></div>
             </div>
            <div className="flex gap-3">
                 <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                  <button onClick={handleProceedToPin} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Pay Now</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white text-center">Enter Transaction PIN</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Enter your 4-digit PIN to authorize this payment.</p>
                <div className="relative">
                    <input
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        maxLength={4}
                        className="w-full p-4 text-center text-3xl font-mono tracking-[1em] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                        autoFocus
                    />
                    <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {pinError && <p className="text-red-500 text-sm text-center mt-2">{pinError}</p>}
                
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium">Cancel</button>
                    <button onClick={executeTransaction} disabled={loading || pin.length !== 4} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin"/> : 'Confirm Purchase'}
                    </button>
                </div>
                <div className="text-center mt-4">
                    <button 
                        type="button" 
                        onClick={handleForgotPin}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        Forgot PIN?
                    </button>
                </div>
            </div>
        </div>
      )}

      {resultState === 'success' && lastTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400 animate-bounce">
                    <Check size={32} />
                </div>
                <h3 className="text-xl font-bold mt-4 text-gray-900 dark:text-white">Transaction Successful!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {lastTx.type === 'DATA' ? `${lastTx.bundleName} sent to ${lastTx.destinationNumber}` :
                     lastTx.type === 'AIRTIME' ? `₦${(lastTx.amount - (serviceFees.airtime || 0)).toLocaleString()} airtime sent to ${lastTx.destinationNumber}` :
                     'Your payment was successful.'}
                </p>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => onViewReceipt(lastTx.id)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium flex items-center justify-center gap-2">
                        <Receipt size={16}/> View Receipt
                    </button>
                    <button onClick={() => {
                        const shareText = `Transaction successful!\nRef: ${lastTx.reference}`;
                        navigator.clipboard.writeText(shareText);
                        playNotification("Receipt details copied!");
                    }} className="flex-1 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl font-medium flex items-center justify-center gap-2">
                        <Share2 size={16}/> Share
                    </button>
                    {(lastTx.type === 'DATA' || lastTx.type === 'AIRTIME') && (
                        <a href={`tel:${lastTx.destinationNumber}`} className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl">
                           <Phone size={18}/>
                        </a>
                    )}
                </div>
                <button onClick={() => setResultState('idle')} className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline">Done</button>
            </div>
        </div>
      )}
    </div>
  );
};