'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        // Store user ID as auth_token in localStorage
        if (session?.user?.id) {
          localStorage.setItem('hasSession', 'true');
          localStorage.setItem('auth_token', session.user.id);
          localStorage.setItem('debug_userId', session.user.id);
        } else {
          localStorage.removeItem('hasSession');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('debug_userId');
        }
        
        // Redirect logic based on ACTUAL session (not localStorage)
        const isAuthPage = pathname === '/login' || pathname === '/signup';
        const isPublicPage = pathname === '/forgot-password' || pathname === '/reset-password';
        const isHomePage = pathname === '/';
        const isAuthenticated = !!session?.user;
        
        // Only redirect on first load, not on every auth state change
        if (isAuthenticated && (isAuthPage || isHomePage)) {
          // If logged in and on auth page or home page, redirect to dashboard
          router.replace('/dashboard');
        } else if (!isAuthenticated && !isPublicPage && !isAuthPage && !isHomePage) {
          // If not logged in and on protected page, redirect to login
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Update localStorage including auth_token
        if (session?.user?.id) {
          localStorage.setItem('hasSession', 'true');
          localStorage.setItem('auth_token', session.user.id);
          localStorage.setItem('debug_userId', session.user.id);
        } else {
          localStorage.removeItem('hasSession');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('debug_userId');
        }
        
        // Only handle SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          router.replace('/');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      
      // Clear all localStorage including auth_token
      localStorage.removeItem('hasSession');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('debug_userId');
      
      // Clear all simulation caches
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sim_active_')) {
          localStorage.removeItem(key);
        }
      });
      
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth(redirectTo: string = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}
