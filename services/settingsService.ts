import { Provider } from '../types';

export interface AppSettings {
  appName: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  providerStatus: Record<string, boolean>;
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
  }
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