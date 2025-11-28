import { Transaction, TransactionType, TransactionStatus, Provider, Bundle, User, BillProvider } from '../types';
import { MockDB } from './mockDb';
import { ApiService } from './apiService';
import { NotificationService } from './notificationService';
import { SettingsService } from './settingsService';
import { playNotification } from '../utils/audio';

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
    return val;
};

// Helper to calculate expiry date from validity string
const calculateExpiryDate = (validity: string): Date | null => {
    if (!validity) return null;

    const now = new Date();
    const parts = validity.toLowerCase().split(' ');
    if (parts.length < 2) return null;

    const value = parseInt(parts[0], 10);
    const unit = parts[1];

    if (isNaN(value)) return null;

    if (unit.startsWith('day')) {
        now.setDate(now.getDate() + value);
    } else if (unit.startsWith('hour')) {
        now.setHours(now.getHours() + value);
    } else if (unit.startsWith('month')) {
        now.setMonth(now.getMonth() + value);
    } else if (unit.startsWith('year')) {
        now.setFullYear(now.getFullYear() + value);
    } else {
        return null; // Unsupported unit
    }

    return now;
};

export const processAirtimePurchase = async (
  user: User,
  provider: Provider,
  amount: number,
  phone: string,
  roundUpSavings: boolean,
  pin: string
): Promise<Transaction> => {
  if (!user.transactionPin) {
    throw new Error("Transaction PIN not set. Please create one in your Profile.");
  }
  if (user.transactionPin !== pin) {
    throw new Error("Incorrect transaction PIN.");
  }

  const settings = await SettingsService.getSettings();
  const serviceFee = settings.serviceFees?.airtime || 0;
  
  const sellingPercentage = settings.servicePricing?.airtimeSellingPercentage || 100;
  const costPercentage = settings.servicePricing?.airtimeCostPercentage || 98;

  const sellingPrice = amount * (sellingPercentage / 100);
  const costPrice = amount * (costPercentage / 100);

  const totalDeduction = sellingPrice + serviceFee;
  const profit = (sellingPrice - costPrice) + serviceFee;

  if (user.balance < totalDeduction) {
    throw new Error("Insufficient wallet balance.");
  }

  try {
      const apiResponse = await ApiService.buyAirtime(provider, phone, amount);
      if (!apiResponse.success) {
          throw new Error(apiResponse.error || "Provider failed to process transaction");
      }
  } catch (error: any) {
      console.error("Service Integration Error:", error);
      throw new Error(error.message || "Service temporarily unavailable. Please try again later.");
  }

  const updatedUser = await MockDB.updateUserBalance(user.id, -totalDeduction);

  const tx: Transaction = {
    id: generateId(),
    userId: user.id,
    type: TransactionType.AIRTIME,
    provider,
    amount: totalDeduction,
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
  
  const audioMsg = `${provider} airtime worth ₦${amount} has been sent to ${phone} successfully.`;
  playNotification(audioMsg);

  const smsMsg = `JadanPay: ${provider} Airtime of N${amount} to ${phone} Successful. New Bal: N${updatedUser.balance.toFixed(2)}. Ref: ${tx.reference}`;
  await NotificationService.sendSms(user.phone, smsMsg);

  return tx;
};

export const processDataPurchase = async (
  user: User,
  bundle: Bundle,
  phone: string,
  roundUpSavings: boolean,
  pin: string
): Promise<Transaction> => {
  if (!user.transactionPin) {
    throw new Error("Transaction PIN not set. Please create one in your Profile.");
  }
  if (user.transactionPin !== pin) {
    throw new Error("Incorrect transaction PIN.");
  }

  const settings = await SettingsService.getSettings();
  const serviceFee = settings.serviceFees?.data || 0;
  const baseAmount = bundle.price;
  const totalDeduction = baseAmount + serviceFee;

  if (user.balance < totalDeduction) {
    throw new Error("Insufficient wallet balance.");
  }

  try {
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

  const updatedUser = await MockDB.updateUserBalance(user.id, -totalDeduction);

  const gbAmount = parseDataToGB(bundle.dataAmount);
  if (gbAmount > 0) {
      await MockDB.updateUserDataBalance(user.id, gbAmount);
  }

  const costPrice = bundle.costPrice || (bundle.price * 0.95);
  const profit = (baseAmount - costPrice) + serviceFee;
  const expiryDate = calculateExpiryDate(bundle.validity);

  const tx: Transaction = {
    id: generateId(),
    userId: user.id,
    type: TransactionType.DATA,
    provider: bundle.provider,
    amount: totalDeduction,
    costPrice,
    profit,
    destinationNumber: phone,
    bundleName: bundle.name,
    status: TransactionStatus.SUCCESS,
    date: new Date().toISOString(),
    reference: generateRef(),
    previousBalance: user.balance,
    newBalance: updatedUser.balance,
    expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
  };

  await MockDB.addTransaction(tx);
  
  const audioMsg = `Data plan ${bundle.name} has been sent to ${phone} successfully.`;
  playNotification(audioMsg);

  const smsMsg = `JadanPay: ${bundle.dataAmount} Data sent to ${phone}. Plan: ${bundle.name}. New Bal: N${updatedUser.balance.toFixed(2)}.`;
  await NotificationService.sendSms(user.phone, smsMsg);

  return tx;
};

export const processBillPayment = async (
    user: User,
    type: TransactionType,
    provider: BillProvider,
    number: string,
    baseAmount: number,
    pin: string,
    bundle?: Bundle
): Promise<Transaction> => {
    if (!user.transactionPin) {
        throw new Error("Transaction PIN not set. Please create one in your Profile.");
    }
    if (user.transactionPin !== pin) {
        throw new Error("Incorrect transaction PIN.");
    }

    const settings = await SettingsService.getSettings();
    const serviceFee = type === TransactionType.CABLE 
        ? settings.serviceFees.cable 
        : settings.serviceFees.electricity;
    
    const totalAmount = baseAmount + serviceFee;
    
    if (user.balance < totalAmount) throw new Error("Insufficient wallet balance.");

    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    const meterToken = type === TransactionType.ELECTRICITY ? `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : undefined;

    const updatedUser = await MockDB.updateUserBalance(user.id, -totalAmount);

    // Assuming API cost is the base amount for bills
    const costPrice = baseAmount; 
    const profit = serviceFee;

    const tx: Transaction = {
        id: generateId(),
        userId: user.id,
        type: type,
        provider: provider,
        amount: totalAmount,
        costPrice: costPrice,
        profit: profit,
        destinationNumber: number,
        bundleName: bundle ? bundle.name : 'Top-up',
        status: TransactionStatus.SUCCESS,
        date: new Date().toISOString(),
        reference: generateRef(),
        previousBalance: user.balance,
        newBalance: updatedUser.balance,
        customerName: 'JABIR MUSA', // From validation
        meterToken: meterToken
    };

    await MockDB.addTransaction(tx);
    
    const audioMsg = `${provider} bill payment for ${number} was successful.`;
    playNotification(audioMsg);

    const smsMsg = `JadanPay: Bill Payment (${provider}) for ${number} of N${totalAmount} was successful. New Bal: N${updatedUser.balance.toFixed(2)}`;
    await NotificationService.sendSms(user.phone, smsMsg);

    return tx;
};

export const fundWallet = async (user: User, amount: number): Promise<Transaction> => {
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
    paymentMethod: 'Bank Transfer'
  };

  await MockDB.addTransaction(tx);
  
  const audioMsg = `Payment of ₦${amount.toLocaleString()} received successfully.`;
  playNotification(audioMsg);

  const smsMsg = `JadanPay: Wallet funded with N${amount} Successfully. New Bal: N${updatedUser.balance.toFixed(2)}. Ref: ${ref}`;
  await NotificationService.sendSms(user.phone, smsMsg);

  return tx;
};