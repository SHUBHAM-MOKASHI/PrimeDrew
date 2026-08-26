'use client';

import React, { useState } from 'react';
import { Search, MapPin, Calendar, Car, Navigation } from 'lucide-react';
import Button from '../common/Button';

export const HeroSearchBar = ({ onSearch, initialParams = {} }) => {
  const [location, setLocation] = useState(initialParams.location || 'Mumbai, MH');
  const [pickupDate, setPickupDate] = useState(initialParams.pickupDate || '');
  const [dropoffDate, setDropoffDate] = useState(initialParams.dropoffDate || '');
  const [category, setCategory] = useState(initialParams.category || 'All');

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocation('Near Current Location (GPS)');
        },
        () => {
          setLocation('Mumbai, MH');
        }
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        location,
        pickupDate,
        dropoffDate,
        category: category === 'All' ? '' : category
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-950/90 backdrop-blur-2xl rounded-3xl md:rounded-full border border-slate-800/90 shadow-2xl shadow-black p-2 sm:p-2.5 transition-all text-slate-100">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-slate-800 gap-2 md:gap-0">
        
        {/* Location Field */}
        <div className="flex-1 px-4 py-2 flex items-center gap-3 relative group">
          <div className="p-2.5 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Where</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, area, or landmark"
              className="w-full text-xs sm:text-sm font-semibold text-white bg-transparent outline-none truncate placeholder:text-slate-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAutoLocation}
            className="text-slate-400 hover:text-cyan-400 transition-colors p-1 cursor-pointer"
            title="Detect My Location"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pickup Date */}
        <div className="flex-1 px-4 py-2 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Pickup Date</label>
            <input
              type="datetime-local"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full text-xs font-semibold text-white bg-transparent outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Dropoff Date */}
        <div className="flex-1 px-4 py-2 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Dropoff Date</label>
            <input
              type="datetime-local"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              className="w-full text-xs font-semibold text-white bg-transparent outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="flex-1 px-4 py-2 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
            <Car className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-white bg-transparent outline-none cursor-pointer [color-scheme:dark]"
            >
              <option value="All" className="bg-slate-900 text-white">All Categories</option>
              <option value="Sedan" className="bg-slate-900 text-white">Sedan</option>
              <option value="SUV" className="bg-slate-900 text-white">SUV & Cruiser</option>
              <option value="EV" className="bg-slate-900 text-white">Electric (EV)</option>
              <option value="Bike" className="bg-slate-900 text-white">Superbike & Scooter</option>
              <option value="Luxury" className="bg-slate-900 text-white">Luxury Class</option>
            </select>
          </div>
        </div>

        {/* Search CTA Button */}
        <div className="p-1.5 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            leftIcon={Search}
            className="w-full md:w-auto py-3 px-6 rounded-2xl md:rounded-full font-bold"
          >
            <span className="hidden lg:inline">Find Vehicles</span>
          </Button>
        </div>

      </form>
    </div>
  );
};

export default HeroSearchBar;
