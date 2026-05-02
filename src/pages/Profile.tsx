import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Shield, LogOut, Clock, Calendar } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="mb-16">
        <h2 className="text-5xl font-light text-white serif italic">Identity & Profile</h2>
        <p className="text-zinc-500 mt-4 text-base leading-relaxed">View and manage your workspace credentials and status.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-8">
          <div className="relative group">
            <div className="w-48 h-48 bg-zinc-900 border border-[#27272A] rounded-2xl flex items-center justify-center text-5xl text-zinc-100 serif italic group-hover:border-zinc-500 transition-colors">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-3 -right-3 bg-white text-black text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-lg">
              Verified
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-500 hover:text-red-400 transition-colors text-[10px] uppercase tracking-widest font-bold"
          >
            <LogOut className="h-4 w-4" />
            Sign Out of Workspace
          </button>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="md:col-span-2 space-y-12">
          <section className="space-y-6">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-600 border-b border-[#18181B] pb-4">Professional Data</h3>
            
            <div className="grid grid-cols-1 gap-8">
              <div className="flex items-start gap-4 p-6 bg-[#0F0F11] border border-[#27272A] rounded-2xl">
                <User className="h-5 w-5 text-zinc-500 mt-1" />
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">Full Name</label>
                  <p className="text-white text-lg font-medium">{user.displayName || 'System Member'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-[#0F0F11] border border-[#27272A] rounded-2xl">
                <Mail className="h-5 w-5 text-zinc-500 mt-1" />
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">Email Address</label>
                  <p className="text-white text-lg font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-[#0F0F11] border border-[#27272A] rounded-2xl">
                <Shield className="h-5 w-5 text-zinc-500 mt-1" />
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">Role Allocation</label>
                  <p className="text-white text-lg font-medium">Full Administrative Access</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-600 border-b border-[#18181B] pb-4">Temporal Metadata</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-zinc-700" />
                  <span className="text-[10px] text-zinc-500 font-medium tracking-tight">MEMBER SINCE</span>
                </div>
                <span className="text-xs text-white serif italic">April 2026</span>
              </div>
              <div className="bg-black/40 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-zinc-700" />
                  <span className="text-[10px] text-zinc-500 font-medium tracking-tight">LAST ACCESS</span>
                </div>
                <span className="text-xs text-white serif italic">Active Now</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
