import { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import api from '../api/axios';

export default function MealLoggerModal({ isOpen, onClose, onMealAdded, selectedDate }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [mealType, setMealType] = useState('BREAKFAST');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/logs', {
        date: selectedDate,
        meals: [
          {
            name,
            calories: Number(calories),
            protein: Number(protein),
            carbs: Number(carbs),
            fats: Number(fats),
            mealType,
          },
        ],
      });

      // Reset form & reload
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      onMealAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log meal item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-500" /> Log Meal Item
        </h2>

        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400">Meal Category</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
            >
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACK">Snack</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Food / Meal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grilled Chicken & Rice"
              className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400">Calories (kcal)</label>
              <input
                type="number"
                required
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Protein (g)</label>
              <input
                type="number"
                required
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Carbs (g)</label>
              <input
                type="number"
                required
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Fats (g)</label>
              <input
                type="number"
                required
                min="0"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-lg font-medium transition"
          >
            {loading ? 'Saving...' : 'Add to Daily Log'}
          </button>
        </form>
      </div>
    </div>
  );
}