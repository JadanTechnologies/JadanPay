import { Provider } from '../types';

export interface AppSettings {
  appName: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  providerStatus: Record<string, boolean>;
  providerStats: Record<string, number>; // Success rate percentage (0-100)
  // Integrations
  bilalApiKey: string;
  useBilalService: boolean;
}

// Initial default settings
const defaultSettings: AppSettings = {
  appName: 'JadanPay',
  supportEmail: 'help@jadanpay.com',
  supportPhone: '0800-JADANPAY',
  maintenanceMode: false,
  providerStatus: {
    [Provider.MTN]: true,
    [Provider.GLO]: true,
    [Provider.AIRTEL]: true,
    [Provider.NMOBILE]: true,
  },
  providerStats: {
    [Provider.MTN]: 98,
    [Provider.GLO]: 85,
    [Provider.AIRTEL]: 92,
    [Provider.NMOBILE]: 90,
  },
  bilalApiKey: '',
  useBilalService: false
};

// In-memory store (persists until refresh)
let _settings = { ...defaultSettings };

export const SettingsService = {
  getSettings: async (): Promise<AppSettings> => {
    // Simulate network delay
    return new Promise(resolve => setTimeout(() => resolve({ ..._settings }), 200));
  },

  updateSettings: async (newSettings: Partial<AppSettings>): Promise<AppSettings> => {
    return new Promise(resolve => setTimeout(() => {
      _settings = { ..._settings, ...newSettings };
      resolve({ ..._settings });
    }, 500));
  }
};