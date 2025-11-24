
import React, { useState, useEffect } from 'react';
import { Save, Globe, Server, CreditCard, Database, Plus, Trash2, Edit2, Check, X, Upload, Mail, Phone, AlertTriangle, Key, Users, Trophy, Gift, MessageSquare, Bell, Send, Smartphone, Activity, Link as LinkIcon, Download } from 'lucide-react';
import { Provider, Bundle, PlanType, User } from '../types';
import { PROVIDER_LOGOS } from '../constants';
import { SettingsService, AppSettings, ApiVendor, EmailProvider, PushProvider } from '../services/settingsService';
import { MockDB } from '../services/mockDb';
import { NotificationService } from '../services/notificationService';

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'services' | 'payment' | 'backup' | 'api' | 'referrals' | 'app' | 'health'>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [topReferrers, setTopReferrers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Bundle Modal State
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Partial<Bundle>>({ isAvailable: true, isBestValue: false, type: PlanType.SME });
  const [bundleError, setBundleError] = useState<string | null>(null);
  
  useEffect(() => {
    loadSettings();
    loadBundles();
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

  const handleTestPush = async () => {
        if(!settings) return;
        setIsSaving(true);
        try {
            const result = await NotificationService.sendPush('test-admin', 'Test Notification', 'This is a test message from your configuration.');
            if (result?.success) {
                alert("Test notification sent! Check the browser console logs for details.");
            } else {
                alert("Failed to send test notification. Check console for errors.");
            }
        } catch(e) {
            alert("Failed to send test notification");
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

  const handleApkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && settings) {
          const file = e.target.files[0];
          // Simulate upload
          setTimeout(() => {
              const fakeUrl = `https://storage.jadanpay.com/apk/${file.name}`;
              setSettings({
                  ...settings,
                  mobileAppUrl: fakeUrl,
                  mobileAppVersion: (Number(settings.mobileAppVersion.split('.')[0]) + 1) + ".0.0",
                  mobileAppReleaseDate: new Date().toISOString()
              });
              alert("APK Uploaded successfully (Mocked). URL updated.");
          }, 1500);
      }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && settings) {
          const file = e.target.files[0];
          // Mock upload - in real app, upload to server and get URL
          const reader = new FileReader();
          reader.onload = (ev) => {
             setSettings({
                 ...settings,
                 faviconUrl: ev.target?.result as string
             });
          };
          reader.readAsDataURL(file);
      }
  };

  if (!settings) return <div className="p-10 text-center dark:text-white">Loading Settings...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Settings
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
            {[
                { id: 'general', label: 'General', icon: Globe },
                { id: 'app', label: 'Mobile App', icon: Smartphone },
                { id: 'health', label: 'Health', icon: Activity },
                { id: 'services', label: 'Services', icon: Server },
                { id: 'api', label: 'Integrations', icon: Key },
                { id: 'payment', label: 'Payments', icon: CreditCard },
                { id: 'referrals', label: 'Referrals', icon: Users },
                { id: 'backup', label: 'Backup', icon: Database },
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-white dark:bg-gray-700 shadow text-green-700 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Branding & Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">App Name</label>
                              <input 
                                  value={settings.appName}
                                  onChange={e => setSettings({...settings, appName: e.target.value})}
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Logo URL</label>
                              <input 
                                  value={settings.logoUrl}
                                  onChange={e => setSettings({...settings, logoUrl: e.target.value})}
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Favicon URL</label>
                              <div className="flex gap-2">
                                  <input 
                                      value={settings.faviconUrl || ''}
                                      onChange={e => setSettings({...settings, faviconUrl: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="https://..."
                                  />
                                   <label className="p-3 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-200">
                                      <Upload size={20} className="text-gray-500"/>
                                      <input type="file" accept="image/x-icon,image/png" onChange={handleFaviconUpload} className="hidden" />
                                  </label>
                              </div>
                              {settings.faviconUrl && <img src={settings.faviconUrl} alt="Favicon Preview" className="w-8 h-8 mt-2 border rounded p-1"/>}
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Support Email</label>
                              <div className="relative">
                                  <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                                  <input 
                                      value={settings.supportEmail}
                                      onChange={e => setSettings({...settings, supportEmail: e.target.value})}
                                      className="w-full pl-10 p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Support Phone</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
                                  <input 
                                      value={settings.supportPhone}
                                      onChange={e => setSettings({...settings, supportPhone: e.target.value})}
                                      className="w-full pl-10 p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                              </div>
                          </div>
                      </div>

                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2 pt-4">Landing Page</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Hero Title</label>
                              <input 
                                  value={settings.landingHeroTitle}
                                  onChange={e => setSettings({...settings, landingHeroTitle: e.target.value})}
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Hero Subtitle</label>
                              <textarea 
                                  value={settings.landingHeroSubtitle}
                                  onChange={e => setSettings({...settings, landingHeroSubtitle: e.target.value})}
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl h-20 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                          </div>
                      </div>
                      
                      <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">
                          {isSaving ? 'Saving...' : 'Save General Settings'}
                      </button>
                  </div>
              )}

              {/* --- APP MANAGEMENT --- */}
              {activeTab === 'app' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Application Management</h3>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-300 mb-6">
                           <h4 className="font-bold flex items-center gap-2"><Smartphone size={18}/> Current Version: {settings.mobileAppVersion}</h4>
                           <p className="text-sm mt-1">Released: {new Date(settings.mobileAppReleaseDate).toLocaleDateString()}</p>
                           <p className="text-xs mt-2 opacity-80 break-all">URL: {settings.mobileAppUrl || 'Not configured'}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Upload New APK</label>
                               <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-800 relative hover:bg-gray-100 transition-colors">
                                  <input type="file" accept=".apk" onChange={handleApkUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                                  <div className="flex flex-col items-center text-gray-400">
                                      <Upload size={32} className="mb-2"/>
                                      <span className="font-bold text-sm">Click to Upload APK</span>
                                      <span className="text-xs mt-1">Max size: 50MB</span>
                                  </div>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Manual URL Override</label>
                              <input 
                                  value={settings.mobileAppUrl}
                                  onChange={e => setSettings({...settings, mobileAppUrl: e.target.value})}
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
                                  placeholder="https://play.google.com/..."
                              />
                               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Version Code</label>
                              <input 
                                  value={settings.mobileAppVersion}
                                  onChange={e => setSettings({...settings, mobileAppVersion: e.target.value})}
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="1.0.0"
                              />
                          </div>
                      </div>
                      <button onClick={handleSave} className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save App Settings</button>
                  </div>
              )}

               {/* --- HEALTH MANAGEMENT --- */}
              {activeTab === 'health' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b dark:border-gray-800 pb-2 mb-4">
                           <h3 className="font-bold text-gray-800 dark:text-white">System & API Health</h3>
                           <button onClick={loadSettings} className="text-xs flex items-center gap-1 text-green-600 font-bold hover:underline"><Activity size={12}/> Refresh Status</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
                              <h4 className="text-green-800 dark:text-green-300 font-bold text-sm uppercase">System Status</h4>
                              <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">Operational</p>
                              <p className="text-xs text-green-600 dark:text-green-500 mt-1">Uptime: 99.98%</p>
                          </div>
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                              <h4 className="text-blue-800 dark:text-blue-300 font-bold text-sm uppercase">API Latency</h4>
                              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">~150ms</p>
                              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Avg response time</p>
                          </div>
                           <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                              <h4 className="text-gray-800 dark:text-gray-300 font-bold text-sm uppercase">Database</h4>
                              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200 mt-1">Healthy</p>
                              <p className="text-xs text-gray-500 mt-1">Local Storage / Mock</p>
                          </div>
                      </div>

                      <h4 className="font-bold text-gray-800 dark:text-white mb-2">External API Connections</h4>
                      <div className="space-y-3">
                          {[
                              { name: 'Gateway (Bilal/Maskawa)', status: 'Connected', latency: '120ms', color: 'text-green-500' },
                              { name: 'Paystack Payment', status: 'Connected', latency: '85ms', color: 'text-green-500' },
                              { name: 'Monnify Banking', status: 'Connected', latency: '200ms', color: 'text-green-500' },
                              { name: 'Twilio SMS', status: settings.enableTwilio ? 'Active' : 'Disabled', latency: '-', color: settings.enableTwilio ? 'text-green-500' : 'text-gray-400' },
                          ].map((s, i) => (
                              <div key={i} className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                  <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
                                  <div className="flex items-center gap-4 text-xs font-mono">
                                      <span className="text-gray-500">{s.latency}</span>
                                      <span className={`font-bold uppercase ${s.color}`}>{s.status}</span>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="pt-6 border-t dark:border-gray-800">
                          <label className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900 rounded-xl cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})}
                                    className="w-5 h-5 accent-red-600"
                                />
                                <div>
                                    <span className="font-bold text-red-700 dark:text-red-400">Maintenance Mode</span>
                                    <p className="text-xs text-red-600 dark:text-red-300">Enable this to prevent non-admin users from logging in or performing transactions.</p>
                                </div>
                          </label>
                      </div>
                      
                      <button onClick={handleSave} className="px-6 py-3 bg-gray-800 dark:bg-white dark:text-black text-white rounded-xl font-bold hover:opacity-90">Update System Status</button>
                  </div>
              )}

              {/* --- API INTEGRATIONS --- */}
              {activeTab === 'api' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                      
                      {/* Gateway Selection */}
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">VTU API Gateways</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Configure which provider is active for airtime/data transactions.</p>

                          <div className="mb-6">
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Active Gateway</label>
                              <select 
                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                                value={settings.activeApiVendor}
                                onChange={(e) => setSettings({...settings, activeApiVendor: e.target.value as ApiVendor})}
                              >
                                  <option value="BILALSADA">BilalSadaSub (Default)</option>
                                  <option value="MASKAWA">Maskawa Sub</option>
                                  <option value="ALRAHUZ">Alrahuz Data</option>
                                  <option value="ABBAPHANTAMI">Abba Phantami Data</option>
                                  <option value="SIMHOST">SimHost NG</option>
                              </select>
                          </div>

                          <div className="space-y-4">
                              {Object.keys(settings.apiKeys).map((vendor) => (
                                  <div key={vendor} className="p-4 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{vendor} API Key</label>
                                      <div className="relative">
                                        <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input 
                                            type="password"
                                            placeholder={`Enter ${vendor} Token/Key`}
                                            value={(settings.apiKeys as any)[vendor]}
                                            onChange={e => setSettings({
                                                ...settings, 
                                                apiKeys: { ...settings.apiKeys, [vendor]: e.target.value }
                                            })}
                                            className="w-full pl-10 p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </section>

                      {/* Messaging: SMS */}
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2 pt-4 flex items-center gap-2"><MessageSquare size={18}/> SMS Configuration (Twilio)</h3>
                          
                          <div className="p-4 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 mb-4">
                               <div className="flex items-center gap-4 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                checked={settings.enableTwilio}
                                                onChange={e => setSettings({...settings, enableTwilio: e.target.checked})}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </div>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Enable Twilio SMS</span>
                                    </label>
                               </div>

                               {settings.enableTwilio && (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Account SID</label>
                                            <input 
                                                type="password"
                                                value={settings.twilioAccountSid}
                                                onChange={e => setSettings({...settings, twilioAccountSid: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="AC..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Auth Token</label>
                                            <input 
                                                type="password"
                                                value={settings.twilioAuthToken}
                                                onChange={e => setSettings({...settings, twilioAuthToken: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="Auth Token"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Sender ID / Phone Number</label>
                                            <input 
                                                value={settings.twilioSenderId}
                                                onChange={e => setSettings({...settings, twilioSenderId: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="+1234567890 or Brand Name"
                                            />
                                        </div>
                                   </div>
                               )}
                          </div>
                      </section>

                      {/* Messaging: Email */}
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2 pt-4 flex items-center gap-2"><Mail size={18}/> Email Configuration</h3>
                          
                          <div className="p-4 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 mb-4">
                               <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Email Provider</label>
                                    <select 
                                        className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium"
                                        value={settings.emailProvider}
                                        onChange={(e) => setSettings({...settings, emailProvider: e.target.value as EmailProvider})}
                                    >
                                        <option value="SMTP">SMTP (Standard)</option>
                                        <option value="RESEND">Resend.com (API)</option>
                                    </select>
                               </div>

                               {settings.emailProvider === 'SMTP' ? (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">SMTP Host</label>
                                            <input 
                                                value={settings.smtpHost}
                                                onChange={e => setSettings({...settings, smtpHost: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="smtp.gmail.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">SMTP Port</label>
                                            <input 
                                                type="number"
                                                value={settings.smtpPort}
                                                onChange={e => setSettings({...settings, smtpPort: Number(e.target.value)})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="587"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">SMTP Username</label>
                                            <input 
                                                value={settings.smtpUser}
                                                onChange={e => setSettings({...settings, smtpUser: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">SMTP Password</label>
                                            <input 
                                                type="password"
                                                value={settings.smtpPass}
                                                onChange={e => setSettings({...settings, smtpPass: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="********"
                                            />
                                        </div>
                                         <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">From Email Address</label>
                                            <input 
                                                value={settings.emailFrom}
                                                onChange={e => setSettings({...settings, emailFrom: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="noreply@yourdomain.com"
                                            />
                                        </div>
                                   </div>
                               ) : (
                                   <div className="animate-fade-in">
                                       <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Resend API Key</label>
                                       <div className="relative">
                                           <Key className="absolute left-3 top-3 text-gray-400" size={18}/>
                                           <input 
                                               type="password"
                                               value={settings.resendApiKey}
                                               onChange={e => setSettings({...settings, resendApiKey: e.target.value})}
                                               className="w-full pl-10 p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                               placeholder="re_..."
                                           />
                                       </div>
                                       <div className="mt-4">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">From Email Address</label>
                                            <input 
                                                value={settings.emailFrom}
                                                onChange={e => setSettings({...settings, emailFrom: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="onboarding@resend.dev"
                                            />
                                        </div>
                                   </div>
                               )}
                          </div>
                      </section>

                      {/* Messaging: Push Notifications */}
                      <section>
                          <div className="flex justify-between items-center mb-4 border-b dark:border-gray-800 pb-2 pt-4">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Bell size={18}/> Push Notifications
                                </h3>
                                {settings.pushProvider !== 'NONE' && (
                                    <button onClick={handleTestPush} className="text-xs flex items-center gap-1 text-green-600 dark:text-green-400 font-bold hover:underline">
                                        <Send size={12} /> Test Config
                                    </button>
                                )}
                          </div>
                          
                          <div className="p-4 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 mb-4">
                               <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Push Provider</label>
                                    <select 
                                        className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium"
                                        value={settings.pushProvider}
                                        onChange={(e) => setSettings({...settings, pushProvider: e.target.value as PushProvider})}
                                    >
                                        <option value="NONE">Disabled</option>
                                        <option value="FIREBASE">Firebase Cloud Messaging (FCM)</option>
                                        <option value="ONESIGNAL">OneSignal</option>
                                    </select>
                               </div>

                               {settings.pushProvider === 'FIREBASE' && (
                                   <div className="grid grid-cols-1 gap-4 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Firebase Project ID</label>
                                            <input 
                                                value={settings.firebaseProjectId}
                                                onChange={e => setSettings({...settings, firebaseProjectId: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="my-project-id"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Server Key (Legacy) / Service Account</label>
                                            <input 
                                                type="password"
                                                value={settings.firebaseServerKey}
                                                onChange={e => setSettings({...settings, firebaseServerKey: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="AAAA..."
                                            />
                                        </div>
                                   </div>
                               )}

                               {settings.pushProvider === 'ONESIGNAL' && (
                                   <div className="grid grid-cols-1 gap-4 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">OneSignal App ID</label>
                                            <input 
                                                value={settings.oneSignalAppId}
                                                onChange={e => setSettings({...settings, oneSignalAppId: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="uuid-format..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">REST API Key</label>
                                            <input 
                                                type="password"
                                                value={settings.oneSignalRestApiKey}
                                                onChange={e => setSettings({...settings, oneSignalRestApiKey: e.target.value})}
                                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="Token..."
                                            />
                                        </div>
                                   </div>
                               )}
                          </div>
                      </section>

                      <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 mt-4">
                          {isSaving ? 'Saving...' : 'Update Integrations'}
                      </button>
                  </div>
              )}

              {/* ... Other Tabs remain the same ... */}
              {/* --- SERVICES SETTINGS --- */}
              {activeTab === 'services' && (
                  <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Provider Status</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.entries(settings.providerStatus).map(([key, isActive]) => (
                                  <div key={key} className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${isActive ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 opacity-60'}`} onClick={() => toggleProvider(key)}>
                                      <span className="font-bold dark:text-gray-200">{PROVIDER_LOGOS[key as Provider] || key}</span>
                                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${isActive ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'}`}>
                                          {isActive ? 'Online' : 'Offline'}
                                      </span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="font-bold text-gray-800 dark:text-white">Data Bundles</h3>
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
                              <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase font-semibold">
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
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {bundles.map(b => (
                                          <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                                                  <button onClick={() => { setEditingBundle(b); setShowBundleModal(true); }} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded"><Edit2 size={16}/></button>
                                                  <button onClick={() => handleBundleDelete(b.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"><Trash2 size={16}/></button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- REFERRALS SETTINGS --- */}
              {activeTab === 'referrals' && (
                  <div className="space-y-6">
                      {/* Configuration Card */}
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                           <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2 flex items-center gap-2">
                               <Gift className="text-purple-600" size={20} /> Referral Configuration
                           </h3>
                           
                           <div className="flex items-center gap-4 mb-4 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            checked={settings.enableReferral}
                                            onChange={e => setSettings({...settings, enableReferral: e.target.checked})}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-300">Enable Referral System</span>
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">When enabled, users get a unique code and earn bonuses for inviting others.</p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Bonus Reward (₦)</label>
                                   <input 
                                      type="number"
                                      value={settings.referralReward}
                                      onChange={e => setSettings({...settings, referralReward: Number(e.target.value)})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="e.g. 100"
                                   />
                                   <p className="text-[10px] text-gray-400 mt-1">Amount credited to referrer's bonus wallet per new signup.</p>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Min. Withdrawal (₦)</label>
                                   <input 
                                      type="number"
                                      value={settings.referralMinWithdrawal || 500}
                                      onChange={e => setSettings({...settings, referralMinWithdrawal: Number(e.target.value)})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="e.g. 500"
                                   />
                                    <p className="text-[10px] text-gray-400 mt-1">Minimum bonus balance required before user can move funds to main wallet.</p>
                               </div>
                           </div>
                           
                           <button onClick={handleSave} disabled={isSaving} className="mt-4 px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">
                               {isSaving ? 'Saving...' : 'Update Configuration'}
                           </button>
                      </div>
                      
                      {/* Leaderboard Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Trophy className="text-yellow-500" size={20} /> Top Referrers
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            <tr>
                                                <th className="p-3">Rank</th>
                                                <th className="p-3">User</th>
                                                <th className="p-3 text-center">Invited</th>
                                                <th className="p-3 text-right">Earned</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {topReferrers.map((user, index) => (
                                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="p-3">
                                                        {index < 3 ? (
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                                                                {index + 1}
                                                            </div>
                                                        ) : (
                                                            <span className="pl-2 font-mono text-gray-500 text-xs">#{index + 1}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <p className="font-bold text-gray-800 dark:text-gray-200">{user.name}</p>
                                                        <p className="text-xs text-gray-400">{user.email}</p>
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-purple-600 dark:text-purple-400">
                                                        {user.referralCount}
                                                    </td>
                                                    <td className="p-3 text-right font-mono text-green-600 dark:text-green-400">
                                                        ₦{(user.referralCount * settings.referralReward).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {topReferrers.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-6 text-center text-gray-400">No active referrers found yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                          </div>
                          
                          <div className="lg:col-span-1 space-y-6">
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-300">
                                    <h4 className="font-bold mb-2">Total Payouts</h4>
                                    <p className="text-3xl font-bold">₦{topReferrers.reduce((acc, curr) => acc + (curr.referralCount * settings.referralReward), 0).toLocaleString()}</p>
                                    <p className="text-xs mt-1 opacity-70">Calculated based on current reward rate.</p>
                                </div>
                                
                                <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-900 text-purple-900 dark:text-purple-300">
                                    <h4 className="font-bold mb-2">Total Invites</h4>
                                    <p className="text-3xl font-bold">{topReferrers.reduce((acc, curr) => acc + curr.referralCount, 0)}</p>
                                    <p className="text-xs mt-1 opacity-70">Successful signups via code.</p>
                                </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- PAYMENT SETTINGS --- */}
              {activeTab === 'payment' && (
                  <div className="space-y-6">
                      {/* Manual Funding Config */}
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                           <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Manual Funding (Bank Transfer)</h3>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Bank Name</label>
                                   <input 
                                      value={settings.bankName}
                                      onChange={e => setSettings({...settings, bankName: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Account Number</label>
                                   <input 
                                      value={settings.accountNumber}
                                      onChange={e => setSettings({...settings, accountNumber: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                   />
                               </div>
                                <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Account Name</label>
                                   <input 
                                      value={settings.accountName}
                                      onChange={e => setSettings({...settings, accountName: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                   />
                               </div>
                           </div>
                      </div>

                      {/* Paystack Config */}
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-2 h-full bg-[#09A5DB]"></div>
                           <h3 className="font-bold text-gray-800 dark:text-white mb-2">Paystack Integration</h3>
                           <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.enablePaystack}
                                        onChange={e => setSettings({...settings, enablePaystack: e.target.checked})}
                                        className="w-5 h-5 accent-blue-600"
                                    />
                                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Enable Paystack</span>
                                </label>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Public Key</label>
                                   <input 
                                      type="password"
                                      value={settings.paystackPublicKey}
                                      onChange={e => setSettings({...settings, paystackPublicKey: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="pk_test_..."
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Secret Key</label>
                                   <input 
                                      type="password"
                                      value={settings.paystackSecretKey}
                                      onChange={e => setSettings({...settings, paystackSecretKey: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="sk_test_..."
                                   />
                               </div>
                           </div>
                      </div>

                       {/* Flutterwave Config */}
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-2 h-full bg-[#f5a623]"></div>
                           <h3 className="font-bold text-gray-800 dark:text-white mb-2">Flutterwave Integration</h3>
                           <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.enableFlutterwave}
                                        onChange={e => setSettings({...settings, enableFlutterwave: e.target.checked})}
                                        className="w-5 h-5 accent-orange-600"
                                    />
                                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Enable Flutterwave</span>
                                </label>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Public Key</label>
                                   <input 
                                      type="password"
                                      value={settings.flutterwavePublicKey}
                                      onChange={e => setSettings({...settings, flutterwavePublicKey: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="FLWPUBK_TEST..."
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Secret Key</label>
                                   <input 
                                      type="password"
                                      value={settings.flutterwaveSecretKey}
                                      onChange={e => setSettings({...settings, flutterwaveSecretKey: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="FLWSECK_TEST..."
                                   />
                               </div>
                           </div>
                      </div>

                       {/* Monnify Config */}
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-2 h-full bg-[#035BA8]"></div>
                           <h3 className="font-bold text-gray-800 dark:text-white mb-2">Monnify Integration</h3>
                           <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.enableMonnify}
                                        onChange={e => setSettings({...settings, enableMonnify: e.target.checked})}
                                        className="w-5 h-5 accent-indigo-600"
                                    />
                                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Enable Monnify</span>
                                </label>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">API Key</label>
                                   <input 
                                      type="password"
                                      value={settings.monnifyApiKey}
                                      onChange={e => setSettings({...settings, monnifyApiKey: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="MK_TEST..."
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Secret Key</label>
                                   <input 
                                      type="password"
                                      value={settings.monnifySecretKey}
                                      onChange={e => setSettings({...settings, monnifySecretKey: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="MS_TEST..."
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Contract Code</label>
                                   <input 
                                      value={settings.monnifyContractCode}
                                      onChange={e => setSettings({...settings, monnifyContractCode: e.target.value})}
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="1234567890"
                                   />
                               </div>
                           </div>
                      </div>

                       <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 w-full md:w-auto">
                          {isSaving ? 'Saving...' : 'Save Payment Configuration'}
                      </button>
                  </div>
              )}

              {/* --- BACKUP SETTINGS --- */}
              {activeTab === 'backup' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">System Backup</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Download a full JSON dump of your database (Users, Transactions, Settings, etc). Useful for migrating or data safety.</p>
                      
                      <div className="flex gap-4">
                          <button onClick={handleBackupDownload} className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-bold hover:bg-black dark:hover:bg-gray-600">
                              <Database size={20} /> Download Backup
                          </button>
                      </div>

                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2 pt-4">Restore Database</h3>
                      <p className="text-red-500 text-sm mb-4">Warning: This will overwrite all current data!</p>
                      
                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-800 relative">
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
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                  <h4 className="font-bold flex items-center gap-2 mb-2"><Server size={18}/> Status</h4>
                  <p className="text-sm">System is running optimally.</p>
                  <p className="text-xs mt-2 opacity-70">Version: 2.1.0 (Multi-Gateway)</p>
              </div>
          </div>
      </div>

      {/* Bundle Modal */}
      {showBundleModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{editingBundle.id ? 'Edit Bundle' : 'Add New Bundle'}</h3>
                      <button onClick={() => setShowBundleModal(false)}><X size={20} className="text-gray-400"/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Provider</label>
                              <select 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
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
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Type</label>
                              <select 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
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
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Plan Name</label>
                          <input 
                              className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                              placeholder="e.g. 1.5GB Monthly"
                              value={editingBundle.name || ''}
                              onChange={e => setEditingBundle({...editingBundle, name: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Price (₦)</label>
                              <input 
                                  type="number"
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="1000"
                                  value={editingBundle.price || ''}
                                  onChange={e => setEditingBundle({...editingBundle, price: Number(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Cost Price (₦)</label>
                              <input 
                                  type="number"
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="950"
                                  value={editingBundle.costPrice || ''}
                                  onChange={e => setEditingBundle({...editingBundle, costPrice: Number(e.target.value)})}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data Amount</label>
                              <input 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="1.5GB"
                                  value={editingBundle.dataAmount || ''}
                                  onChange={e => setEditingBundle({...editingBundle, dataAmount: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Validity</label>
                              <input 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="30 Days"
                                  value={editingBundle.validity || ''}
                                  onChange={e => setEditingBundle({...editingBundle, validity: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase mb-1 flex items-center gap-2">
                              API Plan ID <span className="text-red-500">*</span>
                          </label>
                          <input 
                              className={`w-full p-3 border dark:border-gray-700 rounded-xl font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${bundleError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
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
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Available</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox"
                                  checked={editingBundle.isBestValue}
                                  onChange={e => setEditingBundle({...editingBundle, isBestValue: e.target.checked})}
                                  className="w-5 h-5 accent-yellow-500"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Best Value Tag</span>
                          </label>
                      </div>
                      
                      {bundleError && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                              <AlertTriangle size={16}/> {bundleError}
                          </div>
                      )}

                      <div className="flex gap-3 mt-4">
                          <button onClick={() => setShowBundleModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Cancel</button>
                          <button onClick={handleBundleSave} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save Bundle</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
