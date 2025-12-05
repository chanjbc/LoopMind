import React from 'react';
import { OptimizationResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, Clock, Fuel, Route } from 'lucide-react';

interface ResultsPanelProps {
  result: OptimizationResult;
  viewMode: 'naive' | 'optimized';
  setViewMode: (m: 'naive' | 'optimized') => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, viewMode, setViewMode }) => {
  const data = [
    {
      name: 'Distance (km)',
      Naive: result.naive.stats.totalDistanceKm,
      Optimized: result.optimized.stats.totalDistanceKm,
    },
    {
      name: 'Cost ($)',
      Naive: result.naive.stats.estimatedFuelCost,
      Optimized: result.optimized.stats.estimatedFuelCost,
    },
  ];

  return (
    <div className="absolute bottom-6 left-6 right-[340px] z-[1000] flex gap-4 pointer-events-none">
        {/* Only enable pointer events for children to allow map clickthrough elsewhere if needed, currently laid out to not overlap map heavily */}
        
        {/* Toggle Switch */}
        <div className="pointer-events-auto bg-white rounded-xl shadow-xl border border-slate-200 p-2 flex flex-col gap-2 h-fit">
            <button
                onClick={() => setViewMode('naive')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'naive' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                Naive
            </button>
            <button
                onClick={() => setViewMode('optimized')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'optimized' ? 'bg-brand-600 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                Optimized
            </button>
        </div>

        {/* Stats Card */}
        <div className="pointer-events-auto flex-1 bg-white/95 backdrop-blur rounded-xl shadow-xl border border-slate-200 p-6 flex gap-8 items-center max-w-4xl">
            
            {/* Key Metrics */}
            <div className="flex flex-col gap-4 min-w-[200px]">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Efficiency Gains</h3>
                
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-800">{result.savings.percentImprovement.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500 font-medium">Cost Reduction</p>
                    </div>
                </div>

                 <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Clock size={14} /> <span className="text-xs font-bold uppercase">Time</span>
                        </div>
                        <span className="text-lg font-bold text-slate-700">-{result.savings.timeSavedMinutes.toFixed(0)}m</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Fuel size={14} /> <span className="text-xs font-bold uppercase">Fuel</span>
                        </div>
                        <span className="text-lg font-bold text-slate-700">-${result.savings.moneySaved.toFixed(2)}</span>
                    </div>
                 </div>
            </div>

            {/* Separator */}
            <div className="w-px h-32 bg-slate-200"></div>

            {/* Chart */}
            <div className="flex-1 h-32 w-full min-w-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" barSize={20} margin={{ left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#64748b'}} width={80} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{fill: 'transparent'}}
                        />
                        <Bar dataKey="Naive" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Optimized" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span className="text-xs text-slate-500">Naive Approach</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-brand-500"></div>
                        <span className="text-xs text-slate-500">Optimized LoopMind</span>
                     </div>
                </div>
            </div>

            {/* Current View Stats */}
            <div className="flex flex-col gap-2 min-w-[150px] text-right border-l border-slate-200 pl-8">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {viewMode === 'naive' ? 'Naive Plan' : 'Optimized Plan'}
                 </h3>
                 <div className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900 text-lg">
                        {viewMode === 'naive' ? result.naive.stats.totalDistanceKm.toFixed(1) : result.optimized.stats.totalDistanceKm.toFixed(1)}
                    </span> km
                 </div>
                 <div className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900 text-lg">
                        ${viewMode === 'naive' ? result.naive.stats.estimatedFuelCost.toFixed(2) : result.optimized.stats.estimatedFuelCost.toFixed(2)}
                    </span> est. cost
                 </div>
                 <div className="text-sm text-slate-600">
                     <span className="font-bold text-slate-900 text-lg">
                        {viewMode === 'naive' ? result.naive.routes.length : result.optimized.routes.length}
                     </span> trucks
                 </div>
            </div>
        </div>
    </div>
  );
};

export default ResultsPanel;
