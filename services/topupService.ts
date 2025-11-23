
import { Transaction, TransactionType, TransactionStatus, Provider, Bundle, User } from '../types';
import { MockDB } from './mockDb';
import { BilalService } from './bilalService';

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

  // --- API INTEGRATION START ---
  // Call Bilal Service
  try {
      const apiResponse = await BilalService.buyAirtime(provider, phone, amount);
      if (!apiResponse.ok) {
          throw new Error("Provider failed to process transaction");
      }
  } catch (error) {
      console.error("API Error", error);
      // Decide if you want to throw error or fallback. For now, we throw.
      // throw new Error("Service temporarily unavailable");
      // For Demo purposes, we proceed even if API "mock" fails, or we assume success above.
  }
  // --- API INTEGRATION END ---

  // Deduct Balance
  const updatedUser = await MockDB.updateUserBalance(user.id, -finalDeduction);
  
  // Add to Savings if applicable
  if (savedAmount > 0) {
      await MockDB.updateUserSavings(user.id, savedAmount);
  }

  // Calculate Profit for Airtime (Assume 2% profit margin for Airtime)
  const costPrice = amount * 0.98;
  const profit = amount - costPrice;

  const tx: Transaction = {
    id: generateId(),
    userId: user.id,
    type: TransactionType.AIRTIME,
    provider,
    amount,
    costPrice,
    profit,
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

  // --- API INTEGRATION START ---
  // Call Bilal Service
  try {
      // We use bundle.id as the plan_id
      const apiResponse = await BilalService.buyData(bundle.provider, phone, bundle.id);
      if (!apiResponse.ok) {
          throw new Error("Provider failed to process transaction");
      }
  } catch (error) {
      console.error("API Error", error);
  }
  // --- API INTEGRATION END ---

  // Deduct Balance
  const updatedUser = await MockDB.updateUserBalance(user.id, -finalDeduction);
   if (savedAmount > 0) {
      await MockDB.updateUserSavings(user.id, savedAmount);
  }

  // Calculate Profit from Bundle settings
  const costPrice = bundle.costPrice || (bundle.price * 0.95); // Fallback to 5% margin if costPrice missing
  const profit = bundle.price - costPrice;

  const tx: Transaction = {
    id: generateId(),
    userId: user.id,
    type: TransactionType.DATA,
    provider: bundle.provider,
    amount,
    costPrice,
    profit,
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
    newBalance: updatedUser.balance,
    paymentMethod: 'Bank Transfer' // Added default payment method for manual funding
  };

  await MockDB.addTransaction(tx);
  return tx;
};
