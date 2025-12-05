import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import { User as AppUser, UserRole, UserStatus } from '../types';

interface AuthContextType {
    session: Session | null;
    user: AppUser | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    isAdmin: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    signOut: async () => { },
    isAdmin: false,
    refreshProfile: async () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to map Supabase profile to AppUser
    const mapProfileToUser = (profile: any, email?: string): AppUser => {
        // Default to safe values if fields are missing in early migration stages
        return {
            id: profile.id,
            email: email || profile.email || '',
            name: profile.full_name || email?.split('@')[0] || 'User',
            role: (profile.role as UserRole) || UserRole.USER,
            phone: profile.phone || '',
            balance: profile.balance || 0,
            savings: profile.savings || 0,
            bonusBalance: profile.bonus_balance || 0,
            walletNumber: profile.wallet_number || '0000',
            accountNumber: profile.account_number || '',
            referralCode: profile.referral_code || '',
            referredBy: profile.referred_by,
            referralCount: 0, // Need to implement counting logic separately if needed
            isVerified: profile.is_verified || false,
            avatarUrl: profile.avatar_url,
            status: UserStatus.ACTIVE, // Defaulting to active for now
            joinedDate: profile.created_at,
            dataTotal: 0, // Placeholder
            dataUsed: 0, // Placeholder
        };
    };

    const fetchProfile = async (userId: string, email?: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }

            return mapProfileToUser(data, email);
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            // Create a timeout promise that resolves after 3 seconds
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => resolve('timeout'), 3000);
            });

            try {
                // Race Supabase session check against the timeout
                const sessionPromise = supabase.auth.getSession();
                const result = await Promise.race([sessionPromise, timeoutPromise]);

                if (result === 'timeout') {
                    console.warn("Supabase auth check timed out - likely missing keys or connection issue. Proceeding as guest.");
                    if (mounted) setIsLoading(false);
                    return;
                }

                // If we get here, Supabase responded
                const { data: { session }, error } = result as any;

                if (error) {
                    console.error("Supabase auth error during init:", error);
                    if (mounted) setIsLoading(false);
                    return;
                }

                // If session exists, fetch profile
                if (session && mounted) {
                    setSession(session);
                    try {
                        const profile = await fetchProfile(session.user.id, session.user.email);
                        if (mounted) setUser(profile);
                    } catch (profileErr) {
                        console.error("Profile fetch failed:", profileErr);
                    }
                }
            } catch (err) {
                console.error("Critical AuthContext initialization error:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        // 1. Run initialization
        initAuth();

        // 2. Listen for changes (non-blocking)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            setSession(session);
            if (session) {
                const profile = await fetchProfile(session.user.id, session.user.email);
                if (mounted) setUser(profile);
            } else {
                if (mounted) setUser(null);
            }
            if (mounted) setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const refreshProfile = async () => {
        if (session) {
            const profile = await fetchProfile(session.user.id, session.user.email);
            setUser(profile);
        }
    };

    const value = {
        session,
        user,
        isLoading,
        signOut,
        isAdmin: user?.role === UserRole.ADMIN,
        refreshProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
