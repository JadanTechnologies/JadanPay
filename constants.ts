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
  [BillProvider.IKEDC]: 'https://pbs.twimg.com/profile_images/13561788770