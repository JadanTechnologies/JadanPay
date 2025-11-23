import { Provider, Bundle, UserStatus, UserRole } from './types';

export const PROVIDER_COLORS = {
  [Provider.MTN]: 'bg-yellow-400 text-black',
  [Provider.GLO]: 'bg-green-600 text-white',
  [Provider.AIRTEL]: 'bg-red-600 text-white',
  [Provider.NMOBILE]: 'bg-emerald-800 text-white',
};

export const PROVIDER_LOGOS = {
  [Provider.MTN]: 'MTN',
  [Provider.GLO]: 'Glo',
  [Provider.AIRTEL]: 'Airtel',
  [Provider.NMOBILE]: '9mobile',
};

// IDs updated to mock realistic Plan IDs for BilalSadaSub
export const SAMPLE_BUNDLES: Bundle[] = [
  // MTN
  { id: '1001', planId: '1001', provider: Provider.MTN, name: '1.5GB Monthly', price: 1000, dataAmount: '1.5GB', validity: '30 Days', isBestValue: true, isAvailable: true },
  { id: '1002', planId: '1002', provider: Provider.MTN, name: '2GB Weekly', price: 500, dataAmount: '2GB', validity: '7 Days', isAvailable: false },
  { id: '1003', planId: '1003', provider: Provider.MTN, name: '10GB Monthly', price: 3000, dataAmount: '10GB', validity: '30 Days', isAvailable: true },
  // GLO
  { id: '2001', planId: '2001', provider: Provider.GLO, name: '1.8GB Monthly', price: 1000, dataAmount: '1.8GB', validity: '30 Days', isAvailable: true },
  { id: '2002', planId: '2002', provider: Provider.GLO, name: '7GB Monthly', price: 2500, dataAmount: '7GB', validity: '30 Days', isBestValue: true, isAvailable: true },
  // AIRTEL
  { id: '3001', planId: '3001', provider: Provider.AIRTEL, name: '1.5GB Monthly', price: 1000, dataAmount: '1.5GB', validity: '30 Days', isAvailable: true },
  { id: '3002', planId: '3002', provider: Provider.AIRTEL, name: '4.5GB Monthly', price: 2000, dataAmount: '4.5GB', validity: '30 Days', isAvailable: true },
  // 9MOBILE
  { id: '4001', planId: '4001', provider: Provider.NMOBILE, name: '1.5GB Monthly', price: 1000, dataAmount: '1.5GB', validity: '30 Days', isAvailable: true },
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