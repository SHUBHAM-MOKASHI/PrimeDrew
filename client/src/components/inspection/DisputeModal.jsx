import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Clock, X, ShieldAlert, CheckCircle2, Send, FileText } from 'lucide-react';
import Button from '../common/Button';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://primedrew-api.onrender.com';
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

export const DisputeModal = ({
  isOpen,
  onClose,
  bookingId,
  disputeDeadline,
  securityDepositAmount = 5000,
  onDisputeSubmitted
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const quickReasons = [
    'Pre-existing baseline defect (already present at pickup)',
    'Surface road dirt / mud speck (not a paint scratch)',
    'Harsh sunlight / lens flare reflection on panel',
    'Normal minor wear within acceptable platform tolerance'
  ];

  const handleSelectQuickReason = (text) => {
    setReason((prev) => (prev ? `${prev}\n• ${text}` : text));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Please provide a detailed reason or description for your contest.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const token = localStorage.getItem('token') || localStorage.getItem('primedrew_token');

    try {
      const endpoint = `${API_BASE_URL}/api/v1/inspections/${bookingId}/dispute`;
      let res;
      try {
        res = await axios.post(
          endpoint,
          { reason: reason.trim() },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : ''
            },
            timeout: 15000
          }
        );
      } catch (directErr) {
        // Fallback to relative endpoint if absolute URL is blocked or localhost
        res = await axios.post(
          `/api/v1/inspections/${bookingId}/dispute`,
          { reason: reason.trim() },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : ''
            },
            timeout: 15000
          }
        );
      }

      setSuccessMessage('Dispute submitted successfully! Escrow status is locked in DISPUTED state.');
      if (onDisputeSubmitted) {
        onDisputeSubmitted(res.data?.booking || res.data);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[Dispute Submission Error]:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit dispute contest. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deadlineFormatted = disputeDeadline
    ? new Date(disputeDeadline).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : '24 hours from inspection';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 blur-sm" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-semibold block mb-1">
              Renter Protection & Escrow Contest
            </span>
            <h2 className="text-xl font-bold text-white">Contest Automated AI Verdict</h2>
            <p className="text-xs text-slate-400 mt-1">
              Lock security deposit (₹{Number(securityDepositAmount).toLocaleString()}) in Escrow and request manual audit by platform officers.
            </p>
          </div>
        </div>

        {/* 24-Hour Notice Banner */}
        <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-3.5 mb-6 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Contest window closes:</span>
          </div>
          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
            {deadlineFormatted}
          </span>
        </div>

        {/* Quick Selection Tags */}
        <div className="mb-4">
          <label className="text-[11px] font-mono uppercase text-slate-400 block mb-2 font-medium">
            Common Contest Reasons (Click to append)
          </label>
          <div className="flex flex-wrap gap-2">
            {quickReasons.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectQuickReason(chip)}
                className="text-left text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-all"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Contest Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Detailed Reason / Counter-Proof
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this detection is dirt, lighting reflection, or was already documented at pickup..."
              className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all resize-none"
              required
            />
          </div>

          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl p-3 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl p-3 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={Send}
              className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-semibold py-2.5 px-6 border-0 shadow-lg shadow-amber-500/20"
            >
              Submit Formal Contest
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;
