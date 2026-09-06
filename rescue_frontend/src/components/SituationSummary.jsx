import React from 'react';
import { ShieldAlert, Users, Radio, AlertCircle } from 'lucide-react';

export default function SituationSummary({ incidents, highestPriorityIncidentId }) {
  const totalActive = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = incidents.filter((i) => i.severity === 'HIGH').length;
  const mediumCount = incidents.filter((i) => i.severity === 'MEDIUM').length;

  const totalPeopleAffected = incidents.reduce(
    (sum, i) => sum + (i.peopleAffected || 0),
    0
  );

  // Set of unique device IDs active in mock mesh
  const activeDevices = new Set(incidents.map((i) => i.deviceId)).size + 3; // + base mesh nodes

  return (
    <aside className="w-full h-full flex flex-col bg-[#161b22] border-l border-[#30363d] overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-[#30363d] flex items-center space-x-2 bg-[#1c2128] shrink-0">
        <ShieldAlert className="w-4 h-4 text-slate-300" />
        <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
          Situation Summary
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Metric: Active Incidents */}
        <div className="bg-[#21262d] rounded-lg p-4 border border-[#30363d] text-center">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            Active Incidents
          </span>
          <span className="text-4xl font-extrabold text-slate-100 tracking-tight block mt-1">
            {totalActive}
          </span>
        </div>

        <div className="h-px bg-[#30363d] w-full"></div>

        {/* Severity Breakdown */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
            Severity Breakdown
          </span>

          <div className="flex items-center justify-between p-2.5 bg-red-950/40 border border-red-900/60 rounded-md">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-critical-dot"></span>
              <span className="text-xs font-bold text-red-400">CRITICAL</span>
            </div>
            <span className="text-base font-extrabold text-red-400">
              {criticalCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-orange-950/40 border border-orange-900/60 rounded-md">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-xs font-bold text-orange-400">HIGH</span>
            </div>
            <span className="text-base font-extrabold text-orange-400">
              {highCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-amber-950/40 border border-amber-900/60 rounded-md">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold text-amber-400">MEDIUM</span>
            </div>
            <span className="text-base font-extrabold text-amber-400">
              {mediumCount}
            </span>
          </div>
        </div>

        <div className="h-px bg-[#30363d] w-full"></div>

        {/* Operational Indicators */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#21262d] border border-[#30363d] rounded-md">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300">PEOPLE REPORTED</span>
            </div>
            <span className="text-lg font-black text-slate-100">
              {totalPeopleAffected}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#21262d] border border-[#30363d] rounded-md">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300">DEVICES ONLINE</span>
            </div>
            <span className="text-lg font-black text-emerald-400">
              {activeDevices}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
