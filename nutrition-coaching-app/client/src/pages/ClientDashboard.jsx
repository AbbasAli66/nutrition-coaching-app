import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MacroTracker from '../components/MacroTracker';
import MealLoggerModal from '../components/MealLoggerModal';
import api from '../api/axios';
import { Plus, Utensils, Calendar, Trash2 } from 'lucide-react';

export default function ClientDashboard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [logData, setLogData] = useState({
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    dailyLog: { meals: [] },
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        // 1. Fetch active target plan
        try {
          const planRes = await api.get('/plans/active');
          if (isMounted) {
            setPlan(planRes.data?.plan || null);
          }
        } catch {
          if (isMounted) setPlan(null);
        }

        // 2. Fetch daily logs for selected date
        const logRes = await api.get(`/logs/${selectedDate}`);
        if (isMounted) {
          setLogData(logRes.data);
          if (logRes.data?.activePlan) {
            setPlan(logRes.data.activePlan);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load dashboard logs:', err);
          setLogData({
            totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
            dailyLog: { meals: [] },
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, refreshKey]);

  // Handle meal deletion
  const handleDeleteMeal = async (mealId) => {
    try {
      await api.delete(`/logs/meal/${mealId}`);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to delete meal log:', err);
    }
  };

  const meals = logData?.dailyLog?.meals || logData?.meals || [];
  const totals = logData?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nutrition Tracking</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Track and fulfill your daily macro targets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-zinc-400 mr-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-sm outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add Food
            </button>
          </div>
        </div>

        {/* Macro Progress Bars */}
        <MacroTracker totals={totals} plan={plan} />

        {/* Logged Meals List */}
        <section className="mt-10 bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Logged Meals</h2>
          </div>

          {loading ? (
            <p className="text-zinc-500 text-sm py-4">Loading meals...</p>
          ) : meals.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4">No meals logged for this date yet.</p>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id || meal._id}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800/60 rounded-lg px-4 py-3 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {meal.mealType || meal.type || 'Meal'}
                    </span>
                    <span className="font-medium text-sm text-zinc-200">
                      {meal.name || meal.foodName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="text-zinc-200 font-semibold">{meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fats}g</span>
                    <button
                      onClick={() => handleDeleteMeal(meal.id || meal._id)}
                      className="text-zinc-500 hover:text-rose-400 transition ml-2 p-1"
                      title="Delete meal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Food Logger Modal */}
      {isModalOpen && (
        <MealLoggerModal
          isOpen={isModalOpen}
          selectedDate={selectedDate}
          onClose={() => setIsModalOpen(false)}
          onMealAdded={() => {
            setIsModalOpen(false);
            setRefreshKey((prev) => prev + 1);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}