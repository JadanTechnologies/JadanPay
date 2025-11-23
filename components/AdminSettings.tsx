
import React, { useState } from 'react';
import { Save, Globe, Smartphone, Building, Mail, Phone, ShieldAlert, Check, X } from 'lucide-react';
import { Provider } from '../types';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '../constants';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    appName: 'JadanPay',
    supportEmail: 'help@jadanpay.com',
    supportPhone: '0800-JADANPAY',
    maintenanceMode: false,
  });

  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({
    [Provider.MTN]: true,
    [Provider.GLO]: true,
    [Provider.AIRTEL]: true,
    [Provider.NMOBILE]: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
        setIsSaving(false);
        alert("Settings updated successfully!");
    }, 800);
  };

  const toggleProvider = (key: string) => {
      setProviderStatus(prev => ({
          ...prev,
          [key]: !prev[key]
      }));
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-24">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Platform Settings</h2>
            <p className="text-gray-500 text-sm">Manage global configurations and service availability.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Brand & General Settings */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Building className="text-gray-400" size={20} /> Brand Configuration
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">App Name</label>
                        <input 
                            type="text" 
                            value={settings.appName}
                            onChange={(e) => setSettings({...settings, appName: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Support Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                <input 
                                    type="email" 
                                    value={settings.supportEmail}
                                    onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                                    className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Support Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                <input 
                                    type="text" 
                                    value={settings.supportPhone}
                                    onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                                    className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <ShieldAlert className="text-red-500" size={20} /> Danger Zone
                </h3>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                    <div>
                        <p className="font-bold text-red-800">Maintenance Mode</p>
                        <p className="text-xs text-red-600">Disable all transactions temporarily.</p>
                    </div>
                    <button 
                        onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
        </div>

        {/* Service Provider Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Globe className="text-blue-500" size={20} /> Service Providers
            </h3>
            <p className="text-sm text-gray-500 mb-6">Toggle availability of airtime and data services per provider.</p>

            <div className="space-y-3">
                {Object.values(Provider).map((p) => (
                    <div key={p} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${PROVIDER_COLORS[p]}`}>
                                {PROVIDER_LOGOS[p].charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{PROVIDER_LOGOS[p]}</p>
                                <div className="flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${providerStatus[p] ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <p className="text-xs text-gray-500">{providerStatus[p] ? 'Operational' : 'Disabled'}</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => toggleProvider(p)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                providerStatus[p] 
                                ? 'bg-white border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200' 
                                : 'bg-green-600 border-green-600 text-white shadow-md hover:bg-green-700'
                            }`}
                        >
                            {providerStatus[p] ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-xl text-xs flex items-start gap-2">
                <Smartphone size={16} className="shrink-0 mt-0.5" />
                <p>Disabling a provider will prevent all users from initiating new Airtime or Data transactions for that network.</p>
            </div>
        </div>

      </div>
    </div>
  );
};
