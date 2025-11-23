import { User, Transaction, TransactionType, TransactionStatus, UserRole, Provider, Ticket, UserStatus, Staff, Role, Announcement, CommunicationTemplate } from '../types';
import { MOCK_USERS_DATA } from '../constants';

// Initial Mock State
let users: User[] = [...MOCK_USERS_DATA] as User[];

let transactions: Transaction[] = [
  {
    id: 'tx_1',
    userId: 'u1',
    type: TransactionType.DATA,
    provider: Provider.MTN,
    amount: 1000,
    destinationNumber: '08031234567',
    bundleName: '1.5GB Monthly',
    status: TransactionStatus.SUCCESS,
    date: new Date(Date.now() - 86400000).toISOString(),
    reference: 'REF-123456789',
    previousBalance: 6000,
    newBalance: 5000,
  },
  {
    id: 'tx_2',
    userId: 'u2',
    type: TransactionType.WALLET_FUND,
    amount: 50000,
    status: TransactionStatus.SUCCESS,
    date: new Date(Date.now() - 172800000).toISOString(),
    reference: 'REF-987654321',
    previousBalance: 100000,
    newBalance: 150000,
  }
];

let tickets: Ticket[] = [
  {
    id: 't1',
    userId: 'u1',
    subject: 'Transaction Failed but Debited',
    status: 'open',
    priority: 'high',
    date: new Date().toISOString(),
    messages: [
      { id: 'm1', senderId: 'u1', text: 'I tried to buy data and was debited but no data.', date: new Date().toISOString(), isAdmin: false }
    ]
  }
];

let staffMembers: Staff[] = [];
let roles: Role[] = [
    { id: 'r1', name: 'Support Agent', permissions: ['view_users', 'reply_tickets'] },
    { id: 'r2', name: 'Manager', permissions: ['view_users', 'manage_staff', 'view_analytics'] }
];

let announcements: Announcement[] = [
    {
        id: 'a1',
        title: 'Maintenance Update',
        message: 'MTN Data services will be experiencing downtime between 1AM - 3AM tonight.',
        type: 'warning',
        audience: 'all',
        isActive: true,
        date: new Date().toISOString()
    }
];

let templates: CommunicationTemplate[] = [
    {
        id: 'tmp1',
        name: 'Welcome Email',
        channel: 'email',
        subject: 'Welcome to JadanPay!',
        body: 'Hi {name}, welcome to the platform. We are glad to have you.',
        variables: ['name']
    },
    {
        id: 'tmp2',
        name: 'Transaction Receipt',
        channel: 'sms',
        body: 'Tx Successful: {amount} {type} for {number}. Ref: {ref}',
        variables: ['amount', 'type', 'number', 'ref']
    }
];

// Helper to simulate network delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockDB = {
  getUsers: async () => {
    await delay(500);
    return users;
  },

  getUserByEmail: async (email: string) => {
    await delay(300);
    return users.find(u => u.email === email);
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
  getStaff: async () => staffMembers,
  addStaff: async (staff: Staff) => {
      staffMembers.push(staff);
      return staff;
  },
  getRoles: async () => roles,
  addRole: async (role: Role) => {
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
  }
};