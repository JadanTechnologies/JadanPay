
import React, { useEffect, useState } from 'react';
import { Transaction, User, UserRole, UserStatus } from '../types';
import { MockDB } from '../services/mockDb';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, TrendingUp, DollarSign, UserX, UserMinus, Shield, Users, CheckCircle, UserPlus, Wallet, Activity } from 'lucide-react';

interface AdminDashboardProps {
    onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [todaySales, setTodaySales] = useState({ count: 0, amount: 0 });
  const [advancedStats, setAdvancedStats] = useState<any>({});
  const [profitLoss, setProfitLoss] = useState({ revenue: 0, cost: 0, profit: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const allTxs = await MockDB.getAllTransactionsAdmin();
        setTransactions(allTxs);
        
        const staff = await MockDB.getStaff();
        setStaffCount(staff.length);
        
        setTodaySales(await MockDB.getTodaySales());
        setAdvancedStats(await MockDB.getDashboardStatsDetailed());
        setRecentUsers(await MockDB.getRecentSignups());

        const validSales = allTxs.filter(t => t.status === 'SUCCESS' && ['AIRTIME', 'DATA', 'CABLE', 'ELECTRICITY'].includes(t.type));
        const revenue = validSales.reduce((acc, t) => acc + t.amount, 0);
        const cost = validSales.reduce((acc, t) => acc + (t.costPrice || 0), 0);
        setProfitLoss({
            revenue,
            cost,
            profit: revenue - cost
        });
        
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  
  const providerData = [
    { name: 'MTN', value: transactions.filter(t => t.provider === 'MTN').length },
    { name: 'Glo', value: transactions.filter(t => t.provider === 'GLO').length },
    { name: 'Airtel', value: transactions.filter(t => t.provider === 'AIRTEL').length },
    { name: '9mobile', value: transactions.filter(t => t.provider === '9MOBILE').length },
  ].filter(d => d.value > 0);

  const pnlChartData = [
      { name: 'Mon', revenue: profitLoss.revenue * 0.1, cost: profitLoss.cost * 0.1 },
      { name: 'Tue', revenue: profitLoss.revenue * 0.15, cost: profitLoss.cost * 0.15 },
      { name: 'Wed', revenue: profitLoss.revenue * 0.2, cost: profitLoss.cost * 0.22 },
      { name: 'Thu', revenue: profitLoss.revenue * 0.12, cost: profitLoss.cost * 0.1 },
      { name: 'Fri', revenue: profitLoss.revenue * 0.25, cost: profitLoss.cost * 0.23 },
      { name: 'Sat', revenue: profitLoss.revenue * 0.1, cost: profitLoss.cost * 0.1 },
      { name: 'Sun', revenue: profitLoss.revenue * 0.08, cost: profitLoss.cost * 0.1 },
  ];

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

      {/* Profit & Loss Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Gross Profit</p>
                  <h3 className="text-3xl font-black mb-4">₦{profitLoss.profit.toLocaleString()}</h3>
                  <div className="h-1 w-full bg-indigo-950 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 w-[75%]"></div>
                  </div>
                  <p className="text-xs text-indigo-300 mt-2 flex justify-between">
                      <span>Total Revenue: ₦{profitLoss.revenue.toLocaleString()}</span>
                  </p>
              </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 dark:text-white">Profit & Loss Overview</h3>
                  <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-green-500"></span> Revenue</div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-red-500"></span> Cost (API)</div>
                  </div>
              </div>
              <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pnlChartData}>
                          <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <Tooltip 
                              contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px'}}
                              labelStyle={{color: '#9ca3af'}}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#22c55e" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                          <Area type="monotone" dataKey="cost" stroke="#ef4444" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Clickable Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
            onClick={() => onNavigate('admin-payments')}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer group relative overflow-hidden"
        >
            <div className="absolute right-0 top-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-green-500/20 transition-colors"></div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg"><DollarSign size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-300 text-sm font-medium">Today's Sales</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">₦{todaySales.amount.toLocaleString()}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{todaySales.count} Transactions</p>
        </div>

        <div 
            onClick={() => onNavigate('admin-users')}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer group relative overflow-hidden"
        >
             <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg"><Users size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-300 text-sm font-medium">Total Users</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">{advancedStats.totalUsers}</p>
             <p className="text-xs text-gray-400 mt-1">{advancedStats.activeUsers} Active</p>
        </div>

        <div 
            onClick={() => onNavigate('admin-staff')}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer group relative overflow-hidden"
        >
             <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg"><Shield size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-300 text-sm font-medium">Total Staff</h3>
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 relative z-10">{staffCount}</p>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">Active Personnel</p>
        </div>

        <div 
            onClick={() => onNavigate('admin-users')}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer group relative overflow-hidden"
        >
             <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"><UserX size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-300 text-sm font-medium">Suspended</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">{advancedStats.suspendedUsers}</p>
            <p className="text-xs text-red-500 mt-1">Restricted Access</p>
        </div>
      </div>

      {/* Secondary Breakdown Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div onClick={() => onNavigate('admin-users')} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                  <UserPlus size={16} className="text-indigo-500"/>
                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Total Resellers</span>
              </div>
              <span className="text-xl font-black text-gray-900 dark:text-white">{advancedStats.totalResellers}</span>
          </div>
          <div onClick={() => onNavigate('admin-users')} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-emerald-500"/>
                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Active Resellers</span>
              </div>
              <span className="text-xl font-black text-gray-900 dark:text-white">{advancedStats.activeResellers}</span>
          </div>
          <div onClick={() => onNavigate('admin-users')} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                  <UserMinus size={16} className="text-orange-500"/>
                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Inactive Resellers</span>
              </div>
              <span className="text-xl font-black text-gray-900 dark:text-white">{advancedStats.inactiveResellers}</span>
          </div>
          <div onClick={() => onNavigate('admin-users')} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-blue-500"/>
                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Active Users</span>
              </div>
              <span className="text-xl font-black text-gray-900 dark:text-white">{advancedStats.activeUsers}</span>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Chart Section - Fixed Height for Recharts */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[400px] transition-colors">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 h-6 shrink-0">Transaction Volume by Provider</h3>
            {/* FIXED: Added fixed height to container */}
            <div className="w-full flex-1 min-h-0 relative h-[300px]">
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
                 <button onClick={() => onNavigate('admin-users')} className="text-xs text-blue-600 hover:underline">View All</button>
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
