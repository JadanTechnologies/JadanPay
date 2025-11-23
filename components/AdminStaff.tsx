import React, { useEffect, useState } from 'react';
import { Staff, Role } from '../types';
import { MockDB } from '../services/mockDb';
import { User, Shield, Lock, Plus, Trash2, Mail, Check } from 'lucide-react';

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
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800">Staff & Access Control</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('staff')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Staff Members</button>
                <button onClick={() => setActiveTab('roles')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'roles' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Roles & Permissions</button>
            </div>
        </div>

        {activeTab === 'staff' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">Staff Directory</h3>
                    <button 
                        onClick={() => setShowStaffModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-800"
                    >
                        <Plus size={16}/> Add Staff
                    </button>
                </div>

                {staff.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <User size={32} className="mx-auto mb-2 opacity-30"/>
                        <p>No staff members created yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {staff.map(s => {
                            const roleName = roles.find(r => r.id === s.roleId)?.name || 'Unknown Role';
                            return (
                                <div key={s.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:border-green-200 transition-colors bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-700 font-bold shadow-sm">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{s.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10}/> {s.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase">{roleName}</span>
                                        <button onClick={() => handleDeleteStaff(s.id)} className="block ml-auto mt-2 text-gray-400 hover:text-red-500">
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
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">Roles</h3>
                    <button 
                        onClick={() => setShowRoleModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-purple-200 hover:bg-purple-800"
                    >
                        <Plus size={16}/> Create Role
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roles.map(role => (
                        <div key={role.id} className="p-4 border border-gray-200 rounded-xl hover:border-purple-200 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-800">{role.name}</h4>
                                <Shield size={16} className="text-purple-500"/>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.map(p => (
                                    <span key={p} className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[10px] font-mono">{p}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Add Staff Modal */}
        {showStaffModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <h3 className="font-bold text-lg mb-4">Add New Staff</h3>
                    <div className="space-y-4">
                        <input 
                            className="w-full p-3 border rounded-xl" 
                            placeholder="Full Name" 
                            value={newStaff.name || ''}
                            onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                        />
                        <input 
                            type="email"
                            className="w-full p-3 border rounded-xl" 
                            placeholder="Email Address" 
                            value={newStaff.email || ''}
                            onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                        />
                        <select 
                            className="w-full p-3 border rounded-xl bg-white"
                            value={newStaff.roleId || ''}
                            onChange={e => setNewStaff({...newStaff, roleId: e.target.value})}
                        >
                            <option value="" disabled>Select Role</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowStaffModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
                            <button onClick={handleAddStaff} className="flex-1 py-2 bg-green-700 text-white rounded-xl font-bold">Add Staff</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Create Role Modal */}
        {showRoleModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <h3 className="font-bold text-lg mb-4">Create New Role</h3>
                    <div className="space-y-4">
                        <input 
                            className="w-full p-3 border rounded-xl" 
                            placeholder="Role Name (e.g., Auditor)" 
                            value={newRole.name || ''}
                            onChange={e => setNewRole({...newRole, name: e.target.value})}
                        />
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Permissions</p>
                            <div className="grid grid-cols-2 gap-2">
                                {ALL_PERMISSIONS.map(perm => (
                                    <label key={perm} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input 
                                            type="checkbox" 
                                            checked={newRole.permissions?.includes(perm)}
                                            onChange={() => togglePermission(perm)}
                                        />
                                        <span className="text-xs font-mono">{perm}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowRoleModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
                            <button onClick={handleCreateRole} className="flex-1 py-2 bg-purple-700 text-white rounded-xl font-bold">Create Role</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};