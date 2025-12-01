import { Provider } from '../types';
import { MockDB } from './mockDb';

export type ApiVendor = 'BILALSADA' | 'MASKAWA' | 'ALRAHUZ' | 'ABBAPHANTAMI' | 'SIMHOST';
export type EmailProvider = 'SMTP' | 'RESEND';
export type PushProvider = 'NONE' | 'FIREBASE' | 'ONESIGNAL';

export interface ServiceAlert {
    isActive: boolean;
    message: string;
    type: 'info' | 'warning' | 'critical';
}

export interface AppSettings {
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  supportPhone: string;
  officeAddress: string; // Added for contact modal
  maintenanceMode: boolean;
  
  // Service Status
  providerStatus: Record<string, boolean>;
  providerStats: Record<string, number>; 
  providerNetworkIds: Record<string, string>;
  
  // API Integration Settings
  activeApiVendor: ApiVendor;
  apiKeys: Record<ApiVendor, string>;
  webhookUrls: Record<ApiVendor, string>; 
  apiLastConnection: Record<ApiVendor, string>;

  // Custom Base URLs for Vendors
  apiBaseUrls: Record<ApiVendor, string>;
  
  // SMS Balance Alerts
  enableSmsBalanceAlerts: boolean;
  smsBalanceThreshold: number;
  smsAlertRecipient: string;

  // SMS & Notifications
  enableTwilio: boolean;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioSenderId: string;

  emailProvider: EmailProvider;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  emailFrom: string;
  resendApiKey: string;

  pushProvider: PushProvider;
  firebaseServerKey: string;
  firebaseProjectId: string;
  oneSignalAppId: string;
  oneSignalRestApiKey: string;
  
  // Payments
  bankName: string;
  accountNumber: string;
  accountName: string;

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
  referralReward: number;
  referralMinWithdrawal: number;

  // Service Fees
  serviceFees: {
      airtime: number;
      data: number;
      cable: number;
      electricity: number;
  };
  
  // Global Pricing Rules
  servicePricing: {
      airtimeCostPercentage: number; 
      airtimeSellingPercentage: number; 
  };

  // Landing Page
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

  // Info Pages Content
  aboutUsContent: string;
  privacyPolicyContent: string;
  termsOfServiceContent: string;

  // Service Alert
  serviceAlert: ServiceAlert;

  // AI Agent Settings
  aiAgentSettings: {
    enabled: boolean;
    welcomeMessage: string;
  };
}

const defaultSettings: AppSettings = {
  appName: 'JadanPay',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/8992/8992203.png',
  faviconUrl: '',
  supportEmail: 'help@jadanpay.com',
  supportPhone: '0800-JADANPAY',
  officeAddress: '12 Innovation Drive, Yaba, Lagos State, Nigeria.',
  maintenanceMode: false,
  
  providerStatus: {
    [Provider.MTN]: true,
    [Provider.GLO]: true,
    [Provider.AIRTEL]: true,
    [Provider.NMOBILE]: true,
  },
  providerNetworkIds: {
      [Provider.MTN]: '1',
      [Provider.GLO]: '2',
      [Provider.AIRTEL]: '3',
      [Provider.NMOBILE]: '4',
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
  webhookUrls: { 
      BILALSADA: '',
      MASKAWA: '',
      ALRAHUZ: '',
      ABBAPHANTAMI: '',
      SIMHOST: ''
  },
  apiLastConnection: {
      BILALSADA: '',
      MASKAWA: '',
      ALRAHUZ: '',
      ABBAPHANTAMI: '',
      SIMHOST: ''
  },
  apiBaseUrls: {
      BILALSADA: 'https://app.bilalsadasub.com/api/v1',
      MASKAWA: 'https://api.maskawasub.com/api/v1',
      ALRAHUZ: 'https://alrahuzdata.com.ng/api/v1',
      ABBAPHANTAMI: 'https://abbaphantami.com/api/v1',
      SIMHOST: 'https://simhostng.com/api/v1'
  },
  
  enableSmsBalanceAlerts: false,
  smsBalanceThreshold: 5000,
  smsAlertRecipient: '',

  enableTwilio: false,
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioSenderId: '',

  emailProvider: 'SMTP',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  emailFrom: 'noreply@jadanpay.com',
  resendApiKey: '',

  pushProvider: 'NONE',
  firebaseServerKey: '',
  firebaseProjectId: '',
  oneSignalAppId: '',
  oneSignalRestApiKey: '',
  
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
  
  serviceFees: {
      airtime: 10,
      data: 20,
      cable: 100,
      electricity: 100
  },

  servicePricing: {
      airtimeCostPercentage: 97,
      airtimeSellingPercentage: 100,
  },
  
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
  mobileAppReleaseDate: new Date().toISOString(),
  
  aboutUsContent: "Welcome to JadanPay, Nigeria's most reliable digital top-up platform. Our mission is to bridge the digital divide by providing affordable, reliable, and instant telecommunication services to every Nigerian.",
  privacyPolicyContent: "We collect information you provide directly to us, such as when you create an account. We use this information to provide, maintain, and improve our services.",
  termsOfServiceContent: "By accessing or using our Services, you agree to be bound by these Terms. All transactions performed on our platform are final once successful.",

  serviceAlert: {
    isActive: false,
    message: 'We are currently undergoing scheduled maintenance. Some services may be temporarily unavailable.',
    type: 'warning'
  },

  aiAgentSettings: {
    enabled: true,
    welcomeMessage: "Hello! I am JadanPay's AI assistant. How can I help you today? You can ask me about our services."
  }
};

const SETTINGS_STORAGE_KEY = 'jadanpay_settings_v3';

let _settings: AppSettings = { ...defaultSettings };
try {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    _settings = { 
        ...defaultSettings, 
        ...parsed,
        apiKeys: { ...defaultSettings.apiKeys, ...(parsed.apiKeys || {}) },
        webhookUrls: { ...defaultSettings.webhookUrls, ...(parsed.webhookUrls || {}) }, 
        apiLastConnection: { ...defaultSettings.apiLastConnection, ...(parsed.apiLastConnection || {}) },
        apiBaseUrls: { ...defaultSettings.apiBaseUrls, ...(parsed.apiBaseUrls || {}) },
        serviceFees: { ...defaultSettings.serviceFees, ...(parsed.serviceFees || {}) },
        servicePricing: { ...defaultSettings.servicePricing, ...(parsed.servicePricing || {}) },
        providerNetworkIds: { ...defaultSettings.providerNetworkIds, ...(parsed.providerNetworkIds || {}) },
        landingStats: { ...defaultSettings.landingStats, ...(parsed.landingStats || {}) },
        socialLinks: { ...defaultSettings.socialLinks, ...(parsed.socialLinks || {}) },
        serviceAlert: { ...defaultSettings.serviceAlert, ...(parsed.serviceAlert || {}) },
        aiAgentSettings: { ...defaultSettings.aiAgentSettings, ...(parsed.aiAgentSettings || {}) }
    };
  }
} catch (e) {
  console.warn("Failed to load settings from storage");
}

export const SettingsService = {
  getSettings: async (): Promise<AppSettings> => {
    return new Promise(resolve => setTimeout(() => resolve({ ..._settings }), 200));
  },

  updateSettings: async (newSettings: Partial<AppSettings>): Promise<AppSettings> => {
    return new Promise(resolve => setTimeout(async () => {
      _settings = { ..._settings, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(_settings));
        await MockDB.addAuditLog('SETTINGS_UPDATED', 'Administrator updated application settings.');
      } catch (e) {
        console.warn("Failed to save settings to storage");
      }
      resolve({ ..._settings });
    }, 500));
  }
};