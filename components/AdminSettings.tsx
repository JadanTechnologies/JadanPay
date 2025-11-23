
import React, { useState, useEffect } from 'react';
import { Save, Globe, Smartphone, Building, Mail, Phone, ShieldAlert, CreditCard, Bell, Clock, FileText, Upload, Link as LinkIcon, Server, Database, Plus, Trash2, Edit2, Check, X, HardDrive, Download, RefreshCcw, Gift, LayoutTemplate, Activity, Share2 } from 'lucide-react';
import { Provider, Bundle, PlanType } from '../types';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '../constants';
import { SettingsService, AppSettings } from '../services/settingsService';
import { MockDB } from '../services/mockDb';

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'landing' | 'services' | 'payment' | 'communication' | 'automation' | 'integrations' | 'backup'>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Bundle Modal State
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Partial<Bundle>>({ isAvailable: true, isBestValue: false, type: PlanType.SME });
  
  // Mobile App File State (Mock)
  const [appFile, setAppFile] = useState<File | null>(null);

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

  const handleAppUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          setAppFile(e.target.files[0]);
          // Simulate upload by setting a fake URL
          if(settings) {
              setSettings({
                  ...settings, 
                  mobileAppUrl: `https://cdn.jadanpay.com/downloads/${e.target.files[0].name}`,
                  mobileAppReleaseDate: new Date().toISOString()
              });
          }
      }
  };

  const toggleProvider = (key: string) => {
      if (!settings) return;
      setSettings({
          ...settings,
          providerStatus: {
              ...settings.providerStatus,
              [key]: !settings.providerStatus[key]
          }
      });
  };

  const updateProviderStat = (key: string, value: number) => {
      if (!settings) return;
      setSettings({
          ...settings,
          providerStats: {
              ...settings.providerStats,
              [key]: value
          }
      });
  };

  // Bundle CRUD
  const handleSaveBundle = async () => {
      if(!editingBundle.provider || !editingBundle.price || !editingBundle.planId) {
          alert("Please fill all required fields (Provider, Price, Plan ID)");
          return;
      }

      const b: Bundle = {
          id: editingBundle.id || Math.random().toString(36).substr(2, 9),
          provider: editingBundle.provider as Provider,
          type: editingBundle.type || PlanType.SME,
          name: editingBundle.name || `${editingBundle.dataAmount} ${editingBundle.validity}`,
          price: Number(editingBundle.price),
          costPrice: Number(editingBundle.costPrice) || Number(editingBundle.price), // Default cost to price if not set
          dataAmount: editingBundle.dataAmount || '0MB',
          validity: editingBundle.validity || '1 Day',
          planId: editingBundle.planId,
          isBestValue: editingBundle.isBestValue,
          isAvailable: editingBundle.isAvailable
      };

      await MockDB.saveBundle(b);
      setShowBundleModal(false);
      setEditingBundle({ isAvailable: true, isBestValue: false, type: PlanType.SME });
      loadBundles();
  };

  const handleDeleteBundle = async (id: string) => {
      if(window.confirm("Delete this data plan?")) {
          await MockDB.deleteBundle(id);
          loadBundles();
      }
  };

  // --- Backup & Restore Handlers ---
  const handleDownloadBackup = async () => {
      setIsSaving(true);
      try {
          const dump = await MockDB.getDatabaseDump();
          const jsonString = JSON.stringify(dump, null, 2);
          const blob = new Blob([jsonString], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `jadanpay_backup_${new Date().toISOString().slice(0,10)}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (e) {
          alert("Failed to generate backup");
      } finally {
          setIsSaving(false);
      }
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
          const content = e.target?.result;
          try {
              if (typeof content === 'string') {
                  const dump = JSON.parse(content);
                  if (window.confirm("WARNING: This will overwrite all current data (Users, Transactions, Settings). Are you sure?")) {
                      await MockDB.restoreDatabase(dump);
                      alert("Database restored successfully! The page will reload.");
                      window.location.reload();
                  }
              }
          } catch (err) {
              alert("Invalid Backup File. Please check the JSON format.");
          }
      };
      reader.readAsText(file);
  };

  if (!settings) return <div className="p-10 text-center text-gray-400">Loading settings...</div>;

  const TabButton = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === id 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'text-gray-500 hover:bg-gray-50'
        }`}
    >
        <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-24">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Platform Settings</h2>
            <p className="text-gray-500 text-sm">Global configurations and integrations.</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-colors shadow-lg shadow-green-700/20 active:scale-95 disabled:opacity-70"
        >
            {isSaving ? <span className="animate-spin">⏳</span> : <Save size={18} />}
            Save Changes
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <TabButton id="general" icon={Building} label="Brand & General" />
          <TabButton id="landing" icon={LayoutTemplate} label="Landing & App" />
          <TabButton id="services" icon={Database} label="Services & Pricing" />
          <TabButton id="integrations" icon={Server} label="Service APIs" />
          <TabButton id="payment" icon={CreditCard} label="Payments" />
          <TabButton id="communication" icon={Bell} label="SMS & Email" />
          <TabButton id="automation" icon={Clock} label="Automation" />
          <TabButton id="backup" icon={HardDrive} label="Data & Backups" />
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
             {/* Brand & Assets */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Building className="text-gray-400" size={20} /> Identity
                </h3>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">App Name</label>
                    <input 
                        type="text" 
                        value={settings.appName}
                        onChange={(e) => setSettings({...settings, appName: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50">
                        <Upload size={24} className="mx-auto text-gray-400 mb-2"/>
                        <p className="text-xs font-bold text-gray-500">Upload Logo</p>
                     </div>
                     <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50">
                        <Upload size={24} className="mx-auto text-gray-400 mb-2"/>
                        <p className="text-xs font-bold text-gray-500">Upload Favicon</p>
                     </div>
                </div>
            </div>

            {/* Referral Settings */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Gift className="text-purple-500" size={20} /> Referral System
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.enableReferral}
                            onChange={(e) => setSettings({...settings, enableReferral: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Referral Bonus (₦)</label>
                    <input 
                        type="number" 
                        value={settings.referralReward}
                        onChange={(e) => setSettings({...settings, referralReward: Number(e.target.value)})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="100"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                        Amount credited to a user's bonus wallet when a friend they referred signs up.
                    </p>
                 </div>
            </div>
        </div>
      )}

      {activeTab === 'landing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              {/* Content Configuration */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <LayoutTemplate className="text-blue-500" size={20} /> Landing Page Content
                  </h3>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hero Title</label>
                      <input 
                          type="text" 
                          value={settings.landingHeroTitle}
                          onChange={(e) => setSettings({...settings, landingHeroTitle: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Stop Overpaying For Data."
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hero Subtitle</label>
                      <textarea 
                          value={settings.landingHeroSubtitle}
                          onChange={(e) => setSettings({...settings, landingHeroSubtitle: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24"
                          placeholder="Experience the future of VTU..."
                      />
                  </div>
                  
                  {/* Stats Editing */}
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Activity size={12}/> Display Statistics
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                          <input 
                            placeholder="Active Users (e.g. 10K+)"
                            value={settings.landingStats.activeUsers}
                            onChange={(e) => setSettings({...settings, landingStats: {...settings.landingStats, activeUsers: e.target.value}})}
                            className="p-3 border rounded-xl bg-gray-50"
                          />
                           <input 
                            placeholder="Daily Tx (e.g. 5000+)"
                            value={settings.landingStats.dailyTransactions}
                            onChange={(e) => setSettings({...settings, landingStats: {...settings.landingStats, dailyTransactions: e.target.value}})}
                            className="p-3 border rounded-xl bg-gray-50"
                          />
                           <input 
                            placeholder="Uptime (e.g. 99.9%)"
                            value={settings.landingStats.uptime}
                            onChange={(e) => setSettings({...settings, landingStats: {...settings.landingStats, uptime: e.target.value}})}
                            className="p-3 border rounded-xl bg-gray-50"
                          />
                           <input 
                            placeholder="Support (e.g. 24/7)"
                            value={settings.landingStats.support}
                            onChange={(e) => setSettings({...settings, landingStats: {...settings.landingStats, support: e.target.value}})}
                            className="p-3 border rounded-xl bg-gray-50"
                          />
                      </div>
                  </div>

                  {/* Social Links */}
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Share2 size={12}/> Social Media Links
                      </label>
                      <div className="space-y-3">
                           <input 
                            placeholder="Twitter URL"
                            value={settings.socialLinks.twitter}
                            onChange={(e) => setSettings({...settings, socialLinks: {...settings.socialLinks, twitter: e.target.value}})}
                            className="w-full p-3 border rounded-xl bg-gray-50"
                          />
                           <input 
                            placeholder="Instagram URL"
                            value={settings.socialLinks.instagram}
                            onChange={(e) => setSettings({...settings, socialLinks: {...settings.socialLinks, instagram: e.target.value}})}
                            className="w-full p-3 border rounded-xl bg-gray-50"
                          />
                           <input 
                            placeholder="Facebook URL"
                            value={settings.socialLinks.facebook}
                            onChange={(e) => setSettings({...settings, socialLinks: {...settings.socialLinks, facebook: e.target.value}})}
                            className="w-full p-3 border rounded-xl bg-gray-50"
                          />
                      </div>
                  </div>
              </div>

              {/* Mobile App Configuration */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Smartphone className="text-purple-500" size={20} /> Mobile Application
                  </h3>
                  
                  <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center relative hover:bg-gray-100 transition-colors">
                      <input 
                        type="file" 
                        accept=".apk,.ipa"
                        onChange={handleAppUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload size={32} className="mx-auto text-gray-400 mb-2"/>
                      {appFile ? (
                          <div className="text-green-600">
                              <p className="font-bold">{appFile.name}</p>
                              <p className="text-xs">Ready to update</p>
                          </div>
                      ) : (
                          <div className="text-gray-500">
                              <p className="font-bold text-sm">Upload Android APK / iOS IPA</p>
                              <p className="text-xs opacity-70">Drag & Drop or Click to browse</p>
                          </div>
                      )}
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">App Version</label>
                      <input 
                          type="text" 
                          value={settings.mobileAppVersion}
                          onChange={(e) => setSettings({...settings, mobileAppVersion: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                          placeholder="1.0.0"
                      />
                  </div>
                  
                  {settings.mobileAppUrl && (
                      <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg break-all">
                          <strong>Current Download URL:</strong><br/>
                          {settings.mobileAppUrl}
                          <br/>
                          <span className="text-gray-400 text-[10px] mt-1 block">Updated: {new Date(settings.mobileAppReleaseDate).toLocaleDateString()}</span>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Other Tabs (Services, Integrations, etc.) are rendered here (code omitted for brevity but preserved in full output logic) */}
      {activeTab === 'services' && (
          <div className="space-y-6 animate-fade-in">
              {/* Network Availability Control */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <Globe className="text-blue-500" size={20} /> Network Availability & Success Rates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.values(Provider).map((p) => (
                          <div key={p} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${PROVIDER_COLORS[p]}`}>
                                          {PROVIDER_LOGOS[p].charAt(0)}
                                      </div>
                                      <span className="font-bold text-gray-800 text-sm">{PROVIDER_LOGOS[p]}</span>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          className="sr-only peer"
                                          checked={settings.providerStatus[p]}
                                          onChange={() => toggleProvider(p)}
                                      />
                                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                  </label>
                              </div>
                              
                              <div>
                                  <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-500 font-bold">Success Rate</span>
                                      <span className={`font-bold ${
                                          (settings.providerStats?.[p] ?? 100) > 80 ? 'text-green-600' : 
                                          (settings.providerStats?.[p] ?? 100) > 50 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                          {settings.providerStats?.[p] ?? 100}%
                                      </span>
                                  </div>
                                  <input 
                                      type="range" 
                                      min="0" 
                                      max="100" 
                                      value={settings.providerStats?.[p] ?? 100}
                                      onChange={(e) => updateProviderStat(p, Number(e.target.value))}
                                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Data Plans Manager */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <Database className="text-green-600" size={20} /> Data Plans & Pricing
                      </h3>
                      <button 
                          onClick={() => {
                              setEditingBundle({ isAvailable: true, isBestValue: false, type: PlanType.SME });
                              setShowBundleModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-green-800"
                      >
                          <Plus size={16}/> Add Plan
                      </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                              <tr>
                                  <th className="p-3">Provider</th>
                                  <th className="p-3">Type</th>
                                  <th className="p-3">Plan Name</th>
                                  <th className="p-3">API Plan ID</th>
                                  <th className="p-3">Cost (₦)</th>
                                  <th className="p-3">Selling (₦)</th>
                                  <th className="p-3">Profit</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {bundles.map(b => (
                                  <tr key={b.id} className="hover:bg-gray-50">
                                      <td className="p-3">
                                          <span className={`px-2 py-1 rounded text-[10px] font-bold text-white ${PROVIDER_COLORS[b.provider]}`}>
                                              {PROVIDER_LOGOS[b.provider]}
                                          </span>
                                      </td>
                                      <td className="p-3">
                                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold text-[10px]">{b.type || 'SME'}</span>
                                      </td>
                                      <td className="p-3 font-medium text-gray-800">{b.name}</td>
                                      <td className="p-3 font-mono text-gray-500">{b.planId}</td>
                                      <td className="p-3 font-medium text-red-600">₦{b.costPrice || b.price * 0.95}</td>
                                      <td className="p-3 font-bold text-green-700">₦{b.price}</td>
                                      <td className="p-3 font-bold text-blue-600">
                                          ₦{b.price - (b.costPrice || b.price * 0.95)}
                                      </td>
                                      <td className="p-3">
                                          {b.isAvailable !== false ? (
                                              <span className="text-green-600 flex items-center gap-1"><Check size={12}/> Active</span>
                                          ) : (
                                              <span className="text-red-400 flex items-center gap-1"><X size={12}/> Inactive</span>
                                          )}
                                      </td>
                                      <td className="p-3 text-right">
                                          <div className="flex justify-end gap-2">
                                              <button 
                                                onClick={() => { setEditingBundle(b); setShowBundleModal(true); }}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                              >
                                                  <Edit2 size={14}/>
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteBundle(b.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                              >
                                                  <Trash2 size={14}/>
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'integrations' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Server className="text-purple-600" size={20} /> BilalSadaSub API
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Primary provider for Airtime and Data services.</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500">Status:</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.useBilalService}
                                onChange={(e) => setSettings({...settings, useBilalService: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">API Key</label>
                          <input 
                              type="password" 
                              value={settings.bilalApiKey}
                              onChange={(e) => setSettings({...settings, bilalApiKey: e.target.value})}
                              placeholder="Paste your BilalSadaSub API Key here"
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                          />
                      </div>
                      <div className="flex gap-4">
                          <div className="flex-1">
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Base URL</label>
                              <div className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm flex items-center gap-2">
                                  <LinkIcon size={14}/> https://app.bilalsadasub.com/api/v1
                              </div>
                          </div>
                      </div>
                      
                      {settings.useBilalService && !settings.bilalApiKey && (
                          <div className="p-3 bg-yellow-50 text-yellow-700 text-xs rounded-lg border border-yellow-100 flex items-center gap-2">
                              <ShieldAlert size={16}/> Warning: Integration is enabled but API Key is missing.
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'payment' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4">Manual Payment Gateway</h3>
                  <p className="text-sm text-gray-500 mb-2">Instructions for users to make manual transfers.</p>
                  <textarea 
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Bank Name: GTBank&#10;Account No: 0123456789&#10;Account Name: JadanPay LTD"
                    defaultValue="Bank Name: GTBank&#10;Account No: 0123456789&#10;Account Name: JadanPay LTD"
                  ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {['Paystack', 'Flutterwave', 'Monnify'].map(gw => (
                      <div key={gw} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-gray-800">{gw}</h3>
                              <input type="checkbox" className="toggle" defaultChecked />
                          </div>
                          <div className="space-y-3">
                              <input type="text" placeholder="Public Key" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                              <input type="password" placeholder="Secret Key" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'communication' && (
          <div className="space-y-6 animate-fade-in">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* SMS */}
                   <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                       <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Smartphone size={18}/> SMS Provider</h3>
                       <select className="w-full p-2 bg-gray-50 border rounded-lg mb-4 text-sm">
                           <option>Twilio</option>
                           <option>Termii</option>
                           <option>Infobip</option>
                       </select>
                       <div className="space-y-3">
                           <input type="text" placeholder="SID / API Key" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                           <input type="password" placeholder="Auth Token" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                           <input type="text" placeholder="Sender ID" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                       </div>
                   </div>
                   
                   {/* Email */}
                   <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                       <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Mail size={18}/> Email Provider</h3>
                       <select className="w-full p-2 bg-gray-50 border rounded-lg mb-4 text-sm">
                           <option>SMTP</option>
                           <option>Resend</option>
                           <option>SendGrid</option>
                       </select>
                       <div className="space-y-3">
                           <input type="text" placeholder="Host / API Key" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                           <input type="text" placeholder="Port" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                           <input type="text" placeholder="From Email" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                       </div>
                   </div>

                    {/* Push */}
                   <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                       <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Bell size={18}/> Push Notifications</h3>
                       <select className="w-full p-2 bg-gray-50 border rounded-lg mb-4 text-sm">
                           <option>Firebase (FCM)</option>
                           <option>OneSignal</option>
                       </select>
                       <div className="space-y-3">
                           <input type="text" placeholder="App ID" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                           <input type="password" placeholder="Server Key" className="w-full p-2 text-xs bg-gray-50 border rounded-lg" />
                       </div>
                   </div>
               </div>

               <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   <p className="text-sm text-gray-500">To create and manage message templates, please visit the <strong className="text-green-700">Communication Hub</strong>.</p>
               </div>
          </div>
      )}

      {activeTab === 'automation' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={18}/> Cron Jobs Configuration</h3>
                  <div className="space-y-4">
                      {['Retry Failed Transactions', 'Process Recurring Billing', 'Send Low Balance Alerts', 'Database Cleanup'].map((job, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                              <div>
                                  <p className="font-bold text-gray-800">{job}</p>
                                  <p className="text-xs text-gray-500">Last run: 5 mins ago</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <select className="p-2 text-xs border rounded-lg">
                                      <option>Every 5 Mins</option>
                                      <option>Hourly</option>
                                      <option>Daily</option>
                                  </select>
                                  <button className="p-2 text-green-600 bg-green-100 rounded-lg text-xs font-bold">Run Now</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'backup' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-2xl p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">Data Management</h2>
                  <p className="text-blue-200">Export your database to a secure local file or restore from a previous backup.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Export */}
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                          <Download size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Backup Database</h3>
                      <p className="text-gray-500 text-sm mb-6">
                          Download a complete JSON dump of all users, transactions, settings, and configuration data.
                      </p>
                      <button 
                          onClick={handleDownloadBackup}
                          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                          <Download size={18} /> Download JSON
                      </button>
                  </div>

                  {/* Import */}
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4">
                          <RefreshCcw size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Restore Database</h3>
                      <p className="text-gray-500 text-sm mb-6">
                          Upload a previously downloaded JSON backup file to overwrite current data.
                      </p>
                      <div className="relative w-full">
                          <input 
                              type="file" 
                              accept=".json"
                              onChange={handleRestoreBackup}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <button 
                              className="w-full py-3 bg-white border-2 border-orange-500 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                          >
                              <Upload size={18} /> Select Backup File
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Bundle Modal */}
      {showBundleModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                  <h3 className="font-bold text-lg mb-4">{editingBundle.id ? 'Edit' : 'Add'} Data Plan</h3>
                  <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs font-bold text-gray-500 block mb-1">Provider</label>
                              <select 
                                className="w-full p-3 border rounded-xl bg-white"
                                value={editingBundle.provider || ''}
                                onChange={e => setEditingBundle({...editingBundle, provider: e.target.value as Provider})}
                              >
                                  <option value="" disabled>Select Provider</option>
                                  {Object.values(Provider).map(p => (
                                      <option key={p} value={p}>{PROVIDER_LOGOS[p]}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 block mb-1">Plan Type</label>
                              <select 
                                className="w-full p-3 border rounded-xl bg-white"
                                value={editingBundle.type || PlanType.SME}
                                onChange={e => setEditingBundle({...editingBundle, type: e.target.value as PlanType})}
                              >
                                  {Object.values(PlanType).map(t => (
                                      <option key={t} value={t}>{t}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs font-bold text-gray-500 block mb-1">Data Amount</label>
                              <input 
                                className="w-full p-3 border rounded-xl" 
                                placeholder="e.g. 1.5GB"
                                value={editingBundle.dataAmount || ''}
                                onChange={e => setEditingBundle({...editingBundle, dataAmount: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 block mb-1">Validity</label>
                              <input 
                                className="w-full p-3 border rounded-xl" 
                                placeholder="e.g. 30 Days"
                                value={editingBundle.validity || ''}
                                onChange={e => setEditingBundle({...editingBundle, validity: e.target.value})}
                              />
                          </div>
                      </div>
                      <div>
                           <label className="text-xs font-bold text-gray-500 block mb-1">Plan Name (Display Name)</label>
                           <input 
                                className="w-full p-3 border rounded-xl" 
                                placeholder="e.g. 1.5GB Monthly"
                                value={editingBundle.name || ''}
                                onChange={e => setEditingBundle({...editingBundle, name: e.target.value})}
                              />
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Pricing Strategy</p>
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 block mb-1">Cost Price (₦)</label>
                                  <input 
                                    type="number"
                                    className="w-full p-3 border rounded-xl bg-white focus:ring-red-200 border-red-200" 
                                    value={editingBundle.costPrice || ''}
                                    placeholder="API Cost"
                                    onChange={e => setEditingBundle({...editingBundle, costPrice: Number(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 block mb-1">Selling Price (₦)</label>
                                  <input 
                                    type="number"
                                    className="w-full p-3 border rounded-xl bg-white focus:ring-green-200 border-green-200" 
                                    value={editingBundle.price || ''}
                                    placeholder="User Price"
                                    onChange={e => setEditingBundle({...editingBundle, price: Number(e.target.value)})}
                                  />
                              </div>
                          </div>
                          <div className="mt-2 text-right">
                               <span className="text-xs text-gray-500">
                                   Estimated Profit: <span className="font-bold text-blue-600">
                                       ₦{(Number(editingBundle.price || 0) - Number(editingBundle.costPrice || 0)).toLocaleString()}
                                   </span>
                               </span>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-500 block mb-1">API Plan ID</label>
                          <input 
                            className="w-full p-3 border rounded-xl font-mono text-sm" 
                            placeholder="e.g. 1001"
                            value={editingBundle.planId || ''}
                            onChange={e => setEditingBundle({...editingBundle, planId: e.target.value})}
                          />
                      </div>
                      
                      <div className="flex gap-4 pt-2">
                          <label className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={editingBundle.isAvailable ?? true}
                                onChange={e => setEditingBundle({...editingBundle, isAvailable: e.target.checked})}
                              />
                              <span className="text-sm">Available</span>
                          </label>
                          <label className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={editingBundle.isBestValue ?? false}
                                onChange={e => setEditingBundle({...editingBundle, isBestValue: e.target.checked})}
                              />
                              <span className="text-sm">Best Value Tag</span>
                          </label>
                      </div>

                      <div className="flex gap-3 mt-4">
                          <button onClick={() => setShowBundleModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
                          <button onClick={handleSaveBundle} className="flex-1 py-2 bg-green-700 text-white rounded-xl font-bold">Save Plan</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
