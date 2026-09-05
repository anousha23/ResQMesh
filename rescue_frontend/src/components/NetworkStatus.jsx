import React from 'react';
import { WifiOff, Radio, Cpu, Network, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function NetworkStatus({ activeDeviceCount = 8 }) {
  return (
    <footer className="h-16 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm shrink-0 z-20">
      {/* Title / Value Proposition Badge */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
            System Operationality
          </span>
          <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
            Network Status
          </span>
        </div>
        <div className="hidden lg:block h-6 w-px bg-slate-200"></div>
        <span className="hidden xl:inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          ResQMesh Standalone Mode Active
        </span>
      </div>

      {/* 4 Status Blocks */}
      <div className="grid grid-cols-4 gap-2 md:gap-4 flex-1 max-w-4xl ml-4">
        {/* Block 1: Internet */}
        <div className="flex items-center space-x-2 bg-red-50/90 border border-red-200/90 px-3 py-1.5 rounded-md">
          <WifiOff className="w-4 h-4 text-red-600 shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] font-bold text-red-500 uppercase tracking-wider leading-none">
              Internet
            </div>
            <div className="text-xs font-black text-red-700 leading-tight flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block"></span>
              OFFLINE
            </div>
          </div>
        </div>

        {/* Block 2: Local Network */}
        <div className="flex items-center space-x-2 bg-emerald-50/90 border border-emerald-200/90 px-3 py-1.5 rounded-md">
          <Network className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider leading-none">
              Local Network
            </div>
            <div className="text-xs font-black text-emerald-800 leading-tight flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              ACTIVE (Mesh)
            </div>
          </div>
        </div>

        {/* Block 3: Devices */}
        <div className="flex items-center space-x-2 bg-emerald-50/90 border border-emerald-200/90 px-3 py-1.5 rounded-md">
          <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider leading-none">
              Mesh Devices
            </div>
            <div className="text-xs font-black text-emerald-800 leading-tight flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              {activeDeviceCount} CONNECTED
            </div>
          </div>
        </div>

        {/* Block 4: Edge AI */}
        <div className="flex items-center space-x-2 bg-emerald-50/90 border border-emerald-200/90 px-3 py-1.5 rounded-md">
          <Cpu className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider leading-none">
              Edge AI
            </div>
            <div className="text-xs font-black text-emerald-800 leading-tight flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              RUNNING LOCAL
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
