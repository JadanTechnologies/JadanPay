

import { User } from '../types';
import { MockDB } from './mockDb';

export const login = async (email: string, password: string): Promise<User> => {
  const user = await MockDB.getUserByEmail(email);
  if (!user) {
    throw new Error("User not found. Please register.");
  }
  if (user.password !== password) {
    throw new Error("Incorrect password.");
  }
  return user;
};

export const register = async (name: string, email: string, phone: string, password: string, referralCode?: string): Promise<User> => {
   // This calls the MockDB which performs duplicate checks
   return await MockDB.registerUser(name, email, phone, password, referralCode);
};

export const logout = async () => {
  // cleanup
};