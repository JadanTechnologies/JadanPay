import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, Provider, User } from '../types';
import { MockDB } from '../services/mockDb';
import { X, Share2, CheckCircle2, Download, RefreshCw, Check } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '../constants';

interface HistoryProps {
  user: User;
}

export const History: React.FC<HistoryProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    loadData();
  }, [user.id]);

  useEffect(() => {
    if (selectedTx) {
      setShareState('idle');
    }
  }, [selectedTx]);

  const loadData = async () => {
    setLoading(true);
    const data = await MockDB.getTransactions(user.id);
    setTransactions(data);
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleShare = async () => {
    if (!selectedTx) return;

    const shareUrl = `https://jadanpay.com/receipt/${selectedTx.id}`;
    const shareText = `Payment Receipt from JadanPay\nAmount: ₦${selectedTx.amount.toLocaleString()}\nRef: ${selectedTx.reference}\nStatus: Successful`;
    const shareData = {
      title: 'JadanPay Receipt',
      text: shareText,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to copy if share fails or is cancelled
        fallbackCopy(shareUrl);
      }
    } else {
      fallbackCopy(shareUrl);
    }
  };

  const fallbackCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Transactions</h2>
        <button onClick={loadData} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-4">
        {transactions.map((tx) => (
          <div 
            key={tx.id}
            onClick={() => setSelectedTx(tx)}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                   tx.provider ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
               }`}>
                  {tx.provider ? PROVIDER_LOGOS[tx.provider].slice(0,1) : 'W'}
               </div>
               <div>
                  <p className="font-semibold text-sm text-gray-800">
                    {tx.type === 'WALLET_FUND' ? 'Wallet Top-up' : `${tx.provider} ${tx.type}`}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(tx.date)}</p>
               </div>
            </div>
            <div className="text-right">
                <p className={`font-mono font-bold ${tx.type === 'WALLET_FUND' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.type === 'WALLET_FUND' ? '+' : '-'}₦{tx.amount}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-gray-400">{tx.status}</p>
            </div>
          </div>
        ))}

        {transactions.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-400">
                <p>No transactions yet. Oya, do something!</p>
            </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative animate-fade-in-up">
            
            {/* Close Button */}
            <button 
                onClick={() => setSelectedTx(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
                <X size={24} />
            </button>

            {/* Receipt Header */}
            <div className="bg-green-600 p-6 text-center text-white relative overflow-hidden">
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                        <CheckCircle2 size={32} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold">Transfer Successful</h3>
                    <p className="text-green-100 text-sm">{formatDate(selectedTx.date)}</p>
                </div>
                {/* Decorative Circles */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Receipt Body */}
            <div className="p-6 receipt-pattern relative">
                {/* Jagged edge effect top */}
                <div className="absolute top-0 left-0 w-full h-4 bg-white -mt-2" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>

                {/* Prominent Amount Display */}
                <div className="flex flex-col items-center mb-8 border-b border-dashed border-gray-200 pb-6">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Amount</span>
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">
                        ₦{selectedTx.amount.toLocaleString()}
                    </span>
                </div>

                <div className="space-y-4">
                    {/* Provider with Logo */}
                    {selectedTx.provider && (
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-500 text-sm">Provider</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${PROVIDER_COLORS[selectedTx.provider]}`}>
                                    {PROVIDER_LOGOS[selectedTx.provider].charAt(0)}
                                </div>
                                <span className="font-bold text-gray-800">{PROVIDER_LOGOS[selectedTx.provider]}</span>
                            </div>
                        </div>
                    )}

                    {/* Bundle Name if exists */}
                    {selectedTx.bundleName && (
                         <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Bundle</span>
                            <span className="font-semibold text-gray-900 text-right max-w-[150px] truncate" title={selectedTx.bundleName}>
                                {selectedTx.bundleName}
                            </span>
                        </div>
                    )}
                    
                    {/* Recipient */}
                     <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Recipient</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                {selectedTx.destinationNumber || user.email}
                            </span>
                        </div>
                    </div>

                    {/* Type */}
                    <div className="flex justify-between items-center">
                         <span className="text-gray-500 text-sm">Type</span>
                         <span className="text-sm font-medium text-gray-800 capitalize">
                            {selectedTx.type.replace('_', ' ').toLowerCase()}
                         </span>
                    </div>

                    {/* Reference */}
                    <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200 mt-2">
                        <span className="text-gray-400 text-xs">Ref ID</span>
                        <span className="font-mono text-[10px] text-gray-400">{selectedTx.reference}</span>
                    </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="mt-8 flex flex-col items-center gap-2">
                     <div className="p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="w-20 h-20 bg-gray-900 opacity-90" style={{ backgroundImage: 'radial-gradient(white 2px, transparent 2px)', backgroundSize: '4px 4px'}}></div>
                     </div>
                     <p className="text-[10px] text-gray-400">Scan to verify transaction status</p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button 
                        onClick={handleShare}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all duration-300 ${
                            shareState === 'copied' 
                                ? 'bg-green-600 border-green-600 text-white shadow-lg scale-95' 
                                : 'border-green-100 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-200'
                        }`}
                    >
                        {shareState === 'copied' ? <Check size={18} /> : <Share2 size={18} />} 
                        {shareState === 'copied' ? 'Copied!' : 'Share Receipt'}
                    </button>
                     <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors shadow-lg shadow-gray-200">
                        <Download size={18} /> Save Image
                    </button>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};