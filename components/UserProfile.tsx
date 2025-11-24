
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MockDB } from '../services/mockDb';
import { Save, User as UserIcon, Phone, Mail, Shield, CheckCircle, Lock, Key, Briefcase, Clock, AlertCircle } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdate: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // PIN State
  const [pinData, setPinData] = useState({ oldPin: '', newPin: '' });
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState('');

  // Reseller Request State
  const [requestLoading, setRequestLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
        const updatedUser = { ...user, ...formData };
        await MockDB.updateUser(updatedUser);
        onUpdate();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
        alert("Failed to update profile");
    } finally {
        setLoading(false);
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
      e.preventDefault();
      setPinMessage('');
      
      if (pinData.newPin.length !== 4) {
          setPinMessage("New PIN must be 4 digits.");
          return;
      }

      // If user has an existing PIN, old pin is required
      if (user.transactionPin && pinData.oldPin !== user.transactionPin) {
          setPinMessage("Incorrect Old PIN.");
          return;
      }

      setPinLoading(true);
      try {
          await MockDB.updateUser({ ...user, transactionPin: pinData.newPin });
          onUpdate(); // Sync parent
          user.transactionPin = pinData.newPin; // Local sync hack
          setPinMessage("PIN updated successfully!");
          setPinData({ oldPin: '', newPin: '' });
      } catch (e) {
          setPinMessage("Failed to update PIN.");
      } finally {
          setPinLoading(false);
      }
  };

  const handleRequestUpgrade = async () => {
      if (!window.confirm("Are you sure you want to apply for a Reseller account?")) return;
      setRequestLoading(true);
      try {
          await MockDB.requestResellerUpgrade(user.id);
          onUpdate();
          alert("Application submitted successfully! An admin will review your request.");
      } catch (e) {
          alert("Failed to submit request.");
      } finally {
          setRequestLoading(false);
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden transition-colors">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-green-600 to-teal-600"></div>
            
            <div className="relative z-10 mt-16 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl bg-gray-100 dark:bg-gray-700 overflow-hidden mb-4">
                    <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random&size=128`} className="w-full h-full object-cover" alt="" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                
                <div className="flex gap-2 mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1 ${user.role === UserRole.RESELLER ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                        <Shield size={12}/> {user.role}
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle size={12}/> Verified
                    </span>
                </div>
            </div>
        </div>

        {/* Reseller Upgrade Section */}
        {user.role === UserRole.USER && (
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="text-purple-200" />
                        <h3 className="font-bold text-lg">Business Upgrade</h3>
                    </div>
                    <p className="text-purple-200 text-sm mb-6 max-w-md">
                        Become a reseller to access cheaper rates, API documentation, and bulk transaction tools. Start your own VTU business today.
                    </p>

                    {user.resellerRequestStatus === 'PENDING' ? (
                        <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-3">
                            <Clock className="text-yellow-400 animate-pulse" size={20}/>
                            <div>
                                <p className="font-bold text-sm">Application Pending</p>
                                <p className="text-xs text-purple-200">Your request is under review by an admin.</p>
                            </div>
                        </div>
                    ) : user.resellerRequestStatus === 'REJECTED' ? (
                         <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
                            <AlertCircle className="text-red-300" size={20}/>
                            <div>
                                <p className="font-bold text-sm text-red-100">Application Declined</p>
                                <p className="text-xs text-red-200">Contact support for more details.</p>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleRequestUpgrade}
                            disabled={requestLoading}
                            className="bg-white text-purple-900 px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-purple-50 transition-colors disabled:opacity-70"
                        >
                            {requestLoading ? 'Submitting...' : 'Request Upgrade'}
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Personal Info */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <UserIcon size={20} className="text-green-600 dark:text-green-400"/> Edit Profile
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Full Name</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                        <input 
                            type="text" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                        <input 
                            type="tel" 
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Email Address (Read Only)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                        <input 
                            type="email" 
                            value={user.email}
                            readOnly
                            className="w-full pl-10 p-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl cursor-not-allowed text-gray-500 dark:text-gray-400"
                        />
                    </div>
                </div>

                {success && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl flex items-center gap-2 border border-green-100 dark:border-green-800">
                        <CheckCircle size={20}/> Profile updated successfully!
                    </div>
                )}

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/20 hover:bg-green-800 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving...' : <><Save size={18}/> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>

        {/* Security Section */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Lock size={20} className="text-orange-600 dark:text-orange-400"/> Security
            </h3>

            <form onSubmit={handlePinChange} className="space-y-6">
                {user.transactionPin ? (
                    <div>
                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Old PIN</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                            <input 
                                type="password" 
                                value={pinData.oldPin}
                                onChange={e => setPinData({...pinData, oldPin: e.target.value.replace(/\D/g,'')})}
                                maxLength={4}
                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                                placeholder="••••"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-xl text-sm mb-4">
                        You have not set a transaction PIN yet. Create one below.
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">New PIN (4 Digits)</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                        <input 
                            type="password" 
                            value={pinData.newPin}
                            onChange={e => setPinData({...pinData, newPin: e.target.value.replace(/\D/g,'')})}
                            maxLength={4}
                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                            placeholder="••••"
                        />
                    </div>
                </div>

                {pinMessage && (
                    <div className={`p-3 rounded-xl text-sm font-bold ${pinMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {pinMessage}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={pinLoading}
                    className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/20 hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                >
                    {pinLoading ? 'Updating...' : <><Key size={18}/> {user.transactionPin ? 'Change PIN' : 'Create PIN'}</>}
                </button>
            </form>
        </div>
    </div>
  );
};
