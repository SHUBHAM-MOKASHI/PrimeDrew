'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Clock,
  Car,
  Key,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Navigation,
  Sparkles,
  Zap,
  MapPin,
  RefreshCw,
  Copy,
  Check,
  Radio
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { generateHandoverOtp, verifyHandoverOtp, completeTrip } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';

export const TripHandoverModal = ({ isOpen, onClose, booking, isHost = false, onBookingUpdated }) => {
  const { token, user } = useAuth();

  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(booking?.handoverOtp || '');
  const [expiresAt, setExpiresAt] = useState(booking?.handoverOtpExpiresAt || null);
  const [tripStatus, setTripStatus] = useState(booking?.tripStatus || 'CONFIRMED');
  const [actualStartTime, setActualStartTime] = useState(booking?.actualStartTime || null);
  const [actualEndTime, setActualEndTime] = useState(booking?.actualEndTime || null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Live Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (booking) {
      setGeneratedOtp(booking.handoverOtp || '');
      setExpiresAt(booking.handoverOtpExpiresAt || null);
      setTripStatus(booking.tripStatus || 'CONFIRMED');
      setActualStartTime(booking.actualStartTime || null);
      setActualEndTime(booking.actualEndTime || null);
      setError('');
      setSuccessMessage('');
    }
  }, [booking, isOpen]);

  // Live Running Timer effect when IN_PROGRESS
  useEffect(() => {
    if (tripStatus === 'IN_PROGRESS' || tripStatus === 'active') {
      const startTimeMs = actualStartTime ? new Date(actualStartTime).getTime() : Date.now();

      const updateTimer = () => {
        const diffSecs = Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
        setElapsedSeconds(diffSecs);
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tripStatus, actualStartTime]);

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
  };

  const handleGenerateOtp = async () => {
    if (!booking?._id && !booking?.id) return;
    setIsLoading(true);
    setError('');
    try {
      const bId = booking._id || booking.id;
      const res = await generateHandoverOtp(bId, token);
      if (res.success) {
        setGeneratedOtp(res.handoverOtp);
        setExpiresAt(res.handoverOtpExpiresAt);
        setTripStatus(res.tripStatus || 'HANDOVER_PENDING');
        setSuccessMessage('Secure 6-Digit Handover OTP generated!');
        if (onBookingUpdated && res.booking) onBookingUpdated(res.booking);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate Handover OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otpValue || otpValue.length < 6) {
      setError('Please enter the full 6-digit handover OTP.');
      return;
    }
    if (!booking?._id && !booking?.id) return;

    setIsLoading(true);
    setError('');
    try {
      const bId = booking._id || booking.id;
      const res = await verifyHandoverOtp(bId, otpValue.trim(), token);
      if (res.success) {
        setTripStatus('IN_PROGRESS');
        setActualStartTime(res.actualStartTime || new Date());
        setSuccessMessage('Vehicle Handover Verified! Live trip started.');
        if (onBookingUpdated && res.booking) onBookingUpdated(res.booking);
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired handover OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!booking?._id && !booking?.id) return;
    setIsLoading(true);
    setError('');
    try {
      const bId = booking._id || booking.id;
      const res = await completeTrip(bId, token);
      if (res.success) {
        setTripStatus('COMPLETED');
        setActualEndTime(res.actualEndTime || new Date());
        setSuccessMessage('Trip completed and escrow settled!');
        if (onBookingUpdated && res.booking) onBookingUpdated(res.booking);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete trip.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOtp = () => {
    if (!generatedOtp) return;
    navigator.clipboard.writeText(generatedOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTripActive = tripStatus === 'IN_PROGRESS' || tripStatus === 'active';
  const isTripCompleted = tripStatus === 'COMPLETED' || tripStatus === 'completed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isTripActive
          ? 'Live Vehicle Trip HUD'
          : isTripCompleted
          ? 'Trip Summary & Settlement'
          : 'Vehicle Handover Verification'
      }
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        
        {/* Vehicle Header Details */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">
              {booking?.vehicle?.title || booking?.vehicleTitle || 'PrimeDrew Rental Vehicle'}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
              <span>Plate: {booking?.vehicle?.plateNumber || 'MH-02-EV-9821'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">
                {isTripActive ? '● Live Telemetry Active' : isTripCompleted ? '✓ Completed' : 'Awaiting Handover'}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. STATE: LIVE TRIP IN PROGRESS */}
        {isTripActive && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Real-time Digital Stopwatch HUD */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-cyan-500/40 text-center space-y-2 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>ACTIVE TRIP</span>
              </div>

              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 block">
                Elapsed Trip Duration
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-wider drop-shadow-md">
                {formatTimer(elapsedSeconds)}
              </div>
              <p className="text-[11px] text-slate-400">
                Started: {new Date(actualStartTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Simulated Live GPS Telemetry Dashboard */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">GPS Speed</span>
                <span className="text-sm font-extrabold text-cyan-400 font-mono">46 km/h</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Battery / Fuel</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">88%</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">AI Escrow</span>
                <span className="text-sm font-extrabold text-indigo-400 font-mono">Locked ✓</span>
              </div>
            </div>

            {/* Actions: Return & End Trip */}
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleCompleteTrip}
                isLoading={isLoading}
                leftIcon={Square}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 font-bold shadow-lg shadow-rose-950/40"
              >
                Complete Handover & Settle Escrow
              </Button>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Stopping trip automatically records post-trip damage snapshot and settles payment to host.
              </p>
            </div>
          </div>
        )}

        {/* 2. STATE: COMPLETED TRIP */}
        {isTripCompleted && (
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Trip Completed Successfully!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Vehicle return verified with zero active escrow disputes. Security deposit has been refunded.
              </p>
            </div>
            <Button variant="primary" onClick={onClose} className="w-full py-3 font-bold">
              Done
            </Button>
          </div>
        )}

        {/* 3. STATE: HANDOVER PENDING & OTP VERIFICATION */}
        {!isTripActive && !isTripCompleted && (
          <div className="space-y-5">
            
            {/* Renter View: Display Generated 6-digit OTP */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 text-center">
              <span className="text-xs font-bold text-slate-300 block">
                {generatedOtp ? 'Renter Handover Verification Code' : 'Generate Vehicle Handover Code'}
              </span>

              {generatedOtp ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-slate-950 px-6 py-3 rounded-2xl border border-cyan-500/50 text-2xl sm:text-3xl font-black font-mono tracking-widest text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                      {generatedOtp}
                    </div>
                    <button
                      onClick={handleCopyOtp}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                      title="Copy OTP"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Share this 6-digit code with the vehicle Host when meeting in person. Valid for 15 minutes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Click below to generate the secure 6-digit OTP required to unlock vehicle keys and start the trip.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleGenerateOtp}
                    isLoading={isLoading}
                    leftIcon={Key}
                    className="w-full py-3 font-bold"
                  >
                    Generate Handover OTP
                  </Button>
                </div>
              )}
            </div>

            {/* Host Verification Input Form */}
            <form onSubmit={handleVerifyOtp} className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Host Handover Verification
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Host Action</span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block">
                  Enter 6-Digit Code Provided by Renter:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6 digits..."
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-slate-900 text-center font-mono font-bold text-lg text-white tracking-widest px-4 py-2.5 rounded-xl border border-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    leftIcon={Play}
                    className="font-bold px-5 bg-emerald-600 hover:bg-emerald-500"
                  >
                    Verify & Start
                  </Button>
                </div>
              </div>
            </form>

          </div>
        )}

      </div>
    </Modal>
  );
};

export default TripHandoverModal;
