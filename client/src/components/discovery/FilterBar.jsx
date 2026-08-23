import React from 'react';
import { SlidersHorizontal, Zap, ShieldCheck, Check, RotateCcw } from 'lucide-react';

export const FilterBar = ({ filters, onFilterChange, onReset }) => {
  const activeCount = Object.values(filters).filter((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val < 10000;
    return val && val !== 'All';
  }).length;

  return (
    <div className="w-full bg-white border-y border-slate-100 py-3.5 px-4 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        
        {/* Left Filter Section */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Active Counter / Icon */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>

          {/* Quick Toggle: EV Only */}
          <button
            onClick={() => onFilterChange('evOnly', !filters.evOnly)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              filters.evOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>EV Only</span>
            {filters.evOnly && <Check className="w-3 h-3" />}
          </button>

          {/* Quick Toggle: Verified Hosts */}
          <button
            onClick={() => onFilterChange('verifiedOnly', !filters.verifiedOnly)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              filters.verifiedOnly
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Verified Hosts</span>
            {filters.verifiedOnly && <Check className="w-3 h-3" />}
          </button>

          {/* Transmission Selection Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
            {['All', 'Automatic', 'Manual'].map((t) => (
              <button
                key={t}
                onClick={() => onFilterChange('transmission', t)}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                  filters.transmission === t
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Fuel Type Pills */}
          <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
            {['All', 'Petrol', 'Diesel', 'EV'].map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange('fuelType', f)}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                  filters.fuelType === f
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
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
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all ${
                  filters.seats === seat
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0"
          >
            <RotateCcw className="w-3 h-3" /> Clear All
          </button>
        )}

      </div>
    </div>
  );
};

export default FilterBar;
