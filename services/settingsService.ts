
import { Provider } from '../types';

export type ApiVendor = 'BILALSADA' | 'MASKAWA' | 'ALRAHUZ' | 'ABBAPHANTAMI' | 'SIMHOST';

export interface AppSettings {
  appName: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  
  // Service Status
  providerStatus: Record<string, boolean>;
  providerStats: Record<string, number>; // Success rate percentage (0-100)
  
  // API Integration Settings
  activeApiVendor: ApiVendor;
  apiKeys: {
      BILALSADA: string;
      MASKAWA: string;
      ALRAHUZ: string;
      ABBAPHANTAMI: string;
      SIMHOST: string;
  };

  // SMS Settings (Twilio)
  enableTwilio: boolean;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioSenderId: string;
  
  // Payments (Manual Funding)
  bankName: string;
  accountNumber: string;
  accountName: string;

  // Payment Gateways
  monnifyApiKey: string;
  monnifySecretKey: string;
  monnifyContractCode: string;
  enableMonnify: boolean;

  paystackPublicKey: string;
  paystackSecretKey: string;
  enablePaystack: boolean;

  flutterwavePublicKey: string;
  flutterwaveSecretKey: string;
  enableFlutterwave: boolean;
  
  // Referral
  enableReferral: boolean;
  referralReward: number; // Amount in Naira
  referralMinWithdrawal: number; // New field for withdrawal limit
  
  // Landing Page & App Configuration
  landingHeroTitle: string;
  landingHeroSubtitle: string;
  landingStats: {
    activeUsers: string;
    dailyTransactions: string;
    uptime: string;
    support: string;
  };
  socialLinks: {
    twitter: string;
    instagram: string;
    facebook: string;
  };
  mobileAppUrl: string;
  mobileAppVersion: string;
  mobileAppReleaseDate: string;
}

// Initial default settings
const defaultSettings: AppSettings = {
  appName: 'JadanPay',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/8992/8992203.png',
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
  
  activeApiVendor: 'BILALSADA',
  apiKeys: {
      BILALSADA: '',
      MASKAWA: '',
      ALRAHUZ: '',
      ABBAPHANTAMI: '',
      SIMHOST: ''
  },

  enableTwilio: false,
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioSenderId: '',
  
  bankName: 'GTBank',
  accountNumber: '0123456789',
  accountName: 'JadanPay Ventures',

  monnifyApiKey: '',
  monnifySecretKey: '',
  monnifyContractCode: '',
  enableMonnify: false,

  paystackPublicKey: '',
  paystackSecretKey: '',
  enablePaystack: false,

  flutterwavePublicKey: '',
  flutterwaveSecretKey: '',
  enableFlutterwave: false,
  
  enableReferral: true,
  referralReward: 100,
  referralMinWithdrawal: 500,
  
  landingHeroTitle: "Stop Overpaying For Data.",
  landingHeroSubtitle: "Experience the future of VTU. Seamless top-ups, instant delivery, and reseller friendly rates.",
  landingStats: {
    activeUsers: "10K+",
    dailyTransactions: "5000+",
    uptime: "99.9%",
    support: "24/7"
  },
  socialLinks: {
    twitter: "#",
    instagram: "#",
    facebook: "#"
  },
  mobileAppUrl: "",
  mobileAppVersion: "1.0.0",
  mobileAppReleaseDate: new Date().toISOString()
};

// Key for localStorage
const SETTINGS_STORAGE_KEY = 'jadanpay_settings_v2';

// Initialize settings from localStorage or defaults
let _settings: AppSettings = { ...defaultSettings };
try {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Merge to ensure new fields (like apiKeys object or sms settings) exist if upgrading from v1
    _settings = { 
        ...defaultSettings, 
        ...parsed,
        apiKeys: { ...defaultSettings.apiKeys, ...parsed.apiKeys }
    };
  }
} catch (e) {
  console.warn("Failed to load settings from storage");
}

export const SettingsService = {
  getSettings: async (): Promise<AppSettings> => {
    // Simulate network delay
    return new Promise(resolve => setTimeout(() => resolve({ ..._settings }), 200));
  },

  updateSettings: async (newSettings: Partial<AppSettings>): Promise<AppSettings> => {
    return new Promise(resolve => setTimeout(() => {
      _settings = { ..._settings, ...newSettings };
      // Persist to local storage
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(_settings));
      } catch (e) {
        console.warn("Failed to save settings to storage");
      }
      resolve({ ..._settings });
    }, 500));
  }
};
