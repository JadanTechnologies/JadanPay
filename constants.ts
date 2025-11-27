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
  // Telcos - Using more stable/official URLs
  [Provider.MTN]: 'https://www.mtn.ng/wp-content/themes/mtn-sme/images/logo.svg',
  [Provider.GLO]: 'https://www.gloworld.com/ng/wp-content/uploads/2021/05/Glo-Logo-300x120-1.png',
  [Provider.AIRTEL]: 'https://www.airtel.com.ng/assets/images/logo-red-black.png',
  [Provider.NMOBILE]: 'https://9mobile.com.ng/wp-content/uploads/2022/10/9mobile-logo.png',
  
  // Bills - Using official URLs
  [BillProvider.DSTV]: 'https://www.dstv.com/media/1360/dstv-logo-new.png',
  [BillProvider.GOTV]: 'https://www.gotvafrica.com/media/1330/gotv-logo-new-1.png',
  [BillProvider.STARTIMES]: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/StarTimes_Logo.png',
  [BillProvider.IKEDC]: 'https://www.ikejaelectric.com/wp-content/uploads/2021/03/cropped-ie-logo-1.png',
  [BillProvider.EKEDC]: 'https://www.ekedp.com/assets/img/ekedp_logo.png',
  [BillProvider.AEDC]: 'https://www.aedc.com/assets/images/logo/aedc-logo-colored.png',
  [BillProvider.IBEDC]: 'https://www.ibedc.com/wp-content/uploads/2022/01/ibedc-logo-1.png',
  [BillProvider.KEDCO]: 'https://www.kedco.ng/images/logo.png',
};

// MOCK DATA FOR USERS
export const MOCK_USERS_DATA: any[] = [
  {
    id: 'u1',
    name: 'Tunde Adebayo',
    email: 'tunde@example.com',
    phone: '08012345678',
    role: UserRole.USER,
    balance: 5240.50,
    savings: 12000,
    isVerified: true,
    status: UserStatus.ACTIVE,
  },
  {
    id: 'u2',
    name: 'Jadan Admin',
    email: 'admin@jadanpay.com',
    phone: '08087654321',
    role: UserRole.ADMIN,
    balance: 999999,
    savings: 0,
    isVerified: true,
    status: UserStatus.ACTIVE,
  },
  {
    id: 'u3',
    name: 'Chioma Okoro',
    email: 'chioma@reseller.com',
    phone: '09011223344',
    role: UserRole.RESELLER,
    balance: 150000,
    savings: 5000,
    isVerified: true,
    status: UserStatus.ACTIVE,
  },
];

// SAMPLE DATA BUNDLES
export const SAMPLE_BUNDLES: Omit<Bundle, 'planId' | 'resellerPrice' | 'costPrice'>[] = [
  // MTN
  { id: 'mtn1', provider: Provider.MTN, type: PlanType.SME, name: 'MTN SME 1GB', price: 250, dataAmount: '1GB', validity: '30 Days', isBestValue: true, isAvailable: true },
  { id: 'mtn2', provider: Provider.MTN, type: PlanType.SME, name: 'MTN SME 2GB', price: 500, dataAmount: '2GB', validity: '30 Days', isAvailable: true },
  { id: 'mtn3', provider: Provider.MTN, type: PlanType.GIFTING, name: 'MTN Gifting 5GB', price: 1200, dataAmount: '5GB', validity: '30 Days', isAvailable: true },
  // GLO
  { id: 'glo1', provider: Provider.GLO, type: PlanType.GIFTING, name: 'Glo Gifting 1.5GB', price: 300, dataAmount: '1.5GB', validity: '14 Days', isAvailable: true },
  { id: 'glo2', provider: Provider.GLO, type: PlanType.GIFTING, name: 'Glo Gifting 10GB', price: 2000, dataAmount: '10GB', validity: '30 Days', isBestValue: true, isAvailable: true },
  // AIRTEL
  { id: 'air1', provider: Provider.AIRTEL, type: PlanType.CORPORATE, name: 'Airtel Corp 2GB', price: 480, dataAmount: '2GB', validity: '30 Days', isAvailable: true },
  { id: 'air2', provider: Provider.AIRTEL, type: PlanType.CORPORATE, name: 'Airtel Corp 5GB', price: 1100, dataAmount: '5GB', validity: '30 Days', isAvailable: true },
  // 9MOBILE
  { id: 'nm1', provider: Provider.NMOBILE, type: PlanType.SME, name: '9mobile SME 1GB', price: 280, dataAmount: '1GB', validity: '30 Days', isAvailable: true },
];

// CABLE PLANS
export const CABLE_PLANS: Bundle[] = [
    { id: 'dstv1', provider: BillProvider.DSTV, type: 'Cable', name: 'DStv Padi', price: 2150, dataAmount: 'Padi', validity: '30 Days', planId: 'dstv-padi', costPrice: 2100, isAvailable: true },
    { id: 'dstv2', provider: BillProvider.DSTV, type: 'Cable', name: 'DStv Yanga', price: 2950, dataAmount: 'Yanga', validity: '30 Days', planId: 'dstv-yanga', costPrice: 2900, isAvailable: true },
    { id: 'gotv1', provider: BillProvider.GOTV, type: 'Cable', name: 'GOtv Smallie', price: 900, dataAmount: 'Smallie', validity: '30 Days', planId: 'gotv-smallie', costPrice: 880, isAvailable: true },
    { id: 'gotv2', provider: BillProvider.GOTV, type: 'Cable', name: 'GOtv Jinja', price: 1900, dataAmount: 'Jinja', validity: '30 Days', planId: 'gotv-jinja', costPrice: 1850, isAvailable: true },
    { id: 'startimes1', provider: BillProvider.STARTIMES, type: 'Cable', name: 'StarTimes Nova', price: 900, dataAmount: 'Nova', validity: '30 Days', planId: 'st-nova', costPrice: 880, isAvailable: true },
];

// BILL PROVIDER CATEGORIES
export const BILL_PROVIDERS = {
    CABLE: [BillProvider.DSTV, BillProvider.GOTV, BillProvider.STARTIMES],
    ELECTRICITY: [BillProvider.IKEDC, BillProvider.EKEDC, BillProvider.AEDC, BillProvider.IBEDC, BillProvider.KEDCO]
};