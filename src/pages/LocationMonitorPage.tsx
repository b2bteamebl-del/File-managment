import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  RefreshCw, 
  ExternalLink, 
  User, 
  Clock, 
  Navigation, 
  ShieldCheck, 
  Compass, 
  Search,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { api } from '../lib/api.js';
import { UserLocation } from '../types/index.js';
import { formatDhakaDateTime } from '../utils/dateTime.js';

export const LocationMonitorPage: React.FC = () => {
  const [latestLocations, setLatestLocations] = useState<UserLocation[]>([]);
  const [historyLocations, setHistoryLocations] = useState<UserLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'latest' | 'history'>('latest');
  const [search, setSearch] = useState('');

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        api.getLatestLocations(),
        api.getLocationHistory(),
      ]);
      setLatestLocations(latestRes);
      setHistoryLocations(historyRes);
    } catch (e) {
      console.error('Failed to load user locations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 20000); // 20s auto refresh
    return () => clearInterval(interval);
  }, []);

  const activeList = viewMode === 'latest' ? latestLocations : historyLocations;
  const filteredList = activeList.filter(loc => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      loc.name?.toLowerCase().includes(q) ||
      loc.username?.toLowerCase().includes(q) ||
      loc.rmCode?.toLowerCase().includes(q) ||
      loc.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
              Field Oversight
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-600" />
              <span>Team Member Live Location Monitor</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time GPS coordinates, reverse geocoded street addresses, and action timestamps for all active team members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('latest')}
              className={`px-3 py-1.5 rounded-md transition ${
                viewMode === 'latest' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Latest by Member ({latestLocations.length})
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-md transition ${
                viewMode === 'history' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit History ({historyLocations.length})
            </button>
          </div>

          <button
            onClick={fetchLocations}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200"
            title="Refresh Location Pings"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search team member name, RM code, address..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Geolocation Tracking Active</span>
        </div>
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && activeList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs">Fetching team members' location updates...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border">
            <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs">No location updates logged yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Locations are captured when members check in using the floating menu, auto-detect addresses, or file applications.
            </p>
          </div>
        ) : (
          filteredList.map((loc, idx) => {
            const mapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {loc.name?.[0] || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">{loc.name}</h4>
                        <span className="font-mono text-[10px] text-blue-700">RM {loc.rmCode || loc.username}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {loc.role}
                    </span>
                  </div>

                  {/* Address info */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-start gap-1.5 text-xs text-slate-800">
                      <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">
                        {loc.address || `Lat: ${loc.latitude.toFixed(5)}, Lon: ${loc.longitude.toFixed(5)}`}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono pl-5">
                      Coordinates: {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                      {loc.accuracy && ` (±${Math.round(loc.accuracy)}m)`}
                    </div>

                    {loc.actionContext && (
                      <div className="pl-5 pt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {loc.actionContext}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">
                    {formatDhakaDateTime(loc.timestamp)}
                  </span>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
