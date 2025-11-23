import React, { useState, useEffect } from 'react';
import { Provider, Bundle, User, TransactionType } from '../types';
import { PROVIDER_COLORS, PROVIDER_LOGOS, SAMPLE_BUNDLES } from '../constants';
import { processAirtimePurchase, processDataPurchase } from '../services/topupService';
import { Smartphone, Wifi, PiggyBank, Loader2, Sparkles, Star, Check } from 'lucide-react';

interface TopUpFormProps {
  user: User;
  onSuccess: () => void;
}

export const TopUpForm: React.FC<TopUpFormProps> = ({ user, onSuccess }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.AIRTIME);
  const [provider, setProvider] = useState<Provider>(Provider.MTN);
  const [phone, setPhone] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [roundUp, setRoundUp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Smart Suggest Logic
  useEffect(() => {
    if (phone.length === 11) {
      // Simple mock logic to detect network from prefix
      if (phone.startsWith('0803') || phone.startsWith('0806')) setProvider(Provider.MTN);
      else if (phone.startsWith('0805') || phone.startsWith('0815')) setProvider(Provider.GLO);
      else if (phone.startsWith('0802') || phone.startsWith('0812')) setProvider(Provider.AIRTEL);
      else if (phone.startsWith('0809') || phone.startsWith('0819')) setProvider(Provider.NMOBILE);
    }
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (type === TransactionType.AIRTIME) {
        if (!amount) throw new Error("Please enter amount");
        await processAirtimePurchase(user, provider, Number(amount), phone, roundUp);
      } else {
        if (!selectedBundle) throw new Error("Please select a bundle");
        await processDataPurchase(user, selectedBundle, phone, roundUp);
      }
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

  const filteredBundles = SAMPLE_BUNDLES.filter(b => b.provider === provider);

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

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        
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
          {Object.values(Provider).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={`py-2 rounded-lg text-xs font-bold transition-all active:scale-95 border-2 ${
                provider === p 
                  ? `${PROVIDER_COLORS[p]} border-transparent shadow-md ring-2 ring-offset-1 ring-gray-200 scale-105` 
                  : 'bg-white border-gray-100 text-gray-400 grayscale hover:grayscale-0 hover:border-gray-300'
              }`}
            >
              {PROVIDER_LOGOS[p]}
            </button>
          ))}
        </div>

        {/* Amount or Bundles */}
        {type === TransactionType.AIRTIME ? (
          <div className="animate-fade-in">
             <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Amount (₦)</label>
             <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-lg"
              required
            />
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
          <div className="grid grid-cols-2 gap-3 animate-fade-in pb-2">
            {filteredBundles.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBundle(b)}
                className={`group relative p-3 rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between min-h-[140px] ${
                  selectedBundle?.id === b.id 
                    ? 'border-green-600 bg-green-50 shadow-lg scale-[1.02] ring-2 ring-green-400 ring-offset-2 z-10' 
                    : 'border-gray-100 bg-white hover:border-green-200 hover:shadow-xl hover:-translate-y-1 hover:bg-green-50/20'
                }`}
              >
                {/* Best Value Badge */}
                {b.isBestValue && (
                  <div className="absolute top-0 right-0 z-20">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                       <Star size={8} className="fill-white" /> BEST VALUE
                    </div>
                  </div>
                )}
                
                {/* Checkmark Indicator */}
                {selectedBundle?.id === b.id && (
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
            ))}
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
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 font-medium flex items-center gap-2">
            <Check size={16} />
            {successMsg}
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
    </div>
  );
};