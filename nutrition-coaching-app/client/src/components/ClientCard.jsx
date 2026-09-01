import { UserCheck, Calendar, ArrowUpRight } from 'lucide-react';

export default function ClientCard({ client, onSelectClient }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              {client.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{client.name}</h3>
              <p className="text-xs text-zinc-400">{client.email}</p>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Joined {new Date(client.createdAt || Date.now()).toLocaleDateString()}
          </span>
          <span>{client.plans?.length || 0} Plans</span>
        </div>
      </div>

      <button
        onClick={() => onSelectClient(client)}
        className="mt-4 w-full flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium py-2 rounded-lg transition"
      >
        <span>Manage Plans</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}