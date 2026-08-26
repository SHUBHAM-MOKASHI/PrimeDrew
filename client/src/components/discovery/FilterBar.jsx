'use client';

import React from 'react';
import { SlidersHorizontal, Zap, ShieldCheck, Check, RotateCcw } from 'lucide-react';

export const FilterBar = ({ filters, onFilterChange, onReset }) => {
  const activeCount = Object.values(filters).filter((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val < 10000;
    return val && val !== 'All';
  }).length;

  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-2xl border-y border-slate-800/80 py-3 px-4 sm:px-6 shadow-xl shadow-black/60 text-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        
        {/* Left Filter Section */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Active Counter / Icon */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-500 text-black text-[10px] flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </div>

          {/* Quick Toggle: EV Only */}
          <button
            onClick={() => onFilterChange('evOnly', !filters.evOnly)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              filters.evOnly
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-sm backdrop-blur-md'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>EV Only</span>
            {filters.evOnly && <Check className="w-3 h-3" />}
          </button>

          {/* Quick Toggle: Verified Hosts */}
          <button
            onClick={() => onFilterChange('verifiedOnly', !filters.verifiedOnly)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              filters.verifiedOnly
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-sm backdrop-blur-md'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verified Hosts</span>
            {filters.verifiedOnly && <Check className="w-3 h-3" />}
          </button>

          {/* Transmission Selection Pills */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            {['All', 'Automatic', 'Manual'].map((t) => (
              <button
                key={t}
                onClick={() => onFilterChange('transmission', t)}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filters.transmission === t
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Fuel Type Pills */}
          <div className="hidden md:flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            {['All', 'Petrol', 'Diesel', 'EV'].map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange('fuelType', f)}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filters.fuelType === f
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Seating Capacity Pills */}
          <div className="hidden lg:flex items-center gap-1">
            <span className="text-xs text-slate-400 font-semibold mr-1">Seats:</span>
            {['Any', '2', '4', '5', '7+'].map((seat) => (
              <button
                key={seat}
                onClick={() => onFilterChange('seats', seat)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  filters.seats === seat
                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                {seat}
              </button>
            ))}
          </div>

        </div>

        {/* Clear All Action */}
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}

      </div>
    </div>
  );
};

export default FilterBar;
