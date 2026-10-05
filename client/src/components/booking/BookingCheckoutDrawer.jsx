import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Info,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  X,
  AlertTriangle,
  Calendar,
  Clock,
  Car
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import { createBooking } from '../../services/bookingService';
import TripHandoverModal from './TripHandoverModal';

export const BookingCheckoutDrawer = ({ isOpen, onClose, vehicle, onBookingSuccess }) => {
  const navigate = useNavigate();
  const { user, token, kycStatus, openAuthModal, openKycModal } = useAuth();

  // Initialize dates with sensible defaults (2 hours ahead to 26 hours ahead)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(Date.now() + 26 * 60 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  // Keyboard accessibility and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !vehicle) return null;

  // Calculate pricing breakdown
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const diffHours = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60)));
  const diffDays = Math.max(1, Math.ceil(diffHours / 24));

  const baseDaily = vehicle.pricing?.baseDailyRate || vehicle.baseDailyRate || vehicle.dailyRate || 2500;
  const baseHourly = vehicle.pricing?.baseHourlyRate || vehicle.baseHourlyRate || vehicle.hourlyRate || 300;
  const securityDeposit = vehicle.pricing?.securityDeposit || vehicle.securityDeposit || 2000;

  const baseFare = diffHours < 24 ? baseHourly * diffHours : baseDaily * diffDays;
  const platformFee = Math.round(baseFare * 0.10);
  const totalPayable = baseFare + securityDeposit + platformFee;

  // Resolve user and token directly from state or persistent storage
  const activeToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const activeUser = user || storedUser;

  const isUserKycVerified =
    activeUser?.isKycVerified === true ||
    activeUser?.kycStatus === 'verified' ||
    activeUser?.kycStatus === 'VERIFIED' ||
    activeUser?.kyc?.status === 'verified' ||
    activeUser?.kyc?.status === 'VERIFIED' ||
    kycStatus === 'verified' ||
    kycStatus === 'VERIFIED' ||
    activeUser?.role === 'ADMIN' ||
    activeUser?.role === 'admin';

  const handleConfirmBooking = async () => {
    setError('');

    // 1. Auth check
    if (!activeToken || !activeUser) {
      setError('Please sign in or create an account to reserve this vehicle.');
      openAuthModal('renter');
      return;
    }

    // 2. KYC verification check
    if (!isUserKycVerified) {
      setError('Biometric KYC Verification is required before securing your vehicle in escrow.');
      openKycModal();
      return;
    }

    // 3. Date validation
    const sTime = new Date(startDate).getTime();
    const eTime = new Date(endDate).getTime();
    const nowTime = Date.now();

    if (isNaN(sTime) || isNaN(eTime)) {
      setError('Please select valid pickup and dropoff dates.');
      return;
    }

    if (sTime >= eTime) {
      setError('Dropoff date must be strictly after pickup date.');
      return;
    }

    if (sTime < nowTime - 10 * 60 * 1000) {
      setError('Pickup date and time cannot be in the past.');
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    const bookingPayload = {
      vehicleId: vehicle._id || vehicle.id,
      vehicle: vehicle._id || vehicle.id,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      pickupDate: new Date(startDate).toISOString(),
      dropoffDate: new Date(endDate).toISOString(),
      totalPrice: totalPayable,
      totalAmount: totalPayable,
      baseFare,
      securityDeposit,
      platformFee,
      renterId: activeUser?._id || activeUser?.id
    };

    try {
      const res = await createBooking(bookingPayload, activeToken);

      setIsSubmitting(false);
      setIsLoading(false);
      setBookingSuccess(true);

      const bookedData = res?.data || res;
      setCreatedBooking(bookedData);

      if (onBookingSuccess) {
        onBookingSuccess(bookedData);
      }

      // Celebrate with fireworks
      try {
        const confettiModule = await import('canvas-confetti');
        const confetti = confettiModule.default || confettiModule;
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }
    } catch (err) {
      setIsSubmitting(false);
      setIsLoading(false);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        (typeof err === 'string' ? err : 'Failed to submit booking request. Please check vehicle availability.');
      setError(errMsg);
    }
  };

  const handleNavigateToTrips = () => {
    onClose?.();
    navigate('/trips');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
        {/* Outer Dimmed Backdrop (Clicking triggers onClose) */}
        <div
          className="fixed inset-0 cursor-pointer"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Booking Checkout Card Container */}
        <div className="relative w-full max-w-lg bg-[#0b0f19] border border-cyan-500/20 rounded-3xl p-6 text-slate-100 shadow-2xl overflow-hidden z-10 transform transition-all animate-in zoom-in-95 duration-200">
          
          {/* Prominent, Sleek Close ("X") Button at Top-Right Corner */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-40 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all border border-zinc-700 hover:border-zinc-500 cursor-pointer shadow-md"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="mb-5 pr-12">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {bookingSuccess ? 'Booking Confirmed & Escrow Locked' : `Reserve ${vehicle.title}`}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {bookingSuccess ? 'Your vehicle is secured in smart escrow' : 'Complete details to lock your rental in escrow'}
            </p>
          </div>

          {/* Success Screen State */}
          {bookingSuccess ? (
            <div className="flex flex-col items-center text-center gap-4 py-2 animate-in zoom-in-95 duration-200">
              {/* Success Pulse Shield */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.35)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="absolute -top-1 -right-1 bg-cyan-500 text-[#0b0f19] p-1 rounded-full shadow">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-1.5">
                  Escrow Locked & Guaranteed
                </span>
                <h3 className="text-xl font-extrabold text-white">Trip Reserved Successfully!</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-sm">
                  Your payment of <span className="font-bold text-white font-mono text-sm">₹{totalPayable}</span> is locked securely in smart escrow. Funds release to host only upon mutual trip start.
                </p>
              </div>

              {/* Solid Trip Summary Card */}
              <div className="w-full bg-[#0e1424] border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
                  <span>Vehicle</span>
                  <span className="font-bold text-white">{vehicle.title}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-cyan-400" /> Pickup</span>
                  <span className="font-semibold text-slate-200">{new Date(startDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-400" /> Dropoff</span>
                  <span className="font-semibold text-slate-200">{new Date(endDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Total in Escrow</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">₹{totalPayable}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5 pt-2">
                <Button
                  variant="primary"
                  onClick={() => setIsHandoverOpen(true)}
                  leftIcon={Sparkles}
                  className="w-full py-3.5 font-bold bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-950/40 text-white rounded-xl"
                >
                  View 6-Digit Handover Code & Trip HUD
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleNavigateToTrips}
                    className="w-full py-2.5 border-slate-800 bg-[#0e1424] text-slate-200 hover:text-white hover:border-cyan-500/50 rounded-xl"
                  >
                    View My Trips
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full py-2.5 border-slate-800 bg-[#0e1424] text-slate-200 hover:text-white hover:border-slate-700 rounded-xl"
                  >
                    Done & Return
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Booking Configuration State */
            <div className="space-y-4">
              {/* Vehicle Snapshot Header (Solid Card) */}
              <div className="flex items-center gap-3.5 bg-[#0e1424] p-3.5 rounded-2xl border border-slate-800">
                <img
                  src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600'}
                  alt={vehicle.title}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-700/80 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{vehicle.title}</h4>
                  <p className="text-xs text-slate-400">
                    {vehicle.category || 'Luxury'} • {vehicle.specs?.transmission || vehicle.transmission || 'Automatic'}
                  </p>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Host: {vehicle.host?.name || vehicle.hostName || 'Verified Host'}
                  </span>
                </div>
              </div>

              {/* Renter Profile Snapshot (Solid Card) */}
              {activeUser && (
                <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Renter Profile (Auto-filled)
                    </span>
                    {isUserKycVerified ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> KYC Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        KYC Required
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Driver</span>
                      <span className="font-semibold text-white truncate block">{activeUser.fullName || activeUser.name || 'Verified Driver'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Phone</span>
                      <span className="font-semibold text-white">{activeUser.phone || '+91 ••••• •••••'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Pickup Date & Time"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setError('');
                  }}
                  className="[color-scheme:dark] bg-[#0e1424] border-slate-800 text-white"
                />
                <Input
                  label="Dropoff Date & Time"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setError('');
                  }}
                  className="[color-scheme:dark] bg-[#0e1424] border-slate-800 text-white"
                />
              </div>

              {/* Duration Summary (Solid Card) */}
              <div className="text-xs font-semibold text-slate-300 bg-[#131b2e] border border-cyan-500/20 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Trip Duration:
                </span>
                <span className="font-bold text-cyan-300">
                  {diffHours < 24 ? `${diffHours} Hours` : `${diffDays} Days (${diffHours} Hours)`}
                </span>
              </div>

              {/* Cost Breakdown (Solid Card) */}
              <div className="border border-slate-800 rounded-2xl p-4 space-y-2 text-xs bg-[#0e1424]">
                <span className="font-bold text-slate-400 block mb-2 text-[10px] uppercase tracking-wider">
                  Transparent Cost Breakdown
                </span>
                <div className="flex justify-between text-slate-400">
                  <span>Base Rental ({diffHours < 24 ? `${diffHours} hrs @ ₹${baseHourly}/hr` : `${diffDays} days @ ₹${baseDaily}/day`})</span>
                  <span className="font-semibold text-slate-200">₹{baseFare}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Refundable Security Deposit</span>
                  <span className="font-semibold text-slate-200">₹{securityDeposit}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform & Escrow Protection (10%)</span>
                  <span className="font-semibold text-slate-200">₹{platformFee}</span>
                </div>

                <div className="flex justify-between pt-3 mt-2 border-t border-slate-800 text-sm font-extrabold text-white">
                  <span>Total Escrow Amount</span>
                  <span className="text-cyan-400 text-base font-mono">₹{totalPayable}</span>
                </div>
              </div>

              {/* Escrow Assurance Banner (Solid Card) */}
              <div className="bg-[#091528] border border-cyan-500/25 rounded-xl p-3 text-xs text-cyan-200 flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-[11px] leading-snug">
                  Zero-Risk Escrow Guarantee: Payment is held in smart escrow and disbursed to host only when trip inspection begins.
                </span>
              </div>

              {/* Progressive KYC Status Alert if Not Verified */}
              {!isUserKycVerified && (
                <div className="bg-amber-950/60 border border-amber-500/40 rounded-2xl p-3.5 text-xs text-amber-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-100">Identity Verification Required</span>
                      <p className="text-slate-300 leading-snug mt-0.5">
                        Please complete one-time Biometric KYC to unlock instant checkout and reserve this vehicle.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Sparkles}
                    onClick={() => {
                      if (!activeToken || !activeUser) {
                        openAuthModal('renter');
                      } else {
                        openKycModal();
                      }
                    }}
                    className="w-full bg-[#0b0f19] border-amber-500/50 text-amber-300 hover:bg-amber-950 justify-center"
                  >
                    Verify ID & Selfie Now
                  </Button>
                </div>
              )}

              {/* Error Feedback Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{error}</span>
                </div>
              )}

              {/* Confirm & Escrow CTA */}
              <Button
                variant="primary"
                isLoading={isSubmitting || isLoading}
                isDisabled={isSubmitting || isLoading}
                leftIcon={Lock}
                rightIcon={ArrowRight}
                onClick={handleConfirmBooking}
                className="w-full py-3.5 text-base font-bold shadow-[0_0_30px_rgba(6,182,212,0.35)] bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-2xl cursor-pointer"
              >
                {isSubmitting || isLoading
                  ? 'Locking Escrow & Reserving...'
                  : `Confirm & Lock ₹${totalPayable} in Escrow`}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Handover & Trip HUD Modal */}
      {createdBooking && (
        <TripHandoverModal
          isOpen={isHandoverOpen}
          onClose={() => setIsHandoverOpen(false)}
          booking={createdBooking}
          isHost={false}
        />
      )}
    </>
  );
};

export const BookingModal = BookingCheckoutDrawer;
export const CheckoutModal = BookingCheckoutDrawer;
export default BookingCheckoutDrawer;
