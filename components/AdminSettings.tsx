
import React, { useState, useEffect } from 'react';
import { Save, Globe, Smartphone, Building, Mail, Phone, ShieldAlert, CreditCard, Bell, Clock, FileText, Upload, Link as LinkIcon, Server, Database, Plus, Trash2, Edit2, Check, X, HardDrive, Download, RefreshCcw, Gift, LayoutTemplate, Activity, Share2, ImageIcon, Lock } from 'lucide-react';
import { Provider, Bundle, PlanType } from '../types';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '../constants';
import { SettingsService, AppSettings } from '../services/settingsService';
import { MockDB } from '../services/mockDb';

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'services' | 'payment' | 'backup'>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Bundle Modal State
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Partial<Bundle>>({ isAvailable: true, isBestValue: false, type: PlanType.SME });
  
  useEffect(() => {
    loadSettings();
    loadBundles();
  }, []);

  const loadSettings = async () => {
    const data = await SettingsService.getSettings();
    setSettings(data);
  };

  const loadBundles = async () => {
      const data = await MockDB.getBundles();
      setBundles(data);
  };

  const handleSave = async () => {
    if (!settings) return;

    // Validation: Support Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.supportEmail && !emailRegex.test(settings.supportEmail)) {
        alert("Please enter a valid Support Email address.");
        return;
    }

    setIsSaving(true);
    try {
        await SettingsService.updateSettings(settings);
        alert("Settings updated successfully!");
    } catch (e) {
        alert("Failed to save settings");
    } finally {
        setIsSaving(false);
    }
  };

  const toggleProvider = (key: string) => {
      if(!settings) return;
      setSettings({
          ...settings,
          providerStatus: {
              ...settings.providerStatus,
              [key]: !settings.providerStatus[key]
          }
      });
  };

  const handleBundleSave = async () => {
      if(!editingBundle.provider || !editingBundle.price || !editingBundle.name) return;
      
      const b: Bundle = {
          id: editingBundle.id || Math.random().toString(36).substr(2, 9),
          provider: editingBundle.provider as Provider,
          type: editingBundle.type as PlanType,
          name: editingBundle.name,
          price: Number(editingBundle.price),
          costPrice: Number(editingBundle.costPrice) || Number(editingBundle.price) * 0.9,
          dataAmount: editingBundle.dataAmount || '0GB',
          validity: editingBundle.validity || '30 Days',
          planId: editingBundle.planId || '000',
          isBestValue: editingBundle.isBestValue,
          isAvailable: editingBundle.isAvailable
      };

      await MockDB.saveBundle(b);
      setShowBundleModal(false);
      setEditingBundle({ isAvailable: true, isBestValue: false, type: PlanType.SME });
      loadBundles();
  };

  const handleBundleDelete = async (id: string) => {
      if(window.confirm('Delete this bundle?')) {
          await MockDB.deleteBundle(id);
          loadBundles();
      }
  };

  const handleBackupDownload = async () => {
      const dump = await MockDB.getDatabaseDump();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dump));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `jadanpay_backup_${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = async (event) => {
              try {
                  const dump = JSON.parse(event.target?.result as string);
                  await MockDB.restoreDatabase(dump);
                  alert("Database restored successfully! Reloading...");
                  window.location.reload();
              } catch(err) {
                  alert("Invalid Backup File");
              }
          };
          reader.readAsText(e.target.files[0]);
      }
  };

  if (!settings) return <div className="p-10 text-center">Loading Settings...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutTemplate size={24} className="text-gray-600"/> Platform Settings
        </h2>
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
            {[
                { id: 'general', label: 'General', icon: Globe },
                { id: 'services', label: 'Services & Bundles', icon: Server },
                { id: 'payment', label: 'Payments', icon: CreditCard },
                { id: 'backup', label: 'System Backup', icon: Database },
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-white shadow text-green-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <tab.icon size={16}/> {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
              
              {/* --- GENERAL SETTINGS --- */}
              {activeTab === 'general' && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">Branding & Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">App Name</label>
                              <input 
                                className="w-full p-3 border rounded-xl"
                                value={settings.appName}
                                onChange={e => setSettings({...settings, appName: e.target.value})}
                              />
                          </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Support Email</label>
                              <input 
                                className="w-full p-3 border rounded-xl"
                                value={settings.supportEmail}
                                onChange={e => setSettings({...settings, supportEmail: e.target.value})}
                              />
                          </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Support Phone</label>
                              <input 
                                className="w-full p-3 border rounded-xl"
                                value={settings.supportPhone}
                                onChange={e => setSettings({...settings, supportPhone: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Logo URL</label>
                              <div className="flex gap-2">
                                <input 
                                    className="w-full p-3 border rounded-xl"
                                    value={settings.logoUrl}
                                    onChange={e => setSettings({...settings, logoUrl: e.target.value})}
                                />
                                {settings.logoUrl && <img src={settings.logoUrl} className="w-10 h-10 object-contain rounded border" alt="preview" />}
                              </div>
                          </div>
                      </div>

                      <div className="border-t border-gray-100 pt-6">
                          <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Referral System</h3>
                          <div className="flex items-center justify-between mb-4">
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.enableReferral ? 'bg-green-600' : 'bg-gray-200'}`}>
                                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enableReferral ? 'translate-x-6' : ''}`}></div>
                                  </div>
                                  <span className="font-medium text-sm">Enable Referral System</span>
                              </label>
                              <div className="w-32">
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Bonus Amount (₦)</label>
                                  <input 
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={settings.referralReward}
                                    onChange={e => setSettings({...settings, referralReward: Number(e.target.value)})}
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- SERVICES SETTINGS --- */}
              {activeTab === 'services' && (
                  <div className="space-y-6">
                      {/* Provider Toggles */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Provider Availability</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.keys(settings.providerStatus).map(provider => (
                                  <div key={provider} className="p-4 border rounded-xl flex flex-col items-center gap-3">
                                      <span className={`font-bold ${settings.providerStatus[provider] ? 'text-gray-800' : 'text-gray-400'}`}>{provider}</span>
                                      <label className="cursor-pointer">
                                          <input type="checkbox" className="hidden" checked={settings.providerStatus[provider]} onChange={() => toggleProvider(provider)} />
                                          <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.providerStatus[provider] ? 'bg-green-600' : 'bg-gray-200'}`}>
                                              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.providerStatus[provider] ? 'translate-x-5' : ''}`}></div>
                                          </div>
                                      </label>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Bundle Management */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="font-bold text-gray-800">Data Bundles</h3>
                              <button 
                                onClick={() => { setEditingBundle({ isAvailable: true, isBestValue: false, type: PlanType.SME }); setShowBundleModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800"
                              >
                                  <Plus size={16}/> Add Bundle
                              </button>
                          </div>

                          <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                  <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                                      <tr>
                                          <th className="p-3">Provider</th>
                                          <th className="p-3">Plan Name</th>
                                          <th className="p-3">Plan ID</th>
                                          <th className="p-3">Type</th>
                                          <th className="p-3">Cost</th>
                                          <th className="p-3">Price</th>
                                          <th className="p-3">Status</th>
                                          <th className="p-3 text-right">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {bundles.map(b => (
                                          <tr key={b.id} className="hover:bg-gray-50">
                                              <td className="p-3 font-bold">{b.provider}</td>
                                              <td className="p-3">{b.name}</td>
                                              <td className="p-3 font-mono text-gray-400">{b.planId}</td>
                                              <td className="p-3">{b.type}</td>
                                              <td className="p-3 text-red-600">₦{b.costPrice.toLocaleString()}</td>
                                              <td className="p-3 text-green-600 font-bold">₦{b.price.toLocaleString()}</td>
                                              <td className="p-3">
                                                  {b.isAvailable ? (
                                                      <span className="text-green-600 flex items-center gap-1"><Check size={12}/> Active</span>
                                                  ) : (
                                                      <span className="text-red-400 flex items-center gap-1"><X size={12}/> Inactive</span>
                                                  )}
                                              </td>
                                              <td className="p-3 text-right flex justify-end gap-2">
                                                  <button onClick={() => { setEditingBundle(b); setShowBundleModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={14}/></button>
                                                  <button onClick={() => handleBundleDelete(b.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- PAYMENTS SETTINGS --- */}
              {activeTab === 'payment' && (
                  <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                           <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                               <Building size={18}/> Manual Funding Account
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Bank Name</label>
                                  <input 
                                    className="w-full p-3 border rounded-xl"
                                    value={settings.bankName}
                                    onChange={e => setSettings({...settings, bankName: e.target.value})}
                                  />
                              </div>
                               <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Account Number</label>
                                  <input 
                                    className="w-full p-3 border rounded-xl font-mono"
                                    value={settings.accountNumber}
                                    onChange={e => setSettings({...settings, accountNumber: e.target.value})}
                                  />
                              </div>
                               <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Account Name</label>
                                  <input 
                                    className="w-full p-3 border rounded-xl"
                                    value={settings.accountName}
                                    onChange={e => setSettings({...settings, accountName: e.target.value})}
                                  />
                              </div>
                           </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                           <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                               <CreditCard size={18}/> Paystack Configuration
                           </h3>
                           <div className="mb-4">
                               <label className="flex items-center gap-3 cursor-pointer">
                                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.enablePaystack ? 'bg-green-600' : 'bg-gray-200'}`}>
                                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enablePaystack ? 'translate-x-6' : ''}`}></div>
                                  </div>
                                  <span className="font-medium text-sm">Enable Paystack Payments</span>
                              </label>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Public Key</label>
                                  <input 
                                    className="w-full p-3 border rounded-xl font-mono text-xs"
                                    value={settings.paystackPublicKey}
                                    onChange={e => setSettings({...settings, paystackPublicKey: e.target.value})}
                                    type="password"
                                  />
                              </div>
                               <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Secret Key</label>
                                  <input 
                                    className="w-full p-3 border rounded-xl font-mono text-xs"
                                    value={settings.paystackSecretKey}
                                    onChange={e => setSettings({...settings, paystackSecretKey: e.target.value})}
                                    type="password"
                                  />
                              </div>
                           </div>
                      </div>
                  </div>
              )}

               {/* --- BACKUP SETTINGS --- */}
               {activeTab === 'backup' && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                      <div className="flex items-start gap-4 p-4 bg-blue-50 text-blue-800 rounded-xl">
                          <Database size={24} className="mt-1"/>
                          <div>
                              <h4 className="font-bold">Database Management</h4>
                              <p className="text-sm opacity-80">Download a full JSON dump of your users, transactions, and settings. You can restore this file later if needed.</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="border border-gray-200 rounded-xl p-6 text-center">
                              <Download size={32} className="mx-auto text-green-600 mb-3"/>
                              <h4 className="font-bold text-gray-800 mb-1">Export Data</h4>
                              <p className="text-xs text-gray-500 mb-4">Save current state to a local file.</p>
                              <button onClick={handleBackupDownload} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700">Download Backup</button>
                          </div>

                           <div className="border border-gray-200 rounded-xl p-6 text-center relative">
                              <Upload size={32} className="mx-auto text-purple-600 mb-3"/>
                              <h4 className="font-bold text-gray-800 mb-1">Restore Data</h4>
                              <p className="text-xs text-gray-500 mb-4">Overwrite current DB with backup file.</p>
                              <div className="relative inline-block">
                                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700">Select Backup File</button>
                                  <input type="file" onChange={handleRestore} accept=".json" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              </div>
                          </div>
                      </div>
                  </div>
              )}

          </div>

          {/* Sidebar / Actions */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
                  <h3 className="font-bold text-gray-800 mb-4">Actions</h3>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-3 bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-800 flex items-center justify-center gap-2 mb-3 disabled:opacity-70"
                  >
                      {isSaving ? 'Saving...' : <><Save size={18}/> Save Changes</>}
                  </button>
                  <button className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 flex items-center justify-center gap-2">
                      <RefreshCcw size={18}/> Discard
                  </button>

                  <div className="mt-8 pt-8 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-red-500 mb-2">
                          <ShieldAlert size={18}/>
                          <span className="font-bold text-sm">Danger Zone</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">Enable maintenance mode to prevent user logins during updates.</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-5' : ''}`}></div>
                          </div>
                          <span className="font-medium text-xs text-gray-600">Maintenance Mode</span>
                      </label>
                  </div>
              </div>
          </div>
      </div>

      {/* Bundle Modal */}
      {showBundleModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-lg mb-4">{editingBundle.id ? 'Edit Bundle' : 'New Bundle'}</h3>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Provider</label>
                              <select 
                                className="w-full p-3 border rounded-xl bg-white"
                                value={editingBundle.provider}
                                onChange={e => setEditingBundle({...editingBundle, provider: e.target.value as any})}
                              >
                                  <option value="">Select</option>
                                  <option value="MTN">MTN</option>
                                  <option value="GLO">Glo</option>
                                  <option value="AIRTEL">Airtel</option>
                                  <option value="9MOBILE">9mobile</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Plan Type</label>
                              <select 
                                className="w-full p-3 border rounded-xl bg-white"
                                value={editingBundle.type}
                                onChange={e => setEditingBundle({...editingBundle, type: e.target.value as any})}
                              >
                                  <option value="SME">SME</option>
                                  <option value="GIFTING">Gifting</option>
                                  <option value="CORPORATE">Corporate</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Display Name</label>
                          <input 
                            className="w-full p-3 border rounded-xl"
                            placeholder="e.g. 1.5GB Monthly"
                            value={editingBundle.name}
                            onChange={e => setEditingBundle({...editingBundle, name: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Price (₦)</label>
                              <input 
                                type="number"
                                className="w-full p-3 border rounded-xl"
                                value={editingBundle.price}
                                onChange={e => setEditingBundle({...editingBundle, price: Number(e.target.value)})}
                              />
                          </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Cost Price (₦)</label>
                              <input 
                                type="number"
                                className="w-full p-3 border rounded-xl"
                                value={editingBundle.costPrice}
                                onChange={e => setEditingBundle({...editingBundle, costPrice: Number(e.target.value)})}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Data Amount</label>
                              <input 
                                className="w-full p-3 border rounded-xl"
                                placeholder="e.g. 1.5GB"
                                value={editingBundle.dataAmount}
                                onChange={e => setEditingBundle({...editingBundle, dataAmount: e.target.value})}
                              />
                          </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Validity</label>
                              <input 
                                className="w-full p-3 border rounded-xl"
                                placeholder="e.g. 30 Days"
                                value={editingBundle.validity}
                                onChange={e => setEditingBundle({...editingBundle, validity: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">API Plan ID</label>
                          <input 
                            className="w-full p-3 border rounded-xl font-mono"
                            placeholder="Provider ID"
                            value={editingBundle.planId}
                            onChange={e => setEditingBundle({...editingBundle, planId: e.target.value})}
                          />
                      </div>

                      <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={editingBundle.isAvailable} onChange={e => setEditingBundle({...editingBundle, isAvailable: e.target.checked})} />
                              <span className="text-sm">Available for purchase</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={editingBundle.isBestValue} onChange={e => setEditingBundle({...editingBundle, isBestValue: e.target.checked})} />
                              <span className="text-sm">Mark as "Best Value"</span>
                          </label>
                      </div>

                      <div className="flex gap-3 mt-4">
                          <button onClick={() => setShowBundleModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
                          <button onClick={handleBundleSave} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold">Save Bundle</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
