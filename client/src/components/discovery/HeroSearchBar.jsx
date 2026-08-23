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
    <div className="w-full max-w-5xl mx-auto bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-full border border-slate-200/90 shadow-xl shadow-slate-200/50 p-2 sm:p-3 transition-all">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-2 md:gap-0">
        
        {/* Location Field */}
        <div className="flex-1 px-4 py-2 flex items-center gap-3 relative group">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Where</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, area, or landmark"
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none truncate placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={handleAutoLocation}
            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
            title="Detect My Location"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pickup Date */}
        <div className="flex-1 px-4 py-2 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Pickup Date</label>
            <input
              type="datetime-local"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Dropoff Date */}
        <div className="flex-1 px-4 py-2 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Dropoff Date</label>
            <input
              type="datetime-local"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="flex-1 px-4 py-2 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
            <Car className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="EV">Electric (EV)</option>
              <option value="Bike">Superbike & Scooter</option>
              <option value="Luxury">Luxury Class</option>
            </select>
          </div>
        </div>

        {/* Search CTA Button */}
        <div className="p-1.5 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            leftIcon={Search}
            className="w-full md:w-auto py-3 px-6 rounded-xl md:rounded-full font-bold shadow-md shadow-indigo-200"
          >
            <span className="hidden lg:inline">Search Vehicles</span>
          </Button>
        </div>

      </form>
    </div>
  );
};

export default HeroSearchBar;
