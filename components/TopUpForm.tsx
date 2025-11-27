import React, { useState, useEffect } from 'react';
import { Provider, Bundle, User, TransactionType, Transaction, PlanType, BillProvider } from '../types';
import { PROVIDER_LOGOS, BILL_PROVIDERS, CABLE_PLANS, PROVIDER_IMAGES } from '../constants';
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

const BILL_SERVICE_FEE = 100; // This can be moved to settings later

export const TopUpForm: React.FC<TopUpFormProps> = ({ user, onSuccess, onViewReceipt }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.AIRTIME);
  const [provider, setProvider] = useState<string>(Provider.MTN);
  const [phone, setPhone] = useState<string>(''); // Also used for meter/IUC
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  
  // Bill Payment State
  const [isValidating, setIsValidating] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [resultState, setResultState] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      try {
        const dbBundles = await MockDB.getBundles();
        setBundles(dbBundles);
      } catch (e) { console.error("Failed to load top-up data", e); }
  };
  
  const handleTabChange = (newType: TransactionType) => {
      setType(newType);
      setPhone('');
      setAmount('');
      setSelectedBundle(null);
      setError(null);
      setResultState('idle');
      setCustomerName(null);
      setValidationError(null);
      
      if (newType === TransactionType.CABLE) setProvider(BillProvider.DSTV);
      else if (newType === TransactionType.ELECTRICITY) setProvider(BillProvider.IKEDC);
      else setProvider(Provider.MTN);
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
      // Reset validation when number changes
      setCustomerName(null);
      setValidationError(null);
  }, [phone]);

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

  const executeTransaction = async () => {
    setShowConfirm(false);
    setLoading(true);
    setResultState('idle');
    setError(null);
    
    try {
      let tx: Transaction;
      if (type === TransactionType.AIRTIME) {
        tx = await processAirtimePurchase(user, provider as Provider, Number(amount), phone, false);
      } else if (type === TransactionType.DATA) {
        tx = await processDataPurchase(user, selectedBundle!, phone, false);
      } else {
        const baseAmt = type === TransactionType.CABLE ? selectedBundle!.price : Number(amount);
        const totalDeduct = baseAmt + BILL_SERVICE_FEE;
        tx = await processBillPayment(user, type, provider as BillProvider, phone, totalDeduct, selectedBundle || undefined);
      }
      
      setLastTx(tx);
      setResultState('success');
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Transaction failed");
      setResultState('error');
    } finally {
      setLoading(false);
    }
  };
  
  const getTransactionDetails = () => {
     let cost = 0, desc = "", serviceFee = 0;
     if (type === TransactionType.AIRTIME || type === TransactionType.ELECTRICITY) {
         cost = Number(amount);
         desc = type === TransactionType.ELECTRICITY ? "Electricity Top-up" : "Airtime";
         if (type === TransactionType.ELECTRICITY) serviceFee = BILL_SERVICE_FEE;
     } else {
         cost = selectedBundle ? selectedBundle.price : 0;
         desc = selectedBundle ? `Cable - ${selectedBundle.name}` : '';
         if (type === TransactionType.CABLE) serviceFee = BILL_SERVICE_FEE;
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
        {[{ id: TransactionType.AIRTIME, icon: Smartphone, label: 'Airtime' }, { id: TransactionType.DATA, icon: Wifi, label: 'Data' }, { id: TransactionType.CABLE, icon: Tv, label: 'Cable' }, { id: TransactionType.ELECTRICITY, icon: Zap, label: 'Power' }].map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${type === tab.id ? 'bg-white dark:bg-gray-700 shadow-sm text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
        ))}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5 relative z-10 animate-fade-in">
        <div className="flex flex-wrap gap-3">
            {(type === TransactionType.AIRTIME || type === TransactionType.DATA ? Object.values(Provider) : type === TransactionType.CABLE ? BILL_PROVIDERS.CABLE : BILL_PROVIDERS.ELECTRICITY).map((p) => {
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
                className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono text-lg text-gray-900 dark:text-white"
                required
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
          {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Continue'}
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
                {details.serviceFee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Service Fee:</span><span className="font-mono text-gray-900 dark:text-white">₦{details.serviceFee}</span></div>}
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                <div className="flex justify-between font-bold text-lg"><span className="text-gray-800 dark:text-white">Total to Pay:</span><span className="text-green-700 dark:text-green-400">₦{details.total.toLocaleString()}</span></div>
             </div>
            <div className="flex gap-3">
                 <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                  <button onClick={executeTransaction} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Pay Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};