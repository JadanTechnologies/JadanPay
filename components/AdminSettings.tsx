import React, { useState, useEffect, useRef } from 'react';
import { Save, Globe, Server, CreditCard, Database, Plus, Trash2, Edit2, Check, X, Upload, Mail, Phone, AlertTriangle, Key, Users, Trophy, Gift, MessageSquare, Bell, Send, Smartphone, Activity, Link as LinkIcon, Download, Wifi, Clock, Play, Pause, Lock, DollarSign, Image as ImageIcon, Power, Loader2, ArrowDown, ArrowUp, Zap } from 'lucide-react';
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

  // Network Test State
  const [testProvider, setTestProvider] = useState('MTN');
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<number | null>(null);
  
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

  const handleSettingChange = (field: keyof AppSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const handleNestedChange = (parent: keyof AppSettings, field: string, value: any, isNumeric: boolean = false) => {
    if (settings) {
      const finalValue = isNumeric ? Number(value) : value;
      setSettings({
        ...settings,
        [parent]: {
          // @ts-ignore
          ...(settings[parent] || {}),
          [field]: finalValue,
        },
      });
    }
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
  
  const runNetworkTest = async (provider: string) => {
    setIsTesting(true);
    if (!autoRefresh) {
        setTestResults(null);
    }
    try {
        const response = await fetch('http://localhost:4000/api/network/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: provider.toLowerCase() }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `API returned status ${response.status}`);
        }
        const data = await response.json();
        setTestResults(data);
    } catch (error: any) {
        console.error("Network test failed:", error);
        setTestResults({ error: `Test failed: ${error.message}. Is the API server running?` });
    } finally {
        setIsTesting(false);
    }
  };

  useEffect(() => {
    if (autoRefresh) {
        runNetworkTest(testProvider); // Run immediately
        intervalRef.current = window.setInterval(() => {
            runNetworkTest(testProvider);
        }, 15000);
    } else {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }
    return () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };
  }, [autoRefresh, testProvider]);


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

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return 'Never connected';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 1) return `${days} days ago`;
    if (days === 1) return `1 day ago`;
    if (hours > 1) return `${hours} hours ago`;
    if (hours === 1) return `1 hour ago`;
    if (minutes > 1) return `${minutes} minutes ago`;
    if (minutes === 1) return `1 minute ago`;
    return 'Just now';
  };

  const handleRegenerateKey = (vendor: ApiVendor) => {
    if (!settings) return;
    if (!window.confirm(`Are you sure you want to regenerate the API key for ${vendor}? The old key will stop working immediately.`)) return;

    const newKey = 'jp_live_' + Math.random().toString(36).substr(2, 30) + Date.now().toString(36);
    
    const updatedKeys = {
        ...settings.apiKeys,
        [vendor]: newKey
    };
    
    setSettings({ ...settings, apiKeys: updatedKeys });
  };


  const SettingsCard: React.FC<{title: string, icon: any, children: React.ReactNode}> = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <Icon size={20} className="text-green-500" /> {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const InputField: React.FC<{label: string, value: any, onChange: (e: any) => void, type?: string, placeholder?: string}> = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
    <div>
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
      />
    </div>
  );

  const ToggleSwitch: React.FC<{label: string, enabled: boolean, onChange: (e: any) => void}> = ({ label, enabled, onChange }) => (
    <label className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={enabled} onChange={onChange} />
        <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'translate-x-4' : ''}`}></div>
      </div>
    </label>
  );

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
              
             {activeTab === 'general' && (
                <SettingsCard title="General Settings" icon={Globe}>
                    <ToggleSwitch label="Maintenance Mode" enabled={settings.maintenanceMode} onChange={e => handleSettingChange('maintenanceMode', e.target.checked)} />
                    <InputField label="App Name" value={settings.appName} onChange={e => handleSettingChange('appName', e.target.value)} />
                    <InputField label="Support Email" value={settings.supportEmail} onChange={e => handleSettingChange('supportEmail', e.target.value)} />
                    <InputField label="Support Phone" value={settings.supportPhone} onChange={e => handleSettingChange('supportPhone', e.target.value)} />
                </SettingsCard>
             )}

            {activeTab === 'services' && (
                <>
                    <SettingsCard title="Service Providers" icon={Server}>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.keys(settings.providerStatus).map(p => (
                                <ToggleSwitch key={p} label={p} enabled={settings.providerStatus[p]} onChange={() => toggleProvider(p)} />
                            ))}
                        </div>
                    </SettingsCard>
                    <SettingsCard title="Data Bundles" icon={Wifi}>
                        <button onClick={() => { setEditingBundle({isAvailable: true, isBestValue: false, type: PlanType.SME}); setShowBundleModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-bold shadow-md hover:bg-green-800 w-full justify-center">
                            <Plus size={16}/> Add New Bundle
                        </button>
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                          {bundles.map(b => (
                            <div key={b.id} className="p-3 border dark:border-gray-700 rounded-xl flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                                <div>
                                    <p className="font-bold text-sm text-gray-800 dark:text-white">{b.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">₦{b.price} | Cost: ₦{b.costPrice}</p>
                                </div>
                                <div className="flex gap-2">
                                    <ToggleSwitch label="" enabled={!!b.isAvailable} onChange={async (e) => {
                                      const updatedBundle = {...b, isAvailable: e.target.checked };
                                      await MockDB.saveBundle(updatedBundle);
                                      loadBundles();
                                    }}/>
                                    <button onClick={() => {setEditingBundle(b); setShowBundleModal(true);}} className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={16}/></button>
                                    <button onClick={() => handleBundleDelete(b.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                            </div>
                          ))}
                        </div>
                    </SettingsCard>
                </>
            )}

            {activeTab === 'api' && (
                <>
                    <SettingsCard title="API Vendor" icon={Key}>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Active API Vendor</label>
                        <select
                            value={settings.activeApiVendor}
                            onChange={e => handleSettingChange('activeApiVendor', e.target.value as ApiVendor)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                        >
                            {Object.keys(settings.apiKeys).map(vendor => <option key={vendor} value={vendor}>{vendor}</option>)}
                        </select>
                        <div className="space-y-6 pt-4">
                            {Object.keys(settings.apiKeys).map(vendor => (
                                <div key={vendor} className="p-4 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900">
                                    <h4 className="font-bold mb-2 text-gray-700 dark:text-gray-200">{vendor}</h4>
                                    <InputField
                                        label={`API Key`}
                                        value={settings.apiKeys[vendor as ApiVendor]}
                                        onChange={e => handleNestedChange('apiKeys', vendor, e.target.value)}
                                    />
                                    <div className="mt-4">
                                        <InputField
                                            label={`Webhook URL`}
                                            value={settings.webhookUrls[vendor as ApiVendor]}
                                            onChange={e => handleNestedChange('webhookUrls', vendor, e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleRegenerateKey(vendor as ApiVendor)}
                                            className="w-full justify-center flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                            <Key size={14}/> Regenerate Key
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                        Last connection: <span className="font-bold">{formatRelativeTime(settings.apiLastConnection?.[vendor as ApiVendor])}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SettingsCard>
                     <SettingsCard title="SMS (Twilio)" icon={MessageSquare}>
                        <ToggleSwitch label="Enable Twilio SMS" enabled={settings.enableTwilio} onChange={e => handleSettingChange('enableTwilio', e.target.checked)} />
                        <InputField label="Account SID" value={settings.twilioAccountSid} onChange={e => handleSettingChange('twilioAccountSid', e.target.value)} />
                        <InputField label="Auth Token" value={settings.twilioAuthToken} onChange={e => handleSettingChange('twilioAuthToken', e.target.value)} />
                        <InputField label="Sender ID" value={settings.twilioSenderId} onChange={e => handleSettingChange('twilioSenderId', e.target.value)} />
                    </SettingsCard>
                </>
            )}

            {activeTab === 'payment' && (
              <>
                <SettingsCard title="Service Fees (₦)" icon={DollarSign}>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Airtime Fee" type="number" value={settings.serviceFees.airtime} onChange={e => handleNestedChange('serviceFees', 'airtime', e.target.value, true)} />
                        <InputField label="Data Fee" type="number" value={settings.serviceFees.data} onChange={e => handleNestedChange('serviceFees', 'data', e.target.value, true)} />
                        <InputField label="Cable TV Fee" type="number" value={settings.serviceFees.cable} onChange={e => handleNestedChange('serviceFees', 'cable', e.target.value, true)} />
                        <InputField label="Electricity Fee" type="number" value={settings.serviceFees.electricity} onChange={e => handleNestedChange('serviceFees', 'electricity', e.target.value, true)} />
                    </div>
                </SettingsCard>
                <SettingsCard title="Payment Gateways" icon={CreditCard}>
                    <h4 className="text-sm font-bold border-b dark:border-gray-700 pb-2 mb-2 text-gray-700 dark:text-gray-200">Manual Bank Transfer</h4>
                    <InputField label="Bank Name" value={settings.bankName} onChange={e => handleSettingChange('bankName', e.target.value)} />
                    <InputField label="Account Number" value={settings.accountNumber} onChange={e => handleSettingChange('accountNumber', e.target.value)} />
                    <InputField label="Account Name" value={settings.accountName} onChange={e => handleSettingChange('accountName', e.target.value)} />
                    
                    <h4 className="text-sm font-bold border-b dark:border-gray-700 pb-2 mb-2 pt-4 text-gray-700 dark:text-gray-200">Paystack</h4>
                    <ToggleSwitch label="Enable Paystack" enabled={settings.enablePaystack} onChange={e => handleSettingChange('enablePaystack', e.target.checked)} />
                    <InputField label="Public Key" value={settings.paystackPublicKey} onChange={e => handleSettingChange('paystackPublicKey', e.target.value)} />
                    <InputField label="Secret Key" value={settings.paystackSecretKey} onChange={e => handleSettingChange('paystackSecretKey', e.target.value)} />
                </SettingsCard>
              </>
            )}

            {activeTab === 'referrals' && (
                <SettingsCard title="Referral Program" icon={Users}>
                    <ToggleSwitch label="Enable Referrals" enabled={settings.enableReferral} onChange={e => handleSettingChange('enableReferral', e.target.checked)} />
                    <InputField label="Referral Reward (₦)" type="number" value={settings.referralReward} onChange={e => handleSettingChange('referralReward', Number(e.target.value))} />
                    <InputField label="Min. Withdrawal (₦)" type="number" value={settings.referralMinWithdrawal} onChange={e => handleSettingChange('referralMinWithdrawal', Number(e.target.value))} />
                </SettingsCard>
            )}
            
            {activeTab === 'backup' && (
                <SettingsCard title="Backup & Restore" icon={Database}>
                    <button onClick={handleBackupDownload} className="w-full justify-center flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                        <Download size={16}/> Download Data Backup
                    </button>
                    <div className="relative p-4 border-2 border-dashed border-red-400 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
                        <p className="text-sm font-bold text-red-700 dark:text-red-300">Restore Backup</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mb-2">Warning: This will overwrite ALL existing data.</p>
                        <input type="file" accept=".json" onChange={handleRestore} className="text-xs absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                        <span className="text-xs font-bold py-2 px-4 bg-red-600 text-white rounded-lg">Select Backup File</span>
                    </div>
                </SettingsCard>
            )}

            {activeTab === 'app' && (
                <>
                  <SettingsCard title="Branding" icon={ImageIcon}>
                      <InputField label="App Name" value={settings.appName} onChange={e => handleSettingChange('appName', e.target.value)} />
                      <div className="flex items-center gap-4">
                        <img src={settings.logoUrl} className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 object-contain p-1" />
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Logo URL</label>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs" />
                        </div>
                      </div>
                  </SettingsCard>
                  <SettingsCard title="Landing Page" icon={Globe}>
                       <InputField label="Hero Title" value={settings.landingHeroTitle} onChange={e => handleSettingChange('landingHeroTitle', e.target.value)} />
                       <textarea
                            value={settings.landingHeroSubtitle}
                            onChange={e => handleSettingChange('landingHeroSubtitle', e.target.value)}
                            className="w-full p-3 h-24 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                        />
                  </SettingsCard>
                </>
            )}
            
            {activeTab === 'automation' && (
                <SettingsCard title="Automation / Cron Jobs" icon={Clock}>
                    {cronJobs.map(job => (
                        <div key={job.id} className="p-3 border dark:border-gray-700 rounded-xl flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                            <div>
                                <p className="font-bold text-sm text-gray-800 dark:text-white">{job.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{job.schedule} | Next: {job.nextRun}</p>
                            </div>
                            <button onClick={() => toggleCron(job.id)} className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${job.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {job.status === 'active' ? <Play size={12}/> : <Pause size={12}/>}
                                {job.status}
                            </button>
                        </div>
                    ))}
                </SettingsCard>
            )}

              {/* --- HEALTH TAB --- */}
              {activeTab === 'health' && (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Activity size={20} className="text-green-500"/> System & API Health</h3>
                      
                      {/* Live Network Quality Test */}
                      <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                          <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                              <h4 className="font-bold text-gray-800 dark:text-white">Live Network Quality Test</h4>
                              <div className="flex items-center gap-4 mt-2 md:mt-0">
                                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                                      <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} className="w-4 h-4 rounded accent-green-600"/>
                                      Auto-refresh (15s)
                                  </label>
                              </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mb-6">
                              <select
                                  value={testProvider}
                                  onChange={(e) => setTestProvider(e.target.value)}
                                  className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                                  disabled={isTesting && autoRefresh}
                              >
                                  <option>MTN</option>
                                  <option>GLO</option>
                                  <option>AIRTEL</option>
                                  <option>9MOBILE</option>
                              </select>
                              <button
                                  onClick={() => runNetworkTest(testProvider)}
                                  disabled={isTesting}
                                  className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                  {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                                  Run Test
                              </button>
                          </div>

                          {isTesting && !testResults && (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                  <p>Pinging servers, measuring speeds...</p>
                              </div>
                          )}
                          
                          {testResults && (
                              <div className="animate-fade-in">
                                  {testResults.error ? (
                                       <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-100 dark:border-red-800">{testResults.error}</div>
                                  ) : (
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                              <Zap size={20} className="mx-auto text-yellow-500 mb-2"/>
                                              <p className="text-xs font-bold text-gray-400 uppercase">Latency</p>
                                              <p className="text-xl font-black text-gray-900 dark:text-white">{testResults.latency}<span className="text-xs">ms</span></p>
                                          </div>
                                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                              <ArrowDown size={20} className="mx-auto text-blue-500 mb-2"/>
                                              <p className="text-xs font-bold text-gray-400 uppercase">Download</p>
                                              <p className="text-xl font-black text-gray-900 dark:text-white">{testResults.downloadSpeedMbps}<span className="text-xs">Mbps</span></p>
                                          </div>
                                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                              <ArrowUp size={20} className="mx-auto text-purple-500 mb-2"/>
                                              <p className="text-xs font-bold text-gray-400 uppercase">Upload</p>
                                              <p className="text-xl font-black text-gray-900 dark:text-white">{testResults.uploadSpeedMbps}<span className="text-xs">Mbps</span></p>
                                          </div>
                                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                              <Server size={20} className="mx-auto text-red-500 mb-2"/>
                                              <p className="text-xs font-bold text-gray-400 uppercase">Loss</p>
                                              <p className="text-xl font-black text-gray-900 dark:text-white">{testResults.packetLossPercent}<span className="text-xs">%</span></p>
                                          </div>
                                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-green-500 text-center">
                                              <Wifi size={20} className="mx-auto text-green-500 mb-2"/>
                                              <p className="text-xs font-bold text-gray-400 uppercase">Success Rate</p>
                                              <p className="text-xl font-black text-green-500">{testResults.successRate}<span className="text-xs">%</span></p>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>

                      {/* Existing Component Status Section */}
                      <div className="space-y-4 mt-8">
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-2">Component Status</h4>
                          {[
                              { name: 'Database (LocalStorage)', status: 'Online', color: 'text-green-500' },
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

          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-24">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-4">Save Changes</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Remember to save your changes before leaving the page. Some settings may require an app refresh to take effect.
                  </p>
                  <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-green-900/20 disabled:opacity-70"
                  >
                      {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18}/>}
                      Save All Settings
                  </button>
              </div>
          </div>
      </div>
      
      {/* Bundle Modal */}
      {showBundleModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{editingBundle.id ? 'Edit' : 'Create'} Data Bundle</h3>
                    {bundleError && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg mb-4">{bundleError}</p>}
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Provider" value={editingBundle.provider || ''} onChange={e => setEditingBundle({...editingBundle, provider: e.target.value as Provider})} />
                            <InputField label="Plan Type" value={editingBundle.type || ''} onChange={e => setEditingBundle({...editingBundle, type: e.target.value as PlanType})} />
                        </div>
                        <InputField label="Bundle Name" value={editingBundle.name || ''} onChange={e => setEditingBundle({...editingBundle, name: e.target.value})} placeholder="e.g. MTN SME 1GB" />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Data Amount" value={editingBundle.dataAmount || ''} onChange={e => setEditingBundle({...editingBundle, dataAmount: e.target.value})} placeholder="e.g. 1GB" />
                            <InputField label="Validity" value={editingBundle.validity || ''} onChange={e => setEditingBundle({...editingBundle, validity: e.target.value})} placeholder="e.g. 30 Days" />
                        </div>
                         <div className="grid grid-cols-3 gap-4">
                            <InputField label="Selling Price (₦)" type="number" value={editingBundle.price || ''} onChange={e => setEditingBundle({...editingBundle, price: e.target.value})} />
                            <InputField label="Reseller Price (₦)" type="number" value={editingBundle.resellerPrice || ''} onChange={e => setEditingBundle({...editingBundle, resellerPrice: e.target.value})} />
                            <InputField label="Cost Price (₦)" type="number" value={editingBundle.costPrice || ''} onChange={e => setEditingBundle({...editingBundle, costPrice: e.target.value})} />
                        </div>
                        <InputField label="API Plan ID" value={editingBundle.planId || ''} onChange={e => setEditingBundle({...editingBundle, planId: e.target.value})} placeholder="ID from your API Vendor" />
                        <div className="flex gap-4">
                            <ToggleSwitch label="Is Available?" enabled={!!editingBundle.isAvailable} onChange={e => setEditingBundle({...editingBundle, isAvailable: e.target.checked})} />
                            <ToggleSwitch label="Best Value?" enabled={!!editingBundle.isBestValue} onChange={e => setEditingBundle({...editingBundle, isBestValue: e.target.checked})} />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                        <button onClick={() => setShowBundleModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Cancel</button>
                        <button onClick={handleBundleSave} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save Bundle</button>
                    </div>
               </div>
          </div>
      )}
    </div>
  );
};