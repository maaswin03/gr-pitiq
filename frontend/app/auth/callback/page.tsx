'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[Callback Page] Processing OAuth callback...');
        
        // Get the current session (Supabase will automatically handle the OAuth callback)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Callback Page] Session error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
          return;
        }

        if (session?.user) {
          console.log('[Callback Page] Session found, redirecting to dashboard...');
          // Redirect to dashboard - session is already in Supabase storage
          window.location.href = '/dashboard';
        } else {
          console.error('[Callback Page] No session found');
          setError('No session found after authentication');
          setTimeout(() => router.push('/login?error=no_session'), 2000);
        }
      } catch (err) {
        console.error('[Callback Page] Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setTimeout(() => router.push('/login?error=callback_failed'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Authentication failed: {error}</p>
          <p className="text-zinc-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
        <p className="text-zinc-400">Completing authentication...</p>
      </div>
    </div>
  );
}
