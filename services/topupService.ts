import { Transaction, TransactionType, TransactionStatus, Provider, Bundle, User } from '../types';
import { MockDB } from './mockDb';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateRef = () => `REF-${Math.floor(Math.random() * 1000000000)}`;

export const processAirtimePurchase = async (
  user: User,
  provider: Provider,
  amount: number,
  phone: string,
  roundUpSavings: boolean
): Promise<Transaction> => {
  
  if (user.balance < amount) {
    throw new Error("Insufficient wallet balance.");
  }

  // Calculate Roundup
  let finalDeduction = amount;
  let savedAmount = 0;
  
  if (roundUpSavings) {
    const nextHundred = Math.ceil(amount / 100) * 100;
    if (nextHundred > amount) {
        savedAmount = nextHundred - amount;
        finalDeduction = nextHundred;
    }
  }

  if (user.balance < finalDeduction) {
     throw new Error("Insufficient balance for transaction + savings roundup.");
  }

  // Deduct Balance
  const updatedUser = await MockDB.updateUserBalance(user.id, -finalDeduction);
  
  // Add to Savings if applicable
  if (savedAmount > 0) {
      await MockDB.updateUserSavings(user.id, savedAmount);
  }

  const tx: Transaction = {
    id: generateId(),
    userId: user.id,
    type: TransactionType.AIRTIME,
    provider,
    amount,
    destinationNumber: phone,
    status: TransactionStatus.SUCCESS,
    date: new Date().toISOString(),
    reference: generateRef(),
    previousBalance: user.balance,
    newBalance: updatedUser.balance
  };

  await MockDB.addTransaction(tx);
  return tx;
};

export const processDataPurchase = async (
  user: User,
  bundle: Bundle,
  phone: string,
  roundUpSavings: boolean
): Promise<Transaction> => {
  
  const amount = bundle.price;

    if (user.balance < amount) {
    throw new Error("Insufficient wallet balance.");
  }

  // Calculate Roundup
  let finalDeduction = amount;
  let savedAmount = 0;
  
  if (roundUpSavings) {
    const nextHundred = Math.ceil(amount / 100) * 100;
    if (nextHundred > amount) {
        savedAmount = nextHundred - amount;
        finalDeduction = nextHundred;
    }
  }
  
  if (user.balance < finalDeduction) {
     throw new Error("Insufficient balance for transaction + savings roundup.");
  }

  // Deduct Balance
  const updatedUser = await MockDB.updateUserBalance(user.id, -finalDeduction);
   if (savedAmount > 0) {
      await MockDB.updateUserSavings(user.id, savedAmount);
  }

  const tx: Transaction = {
    id: generateId(),
    userId: user.id,
    type: TransactionType.DATA,
    provider: bundle.provider,
    amount,
    destinationNumber: phone,
    bundleName: bundle.name,
    status: TransactionStatus.SUCCESS,
    date: new Date().toISOString(),
    reference: generateRef(),
    previousBalance: user.balance,
    newBalance: updatedUser.balance
  };

  await MockDB.addTransaction(tx);
  return tx;
};

export const fundWallet = async (user: User, amount: number): Promise<Transaction> => {
  // Mock Payment Gateway Success
  const updatedUser = await MockDB.updateUserBalance(user.id, amount);

  const tx: Transaction = {
    id: generateId(),
    userId: user.id,
    type: TransactionType.WALLET_FUND,
    amount,
    status: TransactionStatus.SUCCESS,
    date: new Date().toISOString(),
    reference: generateRef(),
    previousBalance: user.balance,
    newBalance: updatedUser.balance
  };

  await MockDB.addTransaction(tx);
  return tx;
};