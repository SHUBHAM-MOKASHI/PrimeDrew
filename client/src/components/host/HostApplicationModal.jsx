'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Car, CheckCircle2, AlertCircle, Sparkles, ArrowRight, X, Building, FileText, Clock } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export const HostApplicationModal = ({ isOpen, onClose }) => {
  const { user, token, updateUser, openKycModal } = useAuth();

  const [formData, setFormData] = useState({
    city: 'Mumbai',
    dlNumber: '',
    rcNumber: '',
    experienceYears: 2,
    vehicleTypePreference: 'Cars & EVs',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isKycVerified = user?.isKycVerified || user?.kycStatus === 'verified' || user?.kyc?.status === 'verified';
  const isPending = user?.hostApplicationStatus === 'PENDING';
  const isApproved = user?.hostApplicationStatus === 'APPROVED' || user?.role === 'HOST' || user?.role === 'ADMIN';

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        dlNumber: user?.kyc?.dlNumber || user?.kycDetails?.extractedData?.docNumber || prev.dlNumber,
        city: user?.kycDetails?.extractedData?.city || prev.city
      }));
    }
    setError('');
    setSuccess(false);
  }, [isOpen, user]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.city.trim()) {
      setError('City of operation is required.');
      setIsLoading(false);
      return;
    }

    try {
      const RAW_API_URL =
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
          ? 'https://primedrew-api.onrender.com'
          : '');
      const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
      const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token') || '';

      let response;
      try {
        response = await axios.post(
          `${API_BASE_URL}/api/v1/hosts/apply`,
          formData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: authToken ? `Bearer ${authToken}` : ''
            }
          }
        );
      } catch (endpointErr) {
        if (endpointErr?.response?.status === 404 || endpointErr?.response?.status === 405) {
          response = await axios.post(
            `${API_BASE_URL}/api/v1/users/apply-host`,
            formData,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: authToken ? `Bearer ${authToken}` : ''
              }
            }
          );
        } else {
          throw endpointErr;
        }
      }

      if (response.data && response.data.user) {
        updateUser(response.data.user);
      } else {
        updateUser({
          hostApplicationStatus: 'PENDING',
          hostApplicationDetails: {
            ...formData,
            appliedAt: new Date()
          }
        });
      }

      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit host application.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply to Become a Verified Host"
      maxWidth="max-w-lg"
    >
      {isApproved ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">You are an Approved Host!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your host profile is active with full access to the Host Fleet Manager, Booking Approvals, and Payout Studio.
          </p>
          <Button variant="primary" onClick={onClose} className="w-full py-3 font-bold mt-2">
            Continue to Host Operations
          </Button>
        </div>
      ) : isPending || success ? (
        <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 bg-amber-950/70 text-amber-400 border border-amber-500/40 text-[11px] font-bold px-3 py-1 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> Application Under Review
            </span>
            <h3 className="text-lg font-bold text-white">Host Application Submitted!</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            Thank you, <strong className="text-cyan-400">{user?.fullName || user?.name || 'User'}</strong>. Your host onboarding request has been submitted to the PrimeDrew Verification Team for review. Once approved, the Host Dashboard and Vehicle Listing wizard will unlock automatically.
          </p>
          <Button variant="primary" onClick={onClose} className="w-full py-3 font-bold mt-3 shadow-lg shadow-cyan-950/40">
            Got It, Thanks
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-slate-400">
              List your personal or commercial vehicles on PrimeDrew AI and earn daily rental revenue with full AI biometric damage escrows.
            </p>
          </div>

          {/* KYC Status Badge */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isKycVerified
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          }`}>
            <div className="flex items-center gap-2.5">
              {isKycVerified ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold block text-white">
                  {isKycVerified ? 'Biometric KYC Verified ✓' : 'KYC Verification Recommended'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isKycVerified
                    ? `Verified for ${user?.fullName || user?.name} (DeepFace 1:1)`
                    : 'Complete 60s biometric KYC for 3x faster verification clearance'}
                </span>
              </div>
            </div>
            {!isKycVerified && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openKycModal();
                }}
                className="text-[11px] font-bold text-cyan-400 hover:underline shrink-0"
              >
                Verify KYC →
              </button>
            )}
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="City of Operations *"
                placeholder="e.g. Mumbai, Pune, Bangalore"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
              <Input
                label="Driving License / ID No."
                placeholder="e.g. MH022021008921"
                value={formData.dlNumber}
                onChange={(e) => setFormData({ ...formData, dlNumber: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Vehicle Registration (RC No.)"
                placeholder="e.g. MH-02-EV-9821 (Optional)"
                value={formData.rcNumber}
                onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
              />
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Fleet Vehicle Type
                </label>
                <select
                  value={formData.vehicleTypePreference}
                  onChange={(e) => setFormData({ ...formData, vehicleTypePreference: e.target.value })}
                  className="w-full bg-slate-950/70 text-slate-100 text-sm rounded-xl border border-slate-800 px-4 py-2.5 outline-none transition-all duration-200 focus:bg-slate-900 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
                >
                  <option value="Cars & EVs">Cars & Electric Vehicles (EV)</option>
                  <option value="Luxury / Exotic">Luxury & Sports Cars</option>
                  <option value="SUV & 4x4">SUVs & Off-Road 4x4</option>
                  <option value="Motorcycles">Superbikes & Scooters</option>
                </select>
              </div>
            </div>

            <div className="w-full flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Host Experience / Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Briefly describe your fleet plans or pickup locations..."
                className="w-full bg-slate-950/70 text-slate-100 text-sm rounded-xl border border-slate-800 px-4 py-2.5 outline-none transition-all duration-200 focus:bg-slate-900 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 resize-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              rightIcon={ArrowRight}
              className="w-full py-3 font-bold shadow-lg shadow-cyan-950/40"
            >
              Submit Host Application
            </Button>
            <p className="text-[10px] text-center text-slate-500 mt-2">
              Applications are reviewed securely by the PrimeDrew Verification Team.
            </p>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default HostApplicationModal;
