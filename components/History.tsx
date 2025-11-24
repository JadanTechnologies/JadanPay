
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, Provider, User } from '../types';
import { MockDB } from '../services/mockDb';
import { X, Share2, CheckCircle2, Download, RefreshCw, Check, Search, Calendar, Copy, Receipt, Link as LinkIcon, Smartphone, CreditCard, ExternalLink, QrCode } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '../constants';
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

    // Simulate a deep link for the receipt
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
        // Fallback: Copy Link
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
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 1500);
  };

  const handleCopyToken = (token: string) => {
      navigator.clipboard.writeText(token);
      playNotification("Token copied");
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 1500);
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
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
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
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                       tx.provider ? (PROVIDER_COLORS[tx.provider] || 'bg-green-50 text-green-700') : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                   }`}>
                      {tx.provider ? (PROVIDER_LOGOS[tx.provider] ? PROVIDER_LOGOS[tx.provider].slice(0,1) : tx.provider.slice(0,1)) : 'W'}
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

            {/* Hover Effect Background */}
            <div className="absolute inset-0 bg-green-50/50 dark:bg-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        ))}

        {filteredTransactions.length === 0 && !loading && (
            <div className="col-span-full text-center py-20 text-gray-400 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="opacity-50"/>
                </div>
                <p>No transactions found matching your criteria.</p>
            </div>
        )}
      </div>

      {/* Enhanced Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-[380px] my-8 relative animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
             
             {/* Close Button */}
             <button 
                onClick={() => setSelectedTx(null)}
                className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm z-50"
             >
                <X size={24} />
             </button>

             {/* Receipt Card */}
             <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                 
                 {/* Receipt Header Pattern */}
                 <div className="bg-green-600 p-8 pt-10 text-center relative">
                     {/* Radial Pattern Overlay */}
                     <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] [background-size:16px_16px]"></div>
                     
                     <div className="relative z-10 flex flex-col items-center">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
                            <Check size={32} className="text-green-600" strokeWidth={4} />
                         </div>
                         <h3 className="text-white font-black text-xl tracking-tight uppercase">Transaction Successful</h3>
                         <p className="text-green-100 text-sm mt-1 font-medium opacity-90">{new Date(selectedTx.date).toLocaleString()}</p>
                     </div>
                 </div>

                 {/* Sawtooth Divider */}
                 <div className="relative h-4 bg-green-600">
                     <div className="absolute top-0 left-0 w-full h-4 bg-white dark:bg-gray-800" 
                          style={{clipPath: 'polygon(0 100%, 2% 0, 4% 100%, 6% 0, 8% 100%, 10% 0, 12% 100%, 14% 0, 16% 100%, 18% 0, 20% 100%, 22% 0, 24% 100%, 26% 0, 28% 100%, 30% 0, 32% 100%, 34% 0, 36% 100%, 38% 0, 40% 100%, 42% 0, 44% 100%, 46% 0, 48% 100%, 50% 0, 52% 100%, 54% 0, 56% 100%, 58% 0, 60% 100%, 62% 0, 64% 100%, 66% 0, 68% 100%, 70% 0, 72% 100%, 74% 0, 76% 100%, 78% 0, 80% 100%, 82% 0, 84% 100%, 86% 0, 88% 100%, 90% 0, 92% 100%, 94% 0, 96% 100%, 98% 0, 100% 100%)'}}>
                     </div>
                 </div>

                 {/* Receipt Body */}
                 <div className="px-8 pb-8 bg-white dark:bg-gray-800 text-center flex-1">
                      <div className="mb-8">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Paid</p>
                          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                             ₦{selectedTx.amount.toLocaleString()}
                          </h1>
                      </div>

                      {/* Transaction Details */}
                      <div className="space-y-4 text-sm bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                         <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-200 dark:border-gray-600">
                             <span className="text-gray-500 dark:text-gray-400 font-medium">Reference</span>
                             <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-gray-900 dark:text-white text-xs tracking-tight">{selectedTx.reference}</span>
                                  <button onClick={() => handleCopyRef(selectedTx.reference)} className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"><Copy size={12}/></button>
                             </div>
                         </div>
                         
                         <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-200 dark:border-gray-600">
                             <span className="text-gray-500 dark:text-gray-400 font-medium">Service</span>
                             <span className="font-bold text-gray-900 dark:text-white capitalize">{selectedTx.type.replace(/_/g, ' ').toLowerCase()}</span>
                         </div>

                         <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-200 dark:border-gray-600">
                             <span className="text-gray-500 dark:text-gray-400 font-medium">Provider</span>
                             <div className="flex items-center gap-2">
                                 {selectedTx.provider && PROVIDER_LOGOS[selectedTx.provider] && (
                                     <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${PROVIDER_COLORS[selectedTx.provider]} text-white shadow-sm`}>
                                         {PROVIDER_LOGOS[selectedTx.provider].charAt(0)}
                                     </span>
                                 )}
                                 <span className="font-bold text-gray-900 dark:text-white">{selectedTx.provider || 'Wallet'}</span>
                             </div>
                         </div>

                         <div className="flex justify-between items-center">
                             <span className="text-gray-500 dark:text-gray-400 font-medium">Beneficiary</span>
                             <span className="font-bold text-gray-900 dark:text-white font-mono">{selectedTx.destinationNumber || selectedTx.userId}</span>
                         </div>
                         
                         {selectedTx.meterToken && (
                             <div className="pt-3 mt-3 border-t border-dashed border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/30 -mx-6 px-6 py-4">
                                 <span className="block text-gray-500 dark:text-gray-400 font-medium text-xs uppercase mb-1 text-left">Electricity Token</span>
                                 <div className="flex justify-between items-center">
                                     <span className="font-mono font-black text-lg text-gray-900 dark:text-white tracking-widest">{selectedTx.meterToken}</span>
                                     <button onClick={() => handleCopyToken(selectedTx.meterToken!)} className="text-green-600 hover:text-green-700 dark:text-green-400"><Copy size={16}/></button>
                                 </div>
                             </div>
                         )}
                      </div>

                      {/* QR Code Placeholder for visual appeal */}
                      <div className="mt-6 flex justify-center opacity-40 grayscale">
                          <QrCode size={48} />
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-4 mt-8">
                          <button 
                             onClick={handleShare}
                             className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all group border ${shareState === 'shared' || shareState === 'copied' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 dark:bg-gray-700 border-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                          >
                             <div className={`p-2 rounded-full ${shareState === 'shared' || shareState === 'copied' ? 'bg-green-200' : 'bg-white dark:bg-gray-600'} shadow-sm`}>
                                 {shareState === 'copied' ? <Check size={18} /> : shareState === 'shared' ? <ExternalLink size={18} /> : <Share2 size={18} />}
                             </div>
                             <span className="text-xs font-bold">{shareState === 'copied' ? 'Copied!' : shareState === 'shared' ? 'Shared!' : 'Share Receipt'}</span>
                          </button>
                          
                          <button 
                             className="flex flex-col items-center justify-center gap-2 py-4 bg-gray-900 text-white dark:bg-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
                             onClick={() => alert("Image download simulated.")}
                          >
                             <div className="p-2 bg-gray-700 rounded-full shadow-sm">
                                 <Download size={18}/>
                             </div>
                             <span className="text-xs font-bold">Save Image</span>
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
