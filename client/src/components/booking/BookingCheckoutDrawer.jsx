import React, { useState } from 'react';
import { ShieldCheck, Info, Sparkles, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import { createBooking } from '../../services/bookingService';

export const BookingCheckoutDrawer = ({ isOpen, onClose, vehicle }) => {
  const { user, token, kycStatus, openAuthModal } = useAuth();

  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  if (!vehicle) return null;

  // Calculate pricing breakdown
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const diffHours = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60)));
  const diffDays = Math.max(1, Math.ceil(diffHours / 24));

  const baseDaily = vehicle.pricing?.baseDailyRate || vehicle.baseDailyRate || 2500;
  const baseHourly = vehicle.pricing?.baseHourlyRate || vehicle.baseHourlyRate || 300;
  const securityDeposit = vehicle.pricing?.securityDeposit || vehicle.securityDeposit || 2000;

  const baseFare = diffHours < 24 ? baseHourly * diffHours : baseDaily * diffDays;
  const platformFee = Math.round(baseFare * 0.10);
  const totalPayable = baseFare + securityDeposit + platformFee;

  const handleConfirmBooking = async () => {
    if (!token) {
      openAuthModal('renter');
      return;
    }

    if (kycStatus !== 'verified') {
      openAuthModal('renter');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createBooking(
        {
          vehicleId: vehicle._id || vehicle.id,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString()
        },
        token
      );

      setIsLoading(false);
      setBookingSuccess(true);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Failed to submit booking request. Please check vehicle availability.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bookingSuccess ? 'Booking Confirmed!' : `Reserve ${vehicle.title}`}
      maxWidth="max-w-lg"
    >
      {bookingSuccess ? (
        <div className="flex flex-col items-center text-center gap-4 py-4 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-100">Trip Requested Successfully!</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Your payment of <span className="font-bold text-zinc-100 font-mono">₹{totalPayable}</span> is locked securely in Escrow until host approves key handover.
            </p>
          </div>

          <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between text-zinc-400">
              <span>Vehicle:</span>
              <span className="font-bold text-zinc-100">{vehicle.title}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Pickup Window:</span>
              <span className="font-semibold text-zinc-200">{new Date(startDate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Dropoff Window:</span>
              <span className="font-semibold text-zinc-200">{new Date(endDate).toLocaleString()}</span>
            </div>
          </div>

          <Button variant="primary" onClick={onClose} className="w-full py-3">
            Done & Return to Fleet
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Vehicle Snapshot Header */}
          <div className="flex items-center gap-4 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
            <img
              src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600'}
              alt={vehicle.title}
              className="w-16 h-16 rounded-xl object-cover border border-zinc-700/60"
            />
            <div>
              <h4 className="text-sm font-bold text-zinc-100">{vehicle.title}</h4>
              <p className="text-xs text-zinc-400">{vehicle.category} • {vehicle.specs?.transmission || vehicle.transmission || 'Automatic'}</p>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Host: {vehicle.host?.name || vehicle.hostName || 'Verified Host'}
              </span>
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pickup Date/Time"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="[color-scheme:dark]"
            />
            <Input
              label="Dropoff Date/Time"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="[color-scheme:dark]"
            />
          </div>

          {/* Duration Summary */}
          <div className="text-xs font-semibold text-zinc-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span>Trip Duration:</span>
            <span className="font-bold text-indigo-400">
              {diffHours < 24 ? `${diffHours} Hours` : `${diffDays} Days (${diffHours} Hours)`}
            </span>
          </div>

          {/* Transparent Price Breakdown */}
          <div className="border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs bg-zinc-900/40">
            <span className="font-bold text-zinc-200 block mb-2 text-xs uppercase tracking-wider text-zinc-400">Cost Breakdown</span>
            <div className="flex justify-between text-zinc-400">
              <span>Base Rental ({diffHours < 24 ? `${diffHours} hrs @ ₹${baseHourly}/hr` : `${diffDays} days @ ₹${baseDaily}/day`})</span>
              <span className="font-semibold text-zinc-200">₹{baseFare}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Refundable Security Deposit</span>
              <span className="font-semibold text-zinc-200">₹{securityDeposit}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Platform & Telemetry Protection Fee (10%)</span>
              <span className="font-semibold text-zinc-200">₹{platformFee}</span>
            </div>

            <div className="flex justify-between pt-3 mt-2 border-t border-zinc-800 text-sm font-extrabold text-zinc-100">
              <span>Total Payable</span>
              <span className="text-indigo-400 text-base font-mono">₹{totalPayable}</span>
            </div>
          </div>

          {/* Progressive KYC Status Alert */}
          {kycStatus !== 'verified' ? (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-xs text-amber-200 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-100">Identity Verification Required</span>
                  <p className="text-zinc-400 leading-snug mt-0.5">
                    Your KYC is currently unverified. Complete 60-second DL OCR and live selfie match before checkout.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={Sparkles}
                onClick={() => openAuthModal('renter')}
                className="w-full bg-zinc-900 border-amber-500/40 text-amber-300 hover:bg-amber-950/50 justify-center"
              >
                Verify ID & Selfie Now
              </Button>
            </div>
          ) : (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Identity Verified. You are pre-approved for instant checkout.</span>
            </div>
          )}

          {error && <p className="text-xs font-semibold text-rose-400 text-center">{error}</p>}

          {/* Confirm & Escrow CTA */}
          <Button
            variant="primary"
            isLoading={isLoading}
            leftIcon={Lock}
            rightIcon={ArrowRight}
            onClick={handleConfirmBooking}
            className="w-full py-3.5 text-base font-bold shadow-[0_0_25px_rgba(99,102,241,0.3)]"
          >
            Confirm & Lock ₹{totalPayable} in Escrow
          </Button>

        </div>
      )}
    </Modal>
  );
};

export default BookingCheckoutDrawer;

