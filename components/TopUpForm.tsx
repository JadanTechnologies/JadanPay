import React, { useState, useEffect } from 'react';
import { Provider, Bundle, User, TransactionType } from '../types';
import { PROVIDER_COLORS, PROVIDER_LOGOS, SAMPLE_BUNDLES } from '../constants';
import { processAirtimePurchase, processDataPurchase } from '../services/topupService';
import { Smartphone, Wifi, PiggyBank, Loader2, Sparkles } from 'lucide-react';

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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Sparkles className="text-yellow-500" size={20} />
        Quick Top-up
      </h2>

      {/* Type Toggle */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setType(TransactionType.AIRTIME)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            type === TransactionType.AIRTIME ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Smartphone size={16} /> Airtime
        </button>
        <button
          onClick={() => setType(TransactionType.DATA)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            type === TransactionType.DATA ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wifi size={16} /> Data
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Phone Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="080..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-mono text-lg"
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
              className={`py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 border-2 ${
                provider === p 
                  ? `${PROVIDER_COLORS[p]} border-transparent shadow-md ring-2 ring-offset-2 ring-gray-200` 
                  : 'bg-white border-gray-100 text-gray-400 grayscale hover:grayscale-0'
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
              {[100, 200, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100 whitespace-nowrap"
                >
                  ₦{val}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {filteredBundles.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBundle(b)}
                className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedBundle?.id === b.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-100 bg-yellow-50 hover:border-yellow-200'
                }`}
                style={{
                    boxShadow: selectedBundle?.id === b.id ? 'none' : '2px 4px 6px rgba(0,0,0,0.05)',
                    transform: selectedBundle?.id === b.id ? 'scale(0.98)' : 'rotate(-1deg)'
                }}
              >
                {b.isBestValue && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10 animate-bounce">
                    HOT 🔥
                  </span>
                )}
                <div className="text-sm font-bold text-gray-800">{b.dataAmount}</div>
                <div className="text-xs text-gray-500">{b.validity}</div>
                <div className="mt-2 font-mono font-bold text-green-700">₦{b.price}</div>
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
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${roundUp ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {roundUp && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 font-medium">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-700/30 active:scale-95 transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Pay Now"}
        </button>
      </form>
    </div>
  );
};