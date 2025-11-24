
import { Transaction, TransactionType, TransactionStatus, Provider, Bundle, User, BillProvider } from '../types';
import { MockDB } from './mockDb';
import { ApiService } from './apiService';
import { NotificationService } from './notificationService';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateRef = () => `REF-${Math.floor(Math.random() * 1000000000)}`;

// Helper to parse Data Amount string to GB number
const parseDataToGB = (amountStr: string): number => {
    if (!amountStr) return 0;
    const normalize = amountStr.toUpperCase().replace(/\s/g, '');
    const val = parseFloat(normalize);
    
    if (isNaN(val)) return 0;
    
    if (normalize.includes('TB')) return val * 1024;
    if (normalize.includes('GB')) return val;
    if (normalize.includes('MB')) return val / 1024;
    
    // Default assumption if no unit provided (risky, but usually GB for these plans)
    return val;
};

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
  try {
      const apiResponse = await ApiService.buyAirtime(provider, phone, amount);
      
      if (!apiResponse.success) {
          throw new Error(apiResponse.error || "Provider failed to process transaction");
      }
  } catch (error: any) {
      console.error("Service Integration Error:", error);
      throw new Error(error.message || "Service temporarily unavailable. Please try again later.");
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

  // Send SMS Notification
  const smsMsg = `JadanPay: ${provider} Airtime of N${amount} to ${phone} Successful. New Bal: N${updatedUser.balance.toFixed(2)}. Ref: ${tx.reference}`;
  await NotificationService.sendSms(user.phone, smsMsg);

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
  try {
      // Validation: Check if API Plan ID exists
      if (!bundle.planId) {
          throw new Error("Configuration Error: This bundle is missing an API Plan ID. Please contact support.");
      }
      
      const apiResponse = await ApiService.buyData(bundle.provider as string, phone, bundle.planId);
      
      if (!apiResponse.success) {
          throw new Error(apiResponse.error || "Data Provider failed to process transaction");
      }
  } catch (error: any) {
      console.error("Service Integration Error:", error);
      throw new Error(error.message || "Service temporarily unavailable. Please try again later.");
  }
  // --- API INTEGRATION END ---

  // Deduct Balance
  const updatedUser = await MockDB.updateUserBalance(user.id, -finalDeduction);
   if (savedAmount > 0) {
      await MockDB.updateUserSavings(user.id, savedAmount);
  }

  // Credit Data to User's virtual total
  const gbAmount = parseDataToGB(bundle.dataAmount);
  if (gbAmount > 0) {
      await MockDB.updateUserDataBalance(user.id, gbAmount);
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

  // Send SMS Notification
  const smsMsg = `JadanPay: ${bundle.dataAmount} Data sent to ${phone}. Plan: ${bundle.name}. New Bal: N${updatedUser.balance.toFixed(2)}.`;
  await NotificationService.sendSms(user.phone, smsMsg);

  return tx;
};

export const processBillPayment = async (
    user: User,
    type: TransactionType,
    provider: BillProvider,
    number: string, // IUC or Meter
    amount: number,
    bundle?: Bundle // For Cable
): Promise<Transaction> => {
    
    if (user.balance < amount) {
        throw new Error("Insufficient wallet balance.");
    }

    // --- MOCK API CALL START ---
    // In a real app, call ApiService.payBill()
    // For now, we simulate a latency and success
    await new Promise(r => setTimeout(r, 1500));
    // --- MOCK API CALL END ---

    // Deduct Balance
    const updatedUser = await MockDB.updateUserBalance(user.id, -amount);

    // Calculate Profit (Assume small fee or markup)
    // For bills, usually there is a N100 fee, or we get a commission. 
    // Let's assume we charge flat N50 profit on the price shown to user.
    const costPrice = amount - 50; 
    const profit = 50;

    const tx: Transaction = {
        id: generateId(),
        userId: user.id,
        type: type,
        provider: provider,
        amount: amount,
        costPrice: costPrice,
        profit: profit,
        destinationNumber: number,
        bundleName: bundle ? bundle.name : 'Top-up',
        status: TransactionStatus.SUCCESS,
        date: new Date().toISOString(),
        reference: generateRef(),
        previousBalance: user.balance,
        newBalance: updatedUser.balance,
        customerName: 'MOCKED CUSTOMER' // In real app, this comes from validation step
    };

    await MockDB.addTransaction(tx);

    // Send SMS Notification
    const smsMsg = `JadanPay: Bill Payment (${provider}) for ${number} Successful. Amount: N${amount}. New Bal: N${updatedUser.balance.toFixed(2)}`;
    await NotificationService.sendSms(user.phone, smsMsg);

    return tx;
};

export const fundWallet = async (user: User, amount: number): Promise<Transaction> => {
  // Mock Payment Gateway Success
  const updatedUser = await MockDB.updateUserBalance(user.id, amount);
  const ref = generateRef();

  const tx: Transaction = {
    id: generateId(),
    userId: user.id,
    type: TransactionType.WALLET_FUND,
    amount,
    status: TransactionStatus.SUCCESS,
    date: new Date().toISOString(),
    reference: ref,
    previousBalance: user.balance,
    newBalance: updatedUser.balance,
    paymentMethod: 'Bank Transfer' // Added default payment method for manual funding
  };

  await MockDB.addTransaction(tx);

  // Send SMS Notification
  const smsMsg = `JadanPay: Wallet funded with N${amount} Successfully. New Bal: N${updatedUser.balance.toFixed(2)}. Ref: ${ref}`;
  await NotificationService.sendSms(user.phone, smsMsg);

  return tx;
};