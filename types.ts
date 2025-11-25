
export enum UserRole {
  USER = 'user',
  RESELLER = 'reseller',
  ADMIN = 'admin',
  STAFF = 'staff',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum Provider {
  MTN = 'MTN',
  GLO = 'GLO',
  AIRTEL = 'AIRTEL',
  NMOBILE = '9MOBILE',
}

// New Enums for Bills
export enum BillProvider {
  DSTV = 'DSTV',
  GOTV = 'GOTV',
  STARTIMES = 'STARTIMES',
  IKEDC = 'IKEDC',
  EKEDC = 'EKEDC',
  AEDC = 'AEDC',
  IBEDC = 'IBEDC',
  KEDCO = 'KEDCO'
}

export enum PlanType {
  SME = 'SME',
  GIFTING = 'GIFTING',
  CORPORATE = 'CORPORATE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DECLINED = 'DECLINED', // For rejected manual payments
}

export enum TransactionType {
  AIRTIME = 'AIRTIME',
  DATA = 'DATA',
  CABLE = 'CABLE',           
  ELECTRICITY = 'ELECTRICITY',
  BILL_PAYMENT = 'BILL_PAYMENT',
  WALLET_FUND = 'WALLET_FUND',
  ADMIN_CREDIT = 'ADMIN_CREDIT',
  ADMIN_DEBIT = 'ADMIN_DEBIT',
  REFERRAL_BONUS = 'REFERRAL_BONUS'
}

export enum KycStatus {
    NONE = 'NONE',
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  balance: number;
  savings: number;
  bonusBalance: number; // For referrals
  walletNumber: string; // New generated wallet number
  accountNumber?: string; // Virtual Bank Account Number
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  isVerified: boolean;
  avatarUrl?: string;
  status: UserStatus;
  ipAddress?: string;
  os?: string;
  lastLogin?: string;
  joinedDate?: string; // Added for Recent Signups
  dataTotal: number; // In GB
  dataUsed: number; // In GB
  transactionPin?: string; // Secure 4-digit PIN
  apiKey?: string; // API Key for Resellers/Developers
  resellerRequestStatus?: 'PENDING' | 'REJECTED' | 'NONE';
  
  // KYC Data
  kycStatus?: KycStatus;
  kycDocType?: string; // BVN, NIN, PVC, PASSPORT
  kycDocNumber?: string; // Added Document Number
  kycDocUrl?: string;
  kycFaceUrl?: string;
}

export interface Bundle {
  id: string;
  provider: Provider | BillProvider | string; // Updated to allow BillProviders
  type: PlanType | string;
  name: string;
  price: number;
  resellerPrice?: number; // New field for Resellers
  costPrice: number;
  dataAmount: string; // Can represent Plan Name for Cable
  validity: string;
  planId: string;
  isBestValue?: boolean;
  isAvailable?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  provider?: Provider | string; // Updated type
  amount: number;
  costPrice?: number;
  profit?: number;
  destinationNumber?: string;
  bundleName?: string;
  status: TransactionStatus;
  date: string;
  reference: string;
  previousBalance?: number;
  newBalance?: number;
  paymentMethod?: string;
  proofUrl?: string; // For manual payment evidence
  adminActionDate?: string;
  customerName?: string; // For Bill Validation
  customerAddress?: string; // For Electricity Bills
  meterToken?: string; // For Electricity Tokens
}

export interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  activeUsers: number;
  topProvider: Provider;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  text: string;
  date: string;
  isAdmin: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high';
  date: string;
  messages: TicketMessage[];
}

export interface Permission {
  id: string;
  label: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: 'active' | 'inactive';
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  audience: 'all' | 'resellers' | 'staff';
  isActive: boolean;
  date: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'push';
  subject?: string;
  body: string;
  variables: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'info' | 'success' | 'error';
}

export interface AccessRule {
    id: string;
    type: 'ip' | 'country' | 'device' | 'os' | 'region';
    value: string;
    reason: string;
    dateAdded: string;
    isActive: boolean;
}

export interface CronJob {
    id: string;
    name: string;
    schedule: string; // e.g. "Every Day at 12AM"
    status: 'active' | 'inactive';
    lastRun: string;
    nextRun: string;
    description: string;
}
