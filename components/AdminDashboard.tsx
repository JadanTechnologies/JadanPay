
import React, { useEffect, useState } from 'react';
import { Transaction, User, Staff } from '../types';
import { MockDB } from '../services/mockDb';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Users, TrendingUp, DollarSign, Wallet, UserX, UserMinus, Shield, Calendar } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Specific Stats
  const [todaySales, setTodaySales] = useState({ count: 0, amount: 0 });
  const [inactiveCount, setInactiveCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setTransactions(await MockDB.getAllTransactionsAdmin());
        setUsers(await MockDB.getUsers());
        
        // New Stats Fetching
        const staff = await MockDB.getStaff();
        setStaffCount(staff.length);
        
        setTodaySales(await MockDB.getTodaySales());
        setInactiveCount(await MockDB.getInactiveUsersCount());
        setSuspendedCount(await MockDB.getSuspendedUsersCount());
        setRecentUsers(await MockDB.getRecentSignups());
        
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  
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
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white shadow-sm transition-colors">
            <Download size={16} /> Export Ledger
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-green-500/20 transition-colors"></div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg"><DollarSign size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Today's Sales</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">₦{todaySales.amount.toLocaleString()}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{todaySales.count} Transactions</p>
        </div>

        {/* Inactive Users */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-24 h-24 bg-gray-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-gray-500/20 transition-colors"></div>
             <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg"><UserMinus size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Inactive Users</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">{inactiveCount}</p>
             <p className="text-xs text-gray-400 mt-1">No login for 30+ days</p>
        </div>

        {/* Total Staff */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-colors"></div>
             <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg"><Shield size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Staff</h3>
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 relative z-10">{staffCount}</p>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">Active Personnel</p>
        </div>

        {/* Suspended Users */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-red-500/20 transition-colors"></div>
             <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"><UserX size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Suspended Users</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">{suspendedCount}</p>
            <p className="text-xs text-red-500 mt-1">Restricted Access</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Chart Section */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[400px] transition-colors">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 h-6 shrink-0">Transaction Volume by Provider</h3>
            <div className="w-full flex-1 min-h-0 relative">
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
         
         {/* Recent Users List */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[400px] flex flex-col transition-colors">
             <div className="flex justify-between items-center mb-4 shrink-0">
                 <h3 className="font-bold text-gray-700 dark:text-gray-200">Recent Signups</h3>
             </div>
             <div className="overflow-y-auto flex-1">
                 <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-gray-400 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase font-semibold sticky top-0">
                        <tr>
                            <th className="px-3 py-3">User</th>
                            <th className="px-3 py-3">Email</th>
                            <th className="px-3 py-3 text-right">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {recentUsers.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-3 py-3 font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-700 dark:text-green-400 text-[10px]">
                                        {u.name.charAt(0)}
                                    </div>
                                    {u.name}
                                </td>
                                <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                                <td className="px-3 py-3 text-right text-gray-400">
                                    {u.joinedDate ? new Date(u.joinedDate).toLocaleDateString() : 'N/A'}
                                </td>
                            </tr>
                        ))}
                        {recentUsers.length === 0 && (
                            <tr><td colSpan={3} className="p-4 text-center text-gray-400">No recent signups</td></tr>
                        )}
                    </tbody>
                 </table>
             </div>
         </div>
      </div>
    </div>
  );
};
