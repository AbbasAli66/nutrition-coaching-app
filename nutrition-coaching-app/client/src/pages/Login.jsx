import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
   const data = await login(email, password);
    // 1. Save token and user into localStorage first
    if (data?.token) {
      localStorage.setItem('token', data.token);
    }
    if (data?.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Handle both `user` object directly or `data.user`
    const currentUser = data?.user || data;

    if (!currentUser || !currentUser.role) {
      throw new Error('User role missing in response');
    }

    if (currentUser.role.toUpperCase() === 'COACH') {
      navigate('/coach-dashboard', { replace: true });
    } else {
      navigate('/client-dashboard', { replace: true });
    }
  } catch (err) {
    console.error('Login submit error:', err);
    setError(err.response?.data?.message || err.message || 'Invalid email or password');
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-1 text-sm text-zinc-400">Log in to your nutrition account</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white transition hover:bg-emerald-500 focus:outline-none"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-emerald-400 hover:text-emerald-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}