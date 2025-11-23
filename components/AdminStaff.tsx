import React, { useEffect, useState } from 'react';
import { Staff, Role } from '../types';
import { MockDB } from '../services/mockDb';
import { User, Shield, Lock, Plus } from 'lucide-react';

export const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setStaff(await MockDB.getStaff());
    setRoles(await MockDB.getRoles());
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
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-200">
                        <Plus size={16}/> Add Staff
                    </button>
                </div>

                {staff.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <User size={32} className="mx-auto mb-2 opacity-30"/>
                        <p>No staff members created yet.</p>
                    </div>
                ) : (
                    <div>{/* List would go here */}</div>
                )}
            </div>
        )}

        {activeTab === 'roles' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">Roles</h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-purple-200">
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
    </div>
  );
};