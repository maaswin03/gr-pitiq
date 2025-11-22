import { supabase } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password, fullName }: SignUpData) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: undefined,
      },
    });

    if (authError) throw authError;

    // Insert user profile into custom table
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
        });

      if (profileError && profileError.code !== '23505') {
        // Ignore duplicate key errors (user might already exist)
        console.error('Profile creation error:', profileError);
      }
    }

    return { data: authData, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign up';
    return { data: null, error: message };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    return { data: null, error: message };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    return { error: message };
  }
}

/**
 * Get the current user session
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    return { user: null, error: message };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
    
    // Supabase should automatically redirect, but if not, do it manually
    if (data?.url) {
      window.location.href = data.url;
    }
    
    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in with Google';
    return { data: null, error: message };
  }
}

/**
 * Reset password request
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send reset email';
    return { error: message };
  }
}
