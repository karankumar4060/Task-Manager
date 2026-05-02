import React, { useState } from 'react';
import { LogIn, CheckSquare, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Member'>('Member');
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to="/" />;

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      if (error.code === 'auth/popup-blocked') {
        setError("Popup blocked by browser. Please enable popups for this site.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized in Firebase Console. Please add your Railway URL to Authorized Domains.");
      } else {
        setError(error.message || "Google Authentication failed.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    
    setError(null);
    setAuthLoading(true);
    
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error("Name is required for registration.");
        await signUpWithEmail(email, password, name, role);
      }
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      setError(error.message || "Authentication failed. Check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#0F0F11] p-8 md:p-12 rounded-3xl shadow-2xl border border-[#27272A]"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <CheckSquare className="h-8 w-8 text-black" />
            </div>
          </div>
          <h2 className="text-3xl font-light text-white tracking-tight serif italic">
            TeamSync
          </h2>
          <p className="mt-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            Project Management Portal
          </p>
        </div>

        <div className="flex bg-[#18181B] p-1 rounded-xl border border-[#27272A] mb-8">
          <button 
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'login' ? 'bg-[#27272A] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Login
          </button>
          <button 
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'signup' ? 'bg-[#27272A] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Register
          </button>
        </div>
        
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] focus:border-zinc-500 focus:outline-none rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-zinc-700 transition-all"
                />
              </div>

              <div className="flex gap-2 p-1 bg-[#18181B] rounded-xl border border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setRole('Member')}
                  className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${role === 'Member' ? 'bg-[#27272A] text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Admin')}
                  className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${role === 'Admin' ? 'bg-[#27272A] text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] focus:border-zinc-500 focus:outline-none rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-zinc-700 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] focus:border-zinc-500 focus:outline-none rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-zinc-700 transition-all"
            />
          </div>

          {error && (
            <p className="text-[10px] text-red-500 font-medium italic px-2 bg-red-500/5 py-2 rounded-lg border border-red-500/10">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full flex justify-center py-4 px-6 text-[11px] font-bold uppercase tracking-widest rounded-xl text-black bg-white hover:bg-zinc-200 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="relative py-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#27272A]"></div>
          </div>
          <div className="relative flex justify-center text-[9px] font-bold uppercase tracking-widest">
            <span className="bg-[#0F0F11] px-4 text-zinc-600">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={authLoading}
          className="w-full flex justify-center items-center gap-3 py-4 px-6 text-[11px] font-bold uppercase tracking-widest rounded-xl text-white bg-[#18181B] border border-[#27272A] hover:bg-[#27272A] transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-4 w-4" alt="Google" />
          Google Identity
        </button>

        <div className="mt-8 text-center opacity-40">
          <p className="text-[10px] text-zinc-500 italic">
            "Simple authentication for complex collaboration."
          </p>
        </div>
      </motion.div>
    </div>
  );
}
