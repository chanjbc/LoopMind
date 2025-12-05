import React from 'react';
import { Location } from '../types';
import { Plus, Trash2, Navigation, Settings, PlayCircle, Loader2 } from 'lucide-react';

interface SidebarProps {
  locations: Location[];
  truckCount: number;
  setTruckCount: (n: number) => void;
  onOptimize: () => void;
  onClear: () => void;
  isOptimizing: boolean;
  onRemoveLocation: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  locations,
  truckCount,
  setTruckCount,
  onOptimize,
  onClear,
  isOptimizing,
  onRemoveLocation
}) => {
  const depot = locations.find(l => l.type === 'depot');
  const jobs = locations.filter(l => l.type === 'job');

  return (
    <div className="h-full w-full bg-white border-r border-slate-200 flex flex-col shadow-xl z-20">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-brand-600 p-2 rounded-lg text-white">
             <Navigation size={20} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LoopMind</h1>
        </div>
        <p className="text-slate-500 text-sm">Next-Gen Fleet Intelligence</p>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
        
        {/* Fleet Settings */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Settings size={14} /> Fleet Configuration
          </label>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Number of Trucks</label>
            <input
              type="number"
              min="1"
              max="10"
              value={truckCount}
              onChange={(e) => setTruckCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
            />
          </div>
        </div>

        {/* Locations List */}
        <div className="space-y-3">
           <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Locations ({locations.length})
            </label>
            <button onClick={onClear} className="text-xs text-red-500 hover:text-red-600 font-medium">Reset Map</button>
           </div>
           
           <div className="bg-slate-50 rounded-lg border border-slate-200 p-2 space-y-2 min-h-[200px]">
              {locations.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <p className="mb-2">Click on the map to add points.</p>
                  <p className="text-xs">First click sets the Depot.</p>
                </div>
              )}

              {depot && (
                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 border-l-4 border-l-slate-800 shadow-sm">
                  <span className="text-sm font-semibold text-slate-800">{depot.name}</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">DEPOT</span>
                </div>
              )}

              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 border-l-4 border-l-brand-500 shadow-sm group">
                  <span className="text-sm text-slate-700 truncate max-w-[140px]">{job.name}</span>
                  <button 
                    onClick={() => onRemoveLocation(job.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <button
          onClick={onOptimize}
          disabled={locations.length < 2 || isOptimizing}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 ${
            locations.length < 2 || isOptimizing
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'
          }`}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Optimizing Route...
            </>
          ) : (
            <>
              <PlayCircle size={20} />
              Optimize Fleet
            </>
          )}
        </button>
        {locations.length < 2 && (
          <p className="text-center text-xs text-slate-400 mt-2">Add at least 1 job to optimize.</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
