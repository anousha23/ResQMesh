import React from 'react';
import { ShieldAlert, Users, Radio, AlertCircle } from 'lucide-react';

export default function SituationSummary({ incidents }) {
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
    <aside className="w-full h-full flex flex-col bg-white border-l border-slate-200 overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center space-x-2 bg-slate-50/80 shrink-0">
        <ShieldAlert className="w-4 h-4 text-slate-700" />
        <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
          Situation Summary
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Metric: Active Incidents */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
          <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase block">
            Active Incidents
          </span>
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight block mt-1">
            {totalActive}
          </span>
        </div>

        <div className="h-px bg-slate-200 w-full"></div>

        {/* Severity Breakdown */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
            Severity Breakdown
          </span>

          <div className="flex items-center justify-between p-2.5 bg-red-50/70 border border-red-200/80 rounded-md">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-bold text-red-700">CRITICAL</span>
            </div>
            <span className="text-base font-extrabold text-red-700">
              {criticalCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-orange-50/70 border border-orange-200/80 rounded-md">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-xs font-bold text-orange-700">HIGH</span>
            </div>
            <span className="text-base font-extrabold text-orange-700">
              {highCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-md">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold text-amber-700">MEDIUM</span>
            </div>
            <span className="text-base font-extrabold text-amber-700">
              {mediumCount}
            </span>
          </div>
        </div>

        <div className="h-px bg-slate-200 w-full"></div>

        {/* Operational Indicators */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700">PEOPLE REPORTED</span>
            </div>
            <span className="text-lg font-black text-slate-900">
              {totalPeopleAffected}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700">DEVICES ONLINE</span>
            </div>
            <span className="text-lg font-black text-emerald-600">
              {activeDevices}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
