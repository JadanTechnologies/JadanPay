import { User } from '../types';
import { MockDB } from './mockDb';

export const login = async (email: string, otp: string): Promise<User> => {
  // Mock OTP check: for demo, any 4 digit OTP works if email exists
  const user = await MockDB.getUserByEmail(email);
  if (!user) {
    throw new Error("User not found. Please register.");
  }
  if (otp.length !== 4) {
    throw new Error("Invalid OTP");
  }
  return user;
};

export const register = async (name: string, email: string, phone: string, otp: string): Promise<User> => {
   // Mock registration
   if (otp.length !== 4) throw new Error("Invalid OTP");
   
   const existing = await MockDB.getUserByEmail(email);
   if (existing) throw new Error("Email already registered");

   // In a real app we would add to MockDB.users here
   // For this demo, let's just return a new user object that won't persist across refresh unless we used localStorage
   // But we will stick to the predefined MockDB users for simplicity of the demo flow
   throw new Error("Demo mode: Please use 'tunde@example.com' (User) or 'admin@jadanpay.com' (Admin)");
};

export const logout = async () => {
  // cleanup
};