import React, { useEffect, useState } from 'react';
import { User, UserStatus, Transaction, TransactionType, TransactionStatus } from '../types';
import { MockDB } from '../services/mockDb';
import { Search, Ban, CheckCircle, MoreVertical, DollarSign, History, Shield, Smartphone, Globe, RotateCcw, AlertTriangle, Monitor, Trash2, Edit2, Save, X } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'fund'>('list');
  const [fundAmount, setFundAmount] = useState('');
  const [fundType, setFundType] = useState<'credit' | 'debit'>('credit');
  const [isLoading, setIsLoading] = useState(false);

  // Edit Mode State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await MockDB.getUsers();
    setUsers(data);
    setIsLoading(false);
  };

  const loadUserHistory = async (userId: string) => {
      const tx = await MockDB.getTransactions(userId);
      setUserHistory(tx);
  };

  const handleUserClick = async (user: User) => {
      setSelectedUser(user);
      await loadUserHistory(user.id);
      setViewMode('details');
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
      await MockDB.updateUserStatus(userId, newStatus);
      await loadUsers();
      if(selectedUser) setSelectedUser({...selectedUser, status: newStatus});
  };

  const handleDeleteUser = async () => {
      if(!selectedUser) return;
      if(window.confirm(`Are you sure you want to DELETE ${selectedUser.name}? This action cannot be undone.`)) {
          await MockDB.deleteUser(selectedUser.id);
          await loadUsers();
          setViewMode('list');
          setSelectedUser(null);
      }
  };

  const handleEditClick = () => {
      if(!selectedUser) return;
      setEditFormData({
          name: selectedUser.name,
          email: selectedUser.email,
          phone: selectedUser.phone,
          role: selectedUser.role
      });
      setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
      if(!selectedUser || !editFormData.name) return;
      const updatedUser = { ...selectedUser, ...editFormData };
      await MockDB.updateUser(updatedUser as User);
      await loadUsers();
      setSelectedUser(updatedUser as User);
      setShowEditModal(false);
  };

  const handleFundUser = async () => {
      if(!selectedUser || !fundAmount) return;
      const amount = Number(fundAmount);
      const actualAmount = fundType === 'credit' ? amount : -amount;
      
      await MockDB.updateUserBalance(selectedUser.id, actualAmount);
      
      // Record Admin Transaction
      await MockDB.addTransaction({
          id: Math.random().toString(36),
          userId: selectedUser.id,
          type: fundType === 'credit' ? TransactionType.ADMIN_CREDIT : TransactionType.ADMIN_DEBIT,
          amount: amount,
          status: TransactionStatus.SUCCESS,
          date: new Date().toISOString(),
          reference: `ADMIN-${Date.now()}`,
          previousBalance: selectedUser.balance,
          newBalance: selectedUser.balance + actualAmount
      });

      await loadUsers();
      alert(`User ${fundType === 'credit' ? 'Credited' : 'Debited'} Successfully`);
      setViewMode('list');
      setFundAmount('');
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {viewMode === 'list' && (
        <>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search name, email, phone..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Balance</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Last Login</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-8 h-8 rounded-full" alt="" />
                                            <div>
                                                <p className="font-bold text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 capitalize text-gray-600">{user.role}</td>
                                    <td className="p-4 font-mono font-bold">₦{user.balance.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                                            user.status === UserStatus.BANNED ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                                        <div className="text-[10px] text-gray-400">{user.ipAddress}</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleUserClick(user)}
                                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
      )}

      {viewMode === 'details' && selectedUser && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                  {/* User Profile Card */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-green-600 to-teal-600"></div>
                      <div className="relative z-10 mt-12">
                          <img src={`https://ui-avatars.com/api/?name=${selectedUser.name}&background=fff&size=128`} className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg" alt="" />
                          <h2 className="text-xl font-bold text-gray-900 mt-2">{selectedUser.name}</h2>
                          <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                          <div className="flex justify-center gap-2 mt-4">
                              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold capitalize text-gray-600">{selectedUser.role}</span>
                               <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${selectedUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                   {selectedUser.status}
                               </span>
                          </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-left">
                           <div>
                               <p className="text-xs text-gray-400 uppercase font-bold">Wallet</p>
                               <p className="font-mono font-bold text-lg text-green-700">₦{selectedUser.balance.toLocaleString()}</p>
                           </div>
                           <div>
                               <p className="text-xs text-gray-400 uppercase font-bold">Savings</p>
                               <p className="font-mono font-bold text-lg text-blue-700">₦{selectedUser.savings.toLocaleString()}</p>
                           </div>
                           <div className="col-span-2">
                               <p className="text-xs text-gray-400 uppercase font-bold mb-1">System Info</p>
                               <div className="flex items-center gap-2 text-xs text-gray-600">
                                   <Globe size={12}/> {selectedUser.ipAddress || 'Unknown IP'}
                               </div>
                               <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                   <Monitor size={12}/> {selectedUser.os || 'Unknown OS'}
                               </div>
                           </div>
                      </div>
                  </div>

                  {/* Actions Card */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-4">Admin Actions</h3>
                      <div className="space-y-3">
                          <button 
                            onClick={handleEditClick}
                            className="w-full py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-100 hover:bg-blue-100 flex items-center justify-center gap-2"
                          >
                              <Edit2 size={16}/> Edit Profile
                          </button>
                          
                          <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => { setViewMode('fund'); setFundType('credit'); }}
                                    className="py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100 hover:bg-green-100 flex items-center justify-center gap-2"
                                >
                                    <DollarSign size={16}/> Credit
                                </button>
                                <button 
                                    onClick={() => { setViewMode('fund'); setFundType('debit'); }}
                                    className="py-2 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 flex items-center justify-center gap-2"
                                >
                                    <DollarSign size={16}/> Debit
                                </button>
                          </div>

                          <div className="h-px bg-gray-100 my-2"></div>
                          
                          {selectedUser.status === UserStatus.ACTIVE ? (
                            <>
                                <button 
                                    onClick={() => handleStatusChange(selectedUser.id, UserStatus.SUSPENDED)}
                                    className="w-full py-2 bg-yellow-50 text-yellow-700 rounded-xl text-sm font-bold hover:bg-yellow-100 flex items-center justify-center gap-2"
                                >
                                    <AlertTriangle size={16}/> Suspend Account
                                </button>
                                <button 
                                    onClick={() => handleStatusChange(selectedUser.id, UserStatus.BANNED)}
                                    className="w-full py-2 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-900 flex items-center justify-center gap-2"
                                >
                                    <Ban size={16}/> Ban User
                                </button>
                            </>
                          ) : (
                              <button 
                                onClick={() => handleStatusChange(selectedUser.id, UserStatus.ACTIVE)}
                                className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                              >
                                  <RotateCcw size={16}/> Reactivate Account
                              </button>
                          )}

                           <button 
                                onClick={handleDeleteUser}
                                className="w-full py-2 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2 mt-4"
                            >
                                <Trash2 size={16}/> Delete User
                            </button>
                      </div>
                      <button onClick={() => setViewMode('list')} className="w-full mt-4 text-gray-400 text-sm hover:text-gray-600">Back to List</button>
                  </div>
              </div>

              <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2"><History size={18}/> Transaction History</h3>
                      </div>
                      <div className="overflow-y-auto max-h-[600px]">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                                <tr>
                                    <th className="p-3">Ref</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Details</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {userHistory.map(tx => (
                                    <tr key={tx.id}>
                                        <td className="p-3 font-mono text-gray-500">{tx.reference}</td>
                                        <td className="p-3">{tx.type}</td>
                                        <td className="p-3 text-gray-500">
                                            {tx.destinationNumber || tx.bundleName || '-'}
                                        </td>
                                        <td className={`p-3 font-bold ${tx.type.includes('DEBIT') || (!tx.type.includes('CREDIT') && !tx.type.includes('FUND')) ? 'text-red-600' : 'text-green-600'}`}>
                                            {tx.type.includes('DEBIT') || (!tx.type.includes('CREDIT') && !tx.type.includes('FUND')) ? '-' : '+'}₦{tx.amount.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {userHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400">No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {viewMode === 'fund' && selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                  <h3 className="text-lg font-bold mb-4 capitalize">{fundType} User Wallet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                      You are about to {fundType} <strong>{selectedUser.name}</strong>. This action will be logged.
                  </p>
                  
                  <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (₦)</label>
                      <input 
                        type="number" 
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="w-full p-3 border rounded-xl font-mono text-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="0.00"
                        autoFocus
                      />
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => setViewMode('details')}
                        className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleFundUser}
                        className={`flex-1 py-3 text-white rounded-xl font-bold ${fundType === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                          Confirm {fundType === 'credit' ? '+' : '-'}
                      </button>
                  </div>
              </div>
          </div>
      )}

       {/* Edit Modal */}
       {showEditModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Edit User Details</h3>
                        <button onClick={() => setShowEditModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                value={editFormData.name || ''}
                                onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                className="w-full p-3 border rounded-xl"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                value={editFormData.email || ''}
                                onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                                className="w-full p-3 border rounded-xl"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                            <input 
                                type="text" 
                                value={editFormData.phone || ''}
                                onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                                className="w-full p-3 border rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Role</label>
                            <select 
                                value={editFormData.role}
                                onChange={e => setEditFormData({...editFormData, role: e.target.value as any})}
                                className="w-full p-3 border rounded-xl bg-white"
                            >
                                <option value="user">User</option>
                                <option value="reseller">Reseller</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveEdit}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <Save size={18}/> Save Changes
                        </button>
                    </div>
                </div>
            </div>
       )}
    </div>
  );
};