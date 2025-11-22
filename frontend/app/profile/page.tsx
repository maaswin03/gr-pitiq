'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Car, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CAR_NUMBERS = [
  2, 3, 5, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 31, 41, 46, 47, 50,
  51, 55, 57, 58, 61, 67, 71, 72, 73, 78, 80, 86, 88, 89, 93, 98, 111, 113
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    car_number: null as number | null,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('full_name, email, car_number')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          car_number: data.car_number || null,
        });
      } else {
        setProfile({
          full_name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          car_number: null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile({
        full_name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        car_number: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user?.id,
          full_name: profile.full_name,
          email: profile.email,
          car_number: profile.car_number,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:ml-72 min-h-screen p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
              PROFILE SETTINGS
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
              Manage your account information
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-950 border border-orange-600/20 rounded-lg overflow-hidden"
          >
            <div className="bg-linear-to-r from-orange-600/10 to-transparent p-6 border-b border-orange-600/20">
              <h2 className="text-xl font-bold text-zinc-100 font-rajdhani">Personal Information</h2>
              <p className="text-sm text-zinc-500 mt-1">Update your profile details</p>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wider">
                    <User className="w-4 h-4 text-orange-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white focus:border-orange-600 focus:bg-zinc-900 focus:outline-none transition-all font-rajdhani"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wider">
                    <Mail className="w-4 h-4 text-orange-600" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    className="w-full px-4 py-3 bg-zinc-900/30 border border-zinc-800 rounded-lg text-zinc-500 cursor-not-allowed font-rajdhani"
                    disabled
                  />
                  <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wider">
                    <Car className="w-4 h-4 text-orange-600" />
                    Car Number
                  </label>
                  <Select
                    value={profile.car_number?.toString() || ''}
                    onValueChange={(value) => setProfile({ ...profile, car_number: parseInt(value) })}
                  >
                    <SelectTrigger className="w-full h-12 bg-zinc-900/50 border-zinc-800 text-white hover:bg-zinc-900 hover:border-orange-600/50 transition-all font-rajdhani text-base">
                      <SelectValue placeholder="Select your car number" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                      {CAR_NUMBERS.map((num) => (
                        <SelectItem 
                          key={num} 
                          value={num.toString()}
                          className="text-zinc-300 hover:text-orange-600 hover:bg-zinc-800/50 font-rajdhani cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-orange-600 font-bold">#</span>
                            {num}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                    Choose from available racing numbers
                  </p>
                </div>
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg font-rajdhani flex items-center gap-3 ${
                    message.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    message.type === 'success' ? 'bg-green-400' : 'bg-red-400'
                  }`}></span>
                  {message.text}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-rajdhani text-base shadow-lg shadow-orange-600/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    SAVING CHANGES...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    SAVE CHANGES
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-950 border border-orange-600/20 rounded-lg overflow-hidden"
          >
            <div className="bg-linear-to-r from-orange-600/10 to-transparent p-6 border-b border-orange-600/20">
              <h2 className="text-xl font-bold text-zinc-100 font-rajdhani">Account Information</h2>
              <p className="text-sm text-zinc-500 mt-1">Your account details</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Account Created</p>
                    <p className="text-sm text-zinc-300 font-rajdhani">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Last Sign In</p>
                    <p className="text-sm text-zinc-300 font-rajdhani">
                      {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
