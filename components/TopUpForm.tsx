import React, { useState, useEffect } from 'react';
import { Provider, Bundle, User, TransactionType, Transaction, PlanType } from '../types';
import { PROVIDER_COLORS, PROVIDER_LOGOS } from '../constants';
import { processAirtimePurchase, processDataPurchase } from '../services/topupService';
import { SettingsService } from '../services/settingsService';
import { MockDB } from '../services/mockDb';
import { Smartphone, Wifi, PiggyBank, Loader2, Sparkles, Star, Check, AlertTriangle, Info, Share2, Ban, Signal, SignalHigh, SignalMedium, SignalLow, Filter } from 'lucide-react';

interface TopUpFormProps {
  user: User;
  onSuccess: () => void;
  onViewReceipt: (txId: string) => void;
}

// Define specific limits per provider to mimic real-world restrictions
const PROVIDER_LIMITS: Record<Provider, { min: number; max: number }> = {
  [Provider.MTN]: { min: 100, max: 50000 },
  [Provider.GLO]: { min: 100, max: 50000 },
  [Provider.AIRTEL]: { min: 100, max: 50000 },
  [Provider.NMOBILE]: { min: 100, max: 50000 },
};

export const TopUpForm: React.FC<TopUpFormProps> = ({ user, onSuccess, onViewReceipt }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.AIRTIME);
  const [provider, setProvider] = useState<Provider>(Provider.MTN);
  const [phone, setPhone] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  
  // Plan Type State
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>(PlanType.SME);
  const [availablePlanTypes, setAvailablePlanTypes] = useState<PlanType[]>([]);

  const [loading, setLoading] = useState(false);
  const [roundUp, setRoundUp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  
  // Dynamic Settings
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({
      [Provider.MTN]: true, [Provider.GLO]: true, [Provider.AIRTEL]: true, [Provider.NMOBILE]: true
  });
  const [providerStats, setProviderStats] = useState<Record<string, number>>({});
  const [bundles, setBundles] = useState<Bundle[]>([]);

  // State for Provider Change Confirmation
  const [showProviderConfirm, setShowProviderConfirm] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      // Load enabled/disabled providers and stats from Admin Settings
      const settings = await SettingsService.getSettings();
      setProviderStatus(settings.providerStatus);
      setProviderStats(settings.providerStats);
      
      // Load dynamic bundles
      const dbBundles = await MockDB.getBundles();
      setBundles(dbBundles);
  };

  // Smart Suggest Logic
  useEffect(() => {
    if (phone.length === 11) {
      // Simple mock logic to detect network from prefix
      let suggested: Provider | null = null;
      if (phone.startsWith('0803') || phone.startsWith('0806')) suggested = Provider.MTN;
      else if (phone.startsWith('0805') || phone.startsWith('0815')) suggested = Provider.GLO;
      else if (phone.startsWith('0802') || phone.startsWith('0812')) suggested = Provider.AIRTEL;
      else if (phone.startsWith('0809') || phone.startsWith('0819')) suggested = Provider.NMOBILE;

      // Only switch if the suggested provider is enabled
      if (suggested && providerStatus[suggested]) {
         setProvider(suggested);
      }
    }
  }, [phone, providerStatus]);

  // Update available plan types when provider or bundles change
  useEffect(() => {
      if (type === TransactionType.DATA) {
          const typesForProvider = Array.from(new Set(
              bundles.filter(b => b.provider === provider).map(b => b.type)
          ));
          setAvailablePlanTypes(typesForProvider);
          
          // Default to SME if available, else first available
          if (typesForProvider.includes(PlanType.SME)) {
              setSelectedPlanType(PlanType.SME);
          } else if (typesForProvider.length > 0) {
              setSelectedPlanType(typesForProvider[0]);
          }
      }
  }, [provider, bundles, type]);

  // Reset selection when provider changes to prevent invalid states
  useEffect(() => {
    setSelectedBundle(null);
    setError(null);
  }, [provider, type]);

  const handleProviderClick = (newProvider: Provider) => {
    // Check if provider is enabled in settings
    if (!providerStatus[newProvider]) {
        setError(`Sorry, ${PROVIDER_LOGOS[newProvider]} services are currently unavailable.`);
        return;
    }

    if (newProvider === provider) return;

    // Only prompt if we are in Data mode and a bundle is selected, as switching resets it
    if (type === TransactionType.DATA && selectedBundle) {
        setPendingProvider(newProvider);
        setShowProviderConfirm(true);
    } else {
        setProvider(newProvider);
    }
  };

  const confirmProviderChange = () => {
    if (pendingProvider) {
        setProvider(pendingProvider);
    }
    setShowProviderConfirm(false);
    setPendingProvider(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLastTx(null);

    // 1. Phone Validation
    if (!phone) {
        setError("Please enter a phone number");
        return;
    }
    
    // Strict Phone Number Validation
    if (phone.length !== 11) {
        setError("Phone number must be exactly 11 digits");
        return;
    }
    if (!phone.startsWith('0')) {
        setError("Phone number must start with '0'");
        return;
    }

    // 2. Airtime Amount Validation
    if (type === TransactionType.AIRTIME) {
        const val = Number(amount);
        const limits = PROVIDER_LIMITS[provider];
        
        if (!amount || val <= 0) {
            setError("Please enter a valid amount");
            return;
        }
        if (val < limits.min) {
            setError(`Amount too low. Minimum for ${PROVIDER_LOGOS[provider]} is ₦${limits.min}`);
            return;
        }
        if (val > limits.max) {
            setError(`Amount too high. Maximum for ${PROVIDER_LOGOS[provider]} is ₦${limits.max.toLocaleString()}`);
            return;
        }
    }

    // 3. Data Bundle Validation
    if (type === TransactionType.DATA) {
        if (!selectedBundle) {
            setError("Please select a data bundle");
            return;
        }
        
        // Validation: Check if bundle is marked as available
        if (selectedBundle.isAvailable === false) {
             setError("Selected bundle is currently unavailable.");
             return;
        }

        // Validation: Ensure bundle belongs to selected provider
        const isBundleValid = bundles.some(
            b => b.id === selectedBundle.id && b.provider === provider
        );
        
        if (!isBundleValid) {
            setError(`The selected bundle is not available on ${PROVIDER_LOGOS[provider]}. Please select a valid bundle.`);
            return;
        }
    }

    setShowConfirm(true);
  };

  const executeTransaction = async () => {
    setShowConfirm(false);
    setLoading(true);
    
    try {
      let tx: Transaction;
      if (type === TransactionType.AIRTIME) {
        tx = await processAirtimePurchase(user, provider, Number(amount), phone, roundUp);
      } else {
        tx = await processDataPurchase(user, selectedBundle!, phone, roundUp);
      }
      
      setLastTx(tx);
      setSuccessMsg(`Transaction Successful! "E don land!"`);
      onSuccess();
      
      // Reset form slightly
      setAmount('');
      setSelectedBundle(null);
    } catch (err: any) {
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  // Filter bundles by provider AND selected plan type
  const filteredBundles = bundles.filter(b => b.provider === provider && b.type === selectedPlanType);
  const currentLimits = PROVIDER_LIMITS[provider];
  const successRate = providerStats[provider] ?? 100;

  // Helper to calculate total for confirmation modal
  const getTransactionDetails = () => {
     let cost = 0;
     let desc = "";
     if (type === TransactionType.AIRTIME) {
         cost = Number(amount);
         desc = `Airtime Top-up`;
     } else {
         cost = selectedBundle ? selectedBundle.price : 0;
         desc = selectedBundle ? `${selectedBundle.name} (${selectedBundle.type})` : '';
     }

     let total = cost;
     let savings = 0;
     if (roundUp) {
        const nextHundred = Math.ceil(cost / 100) * 100;
        if (nextHundred > cost) {
            savings = nextHundred - cost;
            total = nextHundred;
        }
     }
     return { cost, desc, total, savings };
  };

  const details = getTransactionDetails();

  const handleBundleSelect = (b: Bundle) => {
    if (b.isAvailable === false) {
        setError(`The ${b.dataAmount} bundle is currently out of stock or unavailable.`);
        return;
    }
    setError(null);
    setSelectedBundle(b);
  };

  const renderSignalIcon = (rate: number) => {
      if (rate >= 90) return <SignalHigh size={12} className="text-green-500" />;
      if (rate >= 60) return <SignalMedium size={12} className="text-yellow-500" />;
      return <SignalLow size={12} className="text-red-500" />;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-transparent rounded-bl-full -z-0 opacity-50"></div>
      
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
        <Sparkles className="text-yellow-500" size={20} />
        Quick Top-up
      </h2>

      {/* Type Toggle */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 relative z-10">
        <button
          onClick={() => setType(TransactionType.AIRTIME)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            type === TransactionType.AIRTIME ? 'bg-white shadow-sm text-green-700 scale-[1.02]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Smartphone size={16} /> Airtime
        </button>
        <button
          onClick={() => setType(TransactionType.DATA)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            type === TransactionType.DATA ? 'bg-white shadow-sm text-green-700 scale-[1.02]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wifi size={16} /> Data
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5 relative z-10">
        
        {/* Phone Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="080..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-mono text-lg placeholder:text-gray-300"
            required
          />
        </div>

        {/* Provider Selection */}
        <div className="grid grid-cols-4 gap-2">
          {Object.values(Provider).map((p) => {
            const isEnabled = providerStatus[p];
            const stats = providerStats[p] ?? 100;
            return (
            <button
              key={p}
              type="button"
              onClick={() => handleProviderClick(p)}
              className={`relative py-3 rounded-lg text-xs font-bold transition-all active:scale-95 border-2 flex flex-col items-center gap-1 ${
                provider === p 
                  ? `${PROVIDER_COLORS[p]} border-transparent shadow-md ring-2 ring-offset-1 ring-gray-200 scale-105` 
                  : isEnabled 
                    ? 'bg-white border-gray-100 text-gray-400 grayscale hover:grayscale-0 hover:border-gray-300'
                    : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
              }`}
            >
              {PROVIDER_LOGOS[p]}
              {/* Network Availability Indicator */}
              {isEnabled && (
                  <div className={`absolute top-1 right-1 flex items-center gap-0.5 bg-white/80 rounded-full px-1 shadow-sm ${provider === p ? 'text-black' : ''}`}>
                      {renderSignalIcon(stats)}
                  </div>
              )}
            </button>
          )})}
        </div>

        {/* Selected Provider Info */}
        <div className="flex justify-between items-center px-2">
            <span className="text-xs text-gray-400">Network Availability:</span>
            <div className="flex items-center gap-1 text-xs font-medium">
                {renderSignalIcon(successRate)}
                <span className={successRate > 80 ? 'text-green-600' : successRate > 50 ? 'text-yellow-600' : 'text-red-600'}>
                    {successRate}% Success Rate
                </span>
            </div>
        </div>

        {/* Amount or Bundles */}
        {type === TransactionType.AIRTIME ? (
          <div className="animate-fade-in">
             <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Amount (₦)</label>
             <input
              type="number"
              value={amount}
              onChange={(e) => {
                  setAmount(e.target.value === '' ? '' : Number(e.target.value));
                  setError(null); // Clear error on change
              }}
              min={currentLimits.min}
              max={currentLimits.max}
              placeholder="0.00"
              className={`w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 outline-none font-mono text-lg ${
                error && error.includes('Amount') 
                ? 'border-red-300 focus:ring-red-200' 
                : 'border-gray-200 focus:ring-green-500'
              }`}
              required
            />
            
            {/* Limit Helper Text */}
            <div className={`flex items-center gap-1 mt-2 text-xs p-2 rounded-lg border transition-colors ${
                (Number(amount) > 0 && (Number(amount) < currentLimits.min || Number(amount) > currentLimits.max))
                ? 'text-red-600 bg-red-50 border-red-100'
                : 'text-gray-500 bg-gray-50 border-gray-100'
            }`}>
                { (Number(amount) > 0 && (Number(amount) < currentLimits.min || Number(amount) > currentLimits.max)) 
                  ? <AlertTriangle size={12} /> 
                  : <Info size={12} className="text-blue-400" /> 
                }
                <span>Range: ₦{currentLimits.min} - ₦{currentLimits.max.toLocaleString()}</span>
            </div>

            <div className="flex gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide">
              {[100, 200, 500, 1000, 2000, 5000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100 whitespace-nowrap hover:bg-green-100 transition-colors"
                >
                  ₦{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
             {/* Plan Type Selector */}
             {availablePlanTypes.length > 0 ? (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                    {availablePlanTypes.map(pt => (
                        <button
                            key={pt}
                            type="button"
                            onClick={() => { setSelectedPlanType(pt); setSelectedBundle(null); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                selectedPlanType === pt 
                                ? 'bg-green-700 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {pt === PlanType.CORPORATE ? 'CORP. GIFTING' : pt}
                        </button>
                    ))}
                </div>
             ) : (
                 <div className="text-xs text-center text-gray-400 mb-2">Fetching plans...</div>
             )}

             <div className="grid grid-cols-2 gap-3 pb-2">
                {filteredBundles.map((b) => {
                const isAvailable = b.isAvailable !== false; // Default true if undefined
                return (
                <div
                    key={b.id}
                    onClick={() => handleBundleSelect(b)}
                    className={`group relative p-3 rounded-2xl border-2 transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between min-h-[140px] ${
                    !isAvailable 
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed grayscale'
                        : selectedBundle?.id === b.id 
                            ? 'cursor-pointer border-green-600 bg-green-50 shadow-lg scale-[1.02] ring-2 ring-green-400 ring-offset-2 z-10' 
                            : 'cursor-pointer border-gray-100 bg-white hover:border-green-200 hover:shadow-xl hover:-translate-y-1 hover:bg-green-50/20'
                    }`}
                >
                    {/* Best Value Badge */}
                    {b.isBestValue && isAvailable && (
                    <div className="absolute top-0 right-0 z-20">
                        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                        <Star size={8} className="fill-white" /> BEST VALUE
                        </div>
                    </div>
                    )}

                    {/* Unavailable Badge */}
                    {!isAvailable && (
                        <div className="absolute top-0 right-0 z-20">
                            <div className="bg-gray-400 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                            <Ban size={8} /> SOLD OUT
                            </div>
                        </div>
                    )}
                    
                    {/* Checkmark Indicator */}
                    {selectedBundle?.id === b.id && isAvailable && (
                        <div className="absolute top-3 left-3 bg-green-600 text-white rounded-full p-0.5 shadow-sm animate-in zoom-in duration-200">
                            <Check size={12} strokeWidth={4} />
                        </div>
                    )}

                    <div className="flex flex-col items-center text-center relative z-10 mt-2">
                        <div className={`text-2xl font-black tracking-tight transition-colors ${
                            selectedBundle?.id === b.id ? 'text-green-800' : 'text-gray-800 group-hover:text-green-700'
                        }`}>
                            {b.dataAmount}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-2 bg-gray-100 px-2 py-0.5 rounded-md">
                            {b.validity}
                        </div>
                    </div>

                    {/* Price Section */}
                    <div className={`w-full py-2 rounded-xl font-mono font-bold text-sm text-center transition-all duration-300 mt-auto ${
                        selectedBundle?.id === b.id 
                        ? 'bg-green-600 text-white shadow-md transform scale-105' 
                        : 'bg-gray-50 text-gray-600 group-hover:bg-white group-hover:shadow-md group-hover:text-green-700 border border-gray-100 group-hover:border-green-100'
                    }`}>
                        ₦{b.price.toLocaleString()}
                    </div>
                    
                    {/* Subtle Background Decoration */}
                    <div className={`absolute -bottom-5 -right-5 transition-all duration-500 ${
                        selectedBundle?.id === b.id 
                        ? 'text-green-200 opacity-30 rotate-0 scale-125' 
                        : 'text-gray-50 opacity-0 group-hover:opacity-100 group-hover:text-green-50 -rotate-12'
                    } pointer-events-none`}>
                        <Wifi size={64} />
                    </div>
                </div>
                )})}
                {filteredBundles.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-400 border border-dashed rounded-xl">
                        <Wifi className="mx-auto mb-2 opacity-30"/>
                        <p className="text-xs">No {selectedPlanType.toLowerCase()} plans available for {PROVIDER_LOGOS[provider]}</p>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* Micro-Savings Round Up */}
        <div 
            onClick={() => setRoundUp(!roundUp)}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${roundUp ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
        >
            <div className={`p-2 rounded-full ${roundUp ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                <PiggyBank size={20} />
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Round-up & Save</p>
                <p className="text-xs text-gray-500">Save the change to your stash.</p>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${roundUp ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {roundUp && <div className="w-2 h-2 bg-white rounded-full animate-in zoom-in" />}
            </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-pulse">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 font-medium flex items-center gap-2">
                <Check size={16} />
                {successMsg}
              </div>
              
              {lastTx && (
                <button
                    type="button"
                    onClick={() => onViewReceipt(lastTx.id)}
                    className="w-full py-3 bg-green-100 text-green-800 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-200 transition-colors"
                >
                    <Share2 size={16} /> Share Receipt
                </button>
              )}
            </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-green-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-green-700/20 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 hover:bg-green-800"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Pay Now"}
        </button>
      </form>

      {/* Provider Change Confirmation Modal */}
      {showProviderConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                 <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 mx-auto text-yellow-600">
                    <AlertTriangle size={24} />
                 </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900 text-center">Change Provider?</h3>
                <p className="text-gray-500 text-sm mb-6 text-center">
                    Are you sure you want to change provider? This will reset your selected data bundle.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setShowProviderConfirm(false);
                            setPendingProvider(null);
                        }}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmProviderChange}
                        className="flex-1 py-2.5 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-colors"
                    >
                        Change
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Confirm Transaction</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6 border border-gray-100">
                <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Service</span>
                    <span className="font-medium text-gray-900">{details.desc}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Provider</span>
                    <span className="font-medium text-gray-900">{provider}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Phone</span>
                    <span className="font-mono text-gray-900">{phone}</span>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                 <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Amount</span>
                    <span className="font-medium text-gray-900">₦{details.cost.toLocaleString()}</span>
                </div>
                 {details.savings > 0 && (
                    <div className="flex justify-between text-blue-600">
                        <span className="text-xs flex items-center gap-1"><PiggyBank size={12}/> Round-up Save</span>
                        <span className="font-medium text-sm">+₦{details.savings}</span>
                    </div>
                 )}
                 <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-800">Total Deducted</span>
                    <span className="font-bold text-xl text-green-700">₦{details.total.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex gap-3">
                 <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                      Cancel
                  </button>
                  <button
                      onClick={executeTransaction}
                      className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition-colors"
                  >
                      Confirm
                  </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};