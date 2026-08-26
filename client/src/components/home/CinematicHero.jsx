import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Search, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Navigation, 
  Flame, 
  ChevronRight,
  Cpu,
  Car
} from 'lucide-react';

export const CinematicHero = () => {
  const navigate = useNavigate();

  // Search dock state
  const [location, setLocation] = useState('Mumbai Airport (BOM), MH');
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLocating, setIsLocating] = useState(false);

  const categories = [
    { id: 'All', label: 'All Fleet', icon: Sparkles },
    { id: 'Sport', label: 'Sport Coupe', icon: Flame },
    { id: 'EV', label: 'Electric EV', icon: Zap },
    { id: 'SUV', label: '4x4 SUV', icon: Car },
  ];

  const handleAutoLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocation('Current Location (GPS Active)');
          setIsLocating(false);
        },
        () => {
          setLocation('Mumbai, Maharashtra');
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const query = new URLSearchParams();
    if (location) query.append('location', location);
    if (selectedCategory && selectedCategory !== 'All') {
      query.append('category', selectedCategory);
    }
    if (pickupDate) query.append('pickupDate', pickupDate);
    if (dropoffDate) query.append('dropoffDate', dropoffDate);

    navigate(`/vehicles?${query.toString()}`);
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden bg-zinc-950 text-white pt-10 pb-16">
      
      {/* Background: Ambient radial dark-violet gradient & cyber glow */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.25), transparent)',
        }}
      />
      
      {/* Subtle background tech grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0" />
      
      {/* Ambient secondary top flares */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-4">
        
        {/* Staggered Floating Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 bg-zinc-900/90 text-indigo-300 border border-indigo-500/30 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-xl shadow-[0_0_25px_rgba(99,102,241,0.25)] hover:border-indigo-400/50 transition-colors"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
          </span>
          <span>⚡ Biometric AI Fleet • Instant Keyless Unlock</span>
        </motion.div>

        {/* Holographic Title with subtle gradient text clipping */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-zinc-100"
        >
          Engineered for <span className="bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">Velocity.</span> <br />
          Verified in <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Seconds.</span>
        </motion.h1>

        {/* Subtitle description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-zinc-400 text-sm sm:text-base md:text-lg mt-4 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Next-generation peer-to-peer mobility powered by 60s DeepFace AI biometric KYC and automated YOLOv8 computer vision damage inspection.
        </motion.p>

        {/* Quick telemetry pill stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-5 text-[11px] sm:text-xs font-mono text-zinc-400"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>YOLOv8 Vision Scanner</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>60s DeepFace KYC</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Keyless Mobile Handshake</span>
          </div>
        </motion.div>
      </div>

      {/* Center Cinematic Showcase: M4 Drive-in Animation & Headlight Volumetric Beams */}
      <div className="relative z-10 w-full max-w-6xl mx-auto my-2 sm:my-4 flex flex-col items-center justify-center px-4">
        
        <div className="relative w-full max-w-4xl flex items-center justify-center min-h-[220px] sm:min-h-[300px] md:min-h-[360px]">
          
          {/* Twin Volumetric Laser Headlight Light Beams (Delay 0.6s) */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -bottom-10 sm:-bottom-16 w-full flex justify-between px-12 sm:px-24 pointer-events-none z-0 origin-top"
          >
            {/* Left Beam */}
            <div className="w-36 sm:w-56 h-56 sm:h-72 bg-gradient-to-b from-cyan-400/35 via-indigo-500/15 to-transparent blur-xl -rotate-12 transform origin-top pointer-events-none" />
            
            {/* Right Beam */}
            <div className="w-36 sm:w-56 h-56 sm:h-72 bg-gradient-to-b from-cyan-400/35 via-indigo-500/15 to-transparent blur-xl rotate-12 transform origin-top pointer-events-none" />
          </motion.div>

          {/* Underglow Ground Reflection & Shadow */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-2 sm:bottom-4 w-4/5 h-16 sm:h-24 bg-indigo-600/30 blur-3xl rounded-full pointer-events-none z-0 shadow-[0_25px_80px_rgba(99,102,241,0.4)] animate-pulse-glow" 
          />

          {/* Car Entrance Drive-in Animation */}
          <motion.div
            initial={{ 
              scale: 0.5, 
              y: 120, 
              opacity: 0, 
              filter: 'blur(10px) brightness(0.4)' 
            }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1, 
              filter: 'blur(0px) brightness(1)' 
            }}
            transition={{ 
              duration: 1.6, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="relative z-10 w-full flex items-center justify-center"
          >
            <div className="relative group max-w-2xl sm:max-w-3xl w-full">
              <img
                src="/assets/m4-hero.png"
                alt="PrimeDrew Dark M4 Sports Coupe Fleet"
                className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] select-none pointer-events-none"
                onError={(e) => {
                  // Fallback if local asset is loading or missing
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=1200';
                }}
              />

              {/* Headlight Cyan Laser Glints */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.8, 1] }}
                transition={{ duration: 1.4, delay: 0.8, times: [0, 0.4, 0.7, 1] }}
                className="absolute top-[48%] left-[16%] w-5 h-5 bg-cyan-300 rounded-full blur-[6px] pointer-events-none opacity-80"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.8, 1] }}
                transition={{ duration: 1.4, delay: 0.8, times: [0, 0.4, 0.7, 1] }}
                className="absolute top-[48%] right-[49%] w-5 h-5 bg-cyan-300 rounded-full blur-[6px] pointer-events-none opacity-80"
              />
            </div>
          </motion.div>

        </div>
      </div>

      {/* Integrated Glassmorphism Search Dock (Directly underneath/overlapping car lower zone) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 -mt-4 sm:-mt-6"
      >
        <div className="max-w-5xl mx-auto backdrop-blur-2xl bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-3.5 sm:p-5 shadow-2xl shadow-black/80 ring-1 ring-white/10 hover:border-zinc-700/80 transition-all duration-300">
          
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            
            {/* Top Row: Category Selection Chips */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none border-b border-zinc-800/70 pb-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 mr-1 hidden sm:inline">
                  Fleet Mode:
                </span>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'text-white bg-indigo-600 border border-indigo-400/50 shadow-[0_0_18px_rgba(99,102,241,0.5)]'
                          : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800/90 border border-zinc-700/40'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-zinc-400'}`} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden md:flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>350+ Host Nodes Online</span>
              </div>
            </div>

            {/* Interlocking Main Dock Grid: Location, Dates, CTA */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
              
              {/* Segment 1: Location Input with Map Pin & GPS detect */}
              <div className="md:col-span-5 relative group">
                <div className="flex items-center gap-3 bg-zinc-950/60 rounded-2xl p-3 border border-zinc-800/80 group-focus-within:border-indigo-500/70 group-focus-within:ring-1 group-focus-within:ring-indigo-500/40 transition-all">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      Pickup Hub / City
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter city, terminal, or area"
                      className="w-full text-xs sm:text-sm font-semibold text-zinc-100 bg-transparent outline-none truncate placeholder:text-zinc-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoLocation}
                    disabled={isLocating}
                    title="Detect Current GPS Location"
                    className="text-zinc-400 hover:text-indigo-300 p-1.5 rounded-lg hover:bg-zinc-800/70 transition-all cursor-pointer shrink-0"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Segment 2: Pickup & Dropoff Dates */}
              <div className="md:col-span-4 grid grid-cols-2 gap-2">
                
                {/* Pickup Date */}
                <div className="flex items-center gap-2 bg-zinc-950/60 rounded-2xl p-3 border border-zinc-800/80 focus-within:border-indigo-500/70 transition-all">
                  <div className="p-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-zinc-400">
                      Pickup
                    </label>
                    <input
                      type="datetime-local"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full text-[11px] font-semibold text-zinc-200 bg-transparent outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Dropoff Date */}
                <div className="flex items-center gap-2 bg-zinc-950/60 rounded-2xl p-3 border border-zinc-800/80 focus-within:border-indigo-500/70 transition-all">
                  <div className="p-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-zinc-400">
                      Return
                    </label>
                    <input
                      type="datetime-local"
                      value={dropoffDate}
                      onChange={(e) => setDropoffDate(e.target.value)}
                      className="w-full text-[11px] font-semibold text-zinc-200 bg-transparent outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

              </div>

              {/* Segment 3: Glowing Gradient Search Fleet CTA */}
              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:shadow-[0_0_35px_rgba(99,102,241,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-indigo-400/30"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Fleet</span>
                  <ChevronRight className="w-4 h-4 ml-0.5 opacity-80" />
                </button>
              </div>

            </div>

          </form>

        </div>
      </motion.div>

    </section>
  );
};

export default CinematicHero;
