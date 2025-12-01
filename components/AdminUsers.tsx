

import React, { useEffect, useState } from 'react';
import { User, UserStatus, Transaction, TransactionType, TransactionStatus, UserRole, KycStatus } from '../types';
import { MockDB } from '../services/mockDb';
import { Search, Ban, CheckCircle, MoreVertical, DollarSign, History, Shield, Smartphone, Globe, RotateCcw, AlertTriangle, Monitor, Trash2, Edit2, Save, X, Key, Code2, UserCheck, AlertCircle, FileText, ExternalLink, UserMinus, ArrowLeft } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'fund' | 'requests' | 'verification'>('list');
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
  
  const handleStatusChange = async (status: UserStatus) => {
    if (!selectedUser) return;
    if (window.confirm(`Set status for ${selectedUser.name} to ${status}?`)) {
        const updatedUser = await MockDB.updateUserStatus(selectedUser.id, status);
        setSelectedUser(updatedUser);
        await loadUsers();
    }
  };

  const handleResetPin = async () => {
      if(!selectedUser) return;
      if(window.confirm(`Reset PIN for ${selectedUser.name}? They will be prompted to create a new one on next transaction.`)) {
          const updatedUser = await MockDB.resetUserPin(selectedUser.id);
          setSelectedUser(updatedUser);
          await loadUsers();
          alert(`PIN has been reset for ${selectedUser.name}.`);
      }
  };

  const handleUpgradeToReseller = async (u: User) => {
      if(window.confirm(`Upgrade ${u.name} to Reseller? This will generate an API Key for them.`)) {
          try {
              const updated = await MockDB.upgradeUserToReseller(u.id);
              const allUsers = await MockDB.getUsers();
              setUsers(allUsers);
              if (selectedUser?.id === u.id) setSelectedUser(updated);
              alert(`User upgraded to Reseller! API Key generated.`);
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  const handleRejectRequest = async (u: User) => {
      if(window.confirm(`Reject reseller application for ${u.name}?`)) {
          try {
              await MockDB.rejectResellerUpgrade(u.id);
              await loadUsers();
              alert("Application rejected.");
          } catch(e: any) {
              alert(e.message);
          }
      }
  };

  // KYC Handlers
  const handleApproveKyc = async (u: User) => {
      if(window.confirm(`Approve Identity Verification for ${u.name}?`)) {
          await MockDB.approveKyc(u.id);
          await loadUsers();
          alert("KYC Approved.");
      }
  };

  const handleRejectKyc = async (u: User) => {
      if(window.confirm(`Reject verification for ${u.name}?`)) {
          await MockDB.rejectKyc(u.id);
          await loadUsers();
          alert("KYC Rejected.");
      }
  };
  
  const handleRevokeVerification = async () => {
      if(!selectedUser) return;
      if(window.confirm(`Are you sure you want to REVOKE verification for ${selectedUser.name}? They will lose access to wallet features.`)) {
          await MockDB.rejectKyc(selectedUser.id); // Re-use reject to set status to REJECTED/Unverified
          const updatedUserList = await MockDB.getUsers();
          const updatedUser = updatedUserList.find(u => u.id === selectedUser.id);
          if (updatedUser) setSelectedUser(updatedUser);
          setUsers(updatedUserList);
          alert("Verification Revoked.");
      }
  };

  const handleFundUser = async () => {
      if(!selectedUser || !fundAmount) return;
      const amount = Number(fundAmount);
      const actualAmount = fundType === 'credit' ? amount : -amount;
      
      await MockDB.updateUserBalance(selectedUser.id, actualAmount);
      
      await MockDB.addTransaction({
          id: Math.random().toString(36),
          userId: selectedUser.id,
          type: fundType === 'credit' ? TransactionType.ADMIN_CREDIT : TransactionType.ADMIN_DEBIT,
          amount: amount,
          status: TransactionStatus.SUCCESS,
          date: new Date().toISOString(),
          reference: `ADMIN-${Date.now()}`,
          previousBalance: selectedUser.balance,
          newBalance: selectedUser.balance + actualAmount,
          paymentMethod: 'Admin Adjustment'
      });

      const updatedUserList = await MockDB.getUsers();
      const updatedUser = updatedUserList.find(u => u.id === selectedUser.id);
      if (updatedUser) setSelectedUser(updatedUser);
      setUsers(updatedUserList);

      alert(`User ${fundType === 'credit' ? 'Credited' : 'Debited'} Successfully`);
      setFundAmount('');
      setViewMode('details');
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone.includes(searchTerm)
  );

  const pendingRequests = users.filter(u => u.resellerRequestStatus === 'PENDING');
  const pendingKyc = users.filter(u => u.kycStatus === KycStatus.PENDING);
  
  const StatusPill = ({ status }: { status: UserStatus }) => {
    let color = '';
    switch (status) {
      case UserStatus.ACTIVE: color = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'; break;
      case UserStatus.SUSPENDED: color = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'; break;
      case UserStatus.BANNED: color = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'; break;
    }
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${color}`}>{status}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">User Management</h2>
              <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>All Users</button>
                  <button onClick={() => setViewMode('requests')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'requests' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      Requests {pendingRequests.length > 0 && <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">{pendingRequests.length}</span>}
                  </button>
                  <button onClick={() => setViewMode('verification')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'verification' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      Verification {pendingKyc.length > 0 && <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px]">{pendingKyc.length}</span>}
                  </button>
              </div>
          </div>
          
          {viewMode === 'list' && (
              <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                      type="text" 
                      placeholder="Search name, email, phone..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                  />
              </div>
          )}
      </div>

      {viewMode === 'verification' && (
          <div className="space-y-4">
              {pendingKyc.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"><p className="text-gray-500 dark:text-gray-400">No pending verification requests.</p></div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingKyc.map(u => (
                          <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      {u.kycFaceUrl ? <img src={u.kycFaceUrl} className="w-full h-full object-cover"/> : <UserCheck size={20}/>}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-gray-900 dark:text-white">{u.name}</h3>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.kycDocType} Submission</p>
                                  </div>
                              </div>
                              
                              {u.kycDocNumber && (
                                  <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                      <span className="text-[10px] text-gray-400 uppercase font-bold">Document Number</span>
                                      <p className="font-mono font-bold text-gray-800 dark:text-gray-200">{u.kycDocNumber}</p>
                                  </div>
                              )}

                              <div className="mb-4 h-40 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden relative group">
                                  {u.kycDocUrl && <img src={u.kycDocUrl} className="w-full h-full object-contain" />}
                                  <a href={u.kycDocUrl} target="_blank" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"><ExternalLink size={16} className="mr-1"/> View Full</a>
                              </div>

                              <div className="flex gap-2">
                                  <button onClick={() => handleRejectKyc(u)} className="flex-1 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs">Reject</button>
                                  <button onClick={() => handleApproveKyc(u)} className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold text-xs">Approve</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}
      
       {viewMode === 'requests' && (
            <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"><p className="text-gray-500 dark:text-gray-400">No pending upgrade requests.</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingRequests.map(u => (
                            <div key={u.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                                <div><h3 className="font-bold text-lg text-gray-900 dark:text-white">{u.name}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p></div>
                                <div className="flex gap-2"><button onClick={() => handleRejectRequest(u)} className="px-4 py-2 border border-red-200 text-red-600 rounded-xl font-bold text-xs">Reject</button><button onClick={() => handleUpgradeToReseller(u)} className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs">Approve</button></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-100 dark:border-gray-700">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Wallet Balance</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredUsers.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full"/>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{u.name}</p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">{u.phone}</td>
                                <td className="p-4"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded-md text-xs font-bold capitalize">{u.role}</span></td>
                                <td className="p-4 font-mono font-bold text-gray-800 dark:text-white">₦{u.balance.toLocaleString()}</td>
                                <td className="p-4"><StatusPill status={u.status} /></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleUserClick(u)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {viewMode === 'details' && selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center relative overflow-hidden">
                    <button onClick={() => setViewMode('list')} className="absolute top-4 left-4 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><ArrowLeft size={18}/></button>
                    <img src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=random`} className="w-24 h-24 rounded-full mx-auto border-4 border-white dark:border-gray-800 shadow-lg mb-2"/>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                    <div className="flex gap-2 justify-center mt-4">
                        <StatusPill status={selectedUser.status} />
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 capitalize">{selectedUser.role}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${selectedUser.isVerified ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{selectedUser.isVerified ? 'Verified' : 'Not Verified'}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Admin Actions</h3>
                    <div className="space-y-3">
                        <button onClick={() => setViewMode('fund')} className="w-full py-2 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20"><DollarSign size={16}/> Credit/Debit Wallet</button>
                        <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => handleStatusChange(UserStatus.ACTIVE)} className="py-2 text-sm font-bold border rounded-lg border-green-200 text-green-600">Activate</button>
                           <button onClick={() => handleStatusChange(UserStatus.SUSPENDED)} className="py-2 text-sm font-bold border rounded-lg border-yellow-300 text-yellow-700">Suspend</button>
                        </div>
                        <button onClick={handleResetPin} className="w-full py-2 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"><RotateCcw size={16}/> Reset PIN</button>
                        {selectedUser.isVerified && <button onClick={handleRevokeVerification} className="w-full py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20"><UserMinus size={16}/> Revoke Verification</button>}
                        <div className="flex gap-2">
                            <button onClick={handleEditClick} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Edit2 size={16}/> Edit</button>
                            <button onClick={handleDeleteUser} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Trash2 size={16}/> Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Transaction History</h3>
                <div className="max-h-96 overflow-y-auto">
                    {userHistory.length > 0 ? (
                        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                           <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold sticky top-0">
                                <tr>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {userHistory.map(tx => (
                                    <tr key={tx.id}>
                                        <td className="p-3 font-bold">{tx.type.replace('_', ' ')}</td>
                                        <td className="p-3 font-mono">₦{tx.amount.toLocaleString()}</td>
                                        <td className="p-3">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.status === TransactionStatus.SUCCESS ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="text-center text-gray-400 py-8">No transactions found for this user.</p>}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};