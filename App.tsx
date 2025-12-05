import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import ResultsPanel from './components/ResultsPanel';
import { Location, OptimizationResult } from './types';
import { optimizeRoutes } from './services/geminiService';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [truckCount, setTruckCount] = useState<number>(2);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [viewMode, setViewMode] = useState<'naive' | 'optimized'>('optimized');
  const [error, setError] = useState<string | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    // Prevent adding points while viewing results
    if (result) return;

    const isDepot = locations.length === 0;
    const newLocation: Location = {
      id: Math.random().toString(36).substr(2, 9),
      lat,
      lng,
      type: isDepot ? 'depot' : 'job',
      name: isDepot ? 'Central Depot' : `Job Site #${locations.length}`,
    };
    setLocations([...locations, newLocation]);
  };

  const handleRemoveLocation = (id: string) => {
    if (result) return;
    setLocations(locations.filter(l => l.id !== id));
  };

  const handleClear = () => {
    setLocations([]);
    setResult(null);
    setError(null);
  };

  const handleOptimize = async () => {
    if (locations.length < 2) return;
    
    setIsOptimizing(true);
    setError(null);

    try {
      const depot = locations.find(l => l.type === 'depot');
      const jobs = locations.filter(l => l.type === 'job');

      if (!depot) throw new Error("No depot defined");

      const optimizationResult = await optimizeRoutes(depot, jobs, truckCount);
      setResult(optimizationResult);
      setViewMode('optimized');
    } catch (err) {
      console.error(err);
      setError("Failed to generate optimization. Please try again. Ensure API Key is valid.");
    } finally {
      setIsOptimizing(false);
    }
  };

  // Determine what to show on map
  let activeRoutes = null;
  let mapMode: 'input' | 'naive' | 'optimized' = 'input';

  if (result) {
    mapMode = viewMode;
    activeRoutes = viewMode === 'naive' ? result.naive.routes : result.optimized.routes;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar - Fixed width */}
      <div className="w-96 flex-shrink-0 z-30 h-full relative">
        <Sidebar 
          locations={locations}
          truckCount={truckCount}
          setTruckCount={setTruckCount}
          onOptimize={handleOptimize}
          onClear={handleClear}
          isOptimizing={isOptimizing}
          onRemoveLocation={handleRemoveLocation}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative h-full">
        <MapDisplay 
          locations={locations}
          onMapClick={handleMapClick}
          activeRoutes={activeRoutes}
          mode={mapMode}
        />

        {/* Error Toast */}
        {error && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-[2000] animate-fade-in-down">
                <AlertCircle size={20} />
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-2 font-bold hover:text-red-900">&times;</button>
            </div>
        )}

        {/* Results Panel */}
        {result && (
          <ResultsPanel 
            result={result}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}
      </div>
    </div>
  );
};

export default App;
