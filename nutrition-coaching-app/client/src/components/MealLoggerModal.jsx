import { useState } from 'react';
import api from '../api/axios';
import { X, PlusCircle } from 'lucide-react';

export default function MealLoggerModal({ isOpen, onClose, onMealAdded, selectedDate }) {
  const [formData, setFormData] = useState({
    name: '',
    mealType: 'BREAKFAST',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    servingQty: 1,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/logs/meal', {
        date: selectedDate,
        name: formData.name,
        mealType: formData.mealType.toUpperCase(),
        calories: Number(formData.calories) || 0,
        protein: Number(formData.protein) || 0,
        carbs: Number(formData.carbs) || 0,
        fats: Number(formData.fats) || 0,
        servingQty: Number(formData.servingQty) || 1,
      });

      // Reset form and refresh parent dashboard
      setFormData({
        name: '',
        mealType: 'BREAKFAST',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        servingQty: 1,
      });
      onMealAdded();
      onClose();
    } catch (err) {
      console.error('Error logging meal:', err);
      setError(err.response?.data?.message || 'Failed to log meal item');
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

        <div className="flex items-center gap-2 mb-4">
          <PlusCircle className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold text-white">Log Meal Item</h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Meal Category</label>
            <select
              name="mealType"
              value={formData.mealType}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACK">Snack</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Food / Meal Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Scrambled Eggs & Toast"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Calories (kcal)</label>
              <input
                type="number"
                name="calories"
                required
                min="0"
                placeholder="450"
                value={formData.calories}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Protein (g)</label>
              <input
                type="number"
                name="protein"
                required
                min="0"
                placeholder="28"
                value={formData.protein}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Carbs (g)</label>
              <input
                type="number"
                name="carbs"
                required
                min="0"
                placeholder="35"
                value={formData.carbs}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Fats (g)</label>
              <input
                type="number"
                name="fats"
                required
                min="0"
                placeholder="22"
                value={formData.fats}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition duration-200"
          >
            {loading ? 'Adding...' : 'Add to Daily Log'}
          </button>
        </form>
      </div>
    </div>
  );
}