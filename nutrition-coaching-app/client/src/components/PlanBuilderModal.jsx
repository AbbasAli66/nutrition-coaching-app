import { useState } from 'react';
import api from '../api/axios';
import { X, Target } from 'lucide-react';

export default function PlanModal({ isOpen, onClose, client, onPlanCreated }) {
  const [formData, setFormData] = useState({
    name: 'Custom Macro Protocol',
    calories: '2200',
    protein: '180',
    carbs: '220',
    fats: '65',
    notes: 'Prioritize whole food protein sources and stay hydrated.',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !client) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/plans', {
        userId: client.id,
        name: formData.name,
        calories: Number(formData.calories),
        protein: Number(formData.protein),
        carbs: Number(formData.carbs),
        fats: Number(formData.fats),
        notes: formData.notes,
        isActive: true,
      });

      onPlanCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create plan:', err);
      setError(err.response?.data?.message || 'Failed to assign nutrition plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Target className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Prescribe Plan</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-4">Assigning targets for {client.name || client.email}</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Plan Title</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Daily Calories (kcal)</label>
            <input
              type="number"
              name="calories"
              required
              value={formData.calories}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Protein (g)</label>
              <input
                type="number"
                name="protein"
                required
                value={formData.protein}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Carbs (g)</label>
              <input
                type="number"
                name="carbs"
                required
                value={formData.carbs}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Fats (g)</label>
              <input
                type="number"
                name="fats"
                required
                value={formData.fats}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Coach Protocol Notes</label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            {loading ? 'Activating...' : 'Activate & Assign Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}