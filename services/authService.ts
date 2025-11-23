
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
   
   // This calls the MockDB which performs duplicate checks
   return await MockDB.registerUser(name, email, phone);
};

export const logout = async () => {
  // cleanup
};
