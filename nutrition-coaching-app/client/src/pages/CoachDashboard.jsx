import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PlanModal from '../components/PlanBuilderModal';

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch roster on mount
 // 1. Initial Load
  useEffect(() => {
    let isMounted = true;

    const loadRoster = async () => {
      try {
        const res = await api.get('/plans/clients');
        if (isMounted) {
          setClients(res.data.clients || []);
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRoster();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Refresh callback for PlanModal
  const refreshClients = async () => {
    try {
      const res = await api.get('/plans/clients');
      setClients(res.data.clients || []);
    } catch (err) {
      console.error('Failed to refresh clients:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openAssignModal = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate active plans using the nutritionPlans relation
  const activePlansCount = clients.filter(
    (c) => c.nutritionPlans && c.nutritionPlans.length > 0
  ).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-xl">∿</span>
          <span className="font-semibold text-lg">Practical Nutrition</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-300">Coach Portal</span>
          <span className="bg-zinc-800 text-xs text-zinc-400 px-2 py-0.5 rounded font-mono">COACH</span>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-emerald-400">👥</span> Coach Command Center
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage gym client rosters and prescribe targeted nutrition protocols.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-sm text-zinc-400 mb-2">Total Clients</div>
            <div className="text-3xl font-bold">{clients.length}</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-sm text-zinc-400 mb-2">Active Plans</div>
            <div className="text-3xl font-bold text-emerald-400">{activePlansCount}</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-sm text-zinc-400 mb-2">Pending Review</div>
            <div className="text-3xl font-bold text-amber-400">0</div>
          </div>
        </div>

        {/* Member List Header & Search */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Gym Member Roster</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Roster Table Container */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-sm">Loading roster...</div>
          ) : filteredClients.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">No registered clients found.</div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {filteredClients.map((client) => {
                const activePlan = client.nutritionPlans?.[0];

                return (
                  <div key={client.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/60 transition">
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {client.name || 'Unnamed Client'}
                        {activePlan && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {activePlan.caloriesTarget} kcal Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">{client.email}</div>
                    </div>
                    <button
                      onClick={() => openAssignModal(client)}
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 text-xs font-semibold px-4 py-2 rounded-lg transition"
                    >
                      {activePlan ? 'Update Plan' : 'Prescribe Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Plan Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={selectedClient}
        onPlanCreated={refreshClients}
      />
    </div>
  );
}