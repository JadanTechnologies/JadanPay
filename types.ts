export enum UserRole {
  USER = 'user',
  RESELLER = 'reseller',
  ADMIN = 'admin',
}

export enum Provider {
  MTN = 'MTN',
  GLO = 'GLO',
  AIRTEL = 'AIRTEL',
  NMOBILE = '9MOBILE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum TransactionType {
  AIRTIME = 'AIRTIME',
  DATA = 'DATA',
  WALLET_FUND = 'WALLET_FUND',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  balance: number;
  savings: number; // Micro-savings
  isVerified: boolean;
  avatarUrl?: string;
}

export interface Bundle {
  id: string;
  provider: Provider;
  name: string;
  price: number;
  dataAmount?: string; // e.g., "1.5GB"
  validity?: string; // e.g., "30 Days"
  isBestValue?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  provider?: Provider;
  amount: number;
  destinationNumber?: string;
  bundleName?: string;
  status: TransactionStatus;
  date: string;
  reference: string;
  previousBalance?: number;
  newBalance?: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  activeUsers: number;
  topProvider: Provider;
}