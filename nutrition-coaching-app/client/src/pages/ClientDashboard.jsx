import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MacroTracker from '../components/MacroTracker';
import MealLoggerModal from '../components/MealLoggerModal';
import api from '../api/axios';
import { Plus, Utensils, Calendar } from 'lucide-react';

export default function ClientDashboard() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [plan, setPlan] = useState(null);
  const [logData, setLogData] = useState({ totals: { calories: 0, protein: 0, carbs: 0, fats: 0 }, meals: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch active target plan
      const planRes = await api.get('/plans/active');
      setPlan(planRes.data.plan);
    } catch {
      setPlan(null);
    }

    try {
      // 2. Fetch daily logs for date
      const logRes = await api.get(`/logs/${selectedDate}`);
      setLogData(logRes.data);
    } catch {
      setLogData({ totals: { calories: 0, protein: 0, carbs: 0, fats: 0 }, meals: [] });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Nutrition Tracking</h1>
            <p className="text-sm text-zinc-400">Track and fulfill your daily macronutrient targets.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-sm">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" /> Add Food
            </button>
          </div>
        </div>

        {/* Macro Progress Ring / Stats */}
        <MacroTracker plan={plan} totals={logData.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 }} />

        {/* Meal Items List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Logged Meals</h2>
          </div>

          {logData.meals?.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">No meals logged for this date.</p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {logData.meals.map((meal) => (
                <div key={meal.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 mr-2">
                      {meal.mealType}
                    </span>
                    <span className="text-sm font-medium text-white">{meal.name}</span>
                  </div>
                  <div className="text-xs text-zinc-400 flex gap-4">
                    <span>{meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fats}g</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <MealLoggerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMealAdded={fetchDashboardData}
        selectedDate={selectedDate}
      />
    </div>
  );
}