import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import CheckInModal from "../components/CheckInModal";

// Extract entries from various response shapes (array or nested in dailyLog)
const extractLogs = (resData) => {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData.logs)) return resData.logs;
  if (Array.isArray(resData.foodLogs)) return resData.foodLogs;
  if (Array.isArray(resData.dailyLog?.entries)) return resData.dailyLog.entries;
  if (Array.isArray(resData.dailyLog?.items)) return resData.dailyLog.items;
  if (Array.isArray(resData.dailyLog?.foodLogs)) return resData.dailyLog.foodLogs;
  if (Array.isArray(resData.dailyLog?.meals)) return resData.dailyLog.meals;
  return [];
};

// Normalize active plan object
const extractPlan = (resData) => {
  if (!resData) return null;
  return (
    resData.plan ||
    resData.nutritionPlan ||
    resData.activePlan ||
    (resData.caloriesTarget || resData.targetCalories || resData.dailyCalories ? resData : null)
  );
};

export default function ClientDashboard() {
  const navigate = useNavigate();

  // Date selection defaults to current local date
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);

  // Core Data States
  const [activePlan, setActivePlan] = useState(null);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [backendTotals, setBackendTotals] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for Food Logging
  const [foodForm, setFoodForm] = useState({
    foodName: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    mealType: "BREAKFAST",
  });

  // Reusable fetch for dashboard refresh
  const loadDashboardData = useCallback(async () => {
    try {
      const [planRes, logsRes, checkInsRes] = await Promise.allSettled([
        api.get("/plans/active"),
        api.get(`/logs/${selectedDate}`),
        api.get("/progress/history"),
      ]);

      if (planRes.status === "fulfilled") {
        const plan = extractPlan(planRes.value.data);
        if (plan) setActivePlan(plan);
      }

      if (logsRes.status === "fulfilled") {
        const data = logsRes.value.data;
        setDailyLogs(extractLogs(data));
        if (data?.totals) {
          setBackendTotals(data.totals);
        } else {
          setBackendTotals(null);
        }
        if (data?.activePlan) {
          setActivePlan(extractPlan(data.activePlan));
        }
      }

      if (checkInsRes.status === "fulfilled") {
        setCheckIns(checkInsRes.value.data.checkIns || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Initial Fetch on component mount or date change
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const [planRes, logsRes, checkInsRes] = await Promise.allSettled([
          api.get("/plans/active"),
          api.get(`/logs/${selectedDate}`),
          api.get("/progress/history"),
        ]);

        if (isMounted) {
          if (planRes.status === "fulfilled") {
            const plan = extractPlan(planRes.value.data);
            if (plan) setActivePlan(plan);
          }

          if (logsRes.status === "fulfilled") {
            const data = logsRes.value.data;
            setDailyLogs(extractLogs(data));
            if (data?.totals) {
              setBackendTotals(data.totals);
            } else {
              setBackendTotals(null);
            }
            if (data?.activePlan) {
              setActivePlan(extractPlan(data.activePlan));
            }
          }

          if (checkInsRes.status === "fulfilled") {
            setCheckIns(checkInsRes.value.data.checkIns || []);
          }
        }
      } catch (err) {
        if (isMounted) console.error("Initialization error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Add Food Item Handler
  const handleAddFood = async (e) => {
    e.preventDefault();
    try {
      await api.post("/logs", {
        name: foodForm.foodName,
        foodName: foodForm.foodName,
        date: selectedDate,
        calories: parseFloat(foodForm.calories) || 0,
        protein: parseFloat(foodForm.protein) || 0,
        carbs: parseFloat(foodForm.carbs) || 0,
        fats: parseFloat(foodForm.fats) || 0,
        mealType: foodForm.mealType,
      });

      setFoodForm({
        foodName: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        mealType: "BREAKFAST",
      });
      setIsFoodModalOpen(false);
      loadDashboardData();
    } catch (err) {
      console.error("Failed to add food log:", err);
    }
  };

  // Aggregated Consumed Totals (prioritizes backend totals if returned)
  const consumed = backendTotals
    ? {
        calories: Number(backendTotals.calories || backendTotals.totalCalories || 0),
        protein: Number(backendTotals.protein || backendTotals.totalProtein || 0),
        carbs: Number(backendTotals.carbs || backendTotals.totalCarbs || 0),
        fats: Number(backendTotals.fats || backendTotals.totalFats || 0),
      }
    : dailyLogs.reduce(
        (acc, item) => ({
          calories: acc.calories + (parseFloat(item.calories) || 0),
          protein: acc.protein + (parseFloat(item.protein) || 0),
          carbs: acc.carbs + (parseFloat(item.carbs) || 0),
          fats: acc.fats + (parseFloat(item.fats) || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

  // Targets pulled from active plan or standard baseline
  const targets = {
    calories:
      activePlan?.caloriesTarget ||
      activePlan?.targetCalories ||
      activePlan?.dailyCalories ||
      2200,
    protein:
      activePlan?.proteinTarget ||
      activePlan?.targetProtein ||
      activePlan?.dailyProtein ||
      180,
    carbs:
      activePlan?.carbsTarget ||
      activePlan?.targetCarbs ||
      activePlan?.dailyCarbs ||
      220,
    fats:
      activePlan?.fatsTarget ||
      activePlan?.targetFats ||
      activePlan?.dailyFats ||
      65,
  };

  const latestCheckIn = checkIns[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pb-16">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-xl">∿</span>
          <span className="font-semibold text-lg">Practical Nutrition</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-300">Client Portal</span>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Nutrition Tracking</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Track and fulfill your daily macro targets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-zinc-700 cursor-pointer"
            />
            <button
              onClick={() => setIsFoodModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
            >
              <span>+</span> Add Food
            </button>
            <button
              onClick={() => setIsCheckInOpen(true)}
              className="bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
            >
              <span>⚖️</span> Check In
            </button>
          </div>
        </div>

        {/* Active Plan Status Callout */}
        {activePlan ? (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-950/20 border border-emerald-500/30 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300">
                Active Plan: {activePlan.title || activePlan.name || "Custom Macro Protocol"}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              Targets: {targets.calories} kcal • {targets.protein}g P • {targets.carbs}g C • {targets.fats}g F
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-zinc-900/40 border border-zinc-800 px-4 py-2.5 rounded-xl text-xs text-zinc-400">
            No custom plan assigned yet by your coach. Showing baseline targets.
          </div>
        )}

        {/* Coach Directive / Feedback Callout */}
        {latestCheckIn && latestCheckIn.coachFeedback && (
          <div className="mb-8 bg-zinc-900/60 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>💬</span> Latest Coach Feedback
              </span>
              <span className="text-[11px] text-zinc-400">
                {new Date(latestCheckIn.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed italic">
              "{latestCheckIn.coachFeedback}"
            </p>
          </div>
        )}

        {/* Daily Macro Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Calories",
              current: Math.round(consumed.calories),
              target: targets.calories,
              unit: "kcal",
            },
            {
              label: "Protein",
              current: Math.round(consumed.protein),
              target: targets.protein,
              unit: "g",
            },
            {
              label: "Carbs",
              current: Math.round(consumed.carbs),
              target: targets.carbs,
              unit: "g",
            },
            {
              label: "Fats",
              current: Math.round(consumed.fats),
              target: targets.fats,
              unit: "g",
            },
          ].map((macro) => {
            const pct = Math.min(
              Math.round((macro.current / (macro.target || 1)) * 100),
              100
            );
            return (
              <div
                key={macro.label}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5"
              >
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>{macro.label}</span>
                  <span className="text-zinc-300 font-medium">{pct}%</span>
                </div>
                <div className="text-2xl font-bold mb-3">
                  {macro.current}{" "}
                  <span className="text-xs text-zinc-500 font-normal">
                    / {macro.target} {macro.unit}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Daily Food Log Entries */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🥗</span> Meals Logged for {selectedDate}
          </h2>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
            {dailyLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No food logged yet for this date. Click "+ Add Food" to begin.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {dailyLogs.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-sm text-white">
                        {item.name || item.foodName || "Food Item"}
                      </span>
                      <span className="ml-2 text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">
                        {item.mealType || "SNACK"}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-4">
                      <span>{item.calories} kcal</span>
                      <span className="text-emerald-400">{item.protein}g P</span>
                      <span>{item.carbs}g C</span>
                      <span>{item.fats}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Weekly Progress History Feed */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📈</span> Weekly Check-In History
          </h2>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Loading history...
              </div>
            ) : checkIns.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No check-ins logged yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {checkIns.map((item) => (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm text-white">
                          {item.averageWeight} kg
                        </span>
                        <span className="text-xs text-zinc-400">
                          Adherence: {item.adherenceScore ?? "N/A"}/10
                        </span>
                        <span className="text-xs text-zinc-400">
                          Sleep: {item.sleepHours} hrs
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        {item.reviewed ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Reviewed
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Pending Review
                          </span>
                        )}
                      </div>
                    </div>

                    {item.clientNotes && (
                      <div className="text-xs text-zinc-400">
                        <span className="text-zinc-500 font-medium">Your note: </span>
                        {item.clientNotes}
                      </div>
                    )}

                    {item.coachFeedback && (
                      <div className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-2.5 mt-2">
                        <span className="font-semibold text-emerald-400">Coach Feedback: </span>
                        {item.coachFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Check In Modal */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={loadDashboardData}
      />

      {/* Add Food Modal */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setIsFoodModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition text-lg"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🥗</span> Log Food Entry
            </h3>

            <form onSubmit={handleAddFood} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Food Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Grilled Chicken Breast"
                  value={foodForm.foodName}
                  onChange={(e) =>
                    setFoodForm({ ...foodForm, foodName: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="300"
                    value={foodForm.calories}
                    onChange={(e) =>
                      setFoodForm({ ...foodForm, calories: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="35"
                    value={foodForm.protein}
                    onChange={(e) =>
                      setFoodForm({ ...foodForm, protein: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={foodForm.carbs}
                    onChange={(e) =>
                      setFoodForm({ ...foodForm, carbs: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="5"
                    value={foodForm.fats}
                    onChange={(e) =>
                      setFoodForm({ ...foodForm, fats: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Meal Category
                </label>
                <select
                  value={foodForm.mealType}
                  onChange={(e) =>
                    setFoodForm({ ...foodForm, mealType: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                  <option value="SNACK">Snack</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFoodModalOpen(false)}
                  className="px-3 py-2 text-xs text-zinc-400 hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition"
                >
                  Save Food Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}