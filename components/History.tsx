import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, Provider, User } from '../types';
import { MockDB } from '../services/mockDb';
import { X, Share2, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { PROVIDER_LOGOS } from '../constants';

interface HistoryProps {
  user: User;
}

export const History: React.FC<HistoryProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, [user.id]);

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

                <div className="space-y-4">
                    <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
                        <span className="text-gray-500 text-sm">Amount</span>
                        <span className="font-bold text-lg">₦{selectedTx.amount.toLocaleString()}</span>
                    </div>
                    {selectedTx.provider && (
                        <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
                            <span className="text-gray-500 text-sm">Provider</span>
                            <span className="font-medium text-gray-800">{selectedTx.provider}</span>
                        </div>
                    )}
                     <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
                        <span className="text-gray-500 text-sm">Recipient</span>
                        <span className="font-medium text-gray-800">{selectedTx.destinationNumber || user.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
                        <span className="text-gray-500 text-sm">Reference</span>
                        <span className="font-mono text-xs text-gray-600">{selectedTx.reference}</span>
                    </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="mt-6 flex justify-center">
                    <div className="bg-white p-2 border border-gray-200 rounded-lg">
                       {/* Simple CSS Pattern for QR Mock */}
                       <div className="w-24 h-24 bg-gray-900 opacity-90" style={{ backgroundImage: 'radial-gradient(white 2px, transparent 2px)', backgroundSize: '4px 4px'}}></div>
                    </div>
                </div>
                <p className="text-center text-[10px] text-gray-400 mt-2">Scan to verify transaction</p>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-green-600 text-green-700 font-medium text-sm hover:bg-green-50 transition-colors">
                        <Share2 size={16} /> Share
                    </button>
                     <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors">
                        <Download size={16} /> Save
                    </button>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};