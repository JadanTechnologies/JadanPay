
import React, { useState, useEffect } from 'react';
import { Save, Globe, Smartphone, Building, Mail, Phone, ShieldAlert, CreditCard, Bell, Clock, FileText, Upload, Link as LinkIcon, Server, Database, Plus, Trash2, Edit2, Check, X, HardDrive, Download, RefreshCcw, Gift, LayoutTemplate, Activity, Share2, ImageIcon, Lock } from 'lucide-react';
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

  const handleEditBundle = (b: Bundle) => {
      setEditingBundle(b);
      setShowBundleModal(true);
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
                <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <ImageIcon size={14}/> Brand Icon URL
                     </label>
                     <div className="flex gap-4 items-center">
                         <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center p-2 border border-gray-200">
                             {settings.logoUrl ? (
                                 <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                             ) : (
                                 <Building size={24} className="text-gray-400" />
                             )}
                         </div>
                         <input 
                            type="text" 
                            value={settings.logoUrl}
                            onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="https://example.com/logo.png"
                        />
                     </div>
                     <p className="text-xs text-gray-400 mt-2">Paste a URL to your transparent PNG logo.</p>
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

      {activeTab === 'services' && (
          <div className="grid grid-cols-1 gap-8 animate-fade-in">
              {/* Provider Availability */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                       <Server className="text-blue-500" size={20} /> Network Availability
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       {Object.keys(settings.providerStatus).map(key => (
                           <div key={key} className={`p-4 rounded-xl border-2 flex items-center justify-between ${
                               settings.providerStatus[key] ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-80'
                           }`}>
                               <div className="flex items-center gap-2">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${key === '9MOBILE' ? 'bg-green-800' : PROVIDER_COLORS[key].split(' ')[0]}`}>
                                       {PROVIDER_LOGOS[key].charAt(0)}
                                   </div>
                                   <span className="font-bold text-gray-700">{PROVIDER_LOGOS[key]}</span>
                               </div>
                               <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={settings.providerStatus[key]}
                                        onChange={() => toggleProvider(key)}
                                    />
                                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                           </div>
                       ))}
                   </div>
              </div>

              {/* Bundle Management */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Database className="text-purple-500" size={20} /> Data Bundles
                        </h3>
                        <button 
                            onClick={() => {
                                setEditingBundle({ isAvailable: true, isBestValue: false, type: PlanType.SME });
                                setShowBundleModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800"
                        >
                            <Plus size={16}/> Add Bundle
                        </button>
                   </div>

                   <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="p-3">Network</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Plan Name</th>
                                    <th className="p-3">Price</th>
                                    <th className="p-3">Plan ID</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bundles.map(b => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-bold text-gray-600">{PROVIDER_LOGOS[b.provider]}</td>
                                        <td className="p-3 text-xs uppercase bg-gray-100 rounded-lg text-center px-2 py-1 w-min whitespace-nowrap">{b.type}</td>
                                        <td className="p-3">{b.name}</td>
                                        <td className="p-3 font-bold text-green-700">₦{b.price}</td>
                                        <td className="p-3 font-mono text-xs text-gray-500">{b.planId}</td>
                                        <td className="p-3">
                                            {b.isAvailable !== false ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Active</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Disabled</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            <button onClick={() => handleEditBundle(b)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDeleteBundle(b.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
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
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto animate-fade-in space-y-6">
               <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <Server className="text-orange-500" size={20} /> Service API Integration
               </h3>
               
               <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-gray-800">BilalSadaSub Service</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.useBilalService}
                                onChange={(e) => setSettings({...settings, useBilalService: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">API Key</label>
                            <input 
                                type="password" 
                                value={settings.bilalApiKey}
                                onChange={(e) => setSettings({...settings, bilalApiKey: e.target.value})}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="****************"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Connected to BilalSadaSub v1.0
                        </div>
                    </div>
               </div>
          </div>
      )}

      {activeTab === 'payment' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto animate-fade-in space-y-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <CreditCard className="text-green-600" size={20} /> Payment Configuration
               </h3>
               
               <div className="space-y-4">
                   <div className="p-4 bg-green-50 border border-green-100 rounded-xl mb-4">
                       <h4 className="font-bold text-green-800 mb-1">Manual Funding (Bank Transfer)</h4>
                       <p className="text-xs text-green-600">These details will be shown to users when they select "Manual Transfer".</p>
                   </div>
                   
                   <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bank Name</label>
                        <input 
                            type="text" 
                            value={settings.bankName}
                            onChange={(e) => setSettings({...settings, bankName: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                        />
                   </div>
                   <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Account Number</label>
                        <input 
                            type="text" 
                            value={settings.accountNumber}
                            onChange={(e) => setSettings({...settings, accountNumber: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono"
                        />
                   </div>
                   <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Account Name</label>
                        <input 
                            type="text" 
                            value={settings.accountName}
                            onChange={(e) => setSettings({...settings, accountName: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                        />
                   </div>
               </div>
          </div>
      )}

      {activeTab === 'communication' && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-in">
              <Bell className="mx-auto text-purple-200 mb-4" size={64}/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Communication Settings</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">Manage SMS templates, Broadcasts, and Announcements in the dedicated Communication Hub.</p>
              <button className="px-6 py-2 bg-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  Go to Communication Hub
              </button>
          </div>
      )}

      {activeTab === 'automation' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto animate-fade-in space-y-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <Clock className="text-red-500" size={20} /> System Automation
               </h3>
               
               <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                   <div>
                       <h4 className="font-bold text-gray-800">Maintenance Mode</h4>
                       <p className="text-xs text-gray-500">Prevent non-admin users from accessing the platform.</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.maintenanceMode}
                            onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                   </label>
               </div>
          </div>
      )}

      {activeTab === 'backup' && (
           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto animate-fade-in space-y-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <HardDrive className="text-gray-600" size={20} /> Data & Backup
               </h3>
               <p className="text-gray-500 text-sm">Export your database as JSON for safekeeping or migration.</p>

               <div className="grid grid-cols-2 gap-6">
                   <button 
                        onClick={handleDownloadBackup}
                        disabled={isSaving}
                        className="p-6 border-2 border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-green-500 hover:bg-green-50 transition-colors"
                   >
                       <Download size={32} className="text-gray-400"/>
                       <span className="font-bold text-gray-700">Download Backup</span>
                   </button>
                   
                   <label className="p-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                       <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
                       <RefreshCcw size={32} className="text-gray-400"/>
                       <span className="font-bold text-gray-700">Restore Data</span>
                   </label>
               </div>
           </div>
      )}

      {/* Bundle Modal */}
      {showBundleModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                   <h3 className="text-lg font-bold mb-4">{editingBundle.id ? 'Edit Bundle' : 'New Bundle'}</h3>
                   <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Network</label>
                                <select 
                                    className="w-full p-3 border rounded-xl bg-white"
                                    value={editingBundle.provider}
                                    onChange={e => setEditingBundle({...editingBundle, provider: e.target.value as any})}
                                >
                                    {Object.values(Provider).map(p => <option key={p} value={p}>{PROVIDER_LOGOS[p]}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                <select 
                                    className="w-full p-3 border rounded-xl bg-white"
                                    value={editingBundle.type}
                                    onChange={e => setEditingBundle({...editingBundle, type: e.target.value as any})}
                                >
                                    <option value={PlanType.SME}>SME</option>
                                    <option value={PlanType.GIFTING}>Gifting</option>
                                    <option value={PlanType.CORPORATE}>Corporate</option>
                                </select>
                            </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plan ID (API)</label>
                                <input 
                                    className="w-full p-3 border rounded-xl"
                                    placeholder="e.g. 101"
                                    value={editingBundle.planId || ''}
                                    onChange={e => setEditingBundle({...editingBundle, planId: e.target.value})}
                                />
                           </div>
                           <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (₦)</label>
                                <input 
                                    type="number"
                                    className="w-full p-3 border rounded-xl"
                                    placeholder="0.00"
                                    value={editingBundle.price || ''}
                                    onChange={e => setEditingBundle({...editingBundle, price: Number(e.target.value)})}
                                />
                           </div>
                       </div>

                       <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name (Optional)</label>
                            <input 
                                className="w-full p-3 border rounded-xl"
                                placeholder="e.g. 1GB SME 30Days"
                                value={editingBundle.name || ''}
                                onChange={e => setEditingBundle({...editingBundle, name: e.target.value})}
                            />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Amount</label>
                                <input 
                                    className="w-full p-3 border rounded-xl"
                                    placeholder="e.g. 1.5GB"
                                    value={editingBundle.dataAmount || ''}
                                    onChange={e => setEditingBundle({...editingBundle, dataAmount: e.target.value})}
                                />
                           </div>
                           <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Validity</label>
                                <input 
                                    className="w-full p-3 border rounded-xl"
                                    placeholder="e.g. 30 Days"
                                    value={editingBundle.validity || ''}
                                    onChange={e => setEditingBundle({...editingBundle, validity: e.target.value})}
                                />
                           </div>
                       </div>

                       <div className="flex flex-col gap-2 pt-2">
                           <label className="flex items-center gap-2 cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   checked={editingBundle.isBestValue}
                                   onChange={e => setEditingBundle({...editingBundle, isBestValue: e.target.checked})}
                               />
                               <span className="text-sm">Mark as Best Value</span>
                           </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   checked={editingBundle.isAvailable !== false}
                                   onChange={e => setEditingBundle({...editingBundle, isAvailable: e.target.checked})}
                               />
                               <span className="text-sm">Enabled / In Stock</span>
                           </label>
                       </div>

                       <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowBundleModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
                            <button onClick={handleSaveBundle} className="flex-1 py-2 bg-green-700 text-white rounded-xl font-bold">Save Bundle</button>
                       </div>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};
