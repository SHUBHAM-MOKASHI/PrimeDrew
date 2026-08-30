'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, ShieldCheck, Zap, Users, Gauge, Fuel, ChevronLeft, ChevronRight } from 'lucide-react';

export const VehicleCard = ({ vehicle, onQuickBook }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600'];

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      onClick={() => navigate(`/vehicles/${vehicle._id || vehicle.id}`)}
      className="bg-slate-900/80 border border-slate-800/90 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-xl shadow-black/60 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-950/40 hover:-translate-y-1.5 p-4 flex flex-col group cursor-pointer text-slate-100"
    >
      {/* Image Container & Carousel Controls */}
      <div className="relative h-52 overflow-hidden rounded-2xl bg-slate-950">
        <img
          src={images[currentImageIndex]}
          alt={vehicle.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Ambient vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 left-3 p-2 rounded-full bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-rose-500 transition-colors border border-slate-800 shadow-sm cursor-pointer"
          aria-label="Save to favorites"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <span className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 backdrop-blur-md shadow-sm">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Host
          </span>
          {vehicle.category === 'EV' && (
            <span className="bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 backdrop-blur-md shadow-sm">
              <Zap className="w-3 h-3 text-cyan-400" /> Instant Book
            </span>
          )}
        </div>

        {/* Carousel Prev/Next Buttons */}
        {images.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button
              onClick={prevImage}
              className="p-1.5 rounded-full bg-slate-900/90 text-slate-200 hover:bg-slate-800 pointer-events-auto border border-slate-700 shadow-md cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="p-1.5 rounded-full bg-slate-900/90 text-slate-200 hover:bg-slate-800 pointer-events-auto border border-slate-700 shadow-md cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Carousel Indicator Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentImageIndex ? 'bg-cyan-400 w-4' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="pt-4 pb-2 px-1 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
              {vehicle.category}
            </span>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{vehicle.rating || '4.95'}</span>
              <span className="text-slate-400">({vehicle.reviewsCount || 24})</span>
            </span>
          </div>

          <h3 className="text-base font-bold text-white mt-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
            {vehicle.title}
          </h3>

          {/* Specs Bar */}
          <div className="flex items-center gap-2 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800 flex-wrap">
            <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800">
              <Users className="w-3 h-3 text-slate-400" />
              <span>{vehicle.specs?.seats || 5} Seats</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800">
              <Gauge className="w-3 h-3 text-slate-400" />
              <span>{vehicle.specs?.transmission || vehicle.transmission || 'Automatic'}</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800">
              <Fuel className="w-3 h-3 text-slate-400" />
              <span>{vehicle.specs?.fuelType || vehicle.fuelType || 'Petrol'}</span>
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">
                ₹{vehicle.pricing?.baseDailyRate || vehicle.baseDailyRate || 2500}
              </span>
              <span className="text-xs text-slate-400">/ day</span>
            </div>
            {vehicle.pricing?.baseHourlyRate && (
              <span className="text-[10px] font-semibold text-cyan-400 block font-mono">
                ₹{vehicle.pricing.baseHourlyRate}/hr
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickBook) onQuickBook(vehicle);
              else navigate(`/vehicles/${vehicle._id || vehicle.id}`);
            }}
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs px-4 py-2 shadow-lg shadow-blue-600/30 rounded-xl active:scale-95 transition-all cursor-pointer"
          >
            Book Vehicle
          </button>
        </div>
      </div>

    </div>
  );
};

export default VehicleCard;
