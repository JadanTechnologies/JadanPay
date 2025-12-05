
import { supabase } from '../utils/supabase';

// Since we heavily depend on AuthContext for state, this service now focuses on Action calls
// Returning promises that components can await.

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
};

export const register = async (name: string, email: string, phone: string, password: string, referralCode?: string) => {
  // 1. Sign Up using Supabase Auth
  // We pass extra metadata so our Trigger can pick it up and creating the Profile
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone,
        referral_code: referralCode // Passed to trigger logic if needed
      }
    }
  });

  if (error) throw error;

  // Note: If email confirmation is enabled, user won't be logged in immediately.
  // For this app we assume default behavior or handled by UI
  return data.user;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};