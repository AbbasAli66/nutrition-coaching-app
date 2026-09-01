import { useAuth } from '../context/AuthContext';
import { LogOut, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const auth = useAuth() || {};
  const user = auth.user || JSON.parse(localStorage.getItem('user') || 'null');
  const logout = auth.logout || (() => {
    localStorage.clear();
    window.location.href = '/login';
  });
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-emerald-500" />
          <span className="font-bold text-lg text-white">Practical Nutrition</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-300 font-medium">{user.name || user.email}</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}