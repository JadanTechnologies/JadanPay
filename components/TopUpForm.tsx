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

const BILL_SERVICE_FEE = 100;

export const TopUpForm: React.FC<TopUpFormProps> = ({ user, onSuccess, onViewReceipt }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.AIRTIME);
  const [provider, setProvider] = useState<string>(Provider.MTN);
  const [phone, setPhone] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
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
      if (newType === TransactionType.CABLE) setProvider(BillProvider.DSTV);
      else if (newType === TransactionType.ELECTRICITY) setProvider(BillProvider.IKEDC);
      else setProvider(Provider.MTN);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultState('idle');

    if (!phone) {
        setError("Please enter the number");
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
         desc = type === TransactionType.ELECTRICITY ? "Electricity" : "Airtime";
         if (type === TransactionType.ELECTRICITY) serviceFee = BILL_SERVICE_FEE;
     } else {
         cost = selectedBundle ? selectedBundle.price : 0;
         desc = selectedBundle ? selectedBundle.name : '';
         if (type === TransactionType.CABLE) serviceFee = BILL_SERVICE_FEE;
     }
     return { cost, desc, total: cost + serviceFee, serviceFee };
  };

  const details = getTransactionDetails();

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
        <div className="grid grid-cols-4 gap-3">
            {(type === TransactionType.AIRTIME || type === TransactionType.DATA ? Object.values(Provider) : type === TransactionType.CABLE ? BILL_PROVIDERS.CABLE : BILL_PROVIDERS.ELECTRICITY).map((p) => {
                const isSelected = provider === p;
                return (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setProvider(p)}
                        className={`relative overflow-hidden rounded-xl transition-all duration-300 group border-2 flex items-center justify-center min-h-[60px] ${isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'}`}
                    >
                        <img src={PROVIDER_IMAGES[p]} alt={p} className="h-8 object-contain" />
                    </button>
                )
            })}
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="080..."
            className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-mono text-lg text-gray-900 dark:text-white placeholder:text-gray-400"
            required
          />
        </div>

        {type === TransactionType.AIRTIME && (
             <div>
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
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <button type="submit" disabled={loading} className="w-full py-4 bg-green-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-green-700/20 hover:bg-green-800 transition-all">
          {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Continue'}
        </button>
      </form>
      
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Confirm</h3>
             <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 mb-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Service:</span><span className="font-medium text-gray-900 dark:text-white">{details.desc}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">To:</span><span className="font-mono text-gray-900 dark:text-white">{phone}</span></div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                <div className="flex justify-between font-bold text-lg"><span className="text-gray-800 dark:text-white">Total:</span><span className="text-green-700 dark:text-green-400">₦{details.total.toLocaleString()}</span></div>
             </div>
            <div className="flex gap-3">
                 <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium">Cancel</button>
                  <button onClick={executeTransaction} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold">Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
