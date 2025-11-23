
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, Provider, User } from '../types';
import { MockDB } from '../services/mockDb';
import { X, Share2, CheckCircle2, Download, RefreshCw, Check, Search, Calendar, Copy } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '../constants';

interface HistoryProps {
  user: User;
  highlightId?: string;
}

export const History: React.FC<HistoryProps> = ({ user, highlightId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [user.id]);

  useEffect(() => {
    if (selectedTx) {
      setShareState('idle');
    }
  }, [selectedTx]);

  // Auto-open highlighted transaction
  useEffect(() => {
    if (highlightId && transactions.length > 0) {
        const tx = transactions.find(t => t.id === highlightId);
        if (tx) {
            setSelectedTx(tx);
        }
    }
  }, [highlightId, transactions]);

  const loadData = async () => {
    setLoading(true);
    const data = await MockDB.getTransactions(user.id);
    setTransactions(data);
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
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
  
  const handleCopyRef = (ref: string) => {
      navigator.clipboard.writeText(ref);
      // Could show toast here, but for now simple UX
  };

  const filteredTransactions = transactions.filter(t => 
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.destinationNumber && t.destinationNumber.includes(searchTerm))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search ref or phone..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
            </div>
            <button onClick={loadData} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTransactions.map((tx) => (
          <div 
            key={tx.id}
            onClick={() => setSelectedTx(tx)}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 cursor-pointer hover:border-green-300 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start z-10">
               <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                       tx.provider ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                   }`}>
                      {tx.provider ? PROVIDER_LOGOS[tx.provider].slice(0,1) : 'W'}
                   </div>
                   <div>
                      <p className="font-bold text-gray-800 truncate max-w-[120px]">
                        {tx.type === 'WALLET_FUND' ? 'Wallet Top-up' : `${tx.provider} ${tx.type}`}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{tx.reference.slice(0, 8)}...</p>
                   </div>
               </div>
               <div className="text-right">
                    <p className={`font-mono font-bold text-lg ${tx.type === 'WALLET_FUND' ? 'text-green-600' : 'text-gray-900'}`}>
                        {tx.type === 'WALLET_FUND' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </p>
               </div>
            </div>
            
            <div className="h-px w-full bg-gray-50 z-10"></div>
            
            <div className="flex justify-between items-center text-xs text-gray-400 z-10">
                <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(tx.date)}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                    tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {tx.status}
                </span>
            </div>

            {/* Hover Effect Background */}
            <div className="absolute inset-0 bg-green-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        ))}

        {filteredTransactions.length === 0 && !loading && (
            <div className="col-span-full text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="opacity-50"/>
                </div>
                <p>No transactions found matching your criteria.</p>
            </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in-up">
            
            {/* Close Button */}
            <button 
                onClick={() => setSelectedTx(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white z-20 transition-colors"
            >
                <X size={24} />
            </button>

            {/* Receipt Header */}
            <div className="bg-green-700 p-8 text-center text-white relative overflow-hidden">
                <div className="relative z-10 mt-2">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner border border-white/10">
                        <CheckCircle2 size={40} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Transaction Successful</h3>
                    <p className="text-green-100 text-sm mt-1 opacity-90">{formatDate(selectedTx.date)}</p>
                </div>
                {/* Decorative Circles */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Receipt Body */}
            <div className="p-8 bg-white receipt-pattern relative">
                {/* Jagged edge effect top */}
                <div className="absolute top-0 left-0 w-full h-3 bg-green-700" style={{clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 5% 50%, 10% 0, 15% 50%, 20% 0, 25% 50%, 30% 0, 35% 50%, 40% 0, 45% 50%, 50% 0, 55% 50%, 60% 0, 65% 50%, 70% 0, 75% 50%, 80% 0, 85% 50%, 90% 0, 95% 50%, 100% 0)"}}></div>

                {/* Prominent Amount Display */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Amount</span>
                    <span className="text-5xl font-black text-gray-900 tracking-tighter">
                        ₦{selectedTx.amount.toLocaleString()}
                    </span>
                    
                    {/* Reference ID Pill */}
                    <button 
                        onClick={() => handleCopyRef(selectedTx.reference)}
                        className="mt-3 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-mono transition-colors group"
                        title="Click to copy"
                    >
                        <span>{selectedTx.reference}</span>
                        <Copy size={10} className="opacity-50 group-hover:opacity-100"/>
                    </button>
                </div>
                
                <div className="h-px bg-gray-100 w-full mb-6"></div>

                <div className="space-y-4">
                    {/* Provider with Logo */}
                    {selectedTx.provider && (
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-500 text-sm font-medium">Provider</span>
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
                            <span className="text-gray-500 text-sm font-medium">Bundle</span>
                            <span className="font-bold text-gray-900 text-right max-w-[150px] truncate" title={selectedTx.bundleName}>
                                {selectedTx.bundleName}
                            </span>
                        </div>
                    )}
                    
                    {/* Recipient */}
                     <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm font-medium">Recipient</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                {selectedTx.destinationNumber || user.email}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <button 
                        onClick={handleShare}
                        className={`flex items-center justify-center gap-2 py-3.5 rounded-xl border font-bold text-sm transition-all duration-300 ${
                            shareState === 'copied' 
                                ? 'bg-green-600 border-green-600 text-white shadow-md' 
                                : 'border-green-100 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-200'
                        }`}
                    >
                        {shareState === 'copied' ? <Check size={18} /> : <Share2 size={18} />} 
                        {shareState === 'copied' ? 'Copied!' : 'Share'}
                    </button>
                     <button className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors shadow-lg shadow-gray-200">
                        <Download size={18} /> Save
                    </button>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
