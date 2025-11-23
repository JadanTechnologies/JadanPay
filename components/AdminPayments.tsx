
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { MockDB } from '../services/mockDb';
import { CheckCircle, XCircle, Eye, RefreshCw, CreditCard, Search, Calendar } from 'lucide-react';
import { playNotification } from '../utils/audio';

export const AdminPayments: React.FC = () => {
  const [pendingTx, setPendingTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    const data = await MockDB.getPendingTransactions();
    setPendingTx(data);
    setLoading(false);
  };

  const handleApprove = async (tx: Transaction) => {
    if(!window.confirm(`Approve funding of ₦${tx.amount.toLocaleString()} for user?`)) return;
    
    await MockDB.approveTransaction(tx.id);
    playNotification("Payment approved");
    loadPending();
  };

  const handleDecline = async (tx: Transaction) => {
    if(!window.confirm(`Decline funding request?`)) return;
    
    await MockDB.declineTransaction(tx.id);
    playNotification("Payment declined", "error");
    loadPending();
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CreditCard size={24} className="text-green-600"/> Payment Management
            </h2>
            <button 
                onClick={loadPending} 
                className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             {pendingTx.length === 0 ? (
                 <div className="p-12 text-center text-gray-400">
                     <CheckCircle size={48} className="mx-auto mb-4 opacity-20"/>
                     <p>No pending manual payments found.</p>
                 </div>
             ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                            <tr>
                                <th className="p-4">User ID</th>
                                <th className="p-4">Reference</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Proof</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingTx.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-700">{tx.userId}</td>
                                    <td className="p-4 font-mono text-xs text-gray-500">{tx.reference}</td>
                                    <td className="p-4 font-bold text-green-700">₦{tx.amount.toLocaleString()}</td>
                                    <td className="p-4 text-xs text-gray-500">
                                        {new Date(tx.date).toLocaleDateString()}
                                        <br/>
                                        {new Date(tx.date).toLocaleTimeString()}
                                    </td>
                                    <td className="p-4">
                                        {tx.proofUrl ? (
                                            <button 
                                                onClick={() => setSelectedProof(tx.proofUrl || null)}
                                                className="flex items-center gap-1 text-blue-600 text-xs font-bold hover:underline"
                                            >
                                                <Eye size={14}/> View
                                            </button>
                                        ) : <span className="text-gray-400 text-xs">No File</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleDecline(tx)}
                                                className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100"
                                            >
                                                Decline
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(tx)}
                                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold shadow-md shadow-green-200 hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
        </div>

        {/* Proof Modal */}
        {selectedProof && (
             <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedProof(null)}>
                 <div className="bg-white p-2 rounded-xl max-w-lg w-full relative">
                     <img src={selectedProof} alt="Proof" className="w-full h-auto rounded-lg"/>
                     <button className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"><XCircle size={24}/></button>
                 </div>
             </div>
        )}
    </div>
  );
};
