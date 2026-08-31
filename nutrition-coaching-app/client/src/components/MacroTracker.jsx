export default function MacroTracker({ plan, totals }) {
  const targetCalories = plan?.calories || 2000;
  const targetProtein = plan?.protein || 150;
  const targetCarbs = plan?.carbs || 200;
  const targetFats = plan?.fats || 65;

  const getPercentage = (current, target) => Math.min(Math.round((current / target) * 100), 100);

  const stats = [
    { label: 'Calories', current: totals.calories, target: targetCalories, unit: 'kcal', color: 'bg-emerald-500' },
    { label: 'Protein', current: totals.protein, target: targetProtein, unit: 'g', color: 'bg-blue-500' },
    { label: 'Carbs', current: totals.carbs, target: targetCarbs, unit: 'g', color: 'bg-amber-500' },
    { label: 'Fats', current: totals.fats, target: targetFats, unit: 'g', color: 'bg-rose-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => {
        const percent = getPercentage(stat.current, stat.target);
        return (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-zinc-400">{stat.label}</span>
              <span className="text-xs text-zinc-500">{percent}%</span>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold text-white">{stat.current}</span>
              <span className="text-sm text-zinc-500">/ {stat.target} {stat.unit}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${stat.color} transition-all duration-500`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}