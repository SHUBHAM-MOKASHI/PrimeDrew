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
      } catch (err) {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Vehicle Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/vehicles')}>Back to Fleet Catalog</Button>
      </div>
    );
  }

  const features = [
    'Bluetooth & Apple CarPlay',
    'GPS Live Tracking',
    'Fastag Pre-Installed',
    'Dashcam Security',
    'Keyless Smartphone Entry',
    'Child Safety Seat'
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Button & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/vehicles')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Fleet Catalog
            </button>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{vehicle.title}</h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-indigo-600" /> {vehicle.location?.address || 'Mumbai, MH'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-slate-900">₹{vehicle.pricing?.baseDailyRate || 2500}</span>
            <span className="text-xs text-slate-400">/ day</span>
            <Button variant="primary" size="lg" leftIcon={Lock} onClick={() => setIsCheckoutOpen(true)}>
              Book Now
            </Button>
          </div>
        </div>

        {/* Hero Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-3xl overflow-hidden shadow-sm border border-slate-200">
          <div className="lg:col-span-2 h-[340px] sm:h-[450px] relative bg-slate-100">
            <img
              src={vehicle.images?.[selectedImage] || vehicle.images?.[0]}
              alt={vehicle.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Listing
            </span>
          </div>

          <div className="hidden lg:grid grid-rows-2 gap-4 h-[450px]">
            {vehicle.images?.slice(1, 3).map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(idx + 1)}
                className={`relative overflow-hidden cursor-pointer bg-slate-100 rounded-2xl border-2 transition-all ${
                  selectedImage === idx + 1 ? 'border-indigo-600 shadow-md' : 'border-transparent'
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
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-xl flex items-center justify-center">
                  {(vehicle.host?.name || 'Rahul')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{vehicle.host?.name || 'Rahul Sharma'}</h3>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Host
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Response Time: &lt; 5 mins • 99% Acceptance Rate</p>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.98
                </span>
                <span className="text-xs text-slate-400">42 Completed Trips</span>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Vehicle Specifications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Users className="w-5 h-5 text-indigo-600 mb-1" />
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">Seats</span>
                  <span className="text-sm font-bold text-slate-900">{vehicle.specs?.seats || 5} Persons</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Gauge className="w-5 h-5 text-indigo-600 mb-1" />
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">Transmission</span>
                  <span className="text-sm font-bold text-slate-900">{vehicle.specs?.transmission || 'Automatic'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Fuel className="w-5 h-5 text-indigo-600 mb-1" />
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">Fuel Type</span>
                  <span className="text-sm font-bold text-slate-900">{vehicle.specs?.fuelType || 'Petrol'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Clock className="w-5 h-5 text-indigo-600 mb-1" />
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">Hourly Rate</span>
                  <span className="text-sm font-bold text-slate-900">₹{vehicle.pricing?.baseHourlyRate || 300}/hr</span>
                </div>
              </div>
            </div>

            {/* Included Features */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Included Vehicle Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Preview Placeholder */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-slate-900">Pickup Location</h3>
              <p className="text-xs text-slate-500">{vehicle.location?.address || 'Bandra West, Mumbai, MH'}</p>
              <div className="h-48 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                <MapPin className="w-8 h-8 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-600">Exact GPS Coordinates Pinlocked until Booking Confirmation</span>
              </div>
            </div>

          </div>

          {/* Right Floating Reservation Sidebar Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg sticky top-24 space-y-5">
              <div className="flex justify-between items-baseline pb-4 border-b border-slate-100">
                <div>
                  <span className="text-2xl font-extrabold text-slate-900">₹{vehicle.pricing?.baseDailyRate || 4200}</span>
                  <span className="text-xs text-slate-400"> / day</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Available</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Refundable Deposit</span>
                  <span className="font-bold text-slate-900">₹{vehicle.pricing?.securityDeposit || 3000}</span>
                </div>
                <div className="flex justify-between">
                  <span>Instant Verification</span>
                  <span className="font-bold text-indigo-600">60s Biometric KYC</span>
                </div>
                <div className="flex justify-between">
                  <span>Damage Telemetry</span>
                  <span className="font-bold text-slate-900">YOLOv8 Pre-Pickup Scan</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                leftIcon={Lock}
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-4 text-base font-bold shadow-lg shadow-indigo-200"
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
