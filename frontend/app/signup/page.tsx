'use client';

import { motion } from 'framer-motion';
import { Flag, Mail, Lock, User, ArrowRight, Zap, Trophy, Gauge, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signInWithGoogle } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.name,
      });

      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log('[Signup] User registered, redirecting...');
        setSuccess(true);
        // Use window.location for full page reload to sync session
        window.location.href = '/dashboard';
        // Keep loading state until redirect completes
        return;
      }
    } catch (err) {
      console.error('[Signup] Error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      const { error: googleError } = await signInWithGoogle();

      if (googleError) {
        setError(googleError);
        setLoading(false);
      }
      // Google OAuth will redirect automatically
    } catch {
      setError('Failed to sign up with Google');
      setLoading(false);
    }
  };

  // Pre-generate random values for speed lines
  const speedLines = [...Array(20)].map((_, i) => ({
    top: 5 + i * 4.5,
    width: 30 + (i * 7) % 40,
    duration: 1.5 + (i % 3) * 0.5,
    delay: i * 0.1
  }));

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - Racing Animations - Fixed */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 fixed left-0 top-0 bottom-0 bg-zinc-950 items-center justify-center overflow-hidden border-r border-orange-600/20">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(234, 88, 12, 0.3) 2px, transparent 2px),
              linear-gradient(90deg, rgba(234, 88, 12, 0.3) 2px, transparent 2px)
            `,
            backgroundSize: '60px 60px',
          }} />
        </div>

        {/* Speed Lines Animation */}
        {speedLines.map((line, i) => (
          <motion.div
            key={i}
            className="absolute h-0.5 bg-linear-to-r from-transparent via-orange-600 to-transparent"
            style={{
              top: `${line.top}%`,
              width: `${line.width}%`,
              left: '-50%'
            }}
            animate={{
              x: ['0%', '200vw'],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: line.duration,
              repeat: Infinity,
              delay: line.delay,
              ease: 'easeInOut'
            }}
          />
        ))}

        {/* Glowing Orbs */}
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-orange-600/20 blur-[100px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Central Content */}
        <div className="relative z-10 text-center px-12">
          {/* Hexagonal Badge - Static */}
          <div className="mx-auto mb-8 w-32 h-32 relative">
            <div 
              className="w-full h-full bg-linear-to-br from-orange-600 to-orange-700 flex items-center justify-center shadow-2xl shadow-orange-600/50"
              style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
              }}
            >
              <Flag className="w-16 h-16 text-black" fill="black" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl font-black text-white mb-4">
            GR <span className="text-orange-600">PitIQ</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            AI-Driven Racing Intelligence
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-black text-white">7+</div>
              <div className="text-sm text-zinc-500">ML Models</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-black text-white">6</div>
              <div className="text-sm text-zinc-500">Race Tracks</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Gauge className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-black text-white">1000+</div>
              <div className="text-sm text-zinc-500">Data Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form - Scrollable */}
      <div className="w-full lg:w-1/2 xl:w-2/5 lg:ml-[50%] xl:ml-[60%] overflow-y-auto p-8 relative min-h-screen flex items-center justify-center">
        {/* Mobile Logo */}
        <Link href="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 group">
          <div 
            className="w-10 h-10 bg-linear-to-br from-orange-600 to-orange-700 flex items-center justify-center"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
          >
            <Flag className="w-5 h-5 text-black" fill="black" />
          </div>
          <span className="text-xl font-black text-white">
            GR <span className="text-orange-600">PitIQ</span>
          </span>
        </Link>

        <div className="w-full max-w-md mt-16 lg:mt-0">
          {/* Title */}
          <div className="mb-8">
            <h2 className="text-4xl font-black text-white mb-3">
              Join the Race
            </h2>
            <p className="text-zinc-400">
              Create your account and start analyzing
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-red-400 text-sm font-semibold">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-green-400 text-sm font-semibold">
                  Account created successfully! Redirecting to dashboard...
                </p>
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-bold text-zinc-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900 border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-zinc-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900 border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900 border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-zinc-300 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900 border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-600 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start gap-2 cursor-pointer group pt-2">
              <input
                type="checkbox"
                required
                className="w-5 h-5 mt-0.5 bg-zinc-900 border-2 border-zinc-800 rounded focus:ring-2 focus:ring-orange-600/50 text-orange-600"
              />
              <span className="text-zinc-400 text-sm group-hover:text-zinc-300 transition-colors font-semibold">
                I agree to the{' '}
                <Link href="/terms" className="text-orange-600 hover:text-orange-500 font-bold">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-orange-600 hover:text-orange-500 font-bold">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 bg-linear-to-r from-orange-600 to-orange-700 text-white font-black text-lg rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 flex items-center justify-center gap-2 group mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : success ? 'Account Created!' : 'Create Account'}
              {!loading && !success && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-600 text-sm font-bold">OR</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Social Signup */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading || success}
              className="w-full py-4 bg-white hover:bg-zinc-100 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Login Link */}
            <p className="text-center text-zinc-400 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-600 hover:text-orange-500 transition-colors font-bold">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
