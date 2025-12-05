import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Location, RoutePlan } from '../types';
import { Warehouse, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface MapDisplayProps {
  locations: Location[];
  onMapClick: (lat: number, lng: number) => void;
  activeRoutes: RoutePlan[] | null;
  mode: 'input' | 'naive' | 'optimized';
}

// Custom Icons
const createIcon = (icon: React.ReactNode, color: string) => {
  const html = renderToStaticMarkup(
    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white`} style={{ backgroundColor: color }}>
      {icon}
    </div>
  );
  return L.divIcon({
    html: html,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const depotIcon = createIcon(<Warehouse size={18} color="white" />, '#0f172a'); // Slate-900
const jobIcon = createIcon(<MapPin size={18} color="white" />, '#3b82f6'); // Blue-500

const ClickHandler: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to fit bounds
const BoundsFitter: React.FC<{ locations: Location[]; routes: RoutePlan[] | null }> = ({ locations, routes }) => {
  const map = useMapEvents({});
  useEffect(() => {
    let bounds: L.LatLngBoundsExpression = [];
    
    // If we have detailed routes, fit to the route geometry for better view
    if (routes && routes.length > 0) {
      const allPoints = routes.flatMap(r => r.geometry.map(p => [p.lat, p.lng] as [number, number]));
      if (allPoints.length > 0) {
        bounds = allPoints;
      }
    } else if (locations.length > 0) {
      bounds = locations.map(l => [l.lat, l.lng]);
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, routes, map]);
  return null;
};

const MapDisplay: React.FC<MapDisplayProps> = ({ locations, onMapClick, activeRoutes, mode }) => {
  // Default center (San Francisco)
  const defaultCenter = { lat: 37.7749, lng: -122.4194 };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="outline-none"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {mode === 'input' && <ClickHandler onClick={onMapClick} />}
        <BoundsFitter locations={locations} routes={activeRoutes} />

        {/* Render Routes */}
        {activeRoutes && activeRoutes.map((route, idx) => (
          <Polyline
            key={`route-${idx}-${mode}`}
            positions={route.geometry.map(l => [l.lat, l.lng])}
            pathOptions={{
              color: route.color,
              weight: 5,
              opacity: 0.8,
              dashArray: mode === 'naive' ? '10, 10' : undefined,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        ))}

        {/* Render Locations on top of routes */}
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={loc.type === 'depot' ? depotIcon : jobIcon}
          >
            <Popup className="font-sans">
              <div className="text-sm font-semibold">{loc.name}</div>
              <div className="text-xs text-gray-500">{loc.type.toUpperCase()}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend overlay */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur p-4 rounded-lg shadow-xl border border-slate-200">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Map Legend</h4>
        <div className="space-y-2 text-sm">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-slate-900"></div>
             <span>Depot</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-blue-500"></div>
             <span>Job Location</span>
           </div>
           {mode === 'naive' && (
             <div className="flex items-center gap-2">
                <div className="w-8 h-1 border-t-2 border-red-500 border-dashed"></div>
                <span>Naive Route</span>
             </div>
           )}
           {mode === 'optimized' && (
             <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
                <span>Optimized Fleet</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default MapDisplay;