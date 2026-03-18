import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogOut, Settings, Brain, PlusCircle } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-zinc-900 font-semibold text-lg">
              <Brain className="w-6 h-6 text-indigo-600" />
              <span>ReviseCloud</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/create"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Create
            </Link>
            <Link
              to="/settings"
              className="text-zinc-500 hover:text-zinc-900 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="text-zinc-500 hover:text-zinc-900 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-zinc-200" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium text-sm">
                {user.email?.[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
