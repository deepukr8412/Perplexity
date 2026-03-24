import React from 'react';
import { Search, Menu, LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onMenuClick, sidebarOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 glass-card border-b border-dark-700/50 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-dark-800/60 transition-all duration-200 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-dark-300" />
          </button>
          
          <button
            onClick={onMenuClick}
            className="hidden lg:flex p-2 rounded-xl hover:bg-dark-800/60 transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-dark-300" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-dark-50 tracking-tight hidden sm:block">
              Perplexity
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-dark-800/50 rounded-lg border border-dark-700/30">
            <div className="w-6 h-6 bg-gradient-to-br from-accent-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-accent-400" />
            </div>
            <span className="text-sm text-dark-300 font-medium">{user?.name}</span>
          </div>
          
          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-red-500/10 transition-all duration-200 group"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-dark-400 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
