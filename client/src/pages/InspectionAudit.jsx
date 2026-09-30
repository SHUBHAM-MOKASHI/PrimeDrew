import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Car,
  User,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRightLeft,
  Calendar,
  Lock,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import Button from '../components/common/Button';
import DamageCanvasOverlay from '../components/inspection/DamageCanvasOverlay';
import DisputeModal from '../components/inspection/DisputeModal';
import { useAuth } from '../context/AuthContext';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://primedrew-api.onrender.com';
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

export const InspectionAudit = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, isHostApproved } = useAuth();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState(null);

  // Role Simulator Toggle: Allows testing both Host and Renter controls seamlessly
  const [viewRole, setViewRole] = useState('host'); // 'host' | 'renter'

  // Live 24-Hour Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
    isExpired: false
  });

  const fetchAuditData = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token') || localStorage.getItem('primedrew_token');

    try {
      if (bookingId && bookingId !== 'sample') {
        let res;
        try {
          res = await axios.get(`${API_BASE_URL}/api/v1/inspections/${bookingId}/audit`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' },
            timeout: 15000
          });
        } catch {
          res = await axios.get(`/api/v1/inspections/${bookingId}/audit`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' },
            timeout: 15000
          });
        }
        if (res.data?.booking) {
          setBooking(res.data.booking);
          return;
        }
      }

      // Sample Demo Fallback for interactive testing when no bookingId exists
      setBooking({
        _id: bookingId || 'b-sample-8821',
        inspectionStatus: 'MANUAL_AUDIT_REQUIRED',
        escrowStatus: 'HELD',
        securityDepositAmount: 5000,
        preImageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        postImageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80',
        vehicle: {
          title: 'BMW M4 Competition Coupe',
          make: 'BMW',
          model: 'M4 Competition',
          year: 2024,
          plateNumber: 'MH-02-EV-9821',
          category: 'Luxury / Sports'
        },
        renter: {
          name: 'Arjun Singhania',
          email: 'arjun.renter@example.com',
          phone: '+91 98201 12345'
        },
        host: {
          name: 'PrimeDrew Host Operations',
          email: 'host.ops@primedrew.com',
          phone: '+91 98202 54321'
        },
        detections: [
          {
            label: 'SCRATCH',
            confidence: 0.94,
            box: { ymin: 0.58, xmin: 0.18, ymax: 0.72, xmax: 0.38 }
          },
          {
            label: 'DENT',
            confidence: 0.89,
            box: { ymin: 0.62, xmin: 0.64, ymax: 0.78, xmax: 0.82 }
          }
        ],
        dispute: {
          isDisputed: false,
          disputeDeadline: new Date(Date.now() + 23 * 60 * 60 * 1000 + 45 * 60 * 1000),
          renterReason: null,
          hostDecision: 'PENDING'
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      });
    } catch (err) {
      console.warn('[Audit Fetch Notice]:', err.message);
      setError('Could not load live booking data. Displaying fallback inspection review.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [bookingId]);

  // Sync initial view role based on user auth
  useEffect(() => {
    if (user?.role === 'host' || isHostApproved) {
      setViewRole('host');
    } else {
      setViewRole('renter');
    }
  }, [user, isHostApproved]);

  // Live 24-Hour Countdown Timer Calculation
  useEffect(() => {
    if (!booking) return;

    const deadline = booking.dispute?.disputeDeadline
      ? new Date(booking.dispute.disputeDeadline)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updateTimer = () => {
      const now = new Date();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  // Host Action: Resolve Dispute / Manual Audit
  const handleHostResolution = async (decision) => {
    setActionLoading(true);
    setActionFeedback(null);
    const token = localStorage.getItem('token') || localStorage.getItem('primedrew_token');

    try {
      const activeId = booking?._id || bookingId;
      const endpoint = `${API_BASE_URL}/api/v1/inspections/${activeId}/resolve-host`;
      let res;

      try {
        res = await axios.post(
          endpoint,
          { decision },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : ''
            },
            timeout: 15000
          }
        );
      } catch {
        res = await axios.post(
          `/api/v1/inspections/${activeId}/resolve-host`,
          { decision },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : ''
            },
            timeout: 15000
          }
        );
      }

      const updated = res.data?.booking || res.data;
      setBooking((prev) => ({
        ...prev,
        ...updated,
        escrowStatus: updated.escrowStatus || (decision === 'DISMISSED_DIRT_GLARE' ? 'RELEASED_TO_RENTER' : 'TRANSFERRED_TO_HOST'),
        inspectionStatus: updated.inspectionStatus || (decision === 'DISMISSED_DIRT_GLARE' ? 'PASSED_PRISTINE' : 'DAMAGE_DETECTED'),
        dispute: {
          ...(prev?.dispute || {}),
          hostDecision: decision,
          resolvedAt: new Date()
        }
      }));

      setActionFeedback({
        type: 'success',
        message:
          decision === 'DISMISSED_DIRT_GLARE'
            ? 'Dismissed as normal wear / dirt. Security deposit released back to renter.'
            : 'Confirmed as real physical damage. Security deposit transferred to host for repairs.'
      });
    } catch (err) {
      console.error('[Host Resolution Error]:', err);
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to submit decision.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeSuccess = (updatedBooking) => {
    setBooking((prev) => ({
      ...prev,
      ...updatedBooking,
      escrowStatus: 'DISPUTED',
      dispute: {
        ...(prev?.dispute || {}),
        isDisputed: true,
        hostDecision: 'PENDING'
      }
    }));
    setActionFeedback({
      type: 'info',
      message: 'Renter contest recorded. Escrow status locked in DISPUTED state.'
    });
  };

  const inspectionStatus = booking?.inspectionStatus || 'MANUAL_AUDIT_REQUIRED';
  const escrowStatus = booking?.escrowStatus || 'HELD';
  const deposit = Number(booking?.securityDepositAmount || 5000).toLocaleString();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Cyber Glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-10 left-1/3 w-[800px] h-[350px] bg-cyan-600/10 blur-[140px] rounded-full" />
        <div className="absolute top-80 right-10 w-[600px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Link to="/inspections" className="hover:text-cyan-400 transition-colors">
              Inspections
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200">Escrow Hold & Dispute Audit</span>
          </div>

          {/* Role Perspective Simulator */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-inner">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2">
              Viewing As:
            </span>
            <button
              onClick={() => setViewRole('host')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                viewRole === 'host'
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Host
            </button>
            <button
              onClick={() => setViewRole('renter')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                viewRole === 'renter'
                  ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Renter
            </button>
          </div>
        </div>

        {/* Top Header Card */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-mono font-semibold inline-flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" /> {booking?.vehicle?.plateNumber || 'MH-02-EV-9821'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Ref: {booking?._id}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {booking?.vehicle?.title || 'Vehicle Inspection Audit'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Forensic dual-approval portal for disputed anomalies, automated bounding boxes, and security deposit escrow release.
              </p>
            </div>

            {/* Live 24-Hour Countdown Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0 shadow-inner">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                  24-Hour Dispute Window
                </span>
                {timeLeft.isExpired ? (
                  <span className="text-sm font-bold text-rose-400">Window Expired</span>
                ) : (
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-xl sm:text-2xl font-black text-amber-400">
                      {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">remaining</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Escrow Status Banner */}
        {inspectionStatus === 'MANUAL_AUDIT_REQUIRED' && (
          <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-amber-300">
                    ⚠️ AI Uncertainty Detected — Manual Audit Required
                  </h3>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    ESCROW LOCKED
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Vision analysis encountered surface ambiguity or sensory uncertainty. The security deposit (₹{deposit}) is securely locked in Escrow awaiting human dual-review.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Escrow Held</span>
              <span className="text-xl font-black text-amber-400">₹{deposit}</span>
            </div>
          </div>
        )}

        {inspectionStatus === 'DAMAGE_DETECTED' && escrowStatus === 'HELD' && (
          <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/70 border border-rose-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-2xl shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-rose-300">
                    🚨 Physical Damage Detected — Escrow Held
                  </h3>
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    24-HR CONTEST ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  New physical damage was detected in post-trip return image. Security deposit (₹{deposit}) is held in Escrow. Renter has 24 hours to contest before funds transfer to host.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Escrow Held</span>
              <span className="text-xl font-black text-rose-400">₹{deposit}</span>
            </div>
          </div>
        )}

        {escrowStatus === 'DISPUTED' && (
          <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-2xl shrink-0">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-purple-300">
                    ⚖️ Active Dispute Under Review
                  </h3>
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    ESCROW FROZEN
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Renter Reason: "{booking?.dispute?.renterReason || 'Contested automated AI damage detection'}"
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Disputed Amount</span>
              <span className="text-xl font-black text-purple-400">₹{deposit}</span>
            </div>
          </div>
        )}

        {escrowStatus === 'RELEASED_TO_RENTER' && (
          <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-300">
                  ✅ Inspection Passed Cleanly — Escrow Released
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Security deposit (₹{deposit}) has been refunded back to the renter's account.
                </p>
              </div>
            </div>
            <span className="text-xl font-black text-emerald-400">REFUNDED</span>
          </div>
        )}

        {escrowStatus === 'TRANSFERRED_TO_HOST' && (
          <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-blue-950/70 border border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-2xl shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-blue-300">
                  💳 Claim Approved — Escrow Transferred to Host
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Security deposit (₹{deposit}) was settled to the host account for repair coverage.
                </p>
              </div>
            </div>
            <span className="text-xl font-black text-blue-400">SETTLED</span>
          </div>
        )}

        {actionFeedback && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : actionFeedback.type === 'info'
                ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>{actionFeedback.message}</span>
          </div>
        )}

        {/* Side-by-Side Comparison Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Pre-Trip Baseline Image */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Pre-Trip Baseline Image
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold">
                  VERIFIED TIMESTAMP
                </span>
              </div>

              {/* Pre-Trip Image View */}
              <div className="relative aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {booking?.preImageUrl ? (
                  <img
                    src={booking.preImageUrl}
                    alt="Pre-Trip Baseline"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-500 text-xs">
                    <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <span>No pre-trip baseline photo archived</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-mono text-slate-300 border border-slate-700">
                  Pickup Handover • Pristine Check
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Renter: <strong className="text-slate-200">{booking?.renter?.name || 'Arjun S.'}</strong></span>
              <span className="font-mono text-[11px] text-slate-500">Baseline Hash: #PRE-OK-01</span>
            </div>
          </div>

          {/* Right Column: Post-Trip Return Image with Canvas/SVG Normalized Bounding Boxes */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Post-Trip Return Image & AI Telemetry
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono text-rose-400 font-bold">
                  {booking?.detections?.length || 0} ANOMALIES
                </span>
              </div>

              {/* Interactive Bounding Box Canvas Container */}
              <div className="relative aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {booking?.postImageUrl ? (
                  <DamageCanvasOverlay
                    imageUrl={booking.postImageUrl}
                    detections={booking.detections || []}
                    selectedDetectionIndex={selectedDetectionIndex}
                    onSelectDetection={(idx) => setSelectedDetectionIndex(idx)}
                  />
                ) : (
                  <div className="text-center p-6 text-slate-500 text-xs">
                    <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <span>No post-trip return photo uploaded</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-mono text-cyan-300 border border-cyan-800/60">
                  Dropoff Return • Gemini Vision
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Host: <strong className="text-slate-200">{booking?.host?.name || 'Operations'}</strong></span>
              <span className="font-mono text-[11px] text-cyan-400">Click box to inspect</span>
            </div>
          </div>

        </div>

        {/* Detections Forensics Grid */}
        {booking?.detections && booking.detections.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Detected Damage Telemetry Coordinates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {booking.detections.map((det, idx) => {
                const box = det.box || {};
                const isSelected = selectedDetectionIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDetectionIndex(idx)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-rose-400 text-xs">
                        #{idx + 1} {det.label}
                      </span>
                      <span className="text-[10px] font-mono bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                        {Math.round((det.confidence || 0.88) * 100)}% Match
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                      <div>ymin: {box.ymin ?? 0} • xmin: {box.xmin ?? 0}</div>
                      <div>ymax: {box.ymax ?? 0} • xmax: {box.xmax ?? 0}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Bar (Dual-Approval System) */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
              Active Mode Controls ({viewRole.toUpperCase()})
            </span>
            <p className="text-xs text-slate-300">
              {viewRole === 'host'
                ? 'Host Dual-Review: Dismiss minor wear as dirt/glare or confirm legitimate damage claim.'
                : 'Renter Rights: Contest automated AI verdict within 24-hr window to lock deposit in dispute review.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {viewRole === 'host' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={CheckCircle2}
                  disabled={actionLoading || escrowStatus === 'RELEASED_TO_RENTER'}
                  onClick={() => handleHostResolution('DISMISSED_DIRT_GLARE')}
                  className="border-emerald-600/60 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 font-semibold py-2.5 px-4"
                >
                  Dismiss (Normal Wear / Dirt)
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={XCircle}
                  disabled={actionLoading || escrowStatus === 'TRANSFERRED_TO_HOST'}
                  onClick={() => handleHostResolution('ACCEPTED_DAMAGE')}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold py-2.5 px-4 border-0 shadow-lg shadow-rose-600/30"
                >
                  Confirm Real Damage
                </Button>
              </>
            )}

            {viewRole === 'renter' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={ShieldAlert}
                disabled={timeLeft.isExpired || booking?.dispute?.isDisputed}
                onClick={() => setIsDisputeModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-semibold py-2.5 px-6 border-0 shadow-lg shadow-amber-500/20"
              >
                {booking?.dispute?.isDisputed ? 'Contest Already Submitted' : 'Contest AI Verdict'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={fetchAuditData}
              className="border-slate-800 text-slate-400 hover:text-white"
            >
              Refresh
            </Button>
          </div>
        </div>

      </div>

      {/* Renter Dispute Submission Modal */}
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        bookingId={booking?._id || bookingId}
        disputeDeadline={booking?.dispute?.disputeDeadline}
        securityDepositAmount={booking?.securityDepositAmount || 5000}
        onDisputeSubmitted={handleDisputeSuccess}
      />
    </div>
  );
};

export default InspectionAudit;
