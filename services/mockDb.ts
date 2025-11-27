
import { User, Transaction, TransactionType, TransactionStatus, UserRole, Provider, Ticket, UserStatus, Staff, Role, Announcement, CommunicationTemplate, Bundle, AppNotification, AccessRule, KycStatus, CronJob } from '../types';
import { MOCK_USERS_DATA, SAMPLE_BUNDLES } from '../constants';
import { SettingsService, AppSettings } from './settingsService';
import { NotificationService } from './notificationService';

const DB_STORAGE_KEY = 'JADANPAY_DB_V2';

// Database Schema Interface
interface DatabaseSchema {
    users: User[];
    transactions: Transaction[];
    bundles: Bundle[];
    tickets: Ticket[];
    staffMembers: Staff[];
    roles: Role[];
    announcements: Announcement[];
    templates: CommunicationTemplate[];
    notifications: AppNotification[];
    settings: AppSettings | null;
    accessRules: AccessRule[];
    cronJobs: CronJob[];
}

// Default Data
const DEFAULT_BUNDLES: Bundle[] = SAMPLE_BUNDLES.map(b => ({...b, planId: b.id, resellerPrice: b.price * 0.95, costPrice: b.price * 0.9}));
const DEFAULT_USERS: User[] = MOCK_USERS_DATA.map(u => ({
    ...u,
    walletNumber: u.id === 'u1' ? '2039485712' : u.id === 'u2' ? '2058392011' : '0000000000',
    accountNumber: '9' + Math.floor(Math.random() * 1000000000), // Virtual Account
    referralCode: u.name.substring(0,3).toUpperCase() + Math.floor(Math.random() * 1000),
    referralCount: 0,
    bonusBalance: 0,
    joinedDate: new Date().toISOString(),
    dataTotal: u.id === 'u1' ? 10.5 : 50, // GB
    dataUsed: u.id === 'u1' ? 4.2 : 12.5, // GB
    transactionPin: u.id === 'u1' ? '1234' : undefined, // u1 has pin, u2 needs to create
    apiKey: u.role === UserRole.RESELLER ? 'jp_live_' + Math.random().toString(36).substr(2, 30) : undefined,
    resellerRequestStatus: 'NONE',
    kycStatus: u.isVerified ? KycStatus.VERIFIED : KycStatus.NONE
})) as User[];

const DEFAULT_CRON_JOBS: CronJob[] = [
    { id: '1', name: 'Daily Sales Report', schedule: 'Every Day at 12:00 AM', status: 'active', lastRun: new Date().toISOString(), nextRun: 'Tomorrow, 12:00 AM', description: 'Generates and emails sales report to admin.' },
    { id: '2', name: 'Retry Failed Transactions', schedule: 'Every 10 Minutes', status: 'active', lastRun: new Date().toISOString(), nextRun: 'In 5 minutes', description: 'Attempts to re-process failed API calls.' },
    { id: '3', name: 'Low Balance Alert', schedule: 'Every Hour', status: 'active', lastRun: new Date().toISOString(), nextRun: 'In 30 minutes', description: 'Checks API wallet balance and notifies admin if low.' },
    { id: '4', name: 'Database Backup', schedule: 'Every Week', status: 'inactive', lastRun: '-', nextRun: '-', description: 'Auto-backup system data to cloud.' },
];

// In-Memory State
let db: DatabaseSchema = {
    users: [],
    transactions: [],
    bundles: [],
    tickets: [],
    staffMembers: [],
    roles: [],
    announcements: [],
    templates: [],
    notifications: [],
    settings: null,
    accessRules: [],
    cronJobs: []
};

// --- DATA SANITIZATION ---
const sanitizeUser = (u: any): User => {
    if (!u) return DEFAULT_USERS[0];
    
    // Ensure Role is valid
    let role = UserRole.USER;
    if (Object.values(UserRole).includes(u.role)) {
        role = u.role;
    }

    return {
        id: u.id || Math.random().toString(36),
        name: u.name || 'Unknown User',
        email: u.email || 'missing@email.com',
        phone: u.phone || '',
        role: role,
        balance: typeof u.balance === 'number' ? u.balance : 0,
        savings: typeof u.savings === 'number' ? u.savings : 0,
        bonusBalance: typeof u.bonusBalance === 'number' ? u.bonusBalance : 0,
        walletNumber: u.walletNumber || '0000000000',
        accountNumber: u.accountNumber || '9000000000',
        referralCode: u.referralCode || 'REF000',
        referredBy: u.referredBy,
        referralCount: typeof u.referralCount === 'number' ? u.referralCount : 0,
        isVerified: !!u.isVerified,
        avatarUrl: u.avatarUrl,
        status: u.status || UserStatus.ACTIVE,
        ipAddress: u.ipAddress || '127.0.0.1',
        os: u.os || 'Unknown',
        lastLogin: u.lastLogin || new Date().toISOString(),
        joinedDate: u.joinedDate || new Date().toISOString(),
        dataTotal: typeof u.dataTotal === 'number' ? u.dataTotal : 1,
        dataUsed: typeof u.dataUsed === 'number' ? u.dataUsed : 0,
        transactionPin: u.transactionPin,
        apiKey: u.apiKey,
        resellerRequestStatus: u.resellerRequestStatus || 'NONE',
        kycStatus: u.kycStatus || (u.isVerified ? KycStatus.VERIFIED : KycStatus.NONE),
        kycDocType: u.kycDocType,
        kycDocNumber: u.kycDocNumber,
        kycDocUrl: u.kycDocUrl,
        kycFaceUrl: u.kycFaceUrl
    };
};

const loadDatabase = () => {
    try {
        const stored = localStorage.getItem(DB_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            
            // Deep Merge / Sanitize
            db = {
                users: Array.isArray(parsed.users) ? parsed.users.map(sanitizeUser).filter(Boolean) : DEFAULT_USERS,
                transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
                bundles: Array.isArray(parsed.bundles) ? parsed.bundles : DEFAULT_BUNDLES,
                tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
                staffMembers: Array.isArray(parsed.staffMembers) ? parsed.staffMembers : [],
                roles: Array.isArray(parsed.roles) ? parsed.roles : [],
                announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
                templates: Array.isArray(parsed.templates) ? parsed.templates : [],
                notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
                settings: parsed.settings || null,
                accessRules: Array.isArray(parsed.accessRules) ? parsed.accessRules : [],
                cronJobs: Array.isArray(parsed.cronJobs) ? parsed.cronJobs : DEFAULT_CRON_JOBS
            };
            
            console.log("Database loaded and sanitized.");
        } else {
            console.log("Initializing new Database");
            db.users = DEFAULT_USERS;
            db.bundles = DEFAULT_BUNDLES;
            db.cronJobs = DEFAULT_CRON_JOBS;
            saveDatabase();
        }
    } catch (e) {
        console.error("Failed to load database (Corrupt Data). Resetting...", e);
        // Fallback to defaults to prevent crash
        db.users = DEFAULT_USERS;
        db.bundles = DEFAULT_BUNDLES;
        db.cronJobs = DEFAULT_CRON_JOBS;
        // Clear corrupt data
        localStorage.removeItem(DB_STORAGE_KEY);
        saveDatabase();
    }
};

const saveDatabase = () => {
    try {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
        console.error("Failed to save database:", e);
    }
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateWalletNumber = () => '2' + Math.random().toString().slice(2, 11);
const generateReferralCode = (name: string) => name.substring(0,3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

// Initialize immediately in a safe block
try {
    loadDatabase();
} catch(e) {
    console.error("Fatal MockDB Init Error", e);
}


export const MockDB = {
  // --- BACKUP & RESTORE ---
  getDatabaseDump: async () => {
      await delay(500);
      const currentSettings = await SettingsService.getSettings();
      db.settings = currentSettings;
      return {
          version: '2.0',
          timestamp: new Date().toISOString(),
          data: db
      };
  },

  restoreDatabase: async (dump: any) => {
      await delay(1000);
      if (!dump || !dump.data) throw new Error("Invalid Backup File");
      
      const { data } = dump;
      if (!Array.isArray(data.users)) throw new Error("Corrupt Data: Missing Users");
      
      db = data;
      
      if (data.settings) {
          await SettingsService.updateSettings(data.settings);
      }
      
      saveDatabase();
      return true;
  },

  // --- USERS ---

  getUsers: async () => {
    await delay(300);
    // Return copies to prevent reference issues with React state
    return db.users.map(u => ({ ...u }));
  },
  
  getRecentSignups: async (limit: number = 5) => {
      await delay(200);
      return db.users
        .sort((a, b) => new Date(b.joinedDate || 0).getTime() - new Date(a.joinedDate || 0).getTime())
        .slice(0, limit)
        .map(u => ({...u}));
  },

  // --- ADVANCED STATS ---
  getDashboardStatsDetailed: async () => {
      await delay(200);
      
      const totalUsers = db.users.length;
      const activeUsers = db.users.filter(u => u.status === UserStatus.ACTIVE).length;
      const inactiveUsers = db.users.filter(u => u.status !== UserStatus.ACTIVE).length; // Suspended or Banned
      
      const totalResellers = db.users.filter(u => u.role === UserRole.RESELLER).length;
      const activeResellers = db.users.filter(u => u.role === UserRole.RESELLER && u.status === UserStatus.ACTIVE).length;
      const inactiveResellers = db.users.filter(u => u.role === UserRole.RESELLER && u.status !== UserStatus.ACTIVE).length;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dormantUsers = db.users.filter(u => {
          const lastLogin = new Date(u.lastLogin || 0);
          return lastLogin < thirtyDaysAgo;
      }).length;

      return {
          totalUsers,
          activeUsers,
          inactiveUsers,
          dormantUsers,
          totalResellers,
          activeResellers,
          inactiveResellers,
          suspendedUsers: db.users.filter(u => u.status === UserStatus.SUSPENDED).length
      };
  },

  getInactiveUsersCount: async () => {
      await delay(100);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return db.users.filter(u => {
          const lastLogin = new Date(u.lastLogin || 0);
          return lastLogin < thirtyDaysAgo;
      }).length;
  },

  getSuspendedUsersCount: async () => {
      return db.users.filter(u => u.status === UserStatus.SUSPENDED).length;
  },
  
  getTopReferrers: async (limit: number = 10) => {
      await delay(300);
      return db.users
        .filter(u => u.referralCount > 0)
        .sort((a, b) => b.referralCount - a.referralCount)
        .slice(0, limit)
        .map(u => ({...u}));
  },

  getUserByEmail: async (email: string) => {
    await delay(200);
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : undefined;
  },

  registerUser: async (name: string, email: string, phone: string, referrerCode?: string): Promise<User> => {
      await delay(600);
      const settings = await SettingsService.getSettings();
      
      const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
      const phoneExists = db.users.some(u => u.phone === phone);

      if (emailExists) throw new Error("This email address is already registered.");
      if (phoneExists) throw new Error("This phone number is already registered.");

      let referrerId: string | undefined = undefined;
      if (referrerCode && settings.enableReferral) {
          const referrer = db.users.find(u => u.referralCode === referrerCode);
          if (referrer) {
              referrerId = referrer.id;
              referrer.referralCount += 1;
              referrer.bonusBalance += settings.referralReward;
              
              db.transactions.unshift({
                  id: Math.random().toString(36),
                  userId: referrer.id,
                  type: TransactionType.REFERRAL_BONUS,
                  amount: settings.referralReward,
                  status: TransactionStatus.SUCCESS,
                  date: new Date().toISOString(),
                  reference: `REF-BONUS-${Math.floor(Math.random() * 100000)}`,
                  previousBalance: referrer.balance,
                  newBalance: referrer.balance
              });

              MockDB.addNotification({
                  userId: referrer.id,
                  title: 'Referral Bonus Earned!',
                  message: `You earned ₦${settings.referralReward} because a friend used your code!`,
                  type: 'success'
              });
          }
      }

      const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          email,
          phone,
          role: UserRole.USER,
          balance: 0,
          savings: 0,
          bonusBalance: 0,
          walletNumber: generateWalletNumber(),
          accountNumber: '9' + Math.floor(Math.random() * 1000000000),
          referralCode: generateReferralCode(name),
          referredBy: referrerId,
          referralCount: 0,
          isVerified: false,
          status: UserStatus.ACTIVE,
          ipAddress: '127.0.0.1',
          os: 'Web Browser',
          lastLogin: new Date().toISOString(),
          joinedDate: new Date().toISOString(),
          dataTotal: 0,
          dataUsed: 0,
          resellerRequestStatus: 'NONE',
          kycStatus: KycStatus.NONE
      };

      db.users.push(newUser);
      
      db.notifications.push({
          id: Math.random().toString(36),
          userId: newUser.id,
          title: 'Welcome to JadanPay!',
          message: 'We are glad to have you onboard. Please verify your account to unlock all features.',
          date: new Date().toISOString(),
          isRead: false,
          type: 'success'
      });

      saveDatabase();
      return { ...newUser };
  },

  resetUserPin: async (userId: string) => {
      await delay(300);
      const user = db.users.find(u => u.id === userId);
      if (user) {
          user.transactionPin = undefined; // Clear PIN
          
          MockDB.addNotification({
              userId: userId,
              title: 'Security Alert: PIN Reset',
              message: 'Your transaction PIN has been reset by an administrator. Please create a new one.',
              type: 'error'
          });
          
          saveDatabase();
          return { ...user };
      }
      throw new Error("User not found");
  },

  // --- KYC & VERIFICATION ---
  submitKyc: async (userId: string, docType: string, docUrl: string, faceUrl: string, docNumber?: string) => {
      await delay(1000);
      const user = db.users.find(u => u.id === userId);
      if (user) {
          user.kycStatus = KycStatus.PENDING;
          user.kycDocType = docType;
          user.kycDocNumber = docNumber;
          user.kycDocUrl = docUrl;
          user.kycFaceUrl = faceUrl;
          saveDatabase();
          return { ...user };
      }
      throw new Error("User not found");
  },

  approveKyc: async (userId: string) => {
      await delay(300);
      const user = db.users.find(u => u.id === userId);
      if (user) {
          user.kycStatus = KycStatus.VERIFIED;
          user.isVerified = true;
          
          MockDB.addNotification({
              userId: userId,
              title: 'Verification Successful!',
              message: 'Your account has been verified. You now have unlimited access and a dedicated Virtual Account Number.',
              type: 'success'
          });
          saveDatabase();
          return { ...user };
      }
      throw new Error("User not found");
  },

  rejectKyc: async (userId: string) => {
      await delay(300);
      const user = db.users.find(u => u.id === userId);
      if (user) {
          user.kycStatus = KycStatus.REJECTED;
          user.isVerified = false;
          
          MockDB.addNotification({
              userId: userId,
              title: 'Verification Rejected',
              message: 'Your verification documents were rejected. Please try again with clear images.',
              type: 'error'
          });
          saveDatabase();
          return { ...user };
      }
      throw new Error("User not found");
  },

  // --- RESELLER MANAGEMENT ---

  requestResellerUpgrade: async (userId: string) => {
      await delay(300);
      const user = db.users.find(u => u.id === userId);
      if (user) {
          user.resellerRequestStatus = 'PENDING';
          saveDatabase();
          return { ...user };
      }
      throw new Error("User not found");
  },

  rejectResellerUpgrade: async (userId: string) => {
      await delay(300);
      const user = db.users.find(u => u.id === userId);
      if (user) {
          user.resellerRequestStatus = 'REJECTED';
          
          MockDB.addNotification({
              userId: userId,
              title: 'Upgrade Request Declined',
              message: 'Your request to upgrade to Reseller status was not approved at this time.',
              type: 'error'
          });

          saveDatabase();
          return { ...user };
      }
      throw new Error("User not found");
  },

  upgradeUserToReseller: async (userId: string) => {
      await delay(400);
      const user = db.users.find(u => u.id === userId);
      if (user) {
          user.role = UserRole.RESELLER;
          // Generate Key if not exists
          if(!user.apiKey) {
              user.apiKey = 'jp_live_' + Math.random().toString(36).substr(2, 30) + Date.now().toString(36);
          }
          user.resellerRequestStatus = 'NONE'; // Clear pending status
          
          MockDB.addNotification({
              userId: userId,
              title: 'Account Upgraded!',
              message: 'You have been upgraded to a Reseller account. You now have access to the Developer API and Reseller Zone.',
              type: 'success'
          });
          
          saveDatabase();
          return { ...user };
      }
      throw new Error("User not found");
  },

  updateUserBalance: async (userId: string, amount: number) => {
    await delay(200);
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    
    user.balance += amount;
    saveDatabase();
    return { ...user };
  },

  updateUserDataBalance: async (userId: string, gbAmount: number) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
        user.dataTotal += gbAmount;
        saveDatabase();
        return { ...user };
    }
  },

  redeemBonus: async (userId: string) => {
      await delay(400);
      const user = db.users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      
      const settings = await SettingsService.getSettings();
      const minWithdraw = settings.referralMinWithdrawal || 0;

      if (user.bonusBalance <= 0) throw new Error("No bonus balance to redeem.");
      if (user.bonusBalance < minWithdraw) throw new Error(`Minimum redeemable amount is ₦${minWithdraw}`);

      const amount = user.bonusBalance;
      user.balance += amount;
      user.bonusBalance = 0;

      db.transactions.unshift({
          id: Math.random().toString(36),
          userId: userId,
          type: TransactionType.WALLET_FUND,
          amount: amount,
          status: TransactionStatus.SUCCESS,
          date: new Date().toISOString(),
          reference: `REDEEM-${Math.floor(Math.random() * 100000)}`,
          paymentMethod: 'Referral Redeem',
          previousBalance: user.balance - amount,
          newBalance: user.balance
      });
      
      saveDatabase();
      return { ...user };
  },
  
  updateUserSavings: async (userId: string, amount: number) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
        user.savings += amount;
        saveDatabase();
    }
  },

  updateUserStatus: async (userId: string, status: UserStatus) => {
    await delay(300);
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    
    user.status = status;
    saveDatabase();
    return { ...user };
  },

  updateUser: async (updatedData: User) => {
      await delay(300);
      const index = db.users.findIndex(u => u.id === updatedData.id);
      if (index !== -1) {
          // Merge existing data with updates to prevent data loss
          const mergedUser = { ...db.users[index], ...updatedData };
          db.users[index] = mergedUser;
          saveDatabase();
          return { ...mergedUser };
      }
      throw new Error("User not found");
  },

  deleteUser: async (userId: string) => {
      await delay(400);
      db.users = db.users.filter(u => u.id !== userId);
      saveDatabase();
  },

  // --- TRANSACTIONS ---
  getTransactions: async (userId?: string) => {
    await delay(300);
    if (userId) {
      return db.transactions.filter(t => t.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return db.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addTransaction: async (tx: Transaction) => {
    await delay(300);
    db.transactions.unshift(tx);
    saveDatabase();
    return tx;
  },

  getAllTransactionsAdmin: async () => {
    await delay(400);
    return [...db.transactions];
  },

  getPendingTransactions: async () => {
      await delay(200);
      return db.transactions.filter(t => t.status === TransactionStatus.PENDING && t.type === TransactionType.WALLET_FUND);
  },

  getTodaySales: async () => {
      const today = new Date().toDateString();
      const txs = db.transactions.filter(t => 
          new Date(t.date).toDateString() === today && 
          t.status === TransactionStatus.SUCCESS &&
          (t.type === TransactionType.AIRTIME || t.type === TransactionType.DATA || t.type === TransactionType.CABLE || t.type === TransactionType.ELECTRICITY)
      );
      
      const count = txs.length;
      const amount = txs.reduce((sum, t) => sum + t.amount, 0);
      return { count, amount };
  },

  approveTransaction: async (txId: string) => {
      await delay(500);
      const tx = db.transactions.find(t => t.id === txId);
      if (!tx) throw new Error("Transaction not found");

      tx.status = TransactionStatus.SUCCESS;
      tx.adminActionDate = new Date().toISOString();

      const user = db.users.find(u => u.id === tx.userId);
      if(user) {
          user.balance += tx.amount;
          tx.previousBalance = user.balance - tx.amount;
          tx.newBalance = user.balance;
          
          MockDB.addNotification({
            userId: tx.userId,
            title: 'Payment Approved',
            message: `Your manual funding of ₦${tx.amount.toLocaleString()} has been approved.`,
            type: 'success'
          });

          // SEND SMS
          await NotificationService.sendSms(
              user.phone,
              `JadanPay Alert: Credit of N${tx.amount.toLocaleString()} was successful. New Bal: N${user.balance.toLocaleString()}. Ref: ${tx.reference}`
          );
      }

      saveDatabase();
      return tx;
  },

  declineTransaction: async (txId: string) => {
      await delay(500);
      const tx = db.transactions.find(t => t.id === txId);
      if (!tx) throw new Error("Transaction not found");

      tx.status = TransactionStatus.DECLINED;
      tx.adminActionDate = new Date().toISOString();

      MockDB.addNotification({
          userId: tx.userId,
          title: 'Payment Declined',
          message: `Your manual funding request of ₦${tx.amount.toLocaleString()} was declined.`,
          type: 'error'
      });

      saveDatabase();
      return tx;
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (userId: string) => {
      return db.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
  addNotification: (n: Partial<AppNotification>) => {
      const notif: AppNotification = {
          id: Math.random().toString(36),
          userId: n.userId!,
          title: n.title!,
          message: n.message!,
          date: new Date().toISOString(),
          isRead: false,
          type: n.type || 'info'
      };
      db.notifications.unshift(notif);
      saveDatabase();
  },

  markNotificationsRead: async (userId: string) => {
      db.notifications.forEach(n => {
          if (n.userId === userId) n.isRead = true;
      });
      saveDatabase();
  },

  // --- TICKETS ---
  getTickets: async (userId?: string) => {
    await delay(300);
    if (userId) {
        return db.tickets.filter(t => t.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return db.tickets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
  createTicket: async (userId: string, subject: string, message: string, priority: 'low' | 'medium' | 'high', attachmentUrl?: string, attachmentName?: string) => {
    await delay(400);
    const newTicket: Ticket = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        subject,
        status: 'open',
        priority,
        date: new Date().toISOString(),
        messages: [
            {
                id: Math.random().toString(36),
                senderId: userId,
                text: message,
                date: new Date().toISOString(),
                isAdmin: false,
                attachmentUrl,
                attachmentName
            }
        ]
    };
    db.tickets.unshift(newTicket);
    saveDatabase();
    return newTicket;
  },

  replyTicket: async (ticketId: string, text: string, isAdmin: boolean, attachmentUrl?: string, attachmentName?: string) => {
    await delay(300);
    const ticket = db.tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.messages.push({
            id: Math.random().toString(36),
            senderId: isAdmin ? 'admin' : ticket.userId,
            text,
            date: new Date().toISOString(),
            isAdmin,
            attachmentUrl,
            attachmentName
        });
        saveDatabase();
    }
  },

  // --- STAFF & ROLES ---
  getStaff: async () => {
      await delay(200);
      return [...db.staffMembers];
  },
  addStaff: async (staff: Staff) => {
      await delay(300);
      db.staffMembers.push(staff);
      saveDatabase();
      return staff;
  },
  deleteStaff: async (id: string) => {
      db.staffMembers = db.staffMembers.filter(s => s.id !== id);
      saveDatabase();
  },
  getRoles: async () => {
      await delay(200);
      return [...db.roles];
  },
  addRole: async (role: Role) => {
      await delay(300);
      db.roles.push(role);
      saveDatabase();
      return role;
  },

  // --- COMMUNICATION ---
  getAnnouncements: async () => {
      await delay(200);
      return [...db.announcements];
  },
  addAnnouncement: async (a: Announcement) => {
      db.announcements.unshift(a);
      saveDatabase();
      return a;
  },
  deleteAnnouncement: async (id: string) => {
      db.announcements = db.announcements.filter(a => a.id !== id);
      saveDatabase();
  },
  getTemplates: async () => {
      await delay(200);
      return [...db.templates];
  },
  saveTemplate: async (t: CommunicationTemplate) => {
      const idx = db.templates.findIndex(temp => temp.id === t.id);
      if (idx >= 0) {
          db.templates[idx] = t;
      } else {
          db.templates.push(t);
      }
      saveDatabase();
      return t;
  },
  deleteTemplate: async (id: string) => {
      db.templates = db.templates.filter(t => t.id !== id);
      saveDatabase();
  },

  // --- BUNDLES ---
  getBundles: async () => {
      await delay(200);
      return [...db.bundles];
  },
  saveBundle: async (b: Bundle) => {
      const idx = db.bundles.findIndex(bun => bun.id === b.id);
      if (idx >= 0) {
          db.bundles[idx] = b;
      } else {
          db.bundles.push(b);
      }
      saveDatabase();
      return b;
  },
  deleteBundle: async (id: string) => {
      db.bundles = db.bundles.filter(b => b.id !== id);
      saveDatabase();
  },

  // --- ACCESS CONTROL ---
  getAccessRules: async () => {
      await delay(200);
      return [...db.accessRules];
  },
  addAccessRule: async (rule: AccessRule) => {
      db.accessRules.unshift(rule);
      saveDatabase();
      return rule;
  },
  deleteAccessRule: async (id: string) => {
      db.accessRules = db.accessRules.filter(r => r.id !== id);
      saveDatabase();
  },

  // --- CRON JOBS ---
  getCronJobs: async () => {
      await delay(100);
      return [...db.cronJobs];
  },
  toggleCronJob: async (id: string) => {
      const job = db.cronJobs.find(j => j.id === id);
      if (job) {
          job.status = job.status === 'active' ? 'inactive' : 'active';
          saveDatabase();
      }
  }
};