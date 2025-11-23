import React, { useState } from 'react';
import { login, register } from '../services/authService';
import { User } from '../types';
import { Loader2 } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('tunde@example.com');
  const [otp, setOtp] = useState('1234');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const user = await login(email, otp);
        onAuthSuccess(user);
      } else {
        const user = await register(name, email, phone, otp);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-xl border border-gray-100">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-700 tracking-tight mb-2">JadanPay</h1>
            <p className="text-gray-500">Your #1 Plug for Data & Airtime.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
            <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
                Login
            </button>
            <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
                Register
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                        <input 
                            type="tel" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required
                        />
                    </div>
                </>
            )}

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                    type="email" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">OTP (Demo: 1234)</label>
                <input 
                    type="text" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono tracking-widest text-center text-lg" 
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    maxLength={4}
                    required
                />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-700/30 hover:bg-green-800 transition-colors flex items-center justify-center"
            >
                {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
            </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
            <p>Demo Credentials:</p>
            <p>User: tunde@example.com / 1234</p>
            <p>Admin: admin@jadanpay.com / 1234</p>
        </div>
      </div>
    </div>
  );
};