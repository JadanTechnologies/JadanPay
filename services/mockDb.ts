
import { User, Transaction, TransactionType, TransactionStatus, UserRole, Provider, Ticket, UserStatus, Staff, Role, Announcement, CommunicationTemplate, Bundle, AppNotification } from '../types';
import { MOCK_USERS_DATA, SAMPLE_BUNDLES } from '../constants';

// Initial Mock State
// Ensure mock users have wallet numbers
let users: User[] = MOCK_USERS_DATA.map(u => ({
    ...u,
    walletNumber: u.id === 'u1' ? '2039485712' : u.id === 'u2' ? '2058392011' : '0000000000'
})) as User[];

let bundles: Bundle[] = SAMPLE_BUNDLES.map(b => ({...b, planId: b.id}));

let transactions: Transaction[] = [
  {
    id: 'tx_1',
    userId: 'u1',
    type: TransactionType.DATA,
    provider: Provider.MTN,
    amount: 1000,
    costPrice: 950,
    profit: 50,
    destinationNumber: '08031234567',
    bundleName: '1.5GB Monthly',
    status: TransactionStatus.SUCCESS,
    date: new Date(Date.now() - 86400000).toISOString(),
    reference: 'REF-123456789',
    previousBalance: 6000,
    newBalance: 5000,
  }
];

let tickets: Ticket[] = [];
let staffMembers: Staff[] = [];
let roles: Role[] = [];
let announcements: Announcement[] = [];
let templates: CommunicationTemplate[] = [];
let notifications: AppNotification[] = [];

// Helper to simulate network delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Generate Unique Wallet Number
const generateWalletNumber = () => {
    return '2' + Math.random().toString().slice(2, 11);
};

export const MockDB = {
  getUsers: async () => {
    await delay(500);
    return users;
  },

  getUserByEmail: async (email: string) => {
    await delay(300);
    return users.find(u => u.email === email);
  },

  // REGISTRATION WITH VALIDATION
  registerUser: async (name: string, email: string, phone: string): Promise<User> => {
      await delay(800);
      
      // Check duplicates
      const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      const phoneExists = users.some(u => u.phone === phone);

      if (emailExists) throw new Error("This email address is already registered.");
      if (phoneExists) throw new Error("This phone number is already registered.");

      const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          email,
          phone,
          role: UserRole.USER,
          balance: 0,
          savings: 0,
          walletNumber: generateWalletNumber(),
          isVerified: true, // Auto verify for demo
          status: UserStatus.ACTIVE,
          ipAddress: '127.0.0.1',
          os: 'Web Browser',
          lastLogin: new Date().toISOString()
      };

      users.push(newUser);
      
      // Create Welcome Notification
      notifications.push({
          id: Math.random().toString(36),
          userId: newUser.id,
          title: 'Welcome to JadanPay!',
          message: 'We are glad to have you onboard. Fund your wallet to get started.',
          date: new Date().toISOString(),
          isRead: false,
          type: 'success'
      });

      return newUser;
  },

  updateUserBalance: async (userId: string, amount: number) => {
    await delay(300);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    
    // Create deep copy
    const user = { ...users[userIndex] };
    user.balance += amount;
    users[userIndex] = user;
    return user;
  },
  
  updateUserSavings: async (userId: string, amount: number) => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].savings += amount;
    }
  },

  updateUserStatus: async (userId: string, status: UserStatus) => {
    await delay(300);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].status = status;
        return users[userIndex];
    }
    throw new Error("User not found");
  },

  updateUser: async (user: User) => {
      await delay(300);
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
          users[idx] = user;
          return user;
      }
      throw new Error("User not found");
  },

  deleteUser: async (userId: string) => {
      await delay(400);
      users = users.filter(u => u.id !== userId);
  },

  getTransactions: async (userId?: string) => {
    await delay(500);
    if (userId) {
      return transactions.filter(t => t.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addTransaction: async (tx: Transaction) => {
    await delay(400);
    transactions.unshift(tx);
    return tx;
  },

  getAllTransactionsAdmin: async () => {
    await delay(600);
    return transactions;
  },

  // PENDING PAYMENTS (MANUAL FUNDING)
  getPendingTransactions: async () => {
      await delay(300);
      return transactions.filter(t => t.status === TransactionStatus.PENDING && t.type === TransactionType.WALLET_FUND);
  },

  approveTransaction: async (txId: string) => {
      await delay(600);
      const idx = transactions.findIndex(t => t.id === txId);
      if (idx === -1) throw new Error("Transaction not found");

      const tx = transactions[idx];
      tx.status = TransactionStatus.SUCCESS;
      tx.adminActionDate = new Date().toISOString();

      // Credit User
      const user = await MockDB.updateUserBalance(tx.userId, tx.amount);
      tx.previousBalance = user.balance - tx.amount;
      tx.newBalance = user.balance;

      // Notify User
      MockDB.addNotification({
          userId: tx.userId,
          title: 'Payment Approved',
          message: `Your manual funding of ₦${tx.amount.toLocaleString()} has been approved.`,
          type: 'success'
      });
      
      // Simulate Push/Email
      console.log(`[PUSH] To ${tx.userId}: Payment Approved`);
      console.log(`[EMAIL] To ${tx.userId}: Payment Approved`);

      return tx;
  },

  declineTransaction: async (txId: string) => {
      await delay(600);
      const idx = transactions.findIndex(t => t.id === txId);
      if (idx === -1) throw new Error("Transaction not found");

      transactions[idx].status = TransactionStatus.DECLINED;
      transactions[idx].adminActionDate = new Date().toISOString();

      // Notify User
      MockDB.addNotification({
          userId: transactions[idx].userId,
          title: 'Payment Declined',
          message: `Your manual funding request of ₦${transactions[idx].amount.toLocaleString()} was declined. Please check proof.`,
          type: 'error'
      });

      return transactions[idx];
  },

  // NOTIFICATIONS
  getNotifications: async (userId: string) => {
      return notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      notifications.unshift(notif);
  },

  markNotificationsRead: async (userId: string) => {
      notifications.forEach(n => {
          if (n.userId === userId) n.isRead = true;
      });
  },

  // Ticket Methods
  getTickets: async () => {
    await delay(400);
    return tickets;
  },
  
  replyTicket: async (ticketId: string, text: string, isAdmin: boolean) => {
    await delay(300);
    const tIndex = tickets.findIndex(t => t.id === ticketId);
    if (tIndex !== -1) {
        tickets[tIndex].messages.push({
            id: Math.random().toString(36),
            senderId: isAdmin ? 'admin' : tickets[tIndex].userId,
            text,
            date: new Date().toISOString(),
            isAdmin
        });
    }
  },

  // Staff Methods
  getStaff: async () => {
      await delay(200);
      return staffMembers;
  },
  addStaff: async (staff: Staff) => {
      await delay(300);
      staffMembers.push(staff);
      return staff;
  },
  deleteStaff: async (id: string) => {
      staffMembers = staffMembers.filter(s => s.id !== id);
  },
  getRoles: async () => {
      await delay(200);
      return roles;
  },
  addRole: async (role: Role) => {
      await delay(300);
      roles.push(role);
      return role;
  },

  // Communication Methods
  getAnnouncements: async () => {
      await delay(200);
      return announcements;
  },
  addAnnouncement: async (a: Announcement) => {
      announcements.unshift(a);
      return a;
  },
  deleteAnnouncement: async (id: string) => {
      announcements = announcements.filter(a => a.id !== id);
  },
  getTemplates: async () => {
      await delay(200);
      return templates;
  },
  saveTemplate: async (t: CommunicationTemplate) => {
      const idx = templates.findIndex(temp => temp.id === t.id);
      if (idx >= 0) {
          templates[idx] = t;
      } else {
          templates.push(t);
      }
      return t;
  },
  deleteTemplate: async (id: string) => {
      templates = templates.filter(t => t.id !== id);
  },

  // Bundle / Pricing Methods
  getBundles: async () => {
      await delay(200);
      return bundles;
  },
  saveBundle: async (b: Bundle) => {
      const idx = bundles.findIndex(bun => bun.id === b.id);
      if (idx >= 0) {
          bundles[idx] = b;
      } else {
          bundles.push(b);
      }
      return b;
  },
  deleteBundle: async (id: string) => {
      bundles = bundles.filter(b => b.id !== id);
  }
};
