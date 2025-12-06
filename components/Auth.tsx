import React, { useState, useEffect } from 'react';
import { login, register } from '../services/authService';
import { User } from '../types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { playNotification } from '../utils/audio';
import { SettingsService } from '../services/settingsService';

interface AuthProps {
    onAuthSuccess: (user: User) => void;
    onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Branding
    const [appName, setAppName] = useState('JadanPay');
    const [logoUrl, setLogoUrl] = useState('');

    // Form State
    const [email, setEmail] = useState('tunde@example.com');
    const [password, setPassword] = useState('user123');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [referralCode, setReferralCode] = useState('');

    useEffect(() => {
        SettingsService.getSettings().then(s => {
            setAppName(s.appName);
            setLogoUrl(s.logoUrl);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Login timed out. Check connection.")), 15000)
        );

        try {
            if (isLogin) {
                // Race login against timeout
                const loginPromise = login(email, password);
                const user = await Promise.race([loginPromise, timeoutPromise]) as User;

                // HACK: Force a small delay to allow AuthContext to update via its subscription listener
                // calling onAuthSuccess immediately might be too fast if relying on 'user' state in App.tsx
                await new Promise(r => setTimeout(r, 500));

                onAuthSuccess(user);
            } else {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match.");
                }

                const registerPromise = register(name, email, phone, password, referralCode);
                const user = await Promise.race([registerPromise, timeoutPromise]) as User;

                // Success Audio
                const welcomeText = `Welcome to the ${appName} family, ${name}. We are glad to have you on board.`;
                playNotification(welcomeText);

                onAuthSuccess(user);
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
            playNotification("Authentication failed. " + (err.message || ""), 'error');
            setLoading(false); // Only set loading false on error, success unmounts component
        }
    };

    const handleTestConnection = async () => {
        alert("Starting connection diagnostic... (Step 1/2)");

        try {
            // 1. Raw Fetch Test
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!url || !key) {
                alert("Missing URL or Key in environment variables!");
                return;
            }

            console.log("Testing connection to:", url);
            const response = await fetch(`${url}/rest/v1/profiles?select=count&limit=1`, {
                method: 'GET',
                headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
            });

            if (!response.ok) {
                const text = await response.text();
                alert(`Raw Fetch FAILED.\nStatus: ${response.status}\nError: ${text}`);
                return;
            }

            alert("Network OK. Starting SDK Auth Test (Step 2/2)...");

            // 2. SDK Auth Test
            const { supabase } = await import('../utils/supabase');
            const { error } = await supabase.auth.signInWithPassword({
                email: 'test@connection-check.com',
                password: 'wrongpassword123'
            });

            if (error && error.message === 'Invalid login credentials') {
                alert(`Diagnostic Result: EVERYTHING IS GOOD.\n\n1. Network: OK\n2. Status: 200\n3. SDK: OK (Got expected 'Invalid login' error)\n\nIf you still can't login, check if your User Account actually exists in Supabase 'users' table.`);
            } else if (error) {
                alert(`SDK Error: ${error.message}`);
            } else {
                alert("SDK Test: Unexpected success (should have failed login).");
            }

        } catch (e: any) {
            alert(`Diagnostic Failed:\n${e.message}`);
            console.error(e);
        }
    };



    const handleForgotPassword = () => {
        if (!email) {
            alert("Please enter your email address first.");
            return;
        }
        alert(`A password reset link has been sent to ${email} (simulation).`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4 transition-colors duration-300 overflow-hidden relative">

            {/* Background decoration for levitation effect context */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 dark:bg-green-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            {/* Main Card with Levitation Animation */}
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800 relative z-10 levitate transition-all duration-300">
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="text-center mb-8 mt-2">
                    <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
                        ) : (
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                                {appName.charAt(0)}
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{appName}</h1>
                    <p className="text-gray-500 dark:text-gray-400">Your #1 Plug for Data & Airtime.</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Password</label>
                            {isLogin && (
                                <button type="button" onClick={handleForgotPassword} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">Forgot Password?</button>
                            )}
                        </div>
                        <input
                            type="password"
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Referral Code (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none uppercase font-mono tracking-wider text-gray-900 dark:text-white transition-colors"
                                    value={referralCode}
                                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. TUND123"
                                />
                            </div>
                        </>
                    )}

                    {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/50">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 hover:shadow-green-500/40 transition-all flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400">
                    <p>Demo Credentials:</p>
                    <p>User: tunde@example.com / user123</p>
                    <p>Admin: admin@jadanpay.com / admin123</p>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="flex items-center justify-center gap-2">
                            Status:
                            <span className={`inline-block w-2 h-2 rounded-full ${import.meta.env.VITE_SUPABASE_URL ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {import.meta.env.VITE_SUPABASE_URL ? 'System Online' : 'Config Missing'}
                        </p>
                        {!import.meta.env.VITE_SUPABASE_URL && <p className="text-[10px] text-red-400 mt-1">Error: VITE_SUPABASE_URL not found</p>}

                        <button
                            type="button"
                            onClick={handleTestConnection}
                            className="mt-2 text-[10px] underline text-gray-400 hover:text-gray-600"
                        >
                            Test Connection details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};