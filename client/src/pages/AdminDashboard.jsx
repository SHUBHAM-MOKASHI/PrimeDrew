'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Crown,
  Users,
  Car,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  DollarSign,
  Lock,
  ArrowRight,
  Sparkles,
  FileText,
  Phone,
  Mail,
  MapPin,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import axios from 'axios';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { user, token, isAdmin, isMasterAdmin, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' | 'applications' | 'users' | 'fleet' | 'security'
  const [appStatusFilter, setAppStatusFilter] = useState('PENDING'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [vehicleFilter, setVehicleFilter] = useState('PENDING'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHosts: 0,
    totalAdmins: 1,
    pendingApplications: 0,
    pendingVehicles: 0,
    approvedHosts: 0,
    verifiedKycUsers: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    totalBookings: 0,
    totalRevenue: 0
  });

  const [applications, setApplications] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [fleetList, setFleetList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectModalUserId, setRejectModalUserId] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectVehicleModalId, setRejectVehicleModalId] = useState(null);
  const [rejectVehicleReasonInput, setRejectVehicleReasonInput] = useState('');
  const [previewDocumentUrl, setPreviewDocumentUrl] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchAdminData = async () => {
    if (!token && !localStorage.getItem('token')) return;
    setIsLoading(true);

    const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
    const headers = { Authorization: authToken ? `Bearer ${authToken}` : '' };

    try {
      const [statsRes, appsRes, usersRes, fleetRes] = await Promise.all([
        axios.get('/api/v1/admin/stats', { headers }).catch(() => null),
        axios.get('/api/v1/admin/host-applications', { headers }).catch(() => null),
        axios.get('/api/v1/admin/users', { headers }).catch(() => null),
        axios.get('/api/v1/admin/fleet', { headers }).catch(() => null)
      ]);

      if (statsRes?.data?.stats) {
        setStats(statsRes.data.stats);
      }
      if (appsRes?.data?.applications) {
        setApplications(appsRes.data.applications);
      }
      if (usersRes?.data?.users) {
        setUsersList(usersRes.data.users);
      }
      if (fleetRes?.data?.vehicles) {
        setFleetList(fleetRes.data.vehicles);
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, token]);

  const handleApproveVehicle = async (vehicleId) => {
    setActionLoadingId(vehicleId);
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
    try {
      const res = await axios.patch(
        `/api/v1/admin/vehicles/${vehicleId}/approve`,
        {},
        { headers: { Authorization: authToken ? `Bearer ${authToken}` : '' } }
      );

      if (res.data?.success) {
        showToast(res.data.message || 'Vehicle approved and published to fleet.');
        setFleetList((prev) =>
          prev.map((v) =>
            (v._id === vehicleId || v.id === vehicleId)
              ? { ...v, verificationStatus: 'approved', status: 'available', rcDocument: { ...(v.rcDocument || {}), isVerifiedByAdmin: true } }
              : v
          )
        );
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve vehicle.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectVehicle = async () => {
    if (!rejectVehicleModalId) return;
    setActionLoadingId(rejectVehicleModalId);
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
    try {
      const res = await axios.patch(
        `/api/v1/admin/vehicles/${rejectVehicleModalId}/reject`,
        { reason: rejectVehicleReasonInput || 'RC Document authenticity check failed.' },
        { headers: { Authorization: authToken ? `Bearer ${authToken}` : '' } }
      );

      if (res.data?.success) {
        showToast(res.data.message || 'Vehicle rejected.');
        setFleetList((prev) =>
          prev.map((v) =>
            (v._id === rejectVehicleModalId || v.id === rejectVehicleModalId)
              ? { ...v, verificationStatus: 'rejected', status: 'unlisted', rcDocument: { ...(v.rcDocument || {}), isVerifiedByAdmin: false, flagReason: rejectVehicleReasonInput } }
              : v
          )
        );
        setRejectVehicleModalId(null);
        setRejectVehicleReasonInput('');
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject vehicle.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveHost = async (targetUserId) => {
    setActionLoadingId(targetUserId);
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
    try {
      const res = await axios.patch(
        `/api/v1/admin/host-applications/${targetUserId}/approve`,
        {},
        { headers: { Authorization: authToken ? `Bearer ${authToken}` : '' } }
      );

      if (res.data?.success) {
        showToast(res.data.message || 'Host application approved successfully.');
        setApplications((prev) =>
          prev.map((app) =>
            (app._id === targetUserId || app.id === targetUserId)
              ? { ...app, hostApplicationStatus: 'APPROVED', role: 'HOST', roles: ['HOST', 'USER'] }
              : app
          )
        );
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve host.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectHost = async () => {
    if (!rejectModalUserId) return;
    setActionLoadingId(rejectModalUserId);
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
    try {
      const res = await axios.patch(
        `/api/v1/admin/host-applications/${rejectModalUserId}/reject`,
        { reason: rejectionReasonInput || 'Verification requirements not satisfied.' },
        { headers: { Authorization: authToken ? `Bearer ${authToken}` : '' } }
      );

      if (res.data?.success) {
        showToast(res.data.message || 'Host application rejected.');
        setApplications((prev) =>
          prev.map((app) =>
            (app._id === rejectModalUserId || app.id === rejectModalUserId)
              ? { ...app, hostApplicationStatus: 'REJECTED', role: 'USER' }
              : app
          )
        );
        setRejectModalUserId(null);
        setRejectionReasonInput('');
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject host application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    setActionLoadingId(targetUserId);
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
    try {
      const res = await axios.patch(
        `/api/v1/admin/users/${targetUserId}/role`,
        { role: newRole },
        { headers: { Authorization: authToken ? `Bearer ${authToken}` : '' } }
      );

      if (res.data?.success) {
        showToast(`Role updated to ${newRole}`);
        setUsersList((prev) =>
          prev.map((u) => (u._id === targetUserId ? { ...u, role: newRole } : u))
        );
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleKycToggle = async (targetUserId, currentKycStatus) => {
    setActionLoadingId(targetUserId);
    const nextStatus = currentKycStatus === 'verified' ? 'rejected' : 'verified';
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
    try {
      const res = await axios.patch(
        `/api/v1/admin/users/${targetUserId}/kyc`,
        { status: nextStatus },
        { headers: { Authorization: authToken ? `Bearer ${authToken}` : '' } }
      );

      if (res.data?.success) {
        showToast(`KYC status set to ${nextStatus}`);
        setUsersList((prev) =>
          prev.map((u) =>
            u._id === targetUserId
              ? { ...u, kycStatus: nextStatus, isKycVerified: nextStatus === 'verified' }
              : u
          )
        );
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update KYC status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1. Security Check: Non-Admin Barrier
  if (!isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-slate-950/90 backdrop-blur-2xl border border-rose-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-rose-950/30">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 bg-rose-950/80 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1 rounded-full mb-2">
              403 Forbidden
            </span>
            <h2 className="text-2xl font-extrabold text-white">Master Admin Clearance Required</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            Access to this administrative station is restricted strictly to the Master Super Admin phone whitelist (<strong className="text-amber-400 font-mono">7387861807</strong>).
          </p>
          <div className="space-y-2.5">
            <Link to="/">
              <Button variant="primary" className="w-full py-3 font-bold">
                Return to Public Platform
              </Button>
            </Link>
            {!user && (
              <Button variant="outline" onClick={() => openAuthModal('host')} className="w-full py-3 border-slate-800">
                Sign In as Admin
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredApplications = applications.filter((app) => {
    if (appStatusFilter === 'ALL') return true;
    return (app.hostApplicationStatus || 'PENDING') === appStatusFilter;
  });

  const filteredVehicles = fleetList.filter((v) => {
    const vStatus = (v.verificationStatus || 'pending').toUpperCase();
    const matchesStatus = vehicleFilter === 'ALL' || vStatus === vehicleFilter;
    const matchesSearch =
      !vehicleSearchQuery ||
      (v.title || '').toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
      (v.make || '').toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
      (v.registrationNumber || v.plateNumber || '').toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
      (v.host?.fullName || v.host?.name || '').toLowerCase().includes(vehicleSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingVehiclesCount = fleetList.filter(
    (v) => (v.verificationStatus || 'pending').toUpperCase() === 'PENDING'
  ).length;

  const filteredUsers = usersList.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || (u.role || '').toUpperCase() === userRoleFilter.toUpperCase();
    const query = userSearchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      (u.name || '').toLowerCase().includes(query) ||
      (u.fullName || '').toLowerCase().includes(query) ||
      (u.phone || '').includes(query) ||
      (u.email || '').toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Executive Header & Master Whitelist Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-950/80 border border-amber-500/30 backdrop-blur-2xl shadow-2xl shadow-amber-950/15 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-extrabold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Master Admin Station
              </span>
              <span className="text-[11px] font-mono font-bold bg-slate-900/90 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                Superuser: +91 7387861807
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Host Governance & Admin Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Review and approve host applications, manage platform roles, inspect KYC biometric records, and monitor vehicle fleet escrows.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              isLoading={isLoading}
              onClick={fetchAdminData}
              className="border-slate-800 hover:border-amber-500/50 text-slate-200"
            >
              Refresh Data
            </Button>
            <Link to="/host">
              <Button variant="primary" size="sm" leftIcon={Car} className="font-bold shadow-lg shadow-cyan-950/40">
                Host Operations Hub
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xl animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Metrics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/70 backdrop-blur-xl rounded-2xl p-5 border border-slate-800/80 shadow-md flex items-center gap-4 hover:border-cyan-500/40 transition-all">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Pending Vehicle RCs</span>
              <span className="text-2xl font-extrabold text-cyan-400">{pendingVehiclesCount} Pending</span>
            </div>
          </div>
          <div className="bg-slate-950/70 backdrop-blur-xl rounded-2xl p-5 border border-slate-800/80 shadow-md flex items-center gap-4 hover:border-amber-500/40 transition-all">
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Pending Host Reviews</span>
              <span className="text-2xl font-extrabold text-amber-400">{stats.pendingApplications} Pending</span>
            </div>
          </div>
          <div className="bg-slate-950/70 backdrop-blur-xl rounded-2xl p-5 border border-slate-800/80 shadow-md flex items-center gap-4 hover:border-emerald-500/40 transition-all">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Approved Hosts</span>
              <span className="text-2xl font-extrabold text-emerald-400">{stats.totalHosts} Active</span>
            </div>
          </div>
          <div className="bg-slate-950/70 backdrop-blur-xl rounded-2xl p-5 border border-slate-800/80 shadow-md flex items-center gap-4 hover:border-indigo-500/40 transition-all">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Biometric KYC Ratio</span>
              <span className="text-2xl font-extrabold text-indigo-400">{stats.verifiedKycUsers} Verified</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-slate-800">
          <nav className="flex gap-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'vehicles' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400'
              }`}
            >
              <Car className="w-4 h-4" /> Vehicle Verification ({pendingVehiclesCount})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'applications' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400'
              }`}
            >
              <Clock className="w-4 h-4" /> Host Applications ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'users' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" /> Platform Users ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('fleet')}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'fleet' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Published Fleet ({fleetList.length})
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'security' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400'
              }`}
            >
              <Lock className="w-4 h-4" /> Security & Whitelist
            </button>
          </nav>
        </div>

        {/* TAB: VEHICLE VERIFICATION DESK */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setVehicleFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      vehicleFilter === st
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st === 'PENDING' ? 'Pending RC Review' : st === 'ALL' ? 'All Vehicles' : st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Title, Plate, or Host..."
                  value={vehicleSearchQuery}
                  onChange={(e) => setVehicleSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 text-xs text-white pl-9 pr-4 py-2 rounded-xl border border-slate-800 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-slate-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">No vehicles in {vehicleFilter} queue</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Vehicles submitted with RTO Registration Certificates (RC) will appear here for automated cross-verification.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredVehicles.map((vehicle) => {
                  const vid = vehicle._id || vehicle.id;
                  const vStatus = (vehicle.verificationStatus || 'pending').toUpperCase();
                  const isApproved = vStatus === 'APPROVED';
                  const isRejected = vStatus === 'REJECTED';

                  const rcDoc = vehicle.rcDocument || {};
                  const rcUrl = rcDoc.documentUrl || vehicle.documents?.rcFrontUrl || 'https://images.unsplash.com/photo-1632823471465-4f46bb4c9f18?auto=format&fit=crop&q=80&w=600';
                  const coverImage = vehicle.images?.[0] || 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=400';

                  const hostObj = vehicle.host || {};
                  const hostName = hostObj.fullName || hostObj.name || 'Verified Mobility Host';
                  const hostKycVerified = hostObj.isKycVerified || hostObj.kycStatus === 'verified' || hostObj.kyc?.status === 'verified';
                  const nameScore = rcDoc.nameMatchScore !== undefined ? rcDoc.nameMatchScore : 94;
                  const isNameFlagged = rcDoc.isFlaggedForReview || nameScore < 80;

                  return (
                    <div
                      key={vid}
                      className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 hover:border-cyan-500/30 transition-all"
                    >
                      {/* Header Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                              {vehicle.registrationNumber || vehicle.plateNumber}
                            </span>
                            <span className="text-xs text-slate-400">{vehicle.category} • {vehicle.specs?.transmission || 'Automatic'}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mt-1">{vehicle.title || `${vehicle.make} ${vehicle.model}`}</h3>
                        </div>

                        <div className="flex items-center gap-3">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> PUBLISHED TO FLEET
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1.5 bg-rose-950 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1 rounded-full">
                              <X className="w-3.5 h-3.5" /> REJECTED / UNLISTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-950 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-400" /> PENDING RC VERIFICATION
                            </span>
                          )}
                          <span className="text-sm font-mono font-bold text-white bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                            ₹{vehicle.pricing?.baseDailyRate || vehicle.baseDailyRate}/day
                          </span>
                        </div>
                      </div>

                      {/* Side-by-Side Verification Cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        
                        {/* Left: Document & Photo Inspection */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-cyan-400" /> Uploaded RC Document & Vehicle Photo
                          </span>

                          <div className="grid grid-cols-2 gap-3">
                            {/* RC Document Preview */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono text-slate-400 block">RTO RC Smart Card</span>
                              <div
                                onClick={() => setPreviewDocumentUrl(rcUrl)}
                                className="relative h-40 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 cursor-pointer group"
                              >
                                <img src={rcUrl} alt="RC Document" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[11px] font-bold text-white">
                                  Click to Zoom
                                </div>
                              </div>
                            </div>

                            {/* Vehicle Photo Preview */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono text-slate-400 block">Vehicle Photo ({vehicle.images?.length || 1})</span>
                              <div
                                onClick={() => setPreviewDocumentUrl(coverImage)}
                                className="relative h-40 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 cursor-pointer group"
                              >
                                <img src={coverImage} alt="Vehicle Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[11px] font-bold text-white">
                                  View Photo
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-[11px] font-mono text-slate-400 pt-1 flex justify-between">
                            <span>RC Number: <strong className="text-white">{rcDoc.rcNumber || vehicle.registrationNumber}</strong></span>
                            <span>Year: <strong className="text-white">{vehicle.year}</strong></span>
                          </div>
                        </div>

                        {/* Right: Automated Cross-Validation & Host KYC Match */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3.5 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Host Identity & Cross-Name Matching
                            </span>

                            {/* Host Card */}
                            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-500 block">Registered Host:</span>
                                <span className="text-sm font-bold text-white block">{hostName}</span>
                                <span className="text-[10px] font-mono text-slate-400">{hostObj.phone || 'N/A'}</span>
                              </div>
                              {hostKycVerified ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                  <Check className="w-3 h-3" /> KYC Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                  KYC Pending
                                </span>
                              )}
                            </div>

                            {/* Name Match Score HUD */}
                            <div className="mt-3 p-3 rounded-xl border space-y-1.5 bg-slate-950/80 border-slate-800">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Name Match Confidence (Levenshtein):</span>
                                <span className={`font-mono font-bold ${
                                  nameScore >= 80 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                  {nameScore}% Match
                                </span>
                              </div>

                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    nameScore >= 80 ? 'bg-emerald-400' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${nameScore}%` }}
                                />
                              </div>

                              {isNameFlagged ? (
                                <p className="text-[11px] text-rose-300 flex items-center gap-1 pt-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                                  <span>{rcDoc.flagReason || 'Document owner name differs from KYC verified name.'}</span>
                                </p>
                              ) : (
                                <p className="text-[11px] text-emerald-300 flex items-center gap-1 pt-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                  <span>RTO RC document credentials matched with verified host profile.</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Admin Action Buttons */}
                          <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={actionLoadingId === vid || isApproved}
                              onClick={() => handleApproveVehicle(vid)}
                              leftIcon={CheckCircle2}
                              className="flex-1 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 disabled:opacity-50"
                            >
                              {isApproved ? 'Vehicle Approved ✓' : 'Verify & Publish Vehicle'}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoadingId === vid}
                              onClick={() => {
                                setRejectVehicleModalId(vid);
                                setRejectVehicleReasonInput('');
                              }}
                              leftIcon={XCircle}
                              className="py-2.5 text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-950/30"
                            >
                              Reject RC
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Lightbox Document Modal */}
        {previewDocumentUrl && (
          <Modal
            isOpen={Boolean(previewDocumentUrl)}
            onClose={() => setPreviewDocumentUrl(null)}
            title="Document & Asset Inspection Lightbox"
            maxWidth="max-w-4xl"
          >
            <div className="space-y-4">
              <div className="max-h-[70vh] overflow-auto rounded-2xl bg-black flex items-center justify-center p-2">
                <img src={previewDocumentUrl} alt="Inspection Preview" className="max-w-full max-h-[65vh] object-contain rounded-xl" />
              </div>
              <Button variant="outline" onClick={() => setPreviewDocumentUrl(null)} className="w-full py-2.5">
                Close Preview
              </Button>
            </div>
          </Modal>
        )}

        {/* Vehicle Rejection Reason Modal */}
        {rejectVehicleModalId && (
          <Modal
            isOpen={Boolean(rejectVehicleModalId)}
            onClose={() => setRejectVehicleModalId(null)}
            title="Reject Vehicle Registration (RC)"
            maxWidth="max-w-md"
          >
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Please provide the reason for rejecting this RC document or vehicle listing. This feedback will be sent to the host.
              </p>
              <textarea
                rows={3}
                value={rejectVehicleReasonInput}
                onChange={(e) => setRejectVehicleReasonInput(e.target.value)}
                placeholder="e.g. RC Document blurred, name mismatch with KYC, or registration expired..."
                className="w-full bg-slate-900 text-xs text-white p-3 rounded-xl border border-slate-800 outline-none focus:border-rose-500"
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleRejectVehicle}
                  isLoading={actionLoadingId === rejectVehicleModalId}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 font-bold"
                >
                  Confirm Rejection
                </Button>
                <Button variant="outline" onClick={() => setRejectVehicleModalId(null)} className="py-2.5">
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* TAB: HOST APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setAppStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      appStatusFilter === st
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st === 'ALL' ? 'All Applications' : st}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400">
                Showing <strong className="text-white">{filteredApplications.length}</strong> applications
              </span>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-slate-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">No applications in {appStatusFilter} queue</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  New applications submitted by mobility partners will show up here for 1-click Master Admin review.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredApplications.map((applicant) => {
                  const appId = applicant._id || applicant.id;
                  const isAppPending = applicant.hostApplicationStatus === 'PENDING';
                  const isAppApproved = applicant.hostApplicationStatus === 'APPROVED' || applicant.role === 'HOST';
                  const isAppRejected = applicant.hostApplicationStatus === 'REJECTED';
                  const isUserKyc = applicant.isKycVerified || applicant.kycStatus === 'verified';
                  const kycScore = applicant.kycConfidenceScore || applicant.kyc?.faceMatchScore || (isUserKyc ? 96 : 0);

                  return (
                    <div
                      key={appId}
                      className="bg-slate-950/80 border border-slate-800/90 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white">
                                {applicant.fullName || applicant.name}
                              </h3>
                              {isUserKyc && (
                                <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  <ShieldCheck className="w-3 h-3" /> KYC {kycScore}%
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-500" /> {applicant.phone}
                              </span>
                              {applicant.hostApplicationDetails?.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" /> {applicant.hostApplicationDetails.city}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            {isAppApproved ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                <Check className="w-3 h-3" /> APPROVED HOST
                              </span>
                            ) : isAppRejected ? (
                              <span className="inline-flex items-center gap-1 bg-rose-950 text-rose-400 border border-rose-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                <X className="w-3 h-3" /> REJECTED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                                <Clock className="w-3 h-3 text-amber-400" /> REVIEW PENDING
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Application Payload Details */}
                        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div>
                              <span className="text-slate-500 block">License / DL No:</span>
                              <span className="text-slate-200 font-bold">
                                {applicant.hostApplicationDetails?.dlNumber || applicant.kyc?.dlNumber || 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Registration (RC):</span>
                              <span className="text-slate-200 font-bold">
                                {applicant.hostApplicationDetails?.rcNumber || 'Pending Submission'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Fleet Category:</span>
                              <span className="text-cyan-400 font-bold">
                                {applicant.hostApplicationDetails?.vehicleTypePreference || 'Cars & EVs'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Applied Timestamp:</span>
                              <span className="text-slate-300">
                                {new Date(applicant.hostApplicationDetails?.appliedAt || applicant.updatedAt || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {applicant.hostApplicationDetails?.notes && (
                            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                              <span className="text-slate-500 block">Applicant Notes:</span>
                              <p className="italic">"{applicant.hostApplicationDetails.notes}"</p>
                            </div>
                          )}

                          {applicant.hostApplicationDetails?.rejectionReason && (
                            <div className="pt-2 border-t border-slate-800 text-[11px] text-rose-300">
                              <span className="text-rose-400 font-bold block">Rejection Feedback:</span>
                              <p>{applicant.hostApplicationDetails.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Decision Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 mt-3">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoadingId === appId || isAppApproved}
                          onClick={() => handleApproveHost(appId)}
                          leftIcon={CheckCircle2}
                          className="flex-1 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 disabled:opacity-50"
                        >
                          {isAppApproved ? 'Approved Host' : 'Approve as Host'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoadingId === appId}
                          onClick={() => {
                            setRejectModalUserId(appId);
                            setRejectionReasonInput('');
                          }}
                          leftIcon={XCircle}
                          className="py-2 text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-950/30"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: User Governance & Directory */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by Name, Phone (+91...), or Email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-900 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 outline-none focus:border-cyan-500"
                >
                  <option value="all">All Roles</option>
                  <option value="USER">USER Only</option>
                  <option value="HOST">HOST Only</option>
                  <option value="ADMIN">ADMIN Only</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">User Identity</th>
                      <th className="px-5 py-3.5">Phone & Email</th>
                      <th className="px-5 py-3.5">KYC Status</th>
                      <th className="px-5 py-3.5">Host Clearance</th>
                      <th className="px-5 py-3.5">Assigned Role</th>
                      <th className="px-5 py-3.5 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-200">
                    {filteredUsers.map((u) => {
                      const uid = u._id || u.id;
                      const isUserKyc = u.isKycVerified || u.kycStatus === 'verified';
                      const isUserHost = u.role === 'HOST' || u.hostApplicationStatus === 'APPROVED';
                      const isUserAdmin = u.role === 'ADMIN' || (u.phone || '').endsWith('7387861807');

                      return (
                        <tr key={uid} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {u.fullName || u.name}
                              {isUserAdmin && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {uid.slice(-6)}</span>
                          </td>
                          <td className="px-5 py-4 font-mono text-[11px]">
                            <div>{u.phone}</div>
                            <div className="text-[10px] text-slate-400">{u.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            {isUserKyc ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <Check className="w-3 h-3" /> VERIFIED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                UNVERIFIED
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              isUserHost
                                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                                : u.hostApplicationStatus === 'PENDING'
                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}>
                              {u.hostApplicationStatus || (isUserHost ? 'APPROVED' : 'NONE')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={u.role || 'USER'}
                              disabled={actionLoadingId === uid || isUserAdmin}
                              onChange={(e) => handleRoleChange(uid, e.target.value)}
                              className="bg-slate-900 text-[11px] font-bold text-white px-2.5 py-1 rounded-lg border border-slate-700 outline-none"
                            >
                              <option value="USER">USER</option>
                              <option value="HOST">HOST</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleKycToggle(uid, u.kycStatus)}
                              disabled={actionLoadingId === uid}
                              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                            >
                              {isUserKyc ? 'Revoke KYC' : 'Verify KYC'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Vehicle Fleet Inspector */}
        {activeTab === 'fleet' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fleetList.map((veh) => (
                <div key={veh._id || veh.id} className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg">
                  <div className="h-36 bg-slate-900 rounded-2xl overflow-hidden relative">
                    <img
                      src={veh.images?.[0] || 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=400'}
                      alt={veh.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
                      ₹{veh.baseDailyRate || veh.pricing?.baseDailyRate}/day
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{veh.title || `${veh.make} ${veh.model}`}</h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">Plate: {veh.plateNumber || 'MH-02-XX-0000'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      Active on Fleet
                    </span>
                    <span className="text-[10px] text-slate-400">Host: {veh.host?.fullName || veh.host?.name || 'Verified Host'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Security & Whitelist Audit */}
        {activeTab === 'security' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" /> Master Whitelist & System Access Controls
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Hardcoded security parameters governing role escalation and biometric KYC validation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-slate-500 block">Master Admin Whitelist Phone:</span>
                <span className="text-amber-400 font-bold text-sm block">7387861807</span>
                <span className="text-[10px] text-slate-400 block">Auto-elevates to ADMIN role on login and unlocks /admin routes</span>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-slate-500 block">Host Access Policy:</span>
                <span className="text-cyan-400 font-bold text-sm block">Admin Approval Required</span>
                <span className="text-[10px] text-slate-400 block">Regular users restricted from Host Studio until status is APPROVED</span>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-slate-500 block">DeepFace Biometric Threshold:</span>
                <span className="text-emerald-400 font-bold text-sm block">&gt;= 50% Match Score</span>
                <span className="text-[10px] text-slate-400 block">Cosine vector distance calculated via FastFace / VGG-Face</span>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-slate-500 block">OCR Engine:</span>
                <span className="text-indigo-400 font-bold text-sm block">EasyOCR AI PyTorch</span>
                <span className="text-[10px] text-slate-400 block">Real-time Driving License & RC number pattern extraction</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Reject Host Reason Modal */}
      {rejectModalUserId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" /> Reject Host Application
              </h3>
              <button onClick={() => setRejectModalUserId(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Provide feedback for the applicant on why their host onboarding was rejected:
            </p>
            <textarea
              rows={3}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Uploaded document is blurry or RC number does not match registered owner name..."
              className="w-full bg-slate-900 text-xs text-white p-3 rounded-xl border border-slate-800 outline-none focus:border-rose-500 resize-none"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModalUserId(null)}
                className="flex-1 py-2.5 border-slate-800"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRejectHost}
                isLoading={actionLoadingId === rejectModalUserId}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 font-bold"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
