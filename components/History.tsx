
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, Provider, User } from '../types';
import { MockDB } from '../services/mockDb';
import { X, Share2, CheckCircle2, Download, RefreshCw, Check, Search, Calendar, Copy, Receipt, Link as LinkIcon, Smartphone, CreditCard, ExternalLink, QrCode } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS, PROVIDER_IMAGES } from '../constants';
import { playNotification } from '../utils/audio';

interface HistoryProps {
  user: User;
  highlightId?: string;
}

export const History: React.FC<HistoryProps> = ({ user, highlightId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared'>('idle');
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

    const receiptLink = `https://jadanpay.com/receipt/${selectedTx.id}`;
    const shareData = {
      title: 'JadanPay Transaction Receipt',
      text: `Payment Receipt\nAmount: ₦${selectedTx.amount.toLocaleString()}\nRef: ${selectedTx.reference}\nDate: ${new Date(selectedTx.date).toLocaleDateString()}\nStatus: Successful`,
      url: receiptLink
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            setShareState('shared');
        } catch (error) {
            console.log("Share canceled or failed", error);
        }
    } else {
        const copyText = `${shareData.text}\nView: ${shareData.url}`;
        navigator.clipboard.writeText(copyText);
        setShareState('copied');
        playNotification("Receipt link copied");
        setTimeout(() => setShareState('idle'), 2000);
    }
  };
  
  const handleCopyRef = (ref: string) => {
      navigator.clipboard.writeText(ref);
      playNotification("Reference copied");
  };

  const handleCopyToken = (token: string) => {
      navigator.clipboard.writeText(token);
      playNotification("Token copied");
  };

  const filteredTransactions = transactions.filter(t => 
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.destinationNumber && t.destinationNumber.includes(searchTerm))
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Receipt size={24} className="text-green-600 dark:text-green-500"/> Transaction History
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search ref or phone..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                />
            </div>
            <button onClick={loadData} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTransactions.map((tx) => (
          <div 
            key={tx.id}
            onClick={() => setSelectedTx(tx)}
            className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 cursor-pointer hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start z-10">
               <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm bg-gray-50 dark:bg-gray-800 overflow-hidden border border-gray-100 dark:border-gray-700`}>
                      {tx.provider && PROVIDER_IMAGES[tx.provider] ? (
                          <img src={PROVIDER_IMAGES[tx.provider]} alt={tx.provider} className="w-full h-full object-cover" />
                      ) : (
                          <span className="text-xs text-gray-500">{tx.provider?.slice(0,2) || 'W'}</span>
                      )}
                   </div>
                   <div>
                      <p className="font-bold text-gray-800 dark:text-white truncate max-w-[120px]">
                        {tx.type === 'WALLET_FUND' ? 'Wallet Top-up' : `${tx.provider || 'Service'} ${tx.type}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{tx.reference.slice(0, 8)}...</p>
                   </div>
               </div>
               <div className="text-right">
                    <p className={`font-mono font-bold text-lg ${tx.type === 'WALLET_FUND' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {tx.type === 'WALLET_FUND' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </p>
               </div>
            </div>
            
            <div className="h-px w-full bg-gray-50 dark:bg-gray-800 z-10"></div>
            
            <div className="flex justify-between items-center text-xs text-gray-400 z-10">
                <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(tx.date)}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                    tx.status === 'SUCCESS' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                    {tx.status}
                </span>
            </div>
          </div>
        ))}
      </div>

      {/* FIXED SIZE RECEIPT MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-[380px] my-4 relative animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 max-h-[90vh] flex flex-col">
             
             {/* Receipt Card */}
             <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col overflow-y-auto">
                 
                 {/* Header with Close Button */}
                 <div className="bg-green-600 p-6 pt-8 text-center relative shrink-0">
                     <button 
                        onClick={() => setSelectedTx(null)}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors z-50"
                     >
                        <X size={20} />
                     </button>
                     <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] [background-size:16px_16px]"></div>
                     <div className="relative z-10 flex flex-col items-center">
                         <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg animate-bounce">
                            <Check size={28} className="text-green-600" strokeWidth={4} />
                         </div>
                         <h3 className="text-white font-black text-lg tracking-tight uppercase">Transaction Successful</h3>
                         <p className="text-green-100 text-xs mt-1 font-medium opacity-90">{new Date(selectedTx.date).toLocaleString()}</p>
                     </div>
                 </div>

                 <div className="relative h-4 bg-green-600 shrink-0">
                     <div className="absolute top-0 left-0 w-full h-4 bg-white dark:bg-gray-800" 
                          style={{clipPath: 'polygon(0 100%, 2% 0, 4% 100%, 6% 0, 8% 100%, 10% 0, 12% 100%, 14% 0, 16% 100%, 18% 0, 20% 100%, 22% 0, 24% 100%, 26% 0, 28% 100%, 30% 0, 32% 100%, 34% 0, 36% 100%, 38% 0, 40% 100%, 42% 0, 44% 100%, 46% 0, 48% 100%, 50% 0, 52% 100%, 54% 0, 56% 100%, 58% 0, 60% 100%, 62% 0, 64% 100%, 66% 0, 68% 100%, 70% 0, 72% 100%, 74% 0, 76% 100%, 78% 0, 80% 100%, 82% 0, 84% 100%, 86% 0, 88% 100%, 90% 0, 92% 100%, 94% 0, 96% 100%, 98% 0, 100% 100%)'}}>
                     </div>
                 </div>

                 {/* Receipt Body */}
                 <div className="px-8 pb-8 bg-white dark:bg-gray-800 text-center flex-1 overflow-y-auto">
                      <div className="mb-6">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Paid</p>
                          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                             ₦{selectedTx.amount.toLocaleString()}
                          </h1>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
                         <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center bg-gray-100/50 dark:bg-gray-800/50">
                             <div>
                                 <span className="block text-[10px] font-bold text-gray-400 uppercase">Reference</span>
                                 <span className="font-mono font-bold text-gray-700 dark:text-gray-200 text-xs">{selectedTx.reference}</span>
                             </div>
                             <button onClick={() => handleCopyRef(selectedTx.reference)} className="text-gray-400 hover:text-green-600"><Copy size={14}/></button>
                         </div>
                         <div className="p-4 space-y-3">
                             <div className="flex justify-between items-center">
                                 <span className="text-sm text-gray-500 dark:text-gray-400">Provider</span>
                                 <div className="flex items-center gap-2">
                                     {selectedTx.provider && PROVIDER_IMAGES[selectedTx.provider] && (
                                         <img src={PROVIDER_IMAGES[selectedTx.provider]} alt="" className="w-6 h-6 rounded-full object-cover bg-white" />
                                     )}
                                     <span className="font-bold text-gray-900 dark:text-white text-sm">{selectedTx.provider || 'Wallet'}</span>
                                 </div>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-sm text-gray-500 dark:text-gray-400">Recipient</span>
                                 <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">{selectedTx.destinationNumber || selectedTx.userId}</span>
                             </div>
                         </div>
                         {selectedTx.meterToken && (
                             <div className="border-t border-dashed border-gray-200 dark:border-gray-600 bg-green-50/50 dark:bg-green-900/10 p-4 text-center">
                                 <span className="block text-green-700 dark:text-green-400 font-bold text-[10px] uppercase mb-1">Electricity Token</span>
                                 <span className="font-mono font-black text-xl text-gray-900 dark:text-white tracking-[0.2em] block">{selectedTx.meterToken}</span>
                                 <button onClick={() => handleCopyToken(selectedTx.meterToken!)} className="text-green-600 hover:text-green-700 dark:text-green-400 text-xs mt-1 flex items-center justify-center gap-1 mx-auto font-bold"><Copy size={12}/> Copy Token</button>
                             </div>
                         )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-8">
                          <button onClick={handleShare} className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                             <Share2 size={20} className={shareState === 'copied' ? 'text-green-500' : ''}/>
                             <span className="text-xs font-bold">{shareState === 'copied' ? 'Copied!' : 'Share'}</span>
                          </button>
                          <button onClick={() => alert("Saved")} className="flex flex-col items-center justify-center gap-2 py-4 bg-gray-900 text-white dark:bg-black rounded-2xl">
                             <Download size={20}/>
                             <span className="text-xs font-bold">Save</span>
                          </button>
                      </div>
                 </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
