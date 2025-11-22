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
        console.log('[AuthContext] Initial session check:', { hasSession: !!session, pathname });
        setUser(session?.user ?? null);
        
        // Store session data securely (only for quick checks, not for auth decisions)
        if (session?.user) {
          localStorage.setItem('hasSession', 'true');
        } else {
          localStorage.removeItem('hasSession');
        }
        
        // Redirect logic based on ACTUAL session (not localStorage)
        const isAuthPage = pathname === '/login' || pathname === '/signup';
        const isPublicPage = pathname === '/forgot-password' || pathname === '/reset-password';
        const isHomePage = pathname === '/';
        const isAuthenticated = !!session?.user;
        
        if (isAuthenticated && (isAuthPage || isHomePage)) {
          // If logged in and on auth page or home page, redirect to dashboard
          console.log('[AuthContext] Redirecting authenticated user to dashboard');
          router.replace('/dashboard');
        } else if (!isAuthenticated && !isPublicPage && !isAuthPage && !isHomePage) {
          // If not logged in and on protected page, redirect to login
          console.log('[AuthContext] Redirecting unauthenticated user to login');
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
        console.log('[AuthContext] Auth state changed:', event);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Update localStorage (only for UI hints)
        if (session?.user) {
          localStorage.setItem('hasSession', 'true');
        } else {
          localStorage.removeItem('hasSession');
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
      localStorage.removeItem('hasSession');
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
