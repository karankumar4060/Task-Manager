import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LogOut, CheckSquare, Plus, Menu, X, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Identity', href: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex overflow-hidden text-zinc-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[#0F0F11] border-r border-[#27272A]">
        <div className="flex items-center h-20 px-8 border-b border-[#18181B]">
          <CheckSquare className="h-5 w-5 text-zinc-100 mr-2" />
          <span className="text-xl font-semibold tracking-tight serif">TeamSync</span>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-6">
          <div className="px-4 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Workspace</div>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-[#18181B] text-white border border-[#27272A]" 
                      : "text-zinc-400 hover:bg-[#18181B] hover:text-white"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 mr-3", isActive ? "text-white" : "text-zinc-500")} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-6 border-t border-[#18181B] bg-[#0F0F11]">
          <Link to="/profile" className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
            <img 
              className="h-8 w-8 rounded-full border border-zinc-800 bg-zinc-900" 
              src={profile?.photoURL || "https://ui-avatars.com/api/?background=27272A&color=fff&name=" + profile?.displayName} 
              alt="" 
            />
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-zinc-100 truncate">
                {profile?.displayName || 'User'}
              </p>
              <div className="inline-block mt-1 text-[8px] uppercase tracking-wider text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded">
                {profile?.role || 'Member'}
              </div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-100 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 bg-[#0F0F11] border-b border-[#27272A] px-6 z-40">
          <div className="flex items-center">
            <CheckSquare className="h-5 w-5 text-zinc-100 mr-2" />
            <span className="text-lg font-semibold serif">TeamSync</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6 text-zinc-400" /> : <Menu className="h-6 w-6 text-zinc-400" />}
          </button>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="fixed inset-0 bg-[#0A0A0B] z-30 md:hidden pt-16"
            >
              <nav className="p-6 space-y-4">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-4">Menu</div>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-4 text-base font-medium text-zinc-400 border-b border-[#18181B]"
                  >
                    <item.icon className="h-5 w-5 mr-4 text-zinc-500" />
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-4 text-base font-medium text-red-400 pt-8"
                >
                  <LogOut className="h-5 w-5 mr-4" />
                  Sign Out
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-[#0A0A0B]">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
