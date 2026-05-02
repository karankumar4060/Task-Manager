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
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name, role);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-[#0F0F11] p-10 md:p-14 rounded-3xl shadow-2xl border border-[#27272A]"
      >
        <div className="text-center">
          <div className="flex justify-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-white rounded-2xl shadow-xl shadow-zinc-950/50"
            >
              <CheckSquare className="h-8 w-8 text-black" />
            </motion.div>
          </div>
          <h2 className="mt-8 text-4xl font-light text-white tracking-tight serif italic">
            TeamSync
          </h2>
          <p className="mt-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            Project Command Center
          </p>
        </div>

        <div className="flex bg-[#18181B] p-1 rounded-xl border border-[#27272A]">
          <button 
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'login' ? 'bg-[#27272A] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Access
          </button>
          <button 
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'signup' ? 'bg-[#27272A] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Register
          </button>
        </div>
        
        <form onSubmit={handleEmailAuth} className="space-y-5">
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                  <input
                    type="text"
                    required={mode === 'signup'}
                    placeholder="FULL NAME"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] focus:border-zinc-500 focus:outline-none rounded-xl py-4 pl-12 pr-4 text-xs font-medium text-white placeholder:text-zinc-700 transition-all"
                  />
                </div>

                <div className="flex gap-2 p-1 bg-[#18181B] rounded-xl border border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setRole('Member')}
                    className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${role === 'Member' ? 'bg-[#27272A] text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${role === 'Admin' ? 'bg-[#27272A] text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    Admin
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />
            <input
              type="email"
              required
              placeholder="EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] focus:border-zinc-500 focus:outline-none rounded-xl py-4 pl-12 pr-4 text-xs font-medium text-white placeholder:text-zinc-700 transition-all"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />
            <input
              type="password"
              required
              placeholder="SECRET CODE"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] focus:border-zinc-500 focus:outline-none rounded-xl py-4 pl-12 pr-4 text-xs font-medium text-white placeholder:text-zinc-700 transition-all"
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-red-500/80 font-medium italic serif lowercase tracking-tight px-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full flex justify-center py-4 px-6 text-[10px] font-bold uppercase tracking-widest rounded-xl text-black bg-white hover:bg-zinc-200 focus:outline-none transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {authLoading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              mode === 'login' ? 'Solidify Presence' : 'Initialize Protocol'
            )}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#27272A]"></div>
          </div>
          <div className="relative flex justify-center text-[8px] font-bold uppercase tracking-[0.2em]">
            <span className="bg-[#0F0F11] px-4 text-zinc-600">Cross-Connect</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={authLoading}
          className="group relative w-full flex justify-center py-4 px-6 text-[10px] font-bold uppercase tracking-widest rounded-xl text-white bg-[#18181B] border border-[#27272A] hover:bg-[#27272A] focus:outline-none transition-all duration-200"
        >
          <span className="absolute left-6 flex items-center">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-4 w-4 bg-white rounded-full p-0.5" alt="Google logo" />
          </span>
          Neural Signature
        </button>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-zinc-600 italic serif lowercase tracking-tight opacity-50">
            "Structure provides the canvas for collective genius."
          </p>
        </div>
      </motion.div>
    </div>
  );
}
