
import React, { useEffect, useState } from 'react';
import { Transaction, User } from '../types';
import { MockDB } from '../services/mockDb';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Users, TrendingUp, DollarSign, Wallet } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setTransactions(await MockDB.getAllTransactionsAdmin());
        setUsers(await MockDB.getUsers());
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Compute Stats
  const validTransactions = transactions.filter(t => t.status === 'SUCCESS' && t.type !== 'WALLET_FUND' && t.type !== 'ADMIN_CREDIT' && t.type !== 'ADMIN_DEBIT');
  
  const totalRevenue = validTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCost = validTransactions.reduce((sum, t) => sum + (t.costPrice || 0), 0);
  const totalProfit = validTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  
  const totalUsers = users.length;
  
  // Chart Data preparation
  const providerData = [
    { name: 'MTN', value: transactions.filter(t => t.provider === 'MTN').length },
    { name: 'Glo', value: transactions.filter(t => t.provider === 'GLO').length },
    { name: 'Airtel', value: transactions.filter(t => t.provider === 'AIRTEL').length },
    { name: '9mobile', value: transactions.filter(t => t.provider === '9MOBILE').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#FFCC00', '#00C853', '#FF0000', '#00695C'];

  const exportCSV = () => {
      const headers = ["ID", "User", "Type", "Amount", "Cost", "Profit", "Provider", "Date", "Status"];
      const rows = transactions.map(t => [t.id, t.userId, t.type, t.amount, t.costPrice || 0, t.profit || 0, t.provider || '-', t.date, t.status]);
      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "transactions_ledger.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
  };

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white shadow-sm transition-colors">
            <Download size={16} /> Export Ledger
        </button>
      </div>

      {/* Stats Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg"><TrendingUp size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Sales</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"><Wallet size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Cost</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg"><DollarSign size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Gross Profit</h3>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">₦{totalProfit.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg"><Users size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Users</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Chart Container - Fixed Height to prevent Recharts crash */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[400px] transition-colors">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 h-6 shrink-0">Transaction Volume by Provider</h3>
            <div className="w-full h-[300px] relative">
                {providerData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={providerData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {providerData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px'}} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        No transaction data available
                    </div>
                )}
            </div>
         </div>
         
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[400px] flex flex-col transition-colors">
             <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 shrink-0">Recent Transactions</h3>
             <div className="overflow-y-auto flex-1">
                 <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 uppercase font-semibold sticky top-0">
                        <tr>
                            <th className="px-2 py-2">User</th>
                            <th className="px-2 py-2">Type</th>
                            <th className="px-2 py-2 text-right">Profit</th>
                            <th className="px-2 py-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {transactions.slice(0, 15).map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-2 py-2 font-medium truncate max-w-[80px]" title={t.userId}>{t.userId}</td>
                                <td className="px-2 py-2">{t.type}</td>
                                <td className="px-2 py-2 text-right text-green-600 dark:text-green-400">
                                    {t.profit ? `+₦${t.profit}` : '-'}
                                </td>
                                <td className="px-2 py-2 text-right text-gray-900 dark:text-white">₦{t.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-400 dark:text-gray-500">No transactions yet</td></tr>
                        )}
                    </tbody>
                 </table>
             </div>
         </div>
      </div>
    </div>
  );
};
