
import { Provider } from '../types';

export interface AppSettings {
  appName: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  
  // Service Status
  providerStatus: Record<string, boolean>;
  providerStats: Record<string, number>; // Success rate percentage (0-100)
  
  // Integrations
  bilalApiKey: string;
  useBilalService: boolean;
  
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
  
  bilalApiKey: '',
  useBilalService: false,
  
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
