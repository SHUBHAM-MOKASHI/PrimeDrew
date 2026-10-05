import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Car,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Key,
  Camera,
  ArrowRight,
  ExternalLink,
  Lock,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserBookings } from '../services/bookingService';
import TripHandoverModal from '../components/booking/TripHandoverModal';
import Button from '../components/common/Button';

export const TripsPage = () => {
  const navigate = useNavigate();
  const { user, token, openAuthModal } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  const fetchBookings = async () => {
    const activeToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
    if (!activeToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await getUserBookings(activeToken);
      if (res && res.data) {
        setBookings(res.data);
      } else if (Array.isArray(res)) {
        setBookings(res);
      } else {
        setBookings([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load your trips. Please refresh to try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const activeToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');

  if (!activeToken) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to view your bookings</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Access your active vehicle reservations, smart escrow holdings, and 6-digit trip handover codes.
        </p>
        <Button
          variant="primary"
          onClick={() => openAuthModal('renter')}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl"
        >
          Sign In / Register
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed' || s === 'approved') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Confirmed & Escrowed
        </span>
      );
    }
    if (s === 'active' || s === 'in_progress') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 animate-pulse">
          <Key className="w-3 h-3" /> Trip In Progress
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-400 border border-blue-500/30 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Completed
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Reserved & Pending
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Renter Hub</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">My Reserved Trips & Escrow</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your booked vehicles, trip handover codes, telemetry HUD, and AI inspections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBookings}
            leftIcon={RefreshCw}
            className="border-slate-800 text-slate-300 hover:text-white"
          >
            Refresh
          </Button>
          <Link to="/vehicles">
            <Button
              variant="primary"
              size="sm"
              leftIcon={Search}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
            >
              Browse Fleet
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="my-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchBookings} className="text-rose-200 border-rose-500/40">
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm font-semibold">Loading your active escrow reservations...</p>
        </div>
      ) : bookings.length === 0 ? (
        /* Empty State */
        <div className="py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0e1424] border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No active trips or bookings</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">
            Reserve a verified vehicle from the PrimeDrew fleet. Your deposit is safely held in escrow until mutually approved.
          </p>
          <Link to="/vehicles">
            <Button
              variant="primary"
              rightIcon={ArrowRight}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-6 py-3 rounded-xl"
            >
              Explore Vehicles
            </Button>
          </Link>
        </div>
      ) : (
        /* Bookings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {bookings.map((booking) => {
            const vehicle = booking.vehicle || {};
            const totalAmount =
              booking.pricingBreakdown?.totalAmount ||
              booking.totalPrice ||
              booking.totalAmount ||
              0;

            return (
              <div
                key={booking._id || booking.id}
                className="bg-[#0b0f19] border border-cyan-500/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col hover:border-cyan-500/40 transition-all duration-300"
              >
                {/* Vehicle Thumbnail Header */}
                <div className="relative h-44 w-full bg-[#0e1424] overflow-hidden">
                  <img
                    src={
                      vehicle.images?.[0] ||
                      vehicle.image ||
                      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600'
                    }
                    alt={vehicle.title || 'Vehicle'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(booking.tripStatus || booking.status)}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white truncate drop-shadow">
                      {vehicle.title || 'Reserved Vehicle'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {vehicle.category || 'Luxury'} • {vehicle.city || 'Verified Fleet'}
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e1424] border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Pickup:
                      </span>
                      <span className="font-semibold text-white">
                        {booking.startDate ? new Date(booking.startDate).toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e1424] border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" /> Dropoff:
                      </span>
                      <span className="font-semibold text-white">
                        {booking.endDate ? new Date(booking.endDate).toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" /> Locked Escrow:
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">₹{totalAmount}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsHandoverOpen(true);
                      }}
                      leftIcon={Key}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold rounded-xl text-white text-xs shadow-md shadow-cyan-950/30"
                    >
                      Trip Handover HUD & Code
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Link to={`/inspection/${booking._id || booking.id}`} className="w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={Camera}
                          className="w-full border-slate-800 text-xs bg-[#0e1424] text-slate-300 hover:text-white hover:border-cyan-500/40 rounded-xl"
                        >
                          Inspection
                        </Button>
                      </Link>
                      <Link to={`/audit/${booking._id || booking.id}`} className="w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={ExternalLink}
                          className="w-full border-slate-800 text-xs bg-[#0e1424] text-slate-300 hover:text-white hover:border-slate-700 rounded-xl"
                        >
                          Dispute / Audit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Handover Modal */}
      {selectedBooking && (
        <TripHandoverModal
          isOpen={isHandoverOpen}
          onClose={() => {
            setIsHandoverOpen(false);
            setSelectedBooking(null);
            fetchBookings();
          }}
          booking={selectedBooking}
          isHost={false}
          onBookingUpdated={fetchBookings}
        />
      )}
    </div>
  );
};

export default TripsPage;
