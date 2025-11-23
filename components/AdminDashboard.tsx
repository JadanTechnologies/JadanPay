import React, { useEffect, useState } from 'react';
import { Transaction, User } from '../types';
import { MockDB } from '../services/mockDb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, TrendingUp, AlertCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      setTransactions(await MockDB.getAllTransactionsAdmin());
      setUsers(await MockDB.getUsers());
    };
    load();
  }, []);

  // Compute Stats
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.status === 'SUCCESS' && t.type !== 'WALLET_FUND' ? t.amount : 0), 0);
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
      const headers = ["ID", "User", "Type", "Amount", "Provider", "Date", "Status"];
      const rows = transactions.map(t => [t.id, t.userId, t.type, t.amount, t.provider || '-', t.date, t.status]);
      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "transactions_ledger.csv");
      document.body.appendChild(link);
      link.click();
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm">
            <Download size={16} /> Export Ledger
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 text-green-700 rounded-lg"><TrendingUp size={20} /></div>
                <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">₦{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Users size={20} /></div>
                <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg"><AlertCircle size={20} /></div>
                <h3 className="text-gray-500 text-sm font-medium">Pending Approvals</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
            <h3 className="font-bold text-gray-700 mb-4">Transaction Volume by Provider</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={providerData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {providerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 overflow-y-auto">
             <h3 className="font-bold text-gray-700 mb-4">Recent Transactions</h3>
             <table className="w-full text-xs text-left">
                <thead className="text-gray-400 bg-gray-50 uppercase font-semibold">
                    <tr>
                        <th className="px-2 py-2">User</th>
                        <th className="px-2 py-2">Type</th>
                        <th className="px-2 py-2 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {transactions.slice(0, 10).map(t => (
                        <tr key={t.id}>
                            <td className="px-2 py-2 font-medium">{t.userId}</td>
                            <td className="px-2 py-2">{t.type}</td>
                            <td className="px-2 py-2 text-right">₦{t.amount}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};