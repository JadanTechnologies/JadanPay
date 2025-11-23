import { Provider, Bundle } from './types';

export const PROVIDER_COLORS = {
  [Provider.MTN]: 'bg-yellow-400 text-black',
  [Provider.GLO]: 'bg-green-600 text-white',
  [Provider.AIRTEL]: 'bg-red-600 text-white',
  [Provider.NMOBILE]: 'bg-emerald-800 text-white', // 9mobile uses a specific green
};

export const PROVIDER_LOGOS = {
  [Provider.MTN]: 'MTN',
  [Provider.GLO]: 'Glo',
  [Provider.AIRTEL]: 'Airtel',
  [Provider.NMOBILE]: '9mobile',
};

export const SAMPLE_BUNDLES: Bundle[] = [
  // MTN
  { id: 'm1', provider: Provider.MTN, name: '1.5GB Monthly', price: 1000, dataAmount: '1.5GB', validity: '30 Days', isBestValue: true },
  { id: 'm2', provider: Provider.MTN, name: '2GB Weekly', price: 500, dataAmount: '2GB', validity: '7 Days' },
  { id: 'm3', provider: Provider.MTN, name: '10GB Monthly', price: 3000, dataAmount: '10GB', validity: '30 Days' },
  // GLO
  { id: 'g1', provider: Provider.GLO, name: '1.8GB Monthly', price: 1000, dataAmount: '1.8GB', validity: '30 Days' },
  { id: 'g2', provider: Provider.GLO, name: '7GB Monthly', price: 2500, dataAmount: '7GB', validity: '30 Days', isBestValue: true },
  // AIRTEL
  { id: 'a1', provider: Provider.AIRTEL, name: '1.5GB Monthly', price: 1000, dataAmount: '1.5GB', validity: '30 Days' },
  { id: 'a2', provider: Provider.AIRTEL, name: '4.5GB Monthly', price: 2000, dataAmount: '4.5GB', validity: '30 Days' },
  // 9MOBILE
  { id: 'n1', provider: Provider.NMOBILE, name: '1.5GB Monthly', price: 1000, dataAmount: '1.5GB', validity: '30 Days' },
];

export const MOCK_USERS_DATA = [
  {
    id: 'u1',
    name: 'Tunde Bakare',
    email: 'tunde@example.com',
    phone: '08030000001',
    role: 'user',
    balance: 5000,
    savings: 250,
    isVerified: true
  },
  {
    id: 'u2',
    name: 'Chioma Jesus',
    email: 'chioma@example.com',
    phone: '08030000002',
    role: 'reseller',
    balance: 150000,
    savings: 1200,
    isVerified: true
  },
  {
    id: 'admin',
    name: 'Admin User',
    email: 'admin@jadanpay.com',
    phone: '08030000000',
    role: 'admin',
    balance: 0,
    savings: 0,
    isVerified: true
  }
];