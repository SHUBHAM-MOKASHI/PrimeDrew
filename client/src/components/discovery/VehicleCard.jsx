import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, ShieldCheck, Zap, Users, Gauge, Fuel, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

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
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer"
    >
      {/* Image Container & Carousel Controls */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <img
          src={images[currentImageIndex]}
          alt={vehicle.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 left-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-slate-700 hover:text-rose-500 transition-colors shadow-xs"
          aria-label="Save to favorites"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 backdrop-blur-md shadow-xs">
            <ShieldCheck className="w-3 h-3" /> Verified Host
          </span>
          {vehicle.category === 'EV' && (
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 backdrop-blur-md">
              <Zap className="w-3 h-3 text-indigo-600" /> Instant Book
            </span>
          )}
        </div>

        {/* Carousel Prev/Next Buttons (Visible on Hover if multiple images) */}
        {images.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button
              onClick={prevImage}
              className="p-1.5 rounded-full bg-white/90 text-slate-800 hover:bg-white pointer-events-auto shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="p-1.5 rounded-full bg-white/90 text-slate-800 hover:bg-white pointer-events-auto shadow-md"
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
                  idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-indigo-600">
              {vehicle.category}
            </span>
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{vehicle.rating || '4.95'}</span>
              <span className="text-slate-400">({vehicle.reviewsCount || 24} trips)</span>
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {vehicle.title}
          </h3>

          {/* Specs Bar */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{vehicle.specs?.seats || 5} Seats</span>
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span>{vehicle.specs?.transmission || vehicle.transmission || 'Automatic'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-slate-400" />
              <span>{vehicle.specs?.fuelType || vehicle.fuelType || 'Petrol'}</span>
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-slate-900">
                ₹{vehicle.pricing?.baseDailyRate || vehicle.baseDailyRate || 2500}
              </span>
              <span className="text-xs text-slate-400">/ day</span>
            </div>
            {vehicle.pricing?.baseHourlyRate && (
              <span className="text-[11px] font-semibold text-indigo-600 block">
                ₹{vehicle.pricing.baseHourlyRate}/hr
              </span>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickBook) onQuickBook(vehicle);
              else navigate(`/vehicles/${vehicle._id || vehicle.id}`);
            }}
          >
            Quick Book
          </Button>
        </div>
      </div>

    </div>
  );
};

export default VehicleCard;
