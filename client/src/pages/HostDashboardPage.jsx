import React, { useState, useEffect } from 'react';
import { Car, DollarSign, Clock, CheckCircle2, Plus, Calendar, CreditCard, SlidersHorizontal, Users, ShieldCheck, AlertCircle, Sparkles, ArrowRight, Lock, X, Trash2, AlertTriangle } from 'lucide-react';
import Button from '../components/common/Button';
import HostFleetManager from '../components/host/HostFleetManager';
import IncomingBookingsList from '../components/host/IncomingBookingsList';
import EarningsAnalytics from '../components/host/EarningsAnalytics';
import AddVehicleModal from '../components/host/AddVehicleModal';
import HostApplicationModal from '../components/host/HostApplicationModal';
import { getHostFleet } from '../services/hostService';
import { deleteVehicle } from '../services/vehicleService';
import { useAuth } from '../context/AuthContext';

export const HostDashboardPage = () => {
  const {
    user,
    token,
    isLoggedIn,
    isAdmin,
    isHostApproved,
    isHostPending,
    isHostRejected,
    openAuthModal,
    openHostModal,
    openKycModal
  } = useAuth();

  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'requests' | 'earnings'
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [fleet, setFleet] = useState([]);

  useEffect(() => {
    const fetchFleetData = async () => {
      if (!token || (!isAdmin && !isHostApproved)) return;
      try {
        const response = await getHostFleet(token);
        const liveList = response?.data || (Array.isArray(response) ? response : []);
        setFleet(Array.isArray(liveList) ? liveList : []);
      } catch (err) {
        console.error('[HostDashboard] Failed to fetch host fleet:', err);
        setFleet([]);
      }
    };
    fetchFleetData();
  }, [token, isAdmin, isHostApproved]);

  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleVehicleCreated = (newVehicle) => {
    setFleet((prev) => [newVehicle, ...prev]);
  };

  const handleDeleteVehicle = (vehicleOrId) => {
    if (typeof vehicleOrId === 'object' && vehicleOrId !== null) {
      setVehicleToDelete(vehicleOrId);
    } else {
      const found = fleet.find((item) => (item._id || item.id) === vehicleOrId);
      setVehicleToDelete(found || { _id: vehicleOrId, title: 'Vehicle' });
    }
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    const vid = vehicleToDelete._id || vehicleToDelete.id;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
      await deleteVehicle(vid, authToken);

      setFleet((prev) => prev.filter((item) => (item._id || item.id) !== vid));
      showToast(`Vehicle "${vehicleToDelete.title || 'Selected vehicle'}" was successfully deleted from your fleet.`);
      setVehicleToDelete(null);
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      setDeleteError(err?.message || err?.error || 'Failed to delete vehicle. Please check permissions.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Not Logged In View
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-slate-950/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl shadow-black relative">
          <button 
            type="button"
            onClick={() => window.history.back()}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition-all duration-150 cursor-pointer group"
            aria-label="Close"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform"/>
          </button>
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Host Portal Access</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please sign in to access your host fleet operations, review rental booking requests, or submit your host verification application.
          </p>
          <Button variant="primary" onClick={() => openAuthModal('host')} className="w-full py-3 font-bold shadow-lg shadow-cyan-950/40">
            Sign In with Phone OTP
          </Button>
        </div>
      </div>
    );
  }

  // 2. Regular User Without Approved Host Status Gate
  if (!isAdmin && !isHostApproved) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full bg-slate-950/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl shadow-black relative overflow-hidden">
          {/* Top-Right Close Button */}
          <button 
            type="button"
            onClick={() => window.history.back()}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition-all duration-150 cursor-pointer group z-20"
            aria-label="Close"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform"/>
          </button>

          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800 pr-12">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold px-3 py-1 rounded-full mb-2">
                <Car className="w-3.5 h-3.5" /> Host Verification Gate
              </span>
              <h2 className="text-2xl font-extrabold text-white">Host Studio Clearance Required</h2>
            </div>
            
            {isHostPending ? (
              <span className="inline-flex items-center gap-1.5 bg-amber-950/80 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                <Clock className="w-4 h-4 text-amber-400" /> Review Pending
              </span>
            ) : isHostRejected ? (
              <span className="inline-flex items-center gap-1.5 bg-rose-950/80 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1.5 rounded-full">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Action Required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-slate-900 text-slate-400 border border-slate-800 text-xs font-bold px-3 py-1.5 rounded-full">
                Not Applied
              </span>
            )}
          </div>

          {isHostPending ? (
            <div className="space-y-5">
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                  <span>Application Under Review</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your host onboarding request for <strong className="text-white">{user?.fullName || user?.name || 'User'}</strong> has been submitted to the PrimeDrew Verification Team for review.
                </p>
                <div className="text-[11px] text-slate-400 font-mono space-y-1 pt-2 border-t border-amber-500/20">
                  <div>City: <span className="text-slate-200">{user?.hostApplicationDetails?.city || 'Mumbai'}</span></div>
                  <div>Applied At: <span className="text-slate-200">{new Date(user?.hostApplicationDetails?.appliedAt || Date.now()).toLocaleString()}</span></div>
                  <div>Status: <span className="text-amber-400 font-bold">Awaiting Verification Team Clearance</span></div>
                </div>
              </div>

              {/* Step Progress Tracker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-bold block">STEP 1</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Biometric KYC</span>
                  <span className="text-[10px] text-emerald-400 mt-1 block">✓ Complete</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 font-bold block">STEP 2</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Host Application</span>
                  <span className="text-[10px] text-amber-400 mt-1 block animate-pulse">● Under Review</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 opacity-60">
                  <span className="text-[10px] text-slate-500 font-bold block">STEP 3</span>
                  <span className="text-xs font-bold text-slate-400 block mt-0.5">Fleet Studio</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Locked</span>
                </div>
              </div>
            </div>
          ) : isHostRejected ? (
            <div className="space-y-4">
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-5 text-xs text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>Host Application Review Feedback</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Reason: {user?.hostApplicationDetails?.rejectionReason || 'Please provide updated identification documents or correct vehicle details.'}
                </p>
              </div>
              <Button variant="primary" onClick={openHostModal} leftIcon={Sparkles} className="w-full py-3 font-bold">
                Update & Re-apply as Host
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                To maintain vehicle safety and guarantee secure peer-to-peer escrows, all hosts must be verified and approved by the Verification Team before listing vehicles or managing rental earnings.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg w-fit">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Daily Revenue Engine</h4>
                  <p className="text-[11px] text-slate-400">Earn automated daily payouts with zero platform commission on your first 3 trips.</p>
                </div>

                <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">AI Damage Escrow</h4>
                  <p className="text-[11px] text-slate-400">YOLOv8 computer vision inspects pre/post vehicle condition with instant damage claims.</p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={openHostModal}
                  rightIcon={ArrowRight}
                  className="w-full py-3.5 font-bold shadow-lg shadow-cyan-950/50"
                >
                  Apply for Host Verification
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Approved Host / Super Admin Hub View
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header & Quick Action Shortcuts */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-3 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Car className="w-3.5 h-3.5 text-indigo-400" /> Host Management Studio
            </span>
            <h1 className="text-3xl font-extrabold text-white">Host Operations Hub</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Manage your vehicle fleet, approve incoming renter requests, and track escrow payouts.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="primary" leftIcon={Plus} onClick={() => setIsWizardOpen(true)} className="shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              Add New Vehicle
            </Button>
            <Button variant="outline" size="sm" leftIcon={Calendar} onClick={() => setActiveTab('fleet')} className="border-zinc-800 hover:border-zinc-700">
              Calendar
            </Button>
            <Button variant="outline" size="sm" leftIcon={CreditCard} onClick={() => setActiveTab('earnings')} className="border-zinc-800 hover:border-zinc-700">
              Payouts
            </Button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 border border-zinc-800/80 shadow-md flex items-center gap-4 hover:border-indigo-500/40 transition-all">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-400 block">Total Active Fleet</span>
              <span className="text-2xl font-extrabold text-zinc-100">{fleet.length} Listed</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 border border-zinc-800/80 shadow-md flex items-center gap-4 hover:border-emerald-500/40 transition-all">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-400 block">Completed Trips</span>
              <span className="text-2xl font-extrabold text-zinc-100">42 Trips</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 border border-zinc-800/80 shadow-md flex items-center gap-4 hover:border-emerald-500/40 transition-all">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-400 block">Net Monthly Earnings</span>
              <span className="text-2xl font-extrabold text-zinc-100 font-mono">₹48,600</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 border border-zinc-800/80 shadow-md flex items-center gap-4 hover:border-amber-500/40 transition-all">
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-400 block">Pending Requests</span>
              <span className="text-2xl font-extrabold text-zinc-100">2 Requests</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-zinc-800">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'fleet'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Fleet Management ({fleet.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'requests'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-4 h-4" /> Incoming Requests (2)
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'earnings'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Earnings & Analytics
            </button>
          </nav>
        </div>

        {/* Tab Contents */}
        {activeTab === 'fleet' && (
          <HostFleetManager
            fleet={fleet}
            onDeleteVehicle={handleDeleteVehicle}
            onOpenAddWizard={() => setIsWizardOpen(true)}
          />
        )}

        {activeTab === 'requests' && <IncomingBookingsList />}

        {activeTab === 'earnings' && <EarningsAnalytics />}

      </div>

      {/* Vehicle Listing Wizard Modal */}
      <AddVehicleModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onVehicleCreated={handleVehicleCreated}
      />

      {/* Custom Delete Vehicle Confirmation Modal */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950/95 border border-rose-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl shadow-rose-950/20 space-y-5 animate-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => !isDeleting && setVehicleToDelete(null)}
              disabled={isDeleting}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Vehicle</h3>
                <p className="text-xs text-slate-400">Permanently remove from fleet</p>
              </div>
            </div>

            {/* Vehicle Summary Card */}
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center gap-3">
              <img
                src={vehicleToDelete.images?.[0] || 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=200'}
                alt={vehicleToDelete.title}
                className="w-14 h-14 rounded-xl object-cover border border-slate-700/60 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{vehicleToDelete.title || `${vehicleToDelete.make} ${vehicleToDelete.model}`}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    {vehicleToDelete.plateNumber || vehicleToDelete.registrationNumber || 'No Plate'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ₹{vehicleToDelete.pricing?.baseDailyRate || vehicleToDelete.baseDailyRate || 2500}/day
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Callout */}
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Are you sure you want to permanently delete this listing? This action cannot be undone and will cancel any unconfirmed booking attempts.
              </p>
            </div>

            {/* Error Feedback */}
            {deleteError && (
              <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-300">
                {deleteError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setVehicleToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-xs font-semibold border-slate-800 hover:bg-slate-900"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50 text-white cursor-pointer"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Vehicle
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950/95 border border-cyan-500/40 text-slate-100 text-xs px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HostDashboardPage;

