
import React, { useState, useEffect } from 'react';
import { Save, Globe, Server, CreditCard, Database, Plus, Trash2, Edit2, Check, X, Upload, Smartphone, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { Provider, Bundle, PlanType } from '../types';
import { PROVIDER_LOGOS } from '../constants';
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
  const [bundleError, setBundleError] = useState<string | null>(null);
  
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
      setBundleError(null);

      // Basic Validation
      if(!editingBundle.provider || !editingBundle.price || !editingBundle.name) {
          setBundleError("Please provide Provider, Plan Name, and Price.");
          return;
      }
      
      // Strict Plan ID Validation
      if (!editingBundle.planId || editingBundle.planId.trim() === "") {
          setBundleError("API Plan ID is required for transaction processing. Please enter the ID from your provider.");
          return;
      }
      
      const b: Bundle = {
          id: editingBundle.id || Math.random().toString(36).substr(2, 9),
          provider: editingBundle.provider as Provider,
          type: editingBundle.type as PlanType,
          name: editingBundle.name,
          price: Number(editingBundle.price),
          costPrice: Number(editingBundle.costPrice) || Number(editingBundle.price) * 0.9,
          dataAmount: editingBundle.dataAmount || '0GB',
          validity: editingBundle.validity || '30 Days',
          planId: editingBundle.planId,
          isBestValue: editingBundle.isBestValue,
          isAvailable: editingBundle.isAvailable
      };

      await MockDB.saveBundle(b);
      setShowBundleModal(false);
      setEditingBundle({ isAvailable: true, isBestValue: false, type: PlanType.SME });
      setBundleError(null);
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
            Settings
        </h2>
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
            {[
                { id: 'general', label: 'General', icon: Globe },
                { id: 'services', label: 'Services', icon: Server },
                { id: 'payment', label: 'Payments', icon: CreditCard },
                { id: 'backup', label: 'Backup', icon: Database },
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
                      <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Branding & Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">App Name</label>
                              <input 
                                  value={settings.appName}
                                  onChange={e => setSettings({...settings, appName: e.target.value})}
                                  className="w-full p-3 border rounded-xl"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo URL</label>
                              <input 
                                  value={settings.logoUrl}
                                  onChange={e => setSettings({...settings, logoUrl: e.target.value})}
                                  className="w-full p-3 border rounded-xl"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support Email</label>
                              <div className="relative">
                                  <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                                  <input 
                                      value={settings.supportEmail}
                                      onChange={e => setSettings({...settings, supportEmail: e.target.value})}
                                      className="w-full pl-10 p-3 border rounded-xl"
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support Phone</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
                                  <input 
                                      value={settings.supportPhone}
                                      onChange={e => setSettings({...settings, supportPhone: e.target.value})}
                                      className="w-full pl-10 p-3 border rounded-xl"
                                  />
                              </div>
                          </div>
                      </div>

                      <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 pt-4">Landing Page</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hero Title</label>
                              <input 
                                  value={settings.landingHeroTitle}
                                  onChange={e => setSettings({...settings, landingHeroTitle: e.target.value})}
                                  className="w-full p-3 border rounded-xl"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hero Subtitle</label>
                              <textarea 
                                  value={settings.landingHeroSubtitle}
                                  onChange={e => setSettings({...settings, landingHeroSubtitle: e.target.value})}
                                  className="w-full p-3 border rounded-xl h-20"
                              />
                          </div>
                      </div>
                      
                      <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">
                          {isSaving ? 'Saving...' : 'Save General Settings'}
                      </button>
                  </div>
              )}

              {/* --- SERVICES SETTINGS --- */}
              {activeTab === 'services' && (
                  <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Provider Status</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.entries(settings.providerStatus).map(([key, isActive]) => (
                                  <div key={key} className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200 opacity-60'}`} onClick={() => toggleProvider(key)}>
                                      <span className="font-bold">{PROVIDER_LOGOS[key as Provider] || key}</span>
                                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                          {isActive ? 'Online' : 'Offline'}
                                      </span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="font-bold text-gray-800">Data Bundles</h3>
                              <button 
                                  onClick={() => {
                                      setEditingBundle({ isAvailable: true, isBestValue: false, type: PlanType.SME });
                                      setShowBundleModal(true);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-800"
                              >
                                  <Plus size={16}/> Add Bundle
                              </button>
                          </div>
                          
                          <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                  <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                                      <tr>
                                          <th className="p-3">Plan ID</th>
                                          <th className="p-3">Provider</th>
                                          <th className="p-3">Name</th>
                                          <th className="p-3">Type</th>
                                          <th className="p-3">Price</th>
                                          <th className="p-3">Status</th>
                                          <th className="p-3 text-right">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {bundles.map(b => (
                                          <tr key={b.id} className="hover:bg-gray-50">
                                              <td className="p-3 font-mono text-xs">{b.planId}</td>
                                              <td className="p-3">{PROVIDER_LOGOS[b.provider]}</td>
                                              <td className="p-3 font-medium">{b.name}</td>
                                              <td className="p-3 text-xs uppercase">{b.type}</td>
                                              <td className="p-3">₦{b.price}</td>
                                              <td className="p-3">
                                                  {b.isAvailable !== false ? 
                                                      <Check size={16} className="text-green-500"/> : 
                                                      <X size={16} className="text-red-500"/>
                                                  }
                                              </td>
                                              <td className="p-3 text-right flex justify-end gap-2">
                                                  <button onClick={() => { setEditingBundle(b); setShowBundleModal(true); }} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={16}/></button>
                                                  <button onClick={() => handleBundleDelete(b.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- PAYMENT SETTINGS --- */}
              {activeTab === 'payment' && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                       <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Manual Funding (Bank Transfer)</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                               <input 
                                  value={settings.bankName}
                                  onChange={e => setSettings({...settings, bankName: e.target.value})}
                                  className="w-full p-3 border rounded-xl"
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                               <input 
                                  value={settings.accountNumber}
                                  onChange={e => setSettings({...settings, accountNumber: e.target.value})}
                                  className="w-full p-3 border rounded-xl"
                               />
                           </div>
                            <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Name</label>
                               <input 
                                  value={settings.accountName}
                                  onChange={e => setSettings({...settings, accountName: e.target.value})}
                                  className="w-full p-3 border rounded-xl"
                               />
                           </div>
                       </div>

                       <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 pt-4">Referral System</h3>
                       <div className="flex items-center gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={settings.enableReferral}
                                    onChange={e => setSettings({...settings, enableReferral: e.target.checked})}
                                    className="w-5 h-5 accent-green-600"
                                />
                                <span className="font-medium">Enable Referral Bonus</span>
                            </label>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bonus Amount (₦)</label>
                           <input 
                              type="number"
                              value={settings.referralReward}
                              onChange={e => setSettings({...settings, referralReward: Number(e.target.value)})}
                              className="w-full max-w-xs p-3 border rounded-xl"
                           />
                       </div>

                       <button onClick={handleSave} disabled={isSaving} className="mt-4 px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">
                          {isSaving ? 'Saving...' : 'Save Payment Settings'}
                      </button>
                  </div>
              )}

              {/* --- BACKUP SETTINGS --- */}
              {activeTab === 'backup' && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">System Backup</h3>
                      <p className="text-gray-500 text-sm">Download a full JSON dump of your database (Users, Transactions, Settings, etc). Useful for migrating or data safety.</p>
                      
                      <div className="flex gap-4">
                          <button onClick={handleBackupDownload} className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black">
                              <Database size={20} /> Download Backup
                          </button>
                      </div>

                      <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 pt-4">Restore Database</h3>
                      <p className="text-red-500 text-sm mb-4">Warning: This will overwrite all current data!</p>
                      
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 relative">
                          <input type="file" onChange={handleRestore} accept=".json" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                          <div className="flex flex-col items-center text-gray-400">
                              <Upload size={32} className="mb-2"/>
                              <span>Click to Upload Backup JSON</span>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* Quick Stats Sidebar */}
          <div className="lg:col-span-1 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800">
                  <h4 className="font-bold flex items-center gap-2 mb-2"><Server size={18}/> Status</h4>
                  <p className="text-sm">System is running optimally.</p>
                  <p className="text-xs mt-2 opacity-70">Version: 1.0.0</p>
              </div>
          </div>
      </div>

      {/* Bundle Modal */}
      {showBundleModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">{editingBundle.id ? 'Edit Bundle' : 'Add New Bundle'}</h3>
                      <button onClick={() => setShowBundleModal(false)}><X size={20} className="text-gray-400"/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Provider</label>
                              <select 
                                  className="w-full p-3 border rounded-xl bg-white"
                                  value={editingBundle.provider}
                                  onChange={e => setEditingBundle({...editingBundle, provider: e.target.value as Provider})}
                              >
                                  <option value="">Select...</option>
                                  {Object.values(Provider).map(p => (
                                      <option key={p} value={p}>{PROVIDER_LOGOS[p]}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                              <select 
                                  className="w-full p-3 border rounded-xl bg-white"
                                  value={editingBundle.type}
                                  onChange={e => setEditingBundle({...editingBundle, type: e.target.value as PlanType})}
                              >
                                  <option value={PlanType.SME}>SME</option>
                                  <option value={PlanType.GIFTING}>Gifting</option>
                                  <option value={PlanType.CORPORATE}>Corporate</option>
                              </select>
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plan Name</label>
                          <input 
                              className="w-full p-3 border rounded-xl"
                              placeholder="e.g. 1.5GB Monthly"
                              value={editingBundle.name || ''}
                              onChange={e => setEditingBundle({...editingBundle, name: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (₦)</label>
                              <input 
                                  type="number"
                                  className="w-full p-3 border rounded-xl"
                                  placeholder="1000"
                                  value={editingBundle.price || ''}
                                  onChange={e => setEditingBundle({...editingBundle, price: Number(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price (₦)</label>
                              <input 
                                  type="number"
                                  className="w-full p-3 border rounded-xl"
                                  placeholder="950"
                                  value={editingBundle.costPrice || ''}
                                  onChange={e => setEditingBundle({...editingBundle, costPrice: Number(e.target.value)})}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Amount</label>
                              <input 
                                  className="w-full p-3 border rounded-xl"
                                  placeholder="1.5GB"
                                  value={editingBundle.dataAmount || ''}
                                  onChange={e => setEditingBundle({...editingBundle, dataAmount: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Validity</label>
                              <input 
                                  className="w-full p-3 border rounded-xl"
                                  placeholder="30 Days"
                                  value={editingBundle.validity || ''}
                                  onChange={e => setEditingBundle({...editingBundle, validity: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-800 uppercase mb-1 flex items-center gap-2">
                              API Plan ID <span className="text-red-500">*</span>
                          </label>
                          <input 
                              className={`w-full p-3 border rounded-xl font-mono ${bundleError ? 'border-red-500 bg-red-50' : ''}`}
                              placeholder="Required for automation"
                              value={editingBundle.planId || ''}
                              onChange={e => setEditingBundle({...editingBundle, planId: e.target.value})}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">This ID must match the plan ID from your API provider.</p>
                      </div>

                      <div className="flex gap-4 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox"
                                  checked={editingBundle.isAvailable}
                                  onChange={e => setEditingBundle({...editingBundle, isAvailable: e.target.checked})}
                                  className="w-5 h-5 accent-green-600"
                              />
                              <span className="text-sm font-medium">Available</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox"
                                  checked={editingBundle.isBestValue}
                                  onChange={e => setEditingBundle({...editingBundle, isBestValue: e.target.checked})}
                                  className="w-5 h-5 accent-yellow-500"
                              />
                              <span className="text-sm font-medium">Best Value Tag</span>
                          </label>
                      </div>
                      
                      {bundleError && (
                          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                              <AlertTriangle size={16}/> {bundleError}
                          </div>
                      )}

                      <div className="flex gap-3 mt-4">
                          <button onClick={() => setShowBundleModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
                          <button onClick={handleBundleSave} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save Bundle</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
