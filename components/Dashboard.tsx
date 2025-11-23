import React, { useState } from 'react';
import { User } from '../types';
import { TopUpForm } from './TopUpForm';
import { fundWallet } from '../services/topupService';
import { Wallet, TrendingUp, Plus, ArrowRight } from 'lucide-react';

interface DashboardProps {
  user: User;
  refreshUser: () => void;
  onViewReceipt: (txId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, refreshUser, onViewReceipt }) => {
  const [showFundModal, setShowFundModal] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  const handleFundWallet = async () => {
    setIsFunding(true);
    try {
        await fundWallet(user, 10000); // Mock funding fixed amount
        refreshUser();
        setShowFundModal(false);
        alert("Wallet funded with ₦10,000 successfully!");
    } catch(e) {
        alert("Funding failed");
    } finally {
        setIsFunding(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      
      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-400/20 rounded-full -ml-8 -mb-8 blur-lg"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
               <p className="text-green-100 text-sm font-medium">Available Balance</p>
               <h1 className="text-3xl font-bold font-mono tracking-tight mt-1">₦{user.balance.toLocaleString()}</h1>
            </div>
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                <Wallet size={20} className="text-green-50" />
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={() => setShowFundModal(true)}
                className="flex-1 bg-white text-green-800 py-2.5 px-4 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
             >
                <Plus size={16} /> Fund Wallet
             </button>
             <div className="bg-green-800/50 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 border border-green-600/30">
                <TrendingUp size={16} className="text-green-300" />
                <div>
                   <p className="text-[10px] text-green-300">Savings Stash</p>
                   <p className="font-mono text-sm font-bold">₦{user.savings.toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Quick Repay Carousel (Mock Data) */}
      <div>
         <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 text-sm">Quick Repay</h3>
            <span className="text-green-600 text-xs font-medium cursor-pointer flex items-center gap-1">View All <ArrowRight size={12}/></span>
         </div>
         <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[1,2,3].map(i => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border-2 border-transparent group-hover:border-green-500 transition-colors relative">
                        <img src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} className="w-12 h-12 rounded-full" alt="" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-[10px] text-yellow-500">★</span>
                        </div>
                    </div>
                    <span className="text-xs text-gray-600 truncate w-full text-center">Mum</span>
                </div>
            ))}
         </div>
      </div>

      {/* Top Up Form */}
      <TopUpForm user={user} onSuccess={refreshUser} onViewReceipt={onViewReceipt} />

       {/* Fund Modal */}
       {showFundModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                <h3 className="text-lg font-bold mb-4">Fund Wallet</h3>
                <p className="text-gray-500 text-sm mb-6">Simulation: This will add ₦10,000 to your wallet.</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowFundModal(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleFundWallet}
                        disabled={isFunding}
                        className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold"
                    >
                        {isFunding ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};