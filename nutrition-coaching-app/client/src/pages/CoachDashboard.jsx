import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PlanModal from '../components/PlanBuilderModal';

// Inline Review Modal to prevent missing file / 404 import errors
function CheckInReviewModal({ isOpen, onClose, checkIn, onReviewed }) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !checkIn) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.patch(`/progress/coach/review/${checkIn.id}`, {
        coachFeedback: feedback,
      });
      onReviewed();
      onClose();
    } catch (err) {
      console.error('Failed to submit coach feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition text-lg"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <span>📋</span> Review Check-In
        </h3>
        <p className="text-xs text-zinc-400 mb-6">
          Review metrics from <span className="text-emerald-400 font-semibold">{checkIn.user?.name || checkIn.user?.email}</span>.
        </p>

        {error && (
          <div className="mb-4 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded p-2 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-[11px] text-zinc-400">Current Weight</div>
            <div className="text-lg font-bold text-emerald-400">{checkIn.averageWeight} kg</div>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-[11px] text-zinc-400">Adherence Score</div>
            <div className="text-lg font-bold text-emerald-400">{checkIn.adherenceScore ?? 'N/A'}/10</div>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-[11px] text-zinc-400">Sleep Duration</div>
            <div className="text-sm font-semibold text-zinc-200">{checkIn.sleepHours} hrs</div>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-[11px] text-zinc-400">Energy & Digestion</div>
            <div className="text-sm font-semibold text-zinc-200">{checkIn.energyRating}/10 • {checkIn.digestionRating}/10</div>
          </div>
        </div>

        {checkIn.clientNotes && (
          <div className="mb-5 bg-zinc-950/40 border border-zinc-800/60 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Client Notes</div>
            <p className="text-xs text-zinc-300 italic leading-relaxed">"{checkIn.clientNotes}"</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Coach Feedback & Directives
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Great job on consistency! Let's maintain these calories for another week..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-zinc-400 hover:text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition disabled:opacity-50"
            >
              {submitting ? 'Marking Reviewed...' : 'Complete Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [pendingCheckIns, setPendingCheckIns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [clientsRes, checkInsRes] = await Promise.allSettled([
        api.get('/plans/clients'),
        api.get('/progress/coach/pending'),
      ]);

      if (clientsRes.status === 'fulfilled') {
        setClients(clientsRes.value.data.clients || []);
      }
      if (checkInsRes.status === 'fulfilled') {
        setPendingCheckIns(checkInsRes.value.data.checkIns || []);
      }
    } catch (err) {
      console.error('Failed to fetch coach dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const [clientsRes, checkInsRes] = await Promise.allSettled([
          api.get('/plans/clients'),
          api.get('/progress/coach/pending'),
        ]);

        if (isMounted) {
          if (clientsRes.status === 'fulfilled') {
            setClients(clientsRes.value.data.clients || []);
          }
          if (checkInsRes.status === 'fulfilled') {
            setPendingCheckIns(checkInsRes.value.data.checkIns || []);
          }
        }
      } catch (err) {
        if (isMounted) console.error('Failed to initialize coach data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openAssignModal = (client) => {
    setSelectedClient(client);
    setIsPlanModalOpen(true);
  };

  const openReviewModal = (checkIn) => {
    setSelectedCheckIn(checkIn);
    setIsReviewModalOpen(true);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-emerald-400">👥</span> Coach Command Center
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage gym client rosters and review weekly progress submissions.
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
            <div className="text-3xl font-bold text-amber-400">{pendingCheckIns.length}</div>
          </div>
        </div>

        {/* Pending Check-Ins Section */}
        {pendingCheckIns.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="text-amber-400">📋</span> Recent Weekly Submissions
              </h2>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                {pendingCheckIns.length} waiting
              </span>
            </div>

            <div className="space-y-3">
              {pendingCheckIns.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {item.user?.name || 'Client'}
                      </span>
                      <span className="text-xs text-zinc-400">{item.user?.email}</span>
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                        {item.averageWeight} kg
                      </span>
                    </div>
                    {item.clientNotes && (
                      <p className="text-xs text-zinc-400 italic">
                        "{item.clientNotes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => openReviewModal(item)}
                      className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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

      {/* Plan Builder Modal */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        client={selectedClient}
        onPlanCreated={fetchDashboardData}
      />

      {/* Check-In Review Modal */}
      <CheckInReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        checkIn={selectedCheckIn}
        onReviewed={fetchDashboardData}
      />
    </div>
  );
}