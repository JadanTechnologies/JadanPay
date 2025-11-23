
import React, { useState, useEffect } from 'react';
import { Provider, Bundle, User, TransactionType, Transaction, PlanType, BillProvider } from '../types';
import { PROVIDER_COLORS, PROVIDER_LOGOS, BILL_PROVIDERS, CABLE_PLANS } from '../constants';
import { processAirtimePurchase, processDataPurchase, processBillPayment } from '../services/topupService';
import { SettingsService } from '../services/settingsService';
import { MockDB } from '../services/mockDb';
import { playNotification } from '../utils/audio';
import { Smartphone, Wifi, PiggyBank, Loader2, Sparkles, Star, Check, AlertTriangle, Info, Share2, Ban, Activity, ChevronDown, Tv, Zap, User as UserIcon } from 'lucide-react';

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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  
  // Dynamic Settings
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      try {
        const settings = await SettingsService.getSettings();
        setProviderStatus(settings.providerStatus || {});
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

      if (suggested && providerStatus[suggested]) {
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
      
      // Set default provider based on type
      if (newType === TransactionType.CABLE) setProvider(BillProvider.DSTV);
      else if (newType === TransactionType.ELECTRICITY) setProvider(BillProvider.IKEDC);
      else setProvider(Provider.MTN);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLastTx(null);

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

    setShowConfirm(true);
  };

  const executeTransaction = async () => {
    setShowConfirm(false);
    setLoading(true);
    
    try {
      let tx: Transaction;
      if (type === TransactionType.AIRTIME) {
        tx = await processAirtimePurchase(user, provider as Provider, Number(amount), phone, roundUp);
      } else if (type === TransactionType.DATA) {
        tx = await processDataPurchase(user, selectedBundle!, phone, roundUp);
      } else {
        // Bills
        // For bills, the processBillPayment usually expects the full amount to deduct
        // In this implementation, we assume the fee is part of the deduction shown to the user
        const baseAmt = type === TransactionType.CABLE ? selectedBundle!.price : Number(amount);
        const totalDeduct = baseAmt + BILL_SERVICE_FEE;
        
        tx = await processBillPayment(user, type, provider as BillProvider, phone, totalDeduct, selectedBundle || undefined);
      }
      
      setLastTx(tx);
      setSuccessMsg("Transaction Successful!");
      playNotification("Transaction successful.");
      onSuccess();
      
      // Clear sensitive fields
      setAmount('');
      setSelectedBundle(null);
      if (type !== TransactionType.DATA && type !== TransactionType.AIRTIME) {
          setPhone(''); // Clear Meter/IUC but keep phone for airtime/data as user might repeat
          setCustomerName(null);
      }
    } catch (err: any) {
      setError(err.message || "Transaction failed");
      playNotification("Transaction failed.", 'error');
    } finally {
      setLoading(false);
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
  const details = getTransactionDetails();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-transparent rounded-bl-full -z-0 opacity-50"></div>
      
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
        <Sparkles className="text-yellow-500" size={20} />
        Quick Pay
      </h2>

      {/* TABS */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 relative z-10 overflow-x-auto">
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
                type === tab.id ? 'bg-white shadow-sm text-green-700 scale-[1.02]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
        ))}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5 relative z-10 animate-fade-in">
        
        {/* Provider Selection */}
        <div className="grid grid-cols-4 gap-2">
            {(type === TransactionType.AIRTIME || type === TransactionType.DATA 
                ? Object.values(Provider) 
                : type === TransactionType.CABLE 
                    ? BILL_PROVIDERS.CABLE 
                    : BILL_PROVIDERS.ELECTRICITY
            ).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`relative py-3 rounded-lg text-[10px] md:text-xs font-bold transition-all border-2 flex flex-col items-center gap-1 ${
                    provider === p 
                      ? `${PROVIDER_COLORS[p] || 'bg-gray-800 text-white'} border-transparent shadow-md scale-105` 
                      : 'bg-white border-gray-100 text-gray-400 grayscale hover:grayscale-0'
                  }`}
                >
                  {PROVIDER_LOGOS[p] || p}
                </button>
            ))}
        </div>

        {/* Input Field (Phone/Meter/IUC) */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
              {type === TransactionType.ELECTRICITY ? 'Meter Number' : type === TransactionType.CABLE ? 'Smartcard / IUC' : 'Phone Number'}
          </label>
          <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder={type === TransactionType.ELECTRICITY ? "Enter Meter No" : type === TransactionType.CABLE ? "Enter IUC Number" : "080..."}
                className={`w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-lg transition-colors ${validationError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                required
              />
              {isValidating && <div className="absolute right-3 top-3.5"><Loader2 className="animate-spin text-green-600" size={20}/></div>}
          </div>
          
          {/* Customer Validation Result */}
          {customerName && (
              <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-xs text-green-700 font-bold animate-in slide-in-from-top-2">
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
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-lg"
                  required
                />
             </div>
        )}

        {/* Plan Selection (Data) */}
        {type === TransactionType.DATA && (
             <div className="animate-fade-in">
                 <div className="mb-4">
                     <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Plan Type</label>
                     <div className="relative">
                        <select
                            value={selectedPlanType}
                            onChange={(e) => { setSelectedPlanType(e.target.value as PlanType); setSelectedBundle(null); }}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none appearance-none font-medium text-gray-700"
                        >
                            {availablePlanTypes.map(pt => (
                                <option key={pt} value={pt}>{pt}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {bundles.filter(b => b.provider === provider && b.type === selectedPlanType).map((b) => (
                        <div
                            key={b.id}
                            onClick={() => setSelectedBundle(b)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedBundle?.id === b.id ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-100 bg-white hover:border-green-200'
                            }`}
                        >
                            <div className="text-lg font-black text-gray-800">{b.dataAmount}</div>
                            <div className="text-xs text-gray-400">{b.validity}</div>
                            <div className="mt-2 font-bold text-green-700">₦{b.price.toLocaleString()}</div>
                        </div>
                    ))}
                 </div>
             </div>
        )}

        {/* Plan Selection (Cable) */}
        {type === TransactionType.CABLE && (
            <div className="animate-fade-in">
                 <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Select Package</label>
                 <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                     {CABLE_PLANS.filter(b => b.provider === provider).map((b) => (
                        <div
                            key={b.id}
                            onClick={() => setSelectedBundle(b)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                                selectedBundle?.id === b.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-100 bg-white hover:border-blue-200'
                            }`}
                        >
                            <div>
                                <div className="font-bold text-gray-800">{b.name}</div>
                                <div className="text-xs text-gray-400">{b.validity}</div>
                            </div>
                            <div className="font-bold text-blue-700">₦{b.price.toLocaleString()}</div>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* Round Up */}
        {(type === TransactionType.AIRTIME || type === TransactionType.DATA) && (
            <div 
                onClick={() => setRoundUp(!roundUp)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${roundUp ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
            >
                <div className={`p-2 rounded-full ${roundUp ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}><PiggyBank size={20} /></div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Round-up & Save</p>
                    <p className="text-xs text-gray-500">Add small change to your savings.</p>
                </div>
                {roundUp && <Check size={16} className="text-blue-600"/>}
            </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-pulse">
            <AlertTriangle size={16} /> <span>{error}</span>
          </div>
        )}

        {successMsg && (
             <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-center gap-2 animate-fade-in">
                <Check size={16} /> {successMsg}
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
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Confirm Transaction</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6 border border-gray-100">
                <div className="flex justify-between"><span className="text-gray-500 text-sm">Service</span><span className="font-medium text-gray-900">{details.desc}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 text-sm">Provider</span><span className="font-medium text-gray-900">{provider}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 text-sm">Target</span><span className="font-mono text-gray-900">{phone}</span></div>
                {customerName && <div className="flex justify-between"><span className="text-gray-500 text-sm">Name</span><span className="font-bold text-xs text-green-700">{customerName}</span></div>}
                
                {details.roundupAmt > 0 && (
                     <div className="flex justify-between text-blue-600 text-xs font-medium">
                         <span>Round-up Savings</span>
                         <span>+₦{details.roundupAmt}</span>
                     </div>
                )}
                
                {details.serviceFee > 0 && (
                     <div className="flex justify-between text-orange-600 text-xs font-medium">
                         <span>Service Charge</span>
                         <span>+₦{details.serviceFee}</span>
                     </div>
                )}

                <div className="h-px bg-gray-200 my-2"></div>
                <div className="flex justify-between"><span className="font-bold text-gray-800">Total Deduct</span><span className="font-bold text-xl text-green-700">₦{details.total.toLocaleString()}</span></div>
            </div>
            <div className="flex gap-3">
                 <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
                 <button onClick={executeTransaction} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
