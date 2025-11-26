
import React, { useState, useEffect } from 'react';
import { Save, Globe, Server, CreditCard, Database, Plus, Trash2, Edit2, Check, X, Upload, Mail, Phone, AlertTriangle, Key, Users, Trophy, Gift, MessageSquare, Bell, Send, Smartphone, Activity, Link as LinkIcon, Download, Wifi, Clock, Play, Pause, Lock } from 'lucide-react';
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

  const toggleCron = async (id: string) => {
      await MockDB.toggleCronJob(id);
      loadCronJobs();
  };

  const toggleProvider = (provider: string) => {
      if (!settings) return;
      const newStatus = { ...settings.providerStatus };
      // Default is active if undefined or not strictly false
      const isActive = newStatus[provider] !== false;
      newStatus[provider] = !isActive;
      
      setSettings({ ...settings, providerStatus: newStatus });
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Settings
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
            {[
                { id: 'general', label: 'General', icon: Globe },
                { id: 'app', label: 'Mobile App', icon: Smartphone },
                { id: 'health', label: 'Health', icon: Activity },
                { id: 'automation', label: 'Automation', icon: Clock },
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
                        ? 'bg-white dark:bg-gray-600 shadow text-green-700 dark:text-green-300' 
                        : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
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

              {/* --- AUTOMATION (CRON) --- */}
              {activeTab === 'automation' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2 flex items-center gap-2">
                          <Clock className="text-blue-500" /> Automation & Cron Jobs
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Manage automated background tasks.</p>

                      <div className="space-y-4">
                          {cronJobs.map(job => (
                              <div key={job.id} className="p-4 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                          <h4 className="font-bold text-gray-800 dark:text-white">{job.name}</h4>
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                              {job.status}
                                          </span>
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{job.description}</p>
                                      <div className="flex gap-4 mt-2 text-xs text-gray-400 font-mono">
                                          <span>Schedule: {job.schedule}</span>
                                          <span>Last Run: {new Date(job.lastRun).toLocaleString()}</span>
                                      </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                      <button className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                                          Logs
                                      </button>
                                      <button 
                                          onClick={() => toggleCron(job.id)}
                                          className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 ${job.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                      >
                                          {job.status === 'active' ? <><Pause size={12}/> Disable</> : <><Play size={12}/> Enable</>}
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* --- API INTEGRATIONS (Full Implementation) --- */}
              {activeTab === 'api' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                      
                      {/* VTU Gateway */}
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">VTU API Gateways</h3>
                          <div className="grid grid-cols-1 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Active Vendor</label>
                                  <select 
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
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
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">API Key ({settings.activeApiVendor})</label>
                                  <input 
                                      type="password"
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                      value={settings.apiKeys[settings.activeApiVendor]}
                                      onChange={e => setSettings({...settings, apiKeys: { ...settings.apiKeys, [settings.activeApiVendor]: e.target.value }})}
                                      placeholder="Enter your API Token"
                                  />
                              </div>
                          </div>
                      </section>

                      {/* Payment Gateways */}
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Payment Gateways</h3>
                          
                          <div className="space-y-6">
                              {/* Paystack */}
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                                  <label className="flex items-center justify-between mb-4 cursor-pointer">
                                      <span className="font-bold text-blue-600 dark:text-blue-400">Paystack</span>
                                      <input type="checkbox" checked={settings.enablePaystack} onChange={e => setSettings({...settings, enablePaystack: e.target.checked})} className="w-5 h-5 accent-blue-600"/>
                                  </label>
                                  {settings.enablePaystack && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <input placeholder="Public Key" className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={settings.paystackPublicKey} onChange={e => setSettings({...settings, paystackPublicKey: e.target.value})} />
                                          <input placeholder="Secret Key" type="password" className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={settings.paystackSecretKey} onChange={e => setSettings({...settings, paystackSecretKey: e.target.value})} />
                                      </div>
                                  )}
                              </div>

                              {/* Flutterwave */}
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                                  <label className="flex items-center justify-between mb-4 cursor-pointer">
                                      <span className="font-bold text-orange-600 dark:text-orange-400">Flutterwave</span>
                                      <input type="checkbox" checked={settings.enableFlutterwave} onChange={e => setSettings({...settings, enableFlutterwave: e.target.checked})} className="w-5 h-5 accent-orange-600"/>
                                  </label>
                                  {settings.enableFlutterwave && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <input placeholder="Public Key" className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={settings.flutterwavePublicKey} onChange={e => setSettings({...settings, flutterwavePublicKey: e.target.value})} />
                                          <input placeholder="Secret Key" type="password" className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={settings.flutterwaveSecretKey} onChange={e => setSettings({...settings, flutterwaveSecretKey: e.target.value})} />
                                      </div>
                                  )}
                              </div>

                              {/* Monnify */}
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                                  <label className="flex items-center justify-between mb-4 cursor-pointer">
                                      <span className="font-bold text-indigo-600 dark:text-indigo-400">Monnify</span>
                                      <input type="checkbox" checked={settings.enableMonnify} onChange={e => setSettings({...settings, enableMonnify: e.target.checked})} className="w-5 h-5 accent-indigo-600"/>
                                  </label>
                                  {settings.enableMonnify && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <input placeholder="API Key" className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={settings.monnifyApiKey} onChange={e => setSettings({...settings, monnifyApiKey: e.target.value})} />
                                          <input placeholder="Secret Key" type="password" className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={settings.monnifySecretKey} onChange={e => setSettings({...settings, monnifySecretKey: e.target.value})} />
                                          <input placeholder="Contract Code" className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={settings.monnifyContractCode} onChange={e => setSettings({...settings, monnifyContractCode: e.target.value})} />
                                      </div>
                                  )}
                              </div>
                          </div>
                      </section>

                      {/* Notifications */}
                      <section>
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Notifications (SMS, Email, Push)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* SMS - Twilio */}
                              <div className="p-4 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl">
                                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                      <input type="checkbox" checked={settings.enableTwilio} onChange={e => setSettings({...settings, enableTwilio: e.target.checked})} className="w-4 h-4"/>
                                      <span className="font-bold text-sm text-gray-800 dark:text-white">Twilio SMS</span>
                                  </label>
                                  {settings.enableTwilio && (
                                      <div className="space-y-3">
                                          <input placeholder="Account SID" className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs" value={settings.twilioAccountSid} onChange={e => setSettings({...settings, twilioAccountSid: e.target.value})} />
                                          <input placeholder="Auth Token" type="password" className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs" value={settings.twilioAuthToken} onChange={e => setSettings({...settings, twilioAuthToken: e.target.value})} />
                                          <input placeholder="Sender ID" className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs" value={settings.twilioSenderId} onChange={e => setSettings({...settings, twilioSenderId: e.target.value})} />
                                      </div>
                                  )}
                              </div>

                              {/* Push Notifications */}
                              <div className="p-4 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl">
                                  <div className="flex justify-between mb-4">
                                      <span className="font-bold text-sm text-gray-800 dark:text-white">Push Notifications</span>
                                      <select className="text-xs bg-gray-100 dark:bg-gray-800 border dark:border-gray-600 rounded p-1 text-gray-900 dark:text-white" value={settings.pushProvider} onChange={e => setSettings({...settings, pushProvider: e.target.value as PushProvider})}>
                                          <option value="NONE">Disabled</option>
                                          <option value="FIREBASE">Firebase</option>
                                          <option value="ONESIGNAL">OneSignal</option>
                                      </select>
                                  </div>
                                  
                                  {settings.pushProvider === 'FIREBASE' && (
                                      <div className="space-y-3">
                                          <input placeholder="Server Key" type="password" className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs" value={settings.firebaseServerKey} onChange={e => setSettings({...settings, firebaseServerKey: e.target.value})} />
                                          <input placeholder="Project ID" className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs" value={settings.firebaseProjectId} onChange={e => setSettings({...settings, firebaseProjectId: e.target.value})} />
                                      </div>
                                  )}
                                  {settings.pushProvider === 'ONESIGNAL' && (
                                      <div className="space-y-3">
                                          <input placeholder="App ID" className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs" value={settings.oneSignalAppId} onChange={e => setSettings({...settings, oneSignalAppId: e.target.value})} />
                                          <input placeholder="REST API Key" type="password" className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs" value={settings.oneSignalRestApiKey} onChange={e => setSettings({...settings, oneSignalRestApiKey: e.target.value})} />
                                      </div>
                                  )}
                                  {settings.pushProvider !== 'NONE' && (
                                      <button onClick={handleTestPush} disabled={isSaving} className="mt-2 w-full py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700">Test Configuration</button>
                                  )}
                              </div>
                          </div>
                      </section>

                      <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 w-full">Save API Settings</button>
                  </div>
              )}

              {/* --- PAYMENT SETTINGS (Manual) --- */}
              {activeTab === 'payment' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Manual Funding (Bank Transfer)</h3>
                      <div className="grid grid-cols-1 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Bank Name</label>
                              <input 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  value={settings.bankName}
                                  onChange={e => setSettings({...settings, bankName: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Account Number</label>
                              <input 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                                  value={settings.accountNumber}
                                  onChange={e => setSettings({...settings, accountNumber: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Account Name</label>
                              <input 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  value={settings.accountName}
                                  onChange={e => setSettings({...settings, accountName: e.target.value})}
                              />
                          </div>
                      </div>
                      <button onClick={handleSave} className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save Bank Details</button>
                  </div>
              )}

              {/* --- SERVICES SETTINGS --- */}
              {activeTab === 'services' && (
                  <div className="space-y-6">
                      {/* Network Visualizer Section */}
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Network Connectivity Center</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {Object.values(Provider).map(p => {
                                  const isOnline = settings.providerStatus[p] !== false;
                                  const stats = settings.providerStats[p] || 90;
                                  return (
                                      <div key={p} className={`p-4 rounded-xl border transition-all ${isOnline ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 grayscale'}`}>
                                          <div className="flex justify-between items-center mb-2">
                                              <span className="font-bold text-gray-800 dark:text-white">{PROVIDER_LOGOS[p]}</span>
                                              <label className="relative inline-flex items-center cursor-pointer">
                                                  <input type="checkbox" className="sr-only peer" checked={isOnline} onChange={() => toggleProvider(p)}/>
                                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                              </label>
                                          </div>
                                          <div className="flex items-end gap-2 h-8">
                                              {[1,2,3,4,5,6,7,8].map(i => (
                                                  <div key={i} className={`flex-1 rounded-sm ${i/8 * 100 <= stats ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} style={{height: `${Math.random() * 100}%`}}></div>
                                              ))}
                                          </div>
                                          <div className="flex justify-between mt-2 text-xs font-mono">
                                              <span className={isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                                              <span>{stats}% Success</span>
                                          </div>
                                      </div>
                                  );
                              })}
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
                                          <th className="p-3">Cost (API)</th>
                                          <th className="p-3">User Price</th>
                                          <th className="p-3">Reseller</th>
                                          <th className="p-3">Profit (User)</th>
                                          <th className="p-3 text-right">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {bundles.map(b => {
                                          const profit = b.price - b.costPrice;
                                          return (
                                          <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                              <td className="p-3 font-mono text-xs text-gray-500">{b.planId}</td>
                                              <td className="p-3 font-bold">{PROVIDER_LOGOS[b.provider]}</td>
                                              <td className="p-3 font-medium">{b.name}</td>
                                              <td className="p-3 font-mono text-red-600 dark:text-red-400">₦{b.costPrice}</td>
                                              <td className="p-3 font-mono">₦{b.price}</td>
                                              <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">₦{b.resellerPrice || b.price}</td>
                                              <td className="p-3 font-mono font-bold text-green-600 dark:text-green-400">
                                                  +₦{profit}
                                              </td>
                                              <td className="p-3 text-right flex justify-end gap-2">
                                                  <button onClick={() => { setEditingBundle(b); setShowBundleModal(true); }} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded"><Edit2 size={16}/></button>
                                                  <button onClick={() => handleBundleDelete(b.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"><Trash2 size={16}/></button>
                                              </td>
                                          </tr>
                                      )})}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- REFERRALS --- */}
              {activeTab === 'referrals' && (
                  <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Referral Settings</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-4 border p-4 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                                  <input type="checkbox" checked={settings.enableReferral} onChange={e => setSettings({...settings, enableReferral: e.target.checked})} className="w-5 h-5 accent-green-600"/>
                                  <span className="font-bold text-gray-700 dark:text-gray-300">Enable System</span>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Bonus Amount (₦)</label>
                                  <input 
                                      type="number"
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      value={settings.referralReward}
                                      onChange={e => setSettings({...settings, referralReward: Number(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Min Withdrawal (₦)</label>
                                  <input 
                                      type="number"
                                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      value={settings.referralMinWithdrawal}
                                      onChange={e => setSettings({...settings, referralMinWithdrawal: Number(e.target.value)})}
                                  />
                              </div>
                          </div>
                          <button onClick={handleSave} className="mt-4 px-6 py-2 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800">Update Referral Config</button>
                      </div>

                      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Trophy className="text-yellow-500"/> Top Referrers</h3>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                                  <thead className="bg-gray-50 dark:bg-gray-800">
                                      <tr>
                                          <th className="p-3">User</th>
                                          <th className="p-3">Referrals</th>
                                          <th className="p-3">Bonus Earned</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {topReferrers.map((u, i) => (
                                          <tr key={u.id} className="border-b dark:border-gray-800">
                                              <td className="p-3 font-bold">{i+1}. {u.name}</td>
                                              <td className="p-3">{u.referralCount} users</td>
                                              <td className="p-3 font-mono text-green-600 dark:text-green-400">₦{(u.referralCount * settings.referralReward).toLocaleString()}</td>
                                          </tr>
                                      ))}
                                      {topReferrers.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400">No referrals yet.</td></tr>}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- BACKUP --- */}
              {activeTab === 'backup' && (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-800 pb-2">Data Management</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900">
                              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><Download size={20}/> Export Database</h4>
                              <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">Download a full JSON dump of all users, transactions, and settings.</p>
                              <button onClick={handleBackupDownload} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Download Backup</button>
                          </div>
                          <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900">
                              <h4 className="font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2"><Upload size={20}/> Restore Database</h4>
                              <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">Upload a JSON backup file to restore system state. This will overwrite current data.</p>
                              <input type="file" accept=".json" onChange={handleRestore} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"/>
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
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Plan Type</label>
                              <select 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  value={editingBundle.type}
                                  onChange={e => setEditingBundle({...editingBundle, type: e.target.value as PlanType})}
                              >
                                  {Object.values(PlanType).map(p => (
                                      <option key={p} value={p}>{p}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Plan Name</label>
                          <input 
                              className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                              placeholder="e.g. 1.5GB SME Monthly" 
                              value={editingBundle.name || ''}
                              onChange={e => setEditingBundle({...editingBundle, name: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data Amount</label>
                              <input 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="e.g. 1.5GB" 
                                  value={editingBundle.dataAmount || ''}
                                  onChange={e => setEditingBundle({...editingBundle, dataAmount: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Validity</label>
                              <input 
                                  className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="e.g. 30 Days" 
                                  value={editingBundle.validity || ''}
                                  onChange={e => setEditingBundle({...editingBundle, validity: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Pricing Structure</h4>
                          <div className="grid grid-cols-3 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-red-500 dark:text-red-400 uppercase mb-1">API Cost (Buying)</label>
                                  <input 
                                      type="number"
                                      className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                      value={editingBundle.costPrice || ''}
                                      onChange={e => setEditingBundle({...editingBundle, costPrice: Number(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">User Selling Price</label>
                                  <input 
                                      type="number"
                                      className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                      value={editingBundle.price || ''}
                                      onChange={e => setEditingBundle({...editingBundle, price: Number(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">Reseller Price</label>
                                  <input 
                                      type="number"
                                      className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                                      value={editingBundle.resellerPrice || ''}
                                      onChange={e => setEditingBundle({...editingBundle, resellerPrice: Number(e.target.value)})}
                                  />
                              </div>
                          </div>
                          <p className="text-xs text-gray-400 text-center mt-2">
                              Estimated Profit: <span className="text-green-600 font-bold">₦{(editingBundle.price || 0) - (editingBundle.costPrice || 0)}</span> per sale.
                          </p>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">API Plan ID</label>
                          <input 
                              className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                              placeholder="ID from API Provider" 
                              value={editingBundle.planId || ''}
                              onChange={e => setEditingBundle({...editingBundle, planId: e.target.value})}
                          />
                      </div>

                      <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={editingBundle.isAvailable} 
                                  onChange={e => setEditingBundle({...editingBundle, isAvailable: e.target.checked})}
                                  className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Available</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={editingBundle.isBestValue} 
                                  onChange={e => setEditingBundle({...editingBundle, isBestValue: e.target.checked})}
                                  className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Best Value Tag</span>
                          </label>
                      </div>

                      {bundleError && <p className="text-red-500 text-sm">{bundleError}</p>}

                      <div className="flex gap-3 mt-4">
                          <button onClick={() => setShowBundleModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold">Cancel</button>
                          <button onClick={handleBundleSave} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save Bundle</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
