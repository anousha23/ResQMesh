import React from 'react';
import { Radio, Plus } from 'lucide-react';

export default function Header({ onSimulateIncident, hasCriticalAlert }) {
  return (
    <header className="h-12 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between shadow-md z-20 shrink-0">
      {/* Left section: Logo & Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-[#21262d] text-slate-100 border border-[#30363d] flex items-center justify-center font-bold tracking-wider text-sm shadow-sm">
            RQ
          </div>
          <span className="font-extrabold text-slate-100 text-base tracking-wide uppercase">
            ResQMesh
          </span>
        </div>
        <div className="h-4 w-px bg-[#30363d]"></div>
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Rescue Command Center
        </span>
      </div>

      {/* Right section: Simulate button + Critical alert + Live indicator */}
      <div className="flex items-center space-x-3">
        {hasCriticalAlert && (
          <div className="flex items-center space-x-2 bg-red-950/80 px-2.5 py-1 rounded border border-red-800/80 shadow-[0_0_10px_rgba(239,68,68,0.25)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-critical-dot"></span>
            </span>
            <span className="text-[11px] font-black text-red-400 tracking-wider uppercase">
              LIVE CRITICAL ALERT
            </span>
          </div>
        )}

        {onSimulateIncident && (
          <button
            onClick={onSimulateIncident}
            className="flex items-center space-x-1.5 text-xs font-medium bg-[#21262d] hover:bg-[#28303d] text-slate-200 px-2.5 py-1 rounded border border-[#30363d] transition-colors"
            title="Simulate incoming mesh broadcast incident"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>Simulate Incident</span>
          </button>
        )}

        <div className="flex items-center space-x-2 bg-emerald-950/70 px-2.5 py-1 rounded border border-emerald-800/80">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-status-pulse"></span>
          </span>
          <span className="text-xs font-bold text-emerald-400 tracking-wider">
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
