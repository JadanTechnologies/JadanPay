
import React, { useState, useEffect } from 'react';
import { Save, Globe, Server, CreditCard, Database, Plus, Trash2, Edit2, Check, X, Upload, Mail, Phone, AlertTriangle, Key, Users, Trophy, Gift, MessageSquare, Bell, Send, Smartphone, Activity, Link as LinkIcon, Download, Wifi, Clock, Play, Pause, Lock, DollarSign, Image as ImageIcon, Shield } from 'lucide-react';
import { Provider, Bundle, PlanType, User, CronJob } from '../types';
import { PROVIDER_LOGOS } from '../constants';
import { SettingsService, AppSettings, ApiVendor, EmailProvider, PushProvider } from '../services/settingsService';
import { MockDB } from '../services/mockDb';
import { NotificationService } from '../services/notificationService';

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'services' | 'api' | 'payment' | 'referrals' | 'backup' | 'app' | 'health' | 'automation'>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [topReferrers, setTopReferrers] = useState<User[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Bundle Modal State
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Partial<Bundle>>({ isAvailable: true, isBestValue: false, type: PlanType.SME });
  const [bundleError, setBundleError] = useState<string | null>(null);
  
  useEffect(() => {
    loadSettings();
    loadBundles();
    loadCronJobs();
  }, []);

  useEffect(() => {
      if (activeTab === 'referrals') {
          loadTopReferrers();
      }
  }, [activeTab]);

  const loadSettings = async () => {
    const data = await SettingsService.getSettings();
    setSettings(data);
  };

  const loadBundles = async () => {
      const data = await MockDB.getBundles();
      setBundles(data);
  };

  const loadTopReferrers = async () => {
      const data = await MockDB.getTopReferrers();
      setTopReferrers(data);
  };

  const loadCronJobs = async () => {
      const data = await MockDB.getCronJobs();
      setCronJobs(data);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
        await SettingsService.updateSettings(settings);
        alert("Settings saved successfully!");
    } catch (e) {
        alert("Failed to save settings");
    } finally {
        setIsSaving(false);
    }
  };

  const handleTestPush = async () => {
        if(!settings) return;
        setIsSaving(true);
        try {
            await NotificationService.sendPush('test', 'Test Notification', 'This is a test message.');
            alert("Test notification sent!");
        } catch(e) {
            alert("Failed to send test.");
        } finally {
            setIsSaving(false);
        }
    };

  const toggleCron = async (id: string) => {
      await MockDB.toggleCronJob(id);
      loadCronJobs();
  };

  const toggleProvider = (provider: string) => {
      if (!settings) return;
      const newStatus = { ...settings.providerStatus };
      newStatus[provider] = !newStatus[provider];
      setSettings({ ...settings, providerStatus: newStatus });
  };

  const updateNetworkId = (provider: string, id: string) => {
      if (!settings) return;
      const newIds = { ...settings.providerNetworkIds };
      newIds[provider] = id;
      setSettings({ ...settings, providerNetworkIds: newIds });
  };

  const handleBundleSave = async () => {
      setBundleError(null);
      if(!editingBundle.provider || !editingBundle.price || !editingBundle.name) {
          setBundleError("Missing required fields.");
          return;
      }
      if (!editingBundle.planId || editingBundle.planId.trim() === "") {
          setBundleError("API Plan ID is required.");
          return;
      }
      
      const b: Bundle = {
          id: editingBundle.id || Math.random().toString(36).substr(2, 9),
          provider: editingBundle.provider as Provider,
          type: editingBundle.type as PlanType,
          name: editingBundle.name,
          price: Number(editingBundle.price),
          resellerPrice: Number(editingBundle.resellerPrice) || Number(editingBundle.price),
          costPrice: Number(editingBundle.costPrice) || Number(editingBundle.price) * 0.9,
          dataAmount: editingBundle.dataAmount || '0GB',
          validity: editingBundle.validity || '30 Days',
          planId: editingBundle.planId,
          isBestValue: editingBundle.isBestValue,
          isAvailable: editingBundle.isAvailable
      };

      await MockDB.saveBundle(b);
      setShowBundleModal(false);
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
      const n = document.createElement('a'); n.setAttribute("href", dataStr); n.setAttribute("download", "backup.json"); document.body.appendChild(n); n.click(); n.remove();
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files?.[0]) {
          const reader = new FileReader();
          reader.onload = async (ev) => {
              try {
                  await MockDB.restoreDatabase(JSON.parse(ev.target?.result as string));
                  alert("Restored successfully! Reloading...");
                  window.location.reload();
              } catch(err) { alert("Invalid Backup File"); }
          };
          reader.readAsText(e.target.files[0]);
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0] && settings) {
          const reader = new FileReader();
          reader.onload = (ev) => setSettings({...settings, logoUrl: ev.target?.result as string});
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0] && settings) {
          const reader = new FileReader();
          reader.onload = (ev) => setSettings({...settings, faviconUrl: ev.target?.result as string});
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  if (!settings) return <div className="p-10 text-center dark:text-white">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">Settings</h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
            {[
                { id: 'general', label: 'General', icon: Globe },
                { id: 'services', label: 'Services', icon: Server },
                { id: 'api', label: 'Integrations', icon: Key },
                { id: 'payment', label: 'Payments', icon: CreditCard },
                { id: 'referrals', label: 'Referrals', icon: Users },
                { id: 'backup', label: 'Backup', icon: Database },
                { id: 'automation', label: 'Automation', icon: Clock },
                { id: 'app', label: 'App', icon: Smartphone },
                { id: 'health', label: 'Health', icon: Activity },
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-600 shadow text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'}`}>
                    <tab.icon size={16}/> {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
              
              {/* --- GENERAL TAB --- */}
              {activeTab === 'general' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 dark:text-white border-b dark:border-gray-800 pb-2">Branding & Identity</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Logo Upload</label>
                              <div className="flex items-center gap-4">
                                  {settings.logoUrl && <img src={settings.logoUrl} className="w-12 h-12 object-contain bg-gray-100 rounded-lg p-1" />}
                                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 border dark:border-gray-600">
                                      <ImageIcon size={16} className="text-gray-600 dark:text-gray-300"/> <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Choose File</span>
                                      <input type="file" hidden accept="image/*" onChange={handleLogoUpload}/>
                                  </label>
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Favicon Upload</label>
                              <div className="flex items-center gap-4">
                                  {settings.faviconUrl && <img src={settings.faviconUrl} className="w-8 h-8 object-contain" />}
                                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 border dark:border-gray-600">
                                      <Upload size={16} className="text-gray-600 dark:text-gray-300"/> <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Choose File</span>
                                      <input type="file" hidden accept="image/*" onChange={handleFaviconUpload}/>
                                  </label>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">App Name</label>
                              <input className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white" value={settings.appName} onChange={e => setSettings({...settings, appName: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Support Email</label>
                              <input className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white" value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} />
                          </div>
                      </div>
                      <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                  </div>
              )}

              {/* --- SERVICES TAB --- */}
              {activeTab === 'services' && (
                  <div className="space-y-6">
                      {/* Provider Configuration */}
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Provider Configuration</h3>
                          <div className="grid grid-cols-1 gap-4">
                              {['MTN', 'GLO', 'AIRTEL', 'NMOBILE'].map(p => (
                                  <div key={p} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-3 h-3 rounded-full ${settings.providerStatus[p] ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                          <span className="font-bold text-sm text-gray-700 dark:text-white">{p}</span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <div className="flex flex-col">
                                              <label className="text-[9px] uppercase font-bold text-gray-400">Network ID</label>
                                              <input 
                                                  className="w-20 p-1 text-xs font-mono border dark:border-gray-600 rounded bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-center"
                                                  value={settings.providerNetworkIds?.[p] || ''}
                                                  onChange={(e) => updateNetworkId(p, e.target.value)}
                                              />
                                          </div>
                                          <label className="relative inline-flex items-center cursor-pointer">
                                              <input type="checkbox" className="sr-only peer" checked={settings.providerStatus[p]} onChange={() => toggleProvider(p)} />
                                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                          </label>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Pricing Rules */}
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Global Service Pricing</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Airtime Cost %</label>
                                  <input type="number" className="w-full mt-1 bg-transparent font-bold text-gray-900 dark:text-white outline-none" value={settings.servicePricing?.airtimeCostPercentage} onChange={e => setSettings({...settings, servicePricing: {...settings.servicePricing, airtimeCostPercentage: Number(e.target.value)}})} />
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Airtime Selling %</label>
                                  <input type="number" className="w-full mt-1 bg-transparent font-bold text-gray-900 dark:text-white outline-none" value={settings.servicePricing?.airtimeSellingPercentage} onChange={e => setSettings({...settings, servicePricing: {...settings.servicePricing, airtimeSellingPercentage: Number(e.target.value)}})} />
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Bill Service Fee (₦)</label>
                                  <input type="number" className="w-full mt-1 bg-transparent font-bold text-gray-900 dark:text-white outline-none" value={settings.servicePricing?.billServiceFee} onChange={e => setSettings({...settings, servicePricing: {...settings.servicePricing, billServiceFee: Number(e.target.value)}})} />
                              </div>
                          </div>
                      </div>

                      {/* Bundles */}
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-gray-800 dark:text-white">Data Bundles</h3>
                              <button onClick={() => { setEditingBundle({isAvailable: true, type: PlanType.SME}); setShowBundleModal(true); }} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold flex gap-1 items-center hover:bg-green-700"><Plus size={14}/> Add</button>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
                                  <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold">
                                      <tr><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">User Price</th><th className="p-3">Reseller Price</th><th className="p-3">Action</th></tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {bundles.map(b => (
                                          <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                              <td className="p-3 font-mono">{b.planId}</td>
                                              <td className="p-3 font-bold text-gray-800 dark:text-white">{b.name} <span className="text-[10px] text-gray-400">({b.provider})</span></td>
                                              <td className="p-3">₦{b.price}</td>
                                              <td className="p-3">₦{b.resellerPrice}</td>
                                              <td className="p-3 flex gap-2">
                                                  <button onClick={() => { setEditingBundle(b); setShowBundleModal(true); }} className="text-blue-500 hover:text-blue-600"><Edit2 size={14}/></button>
                                                  <button onClick={async () => { if(window.confirm('Delete?')) { await MockDB.deleteBundle(b.id); loadBundles(); }}} className="text-red-500 hover:text-red-600"><Trash2 size={14}/></button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                      <button onClick={handleSave} className="w-full px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save Services</button>
                  </div>
              )}

              {/* --- API INTEGRATIONS TAB --- */}
              {activeTab === 'api' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-8">
                      {/* Vendor Config */}
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">VTU Vendor Configuration</h3>
                          <div className="mb-4">
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Active Vendor</label>
                              <select 
                                  className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
                                  value={settings.activeApiVendor}
                                  onChange={e => setSettings({...settings, activeApiVendor: e.target.value as ApiVendor})}
                              >
                                  <option value="BILALSADA">BilalSadaSub</option>
                                  <option value="MASKAWA">MaskawaSub</option>
                                  <option value="ALRAHUZ">AlrahuzData</option>
                                  <option value="ABBAPHANTAMI">AbbaPhantami</option>
                                  <option value="SIMHOST">SimHosting</option>
                              </select>
                          </div>

                          <div className="grid grid-cols-1 gap-6">
                              {['BILALSADA', 'MASKAWA', 'ALRAHUZ', 'ABBAPHANTAMI', 'SIMHOST'].map((vendor) => {
                                  const v = vendor as ApiVendor;
                                  const isActive = settings.activeApiVendor === v;
                                  return (
                                      <div key={v} className={`p-4 rounded-xl border transition-all ${isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-80'}`}>
                                          <div className="flex justify-between items-center mb-2">
                                              <h4 className="font-bold text-sm text-gray-800 dark:text-white">{v}</h4>
                                              {isActive && <span className="text-xs font-bold bg-green-600 text-white px-2 py-0.5 rounded">ACTIVE</span>}
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">API Token</label>
                                                  <input 
                                                      type="password"
                                                      className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                                                      value={settings.apiKeys[v] || ''}
                                                      onChange={e => setSettings({...settings, apiKeys: { ...settings.apiKeys, [v]: e.target.value }})}
                                                      placeholder="Enter API Key"
                                                  />
                                              </div>
                                              <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Base URL</label>
                                                  <input 
                                                      className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                                                      value={settings.apiBaseUrls?.[v] || ''}
                                                      onChange={e => setSettings({...settings, apiBaseUrls: { ...settings.apiBaseUrls, [v]: e.target.value }})}
                                                      placeholder="https://api.vendor.com/v1"
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </section>

                      {/* Payment Gateways */}
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Payment Gateways</h3>
                          <div className="space-y-4">
                              {/* Paystack */}
                              <div className="p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl">
                                  <label className="flex items-center gap-2 mb-2 font-bold text-blue-600">
                                      <input type="checkbox" checked={settings.enablePaystack} onChange={e => setSettings({...settings, enablePaystack: e.target.checked})} className="w-4 h-4 rounded border-gray-300"/> Paystack
                                  </label>
                                  {settings.enablePaystack && (
                                      <div className="grid grid-cols-2 gap-2">
                                          <input placeholder="Public Key" className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white" value={settings.paystackPublicKey} onChange={e => setSettings({...settings, paystackPublicKey: e.target.value})} />
                                          <input placeholder="Secret Key" type="password" className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white" value={settings.paystackSecretKey} onChange={e => setSettings({...settings, paystackSecretKey: e.target.value})} />
                                      </div>
                                  )}
                              </div>
                              
                              {/* Flutterwave */}
                              <div className="p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl">
                                  <label className="flex items-center gap-2 mb-2 font-bold text-orange-600">
                                      <input type="checkbox" checked={settings.enableFlutterwave} onChange={e => setSettings({...settings, enableFlutterwave: e.target.checked})} className="w-4 h-4 rounded border-gray-300"/> Flutterwave
                                  </label>
                                  {settings.enableFlutterwave && (
                                      <div className="grid grid-cols-2 gap-2">
                                          <input placeholder="Public Key" className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white" value={settings.flutterwavePublicKey} onChange={e => setSettings({...settings, flutterwavePublicKey: e.target.value})} />
                                          <input placeholder="Secret Key" type="password" className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white" value={settings.flutterwaveSecretKey} onChange={e => setSettings({...settings, flutterwaveSecretKey: e.target.value})} />
                                      </div>
                                  )}
                              </div>
                          </div>
                      </section>

                      {/* Notifications */}
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Notifications</h3>
                          <div className="space-y-4">
                              {/* SMS */}
                              <div className="p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl">
                                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                      <input type="checkbox" checked={settings.enableTwilio} onChange={e => setSettings({...settings, enableTwilio: e.target.checked})} className="w-4 h-4 rounded border-gray-300"/>
                                      <span className="font-bold text-sm text-gray-800 dark:text-white">Twilio SMS</span>
                                  </label>
                                  {settings.enableTwilio && (
                                      <div className="space-y-3">
                                          <input placeholder="Account SID" className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs" value={settings.twilioAccountSid} onChange={e => setSettings({...settings, twilioAccountSid: e.target.value})} />
                                          <input placeholder="Auth Token" type="password" className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs" value={settings.twilioAuthToken} onChange={e => setSettings({...settings, twilioAuthToken: e.target.value})} />
                                          <input placeholder="Sender ID" className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs" value={settings.twilioSenderId} onChange={e => setSettings({...settings, twilioSenderId: e.target.value})} />
                                      </div>
                                  )}
                              </div>
                              
                              {/* Push Config */}
                              <div className="p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl">
                                  <h4 className="text-sm font-bold mb-3 dark:text-white">Push Notifications</h4>
                                  <div className="grid grid-cols-1 gap-3">
                                      <select 
                                          className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-xs dark:text-white"
                                          value={settings.pushProvider} 
                                          onChange={e => setSettings({...settings, pushProvider: e.target.value as PushProvider})}
                                      >
                                          <option value="NONE">Disabled</option>
                                          <option value="FIREBASE">Firebase Cloud Messaging</option>
                                          <option value="ONESIGNAL">OneSignal</option>
                                      </select>
                                      
                                      {settings.pushProvider === 'FIREBASE' && (
                                          <input placeholder="Server Key" className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-xs dark:text-white" value={settings.firebaseServerKey} onChange={e => setSettings({...settings, firebaseServerKey: e.target.value})} />
                                      )}
                                      
                                      {settings.pushProvider === 'ONESIGNAL' && (
                                          <>
                                              <input placeholder="App ID" className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-xs dark:text-white" value={settings.oneSignalAppId} onChange={e => setSettings({...settings, oneSignalAppId: e.target.value})} />
                                              <input placeholder="Rest API Key" className="p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-xs dark:text-white" value={settings.oneSignalRestApiKey} onChange={e => setSettings({...settings, oneSignalRestApiKey: e.target.value})} />
                                          </>
                                      )}
                                      
                                      {settings.pushProvider !== 'NONE' && (
                                          <button onClick={handleTestPush} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700">Send Test Notification</button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </section>

                      <button onClick={handleSave} disabled={isSaving} className="w-full px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save API Settings</button>
                  </div>
              )}

              {/* --- PAYMENTS TAB --- */}
              {activeTab === 'payment' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4">Manual Bank Transfer Details</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">These details will be shown to users when they select "Manual Transfer" to fund their wallet.</p>
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Bank Name</label>
                              <input className="w-full p-3 mt-1 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" placeholder="e.g. GTBank" value={settings.bankName} onChange={e => setSettings({...settings, bankName: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Account Number</label>
                              <input className="w-full p-3 mt-1 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white font-mono" placeholder="0123456789" value={settings.accountNumber} onChange={e => setSettings({...settings, accountNumber: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Account Name</label>
                              <input className="w-full p-3 mt-1 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" placeholder="JadanPay Ventures" value={settings.accountName} onChange={e => setSettings({...settings, accountName: e.target.value})} />
                          </div>
                      </div>
                      <button onClick={handleSave} className="mt-6 w-full px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save Banking Details</button>
                  </div>
              )}

              {/* --- REFERRALS TAB --- */}
              {activeTab === 'referrals' && (
                  <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Referral Configuration</h3>
                          <label className="flex items-center gap-2 mb-6 cursor-pointer">
                              <input type="checkbox" checked={settings.enableReferral} onChange={e => setSettings({...settings, enableReferral: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-green-600"/>
                              <span className="font-bold text-gray-800 dark:text-white">Enable Referral System</span>
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Reward Per Referral (₦)</label>
                                  <input type="number" className="w-full p-3 mt-1 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" value={settings.referralReward} onChange={e => setSettings({...settings, referralReward: Number(e.target.value)})} />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Min Withdrawal (₦)</label>
                                  <input type="number" className="w-full p-3 mt-1 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" value={settings.referralMinWithdrawal} onChange={e => setSettings({...settings, referralMinWithdrawal: Number(e.target.value)})} />
                              </div>
                          </div>
                          <button onClick={handleSave} className="mt-6 w-full px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Update Referral Settings</button>
                      </div>

                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Trophy size={20} className="text-yellow-500"/> Top Referrers</h3>
                          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-bold text-xs">
                                  <tr><th className="p-3">User</th><th className="p-3">Count</th><th className="p-3">Bonus Earned</th></tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                  {topReferrers.map((u, i) => (
                                      <tr key={u.id}>
                                          <td className="p-3 flex items-center gap-2">
                                              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${i===0?'bg-yellow-500':i===1?'bg-gray-400':'bg-orange-600'}`}>{i+1}</span>
                                              {u.name}
                                          </td>
                                          <td className="p-3 font-bold">{u.referralCount}</td>
                                          <td className="p-3 text-green-600 dark:text-green-400">₦{(u.referralCount * settings.referralReward).toLocaleString()}</td>
                                      </tr>
                                  ))}
                                  {topReferrers.length === 0 && <tr><td colSpan={3} className="p-4 text-center">No referrals yet</td></tr>}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {/* --- BACKUP TAB --- */}
              {activeTab === 'backup' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                      <Database size={48} className="mx-auto text-green-600 mb-4 bg-green-100 dark:bg-green-900/30 p-3 rounded-full"/>
                      <h3 className="font-bold text-gray-800 dark:text-white text-xl mb-2">System Backup & Restore</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Download a full JSON dump of your database (Users, Transactions, Settings) or restore from a previous backup file.</p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <button onClick={handleBackupDownload} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all">
                              <Download size={18}/> Download Backup
                          </button>
                          <label className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold cursor-pointer border border-gray-200 dark:border-gray-600 transition-all">
                              <Upload size={18}/> Restore Database
                              <input type="file" hidden accept=".json" onChange={handleRestore}/>
                          </label>
                      </div>
                  </div>
              )}

              {/* --- AUTOMATION TAB --- */}
              {activeTab === 'automation' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="font-bold text-gray-800 dark:text-white">Automation Tasks</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Manage background cron jobs.</p>
                          </div>
                          <Clock size={24} className="text-gray-400"/>
                      </div>
                      
                      <div className="space-y-4">
                          {cronJobs.map(job => (
                              <div key={job.id} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                  <div>
                                      <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                          {job.name}
                                          <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{job.schedule}</span>
                                      </h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{job.description}</p>
                                      <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-mono">
                                          <span>Last: {job.lastRun}</span>
                                          <span>Next: {job.nextRun}</span>
                                      </div>
                                  </div>
                                  <button 
                                      onClick={() => toggleCron(job.id)} 
                                      className={`p-3 rounded-full transition-colors shadow-sm ${job.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                                  >
                                      {job.status === 'active' ? <Play size={20} fill="currentColor"/> : <Pause size={20} fill="currentColor"/>}
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* --- APP TAB --- */}
              {activeTab === 'app' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                      <Smartphone size={48} className="mx-auto text-purple-600 mb-4 bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full"/>
                      <h3 className="font-bold text-gray-800 dark:text-white text-xl mb-2">Mobile App Management</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Upload new APK versions for users to download directly from the landing page.</p>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 mb-6">
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Current Version: {settings.mobileAppVersion || '1.0.0'}</p>
                          <p className="text-xs text-gray-500 mb-4">Released: {new Date(settings.mobileAppReleaseDate).toLocaleDateString()}</p>
                          
                          <label className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-lg">
                              <Upload size={18}/> Upload New APK
                              <input type="file" hidden accept=".apk" onChange={(e) => {
                                  // Mock upload
                                  if(e.target.files?.[0]) {
                                      const file = e.target.files[0];
                                      setTimeout(() => {
                                          alert(`Uploaded ${file.name} successfully! Version incremented.`);
                                          setSettings({
                                              ...settings, 
                                              mobileAppVersion: (parseFloat(settings.mobileAppVersion) + 0.1).toFixed(1) + ".0",
                                              mobileAppReleaseDate: new Date().toISOString(),
                                              mobileAppUrl: "https://example.com/app-updated.apk"
                                          });
                                      }, 1500);
                                  }
                              }}/>
                          </label>
                      </div>
                  </div>
              )}

              {/* --- HEALTH TAB --- */}
              {activeTab === 'health' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Activity size={20} className="text-green-500"/> System Health</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-xl text-center">
                              <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">System Status</p>
                              <p className="text-2xl font-black text-green-700 dark:text-green-300 mt-1">OPERATIONAL</p>
                          </div>
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl text-center">
                              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">API Latency</p>
                              <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">45ms</p>
                          </div>
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/50 rounded-xl text-center">
                              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Error Rate</p>
                              <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">0.01%</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-2">Component Status</h4>
                          {[
                              { name: 'Database', status: 'Online', color: 'text-green-500' },
                              { name: 'Payment Gateway', status: 'Online', color: 'text-green-500' },
                              { name: 'SMS Gateway (Twilio)', status: settings.enableTwilio ? 'Connected' : 'Disabled', color: settings.enableTwilio ? 'text-green-500' : 'text-gray-400' },
                              { name: 'Email Service', status: 'Operational', color: 'text-green-500' },
                              { name: 'VTU API Provider', status: 'Connected', color: 'text-green-500' },
                          ].map((c, i) => (
                              <div key={i} className="flex justify-between items-center text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{c.name}</span>
                                  <span className={`font-bold ${c.color} flex items-center gap-1.5`}>
                                      <div className={`w-2 h-2 rounded-full ${c.color.replace('text-', 'bg-')}`}></div>
                                      {c.status}
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>
      
      {/* Bundle Modal */}
      {showBundleModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Edit Bundle</h3>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                          <select className="p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" value={editingBundle.provider} onChange={e => setEditingBundle({...editingBundle, provider: e.target.value as any})}>
                              <option value="MTN">MTN</option><option value="GLO">Glo</option><option value="AIRTEL">Airtel</option><option value="9MOBILE">9mobile</option>
                          </select>
                          <select className="p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" value={editingBundle.type} onChange={e => setEditingBundle({...editingBundle, type: e.target.value as any})}>
                              <option value={PlanType.SME}>SME</option><option value={PlanType.GIFTING}>Gifting</option><option value={PlanType.CORPORATE}>Corporate</option>
                          </select>
                      </div>
                      <input className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" placeholder="Name (e.g. 1GB Monthly)" value={editingBundle.name} onChange={e => setEditingBundle({...editingBundle, name: e.target.value})} />
                      <input className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" placeholder="API Plan ID (Required)" value={editingBundle.planId} onChange={e => setEditingBundle({...editingBundle, planId: e.target.value})} />
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-[10px] uppercase font-bold text-gray-500">User Price</label>
                              <input type="number" className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" placeholder="0.00" value={editingBundle.price} onChange={e => setEditingBundle({...editingBundle, price: Number(e.target.value)})} />
                          </div>
                          <div>
                              <label className="text-[10px] uppercase font-bold text-gray-500">Reseller Price</label>
                              <input type="number" className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-950 dark:text-white" placeholder="0.00" value={editingBundle.resellerPrice} onChange={e => setEditingBundle({...editingBundle, resellerPrice: Number(e.target.value)})} />
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <input type="checkbox" checked={editingBundle.isAvailable} onChange={e => setEditingBundle({...editingBundle, isAvailable: e.target.checked})}/> Available
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <input type="checkbox" checked={editingBundle.isBestValue} onChange={e => setEditingBundle({...editingBundle, isBestValue: e.target.checked})}/> Best Value Tag
                          </label>
                      </div>
                      
                      {bundleError && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded">{bundleError}</p>}

                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setShowBundleModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
                          <button onClick={handleBundleSave} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save Bundle</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
