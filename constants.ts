
import { Provider, Bundle, UserStatus, UserRole, PlanType, BillProvider } from './types';

export const PROVIDER_COLORS = {
  [Provider.MTN]: 'bg-yellow-400 text-black',
  [Provider.GLO]: 'bg-green-600 text-white',
  [Provider.AIRTEL]: 'bg-red-600 text-white',
  [Provider.NMOBILE]: 'bg-emerald-800 text-white',
  // Bills
  [BillProvider.DSTV]: 'bg-blue-500 text-white',
  [BillProvider.GOTV]: 'bg-green-500 text-white',
  [BillProvider.STARTIMES]: 'bg-orange-500 text-white',
  [BillProvider.IKEDC]: 'bg-purple-600 text-white',
  [BillProvider.EKEDC]: 'bg-red-500 text-white',
  [BillProvider.AEDC]: 'bg-yellow-500 text-white',
  [BillProvider.IBEDC]: 'bg-blue-800 text-white',
  [BillProvider.KEDCO]: 'bg-green-700 text-white',
};

export const PROVIDER_LOGOS = {
  [Provider.MTN]: 'MTN',
  [Provider.GLO]: 'Glo',
  [Provider.AIRTEL]: 'Airtel',
  [Provider.NMOBILE]: '9mobile',
  // Bills
  [BillProvider.DSTV]: 'DSTV',
  [BillProvider.GOTV]: 'GOtv',
  [BillProvider.STARTIMES]: 'StarTimes',
  [BillProvider.IKEDC]: 'Ikeja Electric',
  [BillProvider.EKEDC]: 'Eko Electric',
  [BillProvider.AEDC]: 'Abuja Electric',
  [BillProvider.IBEDC]: 'Ibadan Electric',
  [BillProvider.KEDCO]: 'Kano Electric',
};

export const PROVIDER_IMAGES: Record<string, string> = {
  [Provider.MTN]: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/600px-New-mtn-logo.jpg',
  [Provider.GLO]: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Glo_button.png/480px-Glo_button.png',
  [Provider.AIRTEL]: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Airtel_Logo.svg/1200px-Airtel_Logo.svg.png',
  [Provider.NMOBILE]: 'https://upload.wikimedia.org/wikipedia/commons/9/98/9mobile_Logo.png',
  // Bills
  [BillProvider.DSTV]: 'https://upload.wikimedia.org/wikipedia/en/a/a3/DStv_Logo.png',
  [BillProvider.GOTV]: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/GOtv_Logo.png/220px-GOtv_Logo.png',
  [BillProvider.STARTIMES]: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/StarTimes_Logo.png',
  [BillProvider.IKEDC]: '',
  [BillProvider.EKEDC]: '',
  [BillProvider.AEDC]: '',
  [BillProvider.IBEDC]: '',
  [BillProvider.KEDCO]: '',
};

export const BILL_PROVIDERS = {
    CABLE: [BillProvider.DSTV, BillProvider.GOTV, BillProvider.STARTIMES],
    ELECTRICITY: [BillProvider.IKEDC, BillProvider.EKEDC, BillProvider.AEDC, BillProvider.IBEDC, BillProvider.KEDCO]
};

// IDs updated to reflect typical API provider IDs (e.g. BilalSadaSub uses numeric IDs for data)
export const SAMPLE_BUNDLES: Bundle[] = [
  // MTN - Typical Plan IDs: 7 (1.5GB), 8 (2GB), etc.
  { id: '1001', planId: '7', provider: Provider.MTN, type: PlanType.SME, name: '1.5GB SME Monthly', price: 1000, costPrice: 950, dataAmount: '1.5GB', validity: '30 Days', isBestValue: true, isAvailable: true },
  { id: '1002', planId: '8', provider: Provider.MTN, type: PlanType.SME, name: '2GB SME Weekly', price: 500, costPrice: 470, dataAmount: '2GB', validity: '7 Days', isAvailable: false },
  { id: '1003', planId: '11', provider: Provider.MTN, type: PlanType.CORPORATE, name: '10GB Corporate', price: 3000, costPrice: 2800, dataAmount: '10GB', validity: '30 Days', isAvailable: true },
  { id: '1004', planId: '15', provider: Provider.MTN, type: PlanType.GIFTING, name: '5GB Gifting', price: 2500, costPrice: 2400, dataAmount: '5GB', validity: '30 Days', isAvailable: true },
  
  // GLO
  { id: '2001', planId: '24', provider: Provider.GLO, type: PlanType.GIFTING, name: '1.8GB Monthly', price: 1000, costPrice: 900, dataAmount: '1.8GB', validity: '30 Days', isAvailable: true },
  { id: '2002', planId: '25', provider: Provider.GLO, type: PlanType.CORPORATE, name: '7GB Monthly', price: 2500, costPrice: 2350, dataAmount: '7GB', validity: '30 Days', isBestValue: true, isAvailable: true },
  
  // AIRTEL
  { id: '3001', planId: '32', provider: Provider.AIRTEL, type: PlanType.CORPORATE, name: '1.5GB Corporate', price: 1000, costPrice: 960, dataAmount: '1.5GB', validity: '30 Days', isAvailable: true },
  { id: '3002', planId: '34', provider: Provider.AIRTEL, type: PlanType.GIFTING, name: '4.5GB Gifting', price: 2000, costPrice: 1900, dataAmount: '4.5GB', validity: '30 Days', isAvailable: true },
  
  // 9MOBILE
  { id: '4001', planId: '40', provider: Provider.NMOBILE, type: PlanType.SME, name: '1.5GB SME', price: 1000, costPrice: 920, dataAmount: '1.5GB', validity: '30 Days', isAvailable: true },
];

export const CABLE_PLANS: Bundle[] = [
    // DSTV
    { id: 'dstv1', planId: 'dstv-padi', provider: BillProvider.DSTV, type: 'CABLE', name: 'DSTV Padi', price: 2950, costPrice: 2900, dataAmount: 'Padi', validity: '30 Days', isAvailable: true },
    { id: 'dstv2', planId: 'dstv-yanga', provider: BillProvider.DSTV, type: 'CABLE', name: 'DSTV Yanga', price: 4200, costPrice: 4150, dataAmount: 'Yanga', validity: '30 Days', isAvailable: true },
    { id: 'dstv3', planId: 'dstv-confam', provider: BillProvider.DSTV, type: 'CABLE', name: 'DSTV Confam', price: 7400, costPrice: 7300, dataAmount: 'Confam', validity: '30 Days', isAvailable: true, isBestValue: true },
    { id: 'dstv4', planId: 'dstv-premium', provider: BillProvider.DSTV, type: 'CABLE', name: 'DSTV Premium', price: 29500, costPrice: 29400, dataAmount: 'Premium', validity: '30 Days', isAvailable: true },
    // GOtv
    { id: 'gotv1', planId: 'gotv-smallie', provider: BillProvider.GOTV, type: 'CABLE', name: 'GOtv Smallie', price: 1300, costPrice: 1250, dataAmount: 'Smallie', validity: '30 Days', isAvailable: true },
    { id: 'gotv2', planId: 'gotv-jinja', provider: BillProvider.GOTV, type: 'CABLE', name: 'GOtv Jinja', price: 2700, costPrice: 2650, dataAmount: 'Jinja', validity: '30 Days', isAvailable: true },
    { id: 'gotv3', planId: 'gotv-jolli', provider: BillProvider.GOTV, type: 'CABLE', name: 'GOtv Jolli', price: 3950, costPrice: 3900, dataAmount: 'Jolli', validity: '30 Days', isAvailable: true, isBestValue: true },
    // StarTimes
    { id: 'startimes1', planId: 'nova', provider: BillProvider.STARTIMES, type: 'CABLE', name: 'Nova', price: 1200, costPrice: 1150, dataAmount: 'Nova', validity: '30 Days', isAvailable: true },
    { id: 'startimes2', planId: 'basic', provider: BillProvider.STARTIMES, type: 'CABLE', name: 'Basic', price: 2600, costPrice: 2550, dataAmount: 'Basic', validity: '30 Days', isAvailable: true },
];

export const MOCK_USERS_DATA = [
  {
    id: 'u1',
    name: 'Tunde Bakare',
    email: 'tunde@example.com',
    phone: '08030000001',
    role: UserRole.USER,
    balance: 5000,
    savings: 250,
    isVerified: true,
    status: UserStatus.ACTIVE,
    ipAddress: '197.210.45.22',
    os: 'Android 13',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'u2',
    name: 'Chioma Jesus',
    email: 'chioma@example.com',
    phone: '08030000002',
    role: UserRole.RESELLER,
    balance: 150000,
    savings: 1200,
    isVerified: true,
    status: UserStatus.ACTIVE,
    ipAddress: '102.12.33.11',
    os: 'Windows 10',
    lastLogin: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'admin',
    name: 'Admin User',
    email: 'admin@jadanpay.com',
    phone: '08030000000',
    role: UserRole.ADMIN,
    balance: 0,
    savings: 0,
    isVerified: true,
    status: UserStatus.ACTIVE,
    ipAddress: '127.0.0.1',
    os: 'MacOS Ventura',
    lastLogin: new Date().toISOString()
  }
];
