'use client';

import React from 'react';
import Modal from '../common/Modal';
import VehicleGallery from './VehicleGallery';
import Button from '../common/Button';
import { Lock, Star, MapPin, ShieldCheck, Gauge, Fuel, Users } from 'lucide-react';

export const VehicleModal = ({
  isOpen,
  onClose,
  vehicle,
  onBookNow
}) => {
  if (!vehicle) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle.title}
      description={`${vehicle.category} • ${vehicle.location?.address || 'Mumbai, MH'}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        
        {/* Interactive Multi-Angle Gallery */}
        <VehicleGallery
          images={vehicle.images}
          title={vehicle.title}
          isVerified={vehicle.verificationStatus === 'approved'}
        />

        {/* Quick Specs & Booking Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Seats</span>
            <span className="text-sm font-bold text-white">{vehicle.specs?.seats || 5} Persons</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Transmission</span>
            <span className="text-sm font-bold text-white">{vehicle.specs?.transmission || 'Automatic'}</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Fuel</span>
            <span className="text-sm font-bold text-white">{vehicle.specs?.fuelType || 'Petrol'}</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Daily Rate</span>
            <span className="text-sm font-bold text-cyan-400">₹{vehicle.pricing?.baseDailyRate || 2500}/day</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div>
            <span className="text-2xl font-extrabold text-white">₹{vehicle.pricing?.baseDailyRate || 2500}</span>
            <span className="text-xs text-slate-400"> / day</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="px-5 py-2.5">
              Close
            </Button>
            <Button
              variant="primary"
              leftIcon={Lock}
              onClick={() => {
                onClose();
                if (onBookNow) onBookNow(vehicle);
              }}
              className="px-6 py-2.5 font-bold shadow-lg shadow-cyan-950/40"
            >
              Reserve Vehicle
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VehicleModal;
