import { useAuth } from '../context/AuthContext';
import { LogOut, User, Activity } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Practical Nutrition</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <User className="w-4 h-4 text-zinc-400" />
            <span>{user?.name}</span>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}