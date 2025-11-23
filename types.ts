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

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum TransactionType {
  AIRTIME = 'AIRTIME',
  DATA = 'DATA',
  WALLET_FUND = 'WALLET_FUND',
  ADMIN_CREDIT = 'ADMIN_CREDIT',
  ADMIN_DEBIT = 'ADMIN_DEBIT',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  balance: number;
  savings: number;
  isVerified: boolean;
  avatarUrl?: string;
  // Extended Admin Fields
  status: UserStatus;
  ipAddress?: string;
  os?: string;
  lastLogin?: string;
}

export interface Bundle {
  id: string;
  provider: Provider;
  name: string;
  price: number;
  dataAmount: string;
  validity: string;
  planId: string; // The ID sent to the external API (Bilal)
  isBestValue?: boolean;
  isAvailable?: boolean;
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

export interface TicketMessage {
  id: string;
  senderId: string;
  text: string;
  date: string;
  isAdmin: boolean;
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