'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flag, 
  LayoutDashboard, 
  Gauge, 
  BarChart3, 
  Settings, 
  Users, 
  Calendar,
  Trophy,
  Zap,
  X,
  Menu,
  ChevronRight,
  Brain,
  LogOut,
  UserCircle,
  Car,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    href: '/dashboard',
    description: 'Overview & Stats'
  },
  { 
    icon: Brain, 
    label: 'AI Strategy Brain', 
    href: '/ai-strategy',
    description: 'AI Predictions',
    highlight: true
  },
  { 
    icon: Zap, 
    label: 'Strategy Optimizer', 
    href: '/strategy-optimizer',
    description: 'What-If Analysis',
    highlight: true
  },
  { 
    icon: Gauge, 
    label: 'Simulation', 
    href: '/simulation-setup',
    description: 'Race Scenarios'
  },
  { 
    icon: Flag, 
    label: 'Pit Wall Console', 
    href: '/pit-wall',
    description: 'Live Race Control'
  },
  { 
    icon: Car, 
    label: 'Car Analysis', 
    href: '/car-analysis',
    description: 'Performance Data'
  },
  { 
    icon: BarChart3, 
    label: 'Model Insights', 
    href: '/model-insights',
    description: 'ML Model Analytics'
  },
  { 
    icon: MessageSquare, 
    label: 'Pit Wall AI', 
    href: '/pit-wall-ai',
    description: 'Race Engineer AI',
    highlight: true
  },
  { 
    icon: Trophy, 
    label: 'Leaderboard', 
    href: '/leaderboard',
    description: 'Rankings'
  },
  { 
    icon: Calendar, 
    label: 'Race Calendar', 
    href: '/calendar',
    description: 'Upcoming Events'
  },
  { 
    icon: Users, 
    label: 'Team Management', 
    href: '/team-management',
    description: 'Manage Your Team'
  }
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const [userName, setUserName] = useState<string>('User');
  const [userInitials, setUserInitials] = useState<string>('U');

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (data?.full_name) {
        setUserName(data.full_name);
        const initials = data.full_name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        setUserInitials(initials);
      } else if (user?.user_metadata?.full_name) {
        const name = user.user_metadata.full_name;
        setUserName(name);
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        setUserInitials(initials);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
        setUserInitials(user.email[0].toUpperCase());
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (user?.email) {
        setUserName(user.email.split('@')[0]);
        setUserInitials(user.email[0].toUpperCase());
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-4 z-50 lg:hidden p-3 bg-zinc-900 border border-orange-600/30 rounded-lg hover:bg-zinc-800 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-orange-600" />
        ) : (
          <Menu className="w-5 h-5 text-orange-600" />
        )}
      </motion.button>

      {/* Overlay for Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-orange-600/20 z-40 overflow-hidden"
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(rgba(234, 88, 12, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(234, 88, 12, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }} />
            </div>

            {/* Glowing Orb */}
            <motion.div
              className="absolute top-20 left-10 w-64 h-64 rounded-full bg-orange-600/10 blur-3xl pointer-events-none"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            <div className="relative h-full flex flex-col">
              {/* Logo Section */}
              <Link href="/" className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800/50">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <div 
                    className="w-12 h-12 bg-linear-to-br from-orange-600 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-600/30"
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                    }}
                  >
                    <Flag className="w-6 h-6 text-black" fill="black" />
                  </div>
                </motion.div>
                <div>
                  <h1 className="text-xl font-black text-white font-rajdhani">
                    GR <span className="text-orange-600">PitIQ</span>
                  </h1>
                  <p className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase font-rajdhani">
                    Racing Intelligence
                  </p>
                </div>
              </Link>

              {/* Stats Card */}
              <div className="mx-4 my-4 p-4 bg-zinc-900/50 backdrop-blur-sm border border-orange-600/20 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-semibold font-rajdhani">Active Models</p>
                    <p className="text-lg font-black text-white font-rajdhani">8</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-rajdhani">
                  <span className="text-zinc-500">Performance</span>
                  <span className="text-orange-600 font-bold">98.3%</span>
                </div>
                <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-linear-to-r from-orange-600 to-orange-700"
                    initial={{ width: 0 }}
                    animate={{ width: '98.3%' }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isHovered = hoveredItem === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => setIsOpen(false)}
                    >
                      <motion.div
                        className={`
                          relative flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all
                          ${isActive 
                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' 
                            : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                          }
                        `}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}

                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-orange-600'}`} />
                        
                        <div className="flex-1">
                          <p className={`text-sm font-bold font-rajdhani ${isActive ? 'text-white' : ''}`}>
                            {item.label}
                          </p>
                          <p className={`text-xs font-rajdhani ${isActive ? 'text-orange-100' : 'text-zinc-600'}`}>
                            {item.description}
                          </p>
                        </div>

                        <ChevronRight 
                          className={`w-4 h-4 transition-opacity ${
                            isHovered || isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>

              {/* User Profile Section */}
              <div className="p-4 border-t border-zinc-800/50 space-y-2">
                <Link href="/profile">
                  <motion.div
                    className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg cursor-pointer hover:bg-zinc-900 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-10 h-10 bg-linear-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center font-black text-white font-rajdhani text-sm">
                      {userInitials}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white font-rajdhani truncate">{userName}</p>
                      <p className="text-xs text-zinc-500 font-rajdhani">View Profile</p>
                    </div>
                    <UserCircle className="w-4 h-4 text-zinc-600" />
                  </motion.div>
                </Link>

                <motion.button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg cursor-pointer hover:bg-red-900/20 transition-colors group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-5 h-5 text-zinc-600 group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-bold text-zinc-400 group-hover:text-red-500 transition-colors font-rajdhani">Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
