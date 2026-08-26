'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Gauge, 
  Timer, 
  Cpu, 
  Fingerprint, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  Car, 
  Zap, 
  ChevronRight,
  Flame
} from 'lucide-react';

const FLOATING_STUDIO_BADGES = [
  { icon: Flame, label: 'Performance Engine', value: '⚡ 503 HP Twin-Turbo S58', pos: 'top-[16%] left-[6%]' },
  { icon: Timer, label: 'Acceleration', value: '⏱️ 0-100 km/h: 3.4s', pos: 'top-[16%] right-[6%]' },
  { icon: Fingerprint, label: 'AI Security', value: '🛡️ Biometric Keyless Access', pos: 'bottom-[34%] left-[6%]' },
  { icon: Cpu, label: 'Vision Inspection', value: '🤖 YOLOv8 Damage Scan', pos: 'bottom-[34%] right-[6%]' },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

function StudioGlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 ${className}`}
    >
      {children}
    </div>
  );
}

function StudioTelemetryBadge({ icon: Icon, label, value, pos, delay }) {
  return (
    <motion.div
      className={`absolute ${pos} pointer-events-none z-10 hidden sm:block`}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <StudioGlassCard className="flex items-center gap-3 px-4 py-2.5 hover:border-blue-300 transition-colors">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{label}</p>
          <p className="text-xs sm:text-sm font-bold text-slate-800">{value}</p>
        </div>
      </StudioGlassCard>
    </motion.div>
  );
}

function StudioColorPicker({ paintOptions, activePaint, onColorChange }) {
  return (
    <motion.div
      className="pointer-events-auto absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-20"
      {...fadeUp}
    >
      <StudioGlassCard className="flex items-center gap-3 px-4 py-2">
        <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 pr-1">Studio Paint</span>
        {Object.entries(paintOptions).map(([name, hex]) => (
          <button
            key={name}
            aria-label={name}
            title={name}
            onClick={() => onColorChange(name)}
            className={`h-6 w-6 rounded-full transition-all cursor-pointer ${
              activePaint === hex ? 'ring-3 ring-blue-600 ring-offset-2 scale-110' : 'ring-1 ring-slate-300 hover:scale-105'
            }`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </StudioGlassCard>
    </motion.div>
  );
}

function StudioSearchDock() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('Mumbai Airport (BOM), MH');
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [category, setCategory] = useState('Sport');

  const categories = [
    { id: 'All', label: 'All Fleet' },
    { id: 'Sport', label: 'Sport Coupe' },
    { id: 'EV', label: 'Electric EV' },
    { id: 'SUV', label: '4x4 SUV' },
  ];

  const handleSearch = (e) => {
    e?.preventDefault();
    const query = new URLSearchParams();
    if (location) query.append('location', location);
    if (category && category !== 'All') query.append('category', category);
    if (pickupDate) query.append('pickupDate', pickupDate);
    if (dropoffDate) query.append('dropoffDate', dropoffDate);
    navigate(`/vehicles?${query.toString()}`);
  };

  return (
    <motion.div
      className="pointer-events-auto absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-5xl"
      {...fadeUp}
    >
      <div className="rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl shadow-slate-300/60 ring-1 ring-black/5">
        
        {/* Category Chips Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mr-2 hidden sm:inline">
              Fleet Mode:
            </span>
            {categories.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>350+ AI Fleet Available</span>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Location */}
          <div className="md:col-span-5 flex items-center gap-3 bg-slate-50 rounded-2xl p-2.5 px-3 border border-slate-200 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">
                Pickup Hub
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city or hub"
                className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-transparent outline-none truncate placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="md:col-span-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2.5 px-3 border border-slate-200 focus-within:bg-white focus-within:border-blue-600 transition-all">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[8px] uppercase font-bold tracking-wider text-slate-400">Pickup</label>
                <input
                  type="datetime-local"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full text-[10px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2.5 px-3 border border-slate-200 focus-within:bg-white focus-within:border-blue-600 transition-all">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[8px] uppercase font-bold tracking-wider text-slate-400">Return</label>
                <input
                  type="datetime-local"
                  value={dropoffDate}
                  onChange={(e) => setDropoffDate(e.target.value)}
                  className="w-full text-[10px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* CTA Search Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer border border-blue-400/30"
            >
              <Search className="w-4 h-4" />
              <span>Search Fleet</span>
              <ChevronRight className="w-4 h-4 opacity-80" />
            </button>
          </div>

        </form>

      </div>
    </motion.div>
  );
}

export default function HUDOverlays({ paintOptions, activePaint, onColorChange }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      
      {/* Top Floating Studio Wordmark */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3.5 py-1 rounded-full shadow-xs mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Apple Studio 3D Showcase
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          BMW M4 Competition
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Drag to inspect 360° • Live Biometric Verification Ready</p>
      </div>

      {/* Floating Studio Badges */}
      {FLOATING_STUDIO_BADGES.map((badge, i) => (
        <StudioTelemetryBadge key={badge.label} {...badge} delay={i * 0.1} />
      ))}

      {/* Paint Selector & Search Dock */}
      {paintOptions && (
        <StudioColorPicker
          paintOptions={paintOptions}
          activePaint={activePaint}
          onColorChange={onColorChange}
        />
      )}

      <StudioSearchDock />
    </div>
  );
}
