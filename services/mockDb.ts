import { User, Transaction, TransactionType, TransactionStatus, UserRole, Provider } from '../types';
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
  }
};