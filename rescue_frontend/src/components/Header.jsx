import React from 'react';
import { Radio, Plus } from 'lucide-react';

export default function Header({ onSimulateIncident }) {
  return (
    <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-sm z-20 shrink-0">
      {/* Left section: Logo & Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold tracking-wider text-sm shadow-sm">
            RQ
          </div>
          <span className="font-extrabold text-slate-900 text-base tracking-wide uppercase">
            ResQMesh
          </span>
        </div>
        <div className="h-4 w-px bg-slate-300"></div>
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Rescue Command Center
        </span>
      </div>

      {/* Right section: Simulate button + Live indicator */}
      <div className="flex items-center space-x-4">
        {onSimulateIncident && (
          <button
            onClick={onSimulateIncident}
            className="flex items-center space-x-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded border border-slate-300 transition-colors"
            title="Simulate incoming mesh broadcast incident"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Simulate Incident</span>
          </button>
        )}

        <div className="flex items-center space-x-2 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-700 tracking-wider">
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
