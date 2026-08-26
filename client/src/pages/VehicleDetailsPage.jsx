'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, MapPin, Gauge, Fuel, Users, CheckCircle2, Clock, Calendar, ArrowLeft, Lock, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import BookingCheckoutDrawer from '../components/booking/BookingCheckoutDrawer';
import { getVehicleById } from '../services/vehicleService';

export const VehicleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await getVehicleById(id);
        if (response.data) {
          setVehicle(response.data);
        }
      } catch {
        // Fallback mock vehicle if backend not connected
        setVehicle({
          _id: id,
          title: 'Tesla Model 3 Performance',
          make: 'Tesla',
          model: 'Model 3',
          year: 2024,
          category: 'EV',
          plateNumber: 'MH-02-EV-9821',
          specs: {
            transmission: 'Automatic',
            fuelType: 'EV',
            seats: 5,
            mileageKm: 12500
          },
          pricing: {
            baseHourlyRate: 350,
            baseDailyRate: 4200,
            securityDeposit: 3000
          },
          location: {
            address: 'Bandra West, Hill Road, Mumbai',
            coordinates: [72.83, 19.05]
          },
          images: [
            'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=1000'
          ],
          host: {
            name: 'Rahul Sharma',
            createdAt: '2023-05-10',
            kyc: { status: 'verified' }
          },
          status: 'available',
          verificationStatus: 'approved'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#080d1a] to-[#020617] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#080d1a] to-[#020617] flex flex-col items-center justify-center gap-4 text-white">
        <h2 className="text-xl font-bold">Vehicle Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/vehicles')}>Back to Fleet Catalog</Button>
      </div>
    );
  }

  const features = [
    'Bluetooth & Apple CarPlay',
    'GPS Live Telemetry Tracking',
    'Fastag Pre-Installed',
    'Dashcam Biometric Security',
    'Keyless Smartphone Entry',
    'Automated YOLOv8 Inspection'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#080d1a] to-[#020617] text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Button & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/vehicles')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Fleet Catalog
            </button>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{vehicle.title}</h1>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-cyan-400" /> {vehicle.location?.address || 'Mumbai, MH'}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 shadow-xl p-3 rounded-2xl backdrop-blur-xl">
            <div>
              <span className="text-2xl font-extrabold text-white">₹{vehicle.pricing?.baseDailyRate || 2500}</span>
              <span className="text-xs text-slate-400"> / day</span>
            </div>
            <Button variant="primary" size="lg" leftIcon={Lock} onClick={() => setIsCheckoutOpen(true)}>
              Book Now
            </Button>
          </div>
        </div>

        {/* Hero Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-2xl p-2">
          <div className="lg:col-span-2 h-[340px] sm:h-[450px] relative bg-slate-950 rounded-2xl overflow-hidden">
            <img
              src={vehicle.images?.[selectedImage] || vehicle.images?.[0]}
              alt={vehicle.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
            <span className="absolute top-4 left-4 bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Host Listing
            </span>
          </div>

          <div className="hidden lg:grid grid-rows-2 gap-3 h-[450px]">
            {vehicle.images?.slice(1, 3).map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(idx + 1)}
                className={`relative overflow-hidden cursor-pointer bg-slate-950 rounded-2xl border-2 transition-all ${
                  selectedImage === idx + 1 ? 'border-cyan-500 shadow-lg shadow-cyan-950/40' : 'border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Angle ${idx + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Details & Checkout Drawer Trigger Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Details Panel */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Host Badge */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  {(vehicle.host?.name || 'Rahul')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{vehicle.host?.name || 'Rahul Sharma'}</h3>
                    <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Host
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Response Time: &lt; 5 mins • 99% Acceptance Rate</p>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-white flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.98
                </span>
                <span className="text-xs text-slate-400">42 Completed Trips</span>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
              <h3 className="text-lg font-bold text-white">Vehicle Specifications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <Users className="w-5 h-5 text-cyan-400 mb-1" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Seats</span>
                  <span className="text-sm font-bold text-white">{vehicle.specs?.seats || 5} Persons</span>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <Gauge className="w-5 h-5 text-cyan-400 mb-1" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Transmission</span>
                  <span className="text-sm font-bold text-white">{vehicle.specs?.transmission || 'Automatic'}</span>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <Fuel className="w-5 h-5 text-cyan-400 mb-1" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Fuel Type</span>
                  <span className="text-sm font-bold text-white">{vehicle.specs?.fuelType || 'Petrol'}</span>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <Clock className="w-5 h-5 text-cyan-400 mb-1" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Hourly Rate</span>
                  <span className="text-sm font-bold text-white">₹{vehicle.pricing?.baseHourlyRate || 300}/hr</span>
                </div>
              </div>
            </div>

            {/* Included Features */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
              <h3 className="text-lg font-bold text-white">Included Vehicle Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Preview */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl backdrop-blur-xl space-y-3">
              <h3 className="text-lg font-bold text-white">Pickup Location</h3>
              <p className="text-xs text-slate-400">{vehicle.location?.address || 'Bandra West, Mumbai, MH'}</p>
              <div className="h-44 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-2">
                <MapPin className="w-7 h-7 text-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">Exact GPS Coordinates Pinlocked until Booking Confirmation</span>
              </div>
            </div>

          </div>

          {/* Right Floating Reservation Sidebar Card */}
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl backdrop-blur-2xl sticky top-24 space-y-5">
              <div className="flex justify-between items-baseline pb-4 border-b border-slate-800">
                <div>
                  <span className="text-2xl font-extrabold text-white">₹{vehicle.pricing?.baseDailyRate || 4200}</span>
                  <span className="text-xs text-slate-400"> / day</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded-full">Available</span>
              </div>

              <div className="space-y-3 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Refundable Deposit</span>
                  <span className="font-bold text-white">₹{vehicle.pricing?.securityDeposit || 3000}</span>
                </div>
                <div className="flex justify-between">
                  <span>Instant Verification</span>
                  <span className="font-bold text-cyan-400">60s Biometric KYC</span>
                </div>
                <div className="flex justify-between">
                  <span>Damage Telemetry</span>
                  <span className="font-bold text-white">YOLOv8 Pre-Pickup Scan</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                leftIcon={Lock}
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-4 text-base font-bold shadow-lg shadow-blue-600/30"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Booking Checkout Drawer */}
      <BookingCheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        vehicle={vehicle}
      />
    </div>
  );
};

export default VehicleDetailsPage;
