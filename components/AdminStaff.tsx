
import React, { useEffect, useState } from 'react';
import { Staff, Role } from '../types';
import { MockDB } from '../services/mockDb';
import { User, Shield, Lock, Plus, Trash2, Mail, Check, X } from 'lucide-react';

export const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');

  // Modal States
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // Form States
  const [newStaff, setNewStaff] = useState<Partial<Staff>>({ status: 'active' });
  const [newRole, setNewRole] = useState<Partial<Role>>({ permissions: [] });

  const ALL_PERMISSIONS = ['view_users', 'manage_users', 'view_transactions', 'manage_staff', 'reply_tickets', 'manage_settings'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setStaff(await MockDB.getStaff());
    setRoles(await MockDB.getRoles());
  };

  const handleAddStaff = async () => {
      if (!newStaff.name || !newStaff.email || !newStaff.roleId) return;
      
      const s: Staff = {
          id: Math.random().toString(36).substr(2, 9),
          name: newStaff.name,
          email: newStaff.email,
          roleId: newStaff.roleId,
          status: newStaff.status as any || 'active'
      };

      await MockDB.addStaff(s);
      setShowStaffModal(false);
      setNewStaff({ status: 'active' });
      loadData();
  };

  const handleDeleteStaff = async (id: string) => {
      if(window.confirm('Remove this staff member?')) {
          await MockDB.deleteStaff(id);
          loadData();
      }
  };

  const handleCreateRole = async () => {
      if (!newRole.name) return;
      
      const r: Role = {
          id: Math.random().toString(36).substr(2, 9),
          name: newRole.name,
          permissions: newRole.permissions || []
      };
      
      await MockDB.addRole(r);
      setShowRoleModal(false);
      setNewRole({ permissions: [] });
      loadData();
  };

  const togglePermission = (perm: string) => {
      const current = newRole.permissions || [];
      if (current.includes(perm)) {
          setNewRole({...newRole, permissions: current.filter(p => p !== perm)});
      } else {
          setNewRole({...newRole, permissions: [...current, perm]});
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Staff & Access Control</h2>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button onClick={() => setActiveTab('staff')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300'}`}>Staff Members</button>
                <button onClick={() => setActiveTab('roles')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'roles' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300'}`}>Roles & Permissions</button>
            </div>
        </div>

        {activeTab === 'staff' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white">Staff Directory</h3>
                    <button 
                        onClick={() => setShowStaffModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-200 dark:shadow-green-900/20 hover:bg-green-800"
                    >
                        <Plus size={16}/> Add Staff
                    </button>
                </div>

                {staff.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <User size={32} className="mx-auto mb-2 opacity-30"/>
                        <p>No staff members created yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {staff.map(s => {
                            const roleName = roles.find(r => r.id === s.roleId)?.name || 'Unknown Role';
                            return (
                                <div key={s.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex justify-between items-center hover:border-green-200 dark:hover:border-green-800 transition-colors bg-gray-50 dark:bg-gray-900">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-bold shadow-sm border border-gray-100 dark:border-gray-700">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{s.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Mail size={10}/> {s.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-[10px] font-bold uppercase">{roleName}</span>
                                        <button onClick={() => handleDeleteStaff(s.id)} className="block ml-auto mt-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'roles' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white">Roles</h3>
                    <button 
                        onClick={() => setShowRoleModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-purple-900/20 hover:bg-purple-800"
                    >
                        <Plus size={16}/> Create Role
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roles.map(role => (
                        <div key={role.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-200 dark:hover:border-purple-800 transition-colors bg-gray-50 dark:bg-gray-900">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-800 dark:text-white">{role.name}</h4>
                                <Shield size={16} className="text-purple-500"/>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.map(p => (
                                    <span key={p} className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700 rounded-md text-[10px] font-mono">{p}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Add Staff Modal */}
        {showStaffModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add New Staff</h3>
                        <button onClick={() => setShowStaffModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    <div className="space-y-4">
                        <input 
                            className="w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            placeholder="Full Name" 
                            value={newStaff.name || ''}
                            onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                        />
                        <input 
                            type="email"
                            className="w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            placeholder="Email Address" 
                            value={newStaff.email || ''}
                            onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                        />
                        <select 
                            className="w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            value={newStaff.roleId || ''}
                            onChange={e => setNewStaff({...newStaff, roleId: e.target.value})}
                        >
                            <option value="" disabled>Select Role</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowStaffModal(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                            <button onClick={handleAddStaff} className="flex-1 py-2 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Add Staff</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Create Role Modal */}
        {showRoleModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Role</h3>
                        <button onClick={() => setShowRoleModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    <div className="space-y-4">
                        <input 
                            className="w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            placeholder="Role Name (e.g., Auditor)" 
                            value={newRole.name || ''}
                            onChange={e => setNewRole({...newRole, name: e.target.value})}
                        />
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Permissions</p>
                            <div className="grid grid-cols-2 gap-2">
                                {ALL_PERMISSIONS.map(perm => (
                                    <label key={perm} className="flex items-center gap-2 p-2 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={newRole.permissions?.includes(perm)}
                                            onChange={() => togglePermission(perm)}
                                            className="accent-purple-600 w-4 h-4"
                                        />
                                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{perm}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowRoleModal(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                            <button onClick={handleCreateRole} className="flex-1 py-2 bg-purple-700 text-white rounded-xl font-bold hover:bg-purple-800">Create Role</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
