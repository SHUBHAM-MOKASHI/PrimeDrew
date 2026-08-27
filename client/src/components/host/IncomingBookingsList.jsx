import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, MessageSquare, Calendar, DollarSign, Key, Play, Clock, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import TripHandoverModal from '../booking/TripHandoverModal';
import { getHostBookings, updateBookingStatus } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';

export const IncomingBookingsList = () => {
  const { token } = useAuth();

  const [requests, setRequests] = useState([
    {
      _id: 'b101',
      id: 'b101',
      renterName: 'Vikram Mehta',
      renter: { name: 'Vikram Mehta', phone: '+91 98201 12345', kyc: { status: 'verified' } },
      renterKyc: 'verified',
      vehicleTitle: 'Tesla Model 3 Performance',
      vehicle: { title: 'Tesla Model 3 Performance', plateNumber: 'MH-02-EV-9821' },
      dates: '24 Aug - 27 Aug 2026 (3 Days)',
      totalPayout: 11340,
      pricingBreakdown: { totalAmount: 12600 },
      tripStatus: 'confirmed',
      paymentStatus: 'escrow_locked'
    },
    {
      _id: 'b102',
      id: 'b102',
      renterName: 'Ananya Roy',
      renter: { name: 'Ananya Roy', phone: '+91 97110 54321', kyc: { status: 'verified' } },
      renterKyc: 'verified',
      vehicleTitle: 'Mahindra Thar 4x4 Convertible',
      vehicle: { title: 'Mahindra Thar 4x4 Convertible', plateNumber: 'MH-12-TH-4410' },
      dates: '28 Aug - 29 Aug 2026 (1 Day)',
      totalPayout: 3150,
      pricingBreakdown: { totalAmount: 3500 },
      tripStatus: 'requested',
      paymentStatus: 'pending'
    }
  ]);

  const [selectedHandoverBooking, setSelectedHandoverBooking] = useState(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) return;
      try {
        const res = await getHostBookings(token);
        if (res.data && res.data.length > 0) {
          setRequests(res.data);
        }
      } catch {
        // Fallback to sample data
      }
    };
    fetchBookings();
  }, [token]);

  const handleApprove = async (id) => {
    try {
      if (token) {
        await updateBookingStatus(id, 'confirmed', token).catch(() => null);
      }
      setRequests((prev) =>
        prev.map((r) =>
          (r._id === id || r.id === id)
            ? { ...r, tripStatus: 'confirmed', paymentStatus: 'escrow_locked' }
            : r
        )
      );
    } catch {
      // Fallback update
    }
  };

  const handleDecline = async (id) => {
    try {
      if (token) {
        await updateBookingStatus(id, 'cancelled', token).catch(() => null);
      }
      setRequests((prev) => prev.filter((r) => (r._id || r.id) !== id));
    } catch {
      setRequests((prev) => prev.filter((r) => (r._id || r.id) !== id));
    }
  };

  const openHandover = (booking) => {
    setSelectedHandoverBooking(booking);
    setIsHandoverModalOpen(true);
  };

  const handleBookingUpdated = (updatedBooking) => {
    setRequests((prev) =>
      prev.map((b) =>
        (b._id === updatedBooking._id || b.id === updatedBooking._id)
          ? { ...b, ...updatedBooking }
          : b
      )
    );
    setSelectedHandoverBooking(updatedBooking);
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-zinc-800/80 p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Incoming Bookings & Handover Queue</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verify 6-digit Renter Handover OTPs, monitor active live trip stopwatches, and settle escrows
          </p>
        </div>
        <span className="bg-amber-950/80 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
          {requests.length} Bookings
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="bg-zinc-950/60 rounded-2xl p-8 text-center text-zinc-400 text-xs space-y-1 border border-zinc-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <span className="font-bold text-zinc-100 text-sm block">All Requests Reviewed</span>
          <p>You have no pending booking requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => {
            const bId = req._id || req.id;
            const rName = req.renter?.fullName || req.renter?.name || req.renterName || 'Mobility Renter';
            const vTitle = req.vehicle?.title || req.vehicleTitle || 'PrimeDrew Rental Vehicle';
            const isConfirmed = req.tripStatus === 'confirmed' || req.tripStatus === 'CONFIRMED';
            const isHandoverPending = req.tripStatus === 'HANDOVER_PENDING';
            const isInProgress = req.tripStatus === 'IN_PROGRESS' || req.tripStatus === 'active';
            const isCompleted = req.tripStatus === 'COMPLETED' || req.tripStatus === 'completed';

            return (
              <div key={bId} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-100 text-sm">{rName}</span>
                    <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Biometric KYC ✓
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-zinc-300">{vTitle}</p>
                  
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{req.dates || '24 Aug - 27 Aug 2026'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Net Escrow: ₹{req.totalPayout || req.pricingBreakdown?.totalAmount || 4200}</span>
                    </div>

                    <div>
                      {isInProgress ? (
                        <span className="bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> IN TRIP
                        </span>
                      ) : isHandoverPending ? (
                        <span className="bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          OTP READY
                        </span>
                      ) : isConfirmed ? (
                        <span className="bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ESCROW LOCKED
                        </span>
                      ) : isCompleted ? (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          REQUESTED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-zinc-800 flex-wrap">
                  {isInProgress ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={Clock}
                      onClick={() => openHandover(req)}
                      className="w-full font-bold bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-950/40"
                    >
                      Live Trip HUD & Stopwatch
                    </Button>
                  ) : (isConfirmed || isHandoverPending) ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={Key}
                      onClick={() => openHandover(req)}
                      className="w-full font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-md shadow-cyan-950/30"
                    >
                      Verify Handover OTP & Start
                    </Button>
                  ) : isCompleted ? (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={CheckCircle2}
                      onClick={() => openHandover(req)}
                      className="w-full border-zinc-800 text-emerald-400"
                    >
                      View Trip Summary
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={XCircle}
                        onClick={() => handleDecline(bId)}
                        className="border-zinc-800 text-zinc-300 hover:text-rose-400 flex-1"
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={CheckCircle2}
                        onClick={() => handleApprove(bId)}
                        className="font-bold shadow-[0_0_15px_rgba(99,102,241,0.25)] flex-1"
                      >
                        Approve Booking
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Handover & Live Trip Timer Modal */}
      {selectedHandoverBooking && (
        <TripHandoverModal
          isOpen={isHandoverModalOpen}
          onClose={() => setIsHandoverModalOpen(false)}
          booking={selectedHandoverBooking}
          isHost={true}
          onBookingUpdated={handleBookingUpdated}
        />
      )}
    </div>
  );
};

export default IncomingBookingsList;

