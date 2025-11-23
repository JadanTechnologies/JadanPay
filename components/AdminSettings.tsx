import React, { useState, useEffect } from 'react';
import { Save, Globe, Smartphone, Building, Mail, Phone, ShieldAlert, CreditCard, Bell, Clock, FileText, Upload } from 'lucide-react';
import { Provider } from '../types';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '../constants';
import { SettingsService, AppSettings } from '../services/settingsService';

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'communication' | 'automation'>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await SettingsService.getSettings();
    setSettings(data);
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

  if (!settings) return <div className="p-10 text-center text-gray-400">Loading settings...</div>;

  const TabButton = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
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

      <div className="flex gap-2 overflow-x-auto pb-2">
          <TabButton id="general" icon={Building} label="Brand & General" />
          <TabButton id="payment" icon={CreditCard} label="Payments & Gateways" />
          <TabButton id="communication" icon={Bell} label="SMS & Email" />
          <TabButton id="automation" icon={Clock} label="Automation & Cron" />
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

            {/* Service Status */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Globe className="text-blue-500" size={20} /> Service Providers
                </h3>
                <div className="space-y-3">
                    {Object.values(Provider).map((p) => (
                        <div key={p} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${PROVIDER_COLORS[p]}`}>
                                    {PROVIDER_LOGOS[p].charAt(0)}
                                </div>
                                <span className="font-bold text-gray-800 text-sm">{PROVIDER_LOGOS[p]}</span>
                            </div>
                            <button 
                                onClick={() => toggleProvider(p)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                    settings.providerStatus[p] 
                                    ? 'bg-white text-red-600 border-gray-200' 
                                    : 'bg-green-600 text-white border-green-600'
                                }`}
                            >
                                {settings.providerStatus[p] ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    ))}
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

               {/* Templates */}
               <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText size={18}/> Message Templates</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Welcome Email</label>
                           <textarea className="w-full h-32 p-3 mt-1 bg-gray-50 border rounded-xl text-sm" defaultValue="Welcome to JadanPay, {name}! We are glad to have you."></textarea>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Transaction Receipt (SMS)</label>
                           <textarea className="w-full h-32 p-3 mt-1 bg-gray-50 border rounded-xl text-sm" defaultValue="Tx Successful: {amount} {type} for {number}. Ref: {ref}"></textarea>
                       </div>
                   </div>
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

    </div>
  );
};