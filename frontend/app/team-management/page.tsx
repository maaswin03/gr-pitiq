'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Edit2, 
  Save, 
  X, 
  Trophy,
  Flag,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

interface TeamData {
  id: string;
  user_id: string;
  car_number: number;
  team_name: string;
  team_description: string;
  created_at: string;
  updated_at: string;
}

export default function TeamManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carNumber, setCarNumber] = useState<number | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      checkCarNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (carNumber) {
      loadTeamData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carNumber]);

  const checkCarNumber = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('car_number')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setCarNumber(data?.car_number || null);
    } catch (error) {
      console.error('Error checking car number:', error);
      setCarNumber(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadTeamData = useCallback(async () => {
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('user_id', user?.id)
        .eq('car_number', carNumber)
        .single();

      if (teamError && teamError.code !== 'PGRST116') throw teamError;

      if (team) {
        setTeamData(team);
        setTeamName(team.team_name);
        setTeamDescription(team.team_description);

        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', team.id);

        if (membersError) throw membersError;

        setTeamMembers(members || []);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    }
  }, [user?.id, carNumber]);

  const handleSaveTeam = async () => {
    try {
      if (teamData) {
        // Update existing team
        const { error } = await supabase
          .from('teams')
          .update({
            team_name: teamName,
            team_description: teamDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', teamData.id);

        if (error) throw error;
      } else {
        // Create new team
        const { data, error } = await supabase
          .from('teams')
          .insert({
            user_id: user?.id,
            car_number: carNumber,
            team_name: teamName,
            team_description: teamDescription
          })
          .select()
          .single();

        if (error) throw error;
        setTeamData(data);
      }

      setIsEditingTeam(false);
      loadTeamData();
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const handleAddMember = async () => {
    try {
      if (!teamData) {
        alert('Please create a team first');
        return;
      }

      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          name: newMember.name,
          role: newMember.role,
          email: newMember.email,
          phone: newMember.phone
        });

      if (error) throw error;

      setNewMember({ name: '', role: '', email: '', phone: '' });
      setShowAddMember(false);
      loadTeamData();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      loadTeamData();
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!carNumber) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="lg:ml-72 min-h-screen p-4 md:p-6">
          <div className="max-w-full mx-auto space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
                TEAM MANAGEMENT
              </h1>
              <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
                Manage your racing team and members
              </p>
            </div>

            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center space-y-6 max-w-md">
                <div className="relative">
                  <div className="text-8xl mb-4 animate-pulse">🏎️</div>
                  <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full" />
                </div>
                <h2 className="text-3xl font-bold text-zinc-100 tracking-wider">
                  NO CAR SELECTED
                </h2>
                <p className="text-zinc-400 text-lg">
                  Please select your car number in profile settings
                </p>
                <button
                  onClick={() => router.push('/profile')}
                  className="px-8 py-4 bg-linear-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg text-lg font-bold transition-all shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  GO TO PROFILE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:ml-72 min-h-screen p-4 md:p-6">
        <div className="max-w-full mx-auto space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
              TEAM MANAGEMENT
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
              Manage your racing team and members
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-400 uppercase tracking-wider">Car Number</span>
                <Flag className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-orange-100">#{carNumber}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-400 uppercase tracking-wider">Team Members</span>
                <Users className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-orange-100">{teamMembers.length}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-400 uppercase tracking-wider">Team Status</span>
                <Trophy className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-orange-100">{teamData ? 'Active' : 'Setup'}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-400 uppercase tracking-wider">Last Updated</span>
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-orange-100">
                {teamData ? new Date(teamData.updated_at).toLocaleDateString() : 'N/A'}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-wider">Team Information</h2>
              {!isEditingTeam ? (
                <button
                  onClick={() => setIsEditingTeam(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTeam}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTeam(false);
                      setTeamName(teamData?.team_name || '');
                      setTeamDescription(teamData?.team_description || '');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 uppercase tracking-wider mb-2 block">Team Name</label>
                {isEditingTeam ? (
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-colors"
                  />
                ) : (
                  <div className="text-lg font-bold text-zinc-100">{teamName || 'Not set'}</div>
                )}
              </div>

              <div>
                <label className="text-sm text-zinc-400 uppercase tracking-wider mb-2 block">Team Description</label>
                {isEditingTeam ? (
                  <textarea
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Enter team description"
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-colors resize-none"
                  />
                ) : (
                  <div className="text-zinc-300">{teamDescription || 'Not set'}</div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-wider">Team Members</h2>
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            {showAddMember && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-zinc-800 border border-zinc-700 rounded-lg"
              >
                <h3 className="text-lg font-bold text-zinc-100 mb-4">Add New Member</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g., Driver, Engineer)"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddMember}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Add Member
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setNewMember({ name: '', role: '', email: '', phone: '' });
                    }}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {teamMembers.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No team members yet. Add your first member to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-zinc-100">{member.name}</h3>
                        <span className="px-2 py-1 bg-orange-600/20 border border-orange-600/50 rounded text-xs text-orange-400 uppercase tracking-wider">
                          {member.role}
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row md:gap-6 text-sm text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span>📧</span>
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📞</span>
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
