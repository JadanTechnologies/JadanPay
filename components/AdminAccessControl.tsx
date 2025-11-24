
import React, { useState, useEffect } from 'react';
import { MockDB } from '../services/mockDb';
import { AccessRule } from '../types';
import { ShieldAlert, Plus, Trash2, Globe, Smartphone, Monitor, MapPin, X } from 'lucide-react';

export const AdminAccessControl: React.FC = () => {
  const [rules, setRules] = useState<AccessRule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AccessRule>>({ type: 'ip', isActive: true });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const data = await MockDB.getAccessRules();
    setRules(data);
  };

  const handleAddRule = async () => {
      if (!newRule.value || !newRule.reason) return;

      const rule: AccessRule = {
          id: Math.random().toString(36).substr(2, 9),
          type: newRule.type as any,
          value: newRule.value,
          reason: newRule.reason,
          dateAdded: new Date().toISOString(),
          isActive: true
      };

      await MockDB.addAccessRule(rule);
      setShowModal(false);
      setNewRule({ type: 'ip', isActive: true, value: '', reason: '' });
      loadRules();
  };

  const handleDeleteRule = async (id: string) => {
      if(window.confirm('Delete this restriction?')) {
          await MockDB.deleteAccessRule(id);
          loadRules();
      }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'ip': return <Globe size={18} />;
          case 'device': return <Smartphone size={18} />;
          case 'os': return <Monitor size={18} />;
          case 'country': 
          case 'region': return <MapPin size={18} />;
          default: return <ShieldAlert size={18} />;
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <ShieldAlert size={24} className="text-red-600 dark:text-red-400"/> Access Management
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Restrict access based on IP, Region, Device, or OS.</p>
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-red-900/20"
            >
                <Plus size={18} /> Add Restriction
            </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
            {rules.length === 0 ? (
                <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                    <ShieldAlert size={48} className="mx-auto mb-4 opacity-20"/>
                    <p>No active restrictions found.</p>
                    <p className="text-xs">The platform is open to all users.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-4">Type</th>
                                <th className="p-4">Value / Pattern</th>
                                <th className="p-4">Reason</th>
                                <th className="p-4">Date Added</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {rules.map(rule => (
                                <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 font-bold capitalize">
                                            {getIcon(rule.type)}
                                            {rule.type}
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-xs bg-gray-50 dark:bg-gray-900 rounded-md px-2 py-1 w-fit">
                                        {rule.value}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{rule.reason}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">
                                        {new Date(rule.dateAdded).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDeleteRule(rule.id)}
                                            className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add Access Restriction</h3>
                        <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Restriction Type</label>
                            <select 
                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-red-500"
                                value={newRule.type}
                                onChange={e => setNewRule({...newRule, type: e.target.value as any})}
                            >
                                <option value="ip">IP Address</option>
                                <option value="country">Country Code (e.g., US)</option>
                                <option value="device">Device Type</option>
                                <option value="os">Operating System</option>
                                <option value="region">Region / State</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Value to Block</label>
                            <input 
                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-red-500"
                                placeholder={newRule.type === 'ip' ? '192.168.1.1' : newRule.type === 'country' ? 'US' : 'Value'}
                                value={newRule.value || ''}
                                onChange={e => setNewRule({...newRule, value: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Reason</label>
                            <input 
                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-red-500"
                                placeholder="e.g., Suspicious activity"
                                value={newRule.reason || ''}
                                onChange={e => setNewRule({...newRule, reason: e.target.value})}
                            />
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Cancel</button>
                            <button onClick={handleAddRule} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-red-900/20">Add Block</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
