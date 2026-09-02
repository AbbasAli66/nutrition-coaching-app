import { useState } from 'react';
import api from '../api/axios';

export default function CheckInReviewModal({ isOpen, onClose, checkIn, onReviewed }) {
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
            <div className="text-lg font-bold text-emerald-400">{checkIn.adherenceScore || 'N/A'}/10</div>
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
              placeholder="e.g., Great work hitting protein targets. Keep calories steady and focus on sleep recovery..."
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