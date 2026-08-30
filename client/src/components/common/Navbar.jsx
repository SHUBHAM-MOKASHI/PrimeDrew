'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Car,
  Zap,
  Bike,
  ShieldCheck,
  User,
  LogOut,
  PlusCircle,
  Repeat,
  Sparkles,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  Edit2,
  Check,
  ShieldAlert,
  Crown,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import axios from 'axios';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    token,
    isLoggedIn,
    activeRole,
    kycStatus,
    isAdmin,
    isMasterAdmin,
    isHostApproved,
    isHostPending,
    isHostRejected,
    logout,
    updateUser,
    toggleActiveRole,
    openAuthModal,
    openKycModal,
    openHostModal
  } = useAuth();
  
  const [showVerifiedToast, setShowVerifiedToast] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const toastTimeoutRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const navLinks = [
    { name: 'Vehicles', icon: Car, path: '/vehicles' },
    { name: 'AI Damage Studio', icon: Sparkles, path: '/inspections' },
    ...(isAdmin ? [{ name: 'Master Admin', icon: ShieldCheck, path: '/admin', badge: 'SUPER' }] : []),
    ...(isHostApproved ? [{ name: 'Host Studio', icon: SlidersHorizontal, path: '/host' }] : [])
  ];

  const isVerified = user?.kycStatus === 'verified' || kycStatus === 'verified' || user?.isKycVerified || isAdmin;

  const effectiveName =
    (user?.fullName && !user.fullName.startsWith('User ') ? user.fullName : null) ||
    (user?.name && !user.name.startsWith('User ') ? user.name : null) ||
    user?.kycDetails?.extractedData?.name ||
    user?.fullName ||
    user?.name ||
    (user?.phone ? `User ${user.phone.slice(-4)}` : 'Mobility Partner');

  const displayFirstName = effectiveName.startsWith('User ')
    ? (user?.phone ? user.phone.slice(-4) : 'User')
    : effectiveName.split(' ')[0];

  useEffect(() => {
    if (user?.name) {
      setCustomNameInput(user.name);
    }
  }, [user]);

  const handleSaveName = async () => {
    if (!customNameInput.trim()) return;
    const trimmed = customNameInput.trim();
    
    // Optimistic UI update
    updateUser({ name: trimmed, fullName: trimmed });
    setIsEditingName(false);

    try {
      const RAW_API_URL =
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
          ? 'https://primedrew-api.onrender.com'
          : '');
      const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
      const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
      await axios.patch(
        `${API_BASE_URL}/api/v1/users/kyc-status`,
        { name: trimmed, fullName: trimmed },
        { headers: { Authorization: authToken ? `Bearer ${authToken}` : '' } }
      ).catch(() => null);
    } catch (e) {
      console.warn('Failed to update name on backend:', e);
    }
  };

  const handleBadgeClick = (e) => {
    e.stopPropagation();
    if (isVerified) {
      setShowVerifiedToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setShowVerifiedToast(false);
      }, 3500);
    } else {
      openKycModal();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
        setIsEditingName(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const getKycBadge = () => {
    if (isAdmin) {
      return (
        <span
          className="bg-amber-950/80 text-amber-300 border border-amber-500/50 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] backdrop-blur-md"
          title="Master Admin Superuser clearance"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Super Admin</span>
        </span>
      );
    }

    if (isVerified) {
      return (
        <button
          type="button"
          onClick={handleBadgeClick}
          className="bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 cursor-pointer hover:bg-emerald-900/80 transition-all shadow-xs backdrop-blur-md"
          title="Verified Account - Click to view status"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>✓ Verified {displayFirstName}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleBadgeClick}
        className="bg-amber-950/70 text-amber-400 border border-amber-500/40 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 cursor-pointer hover:bg-amber-900/80 transition-all shadow-xs animate-pulse backdrop-blur-md"
        title="KYC Pending - Click to verify ID in 60s"
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        <span>! KYC Pending</span>
      </button>
    );
  };

  return (
    <header className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6 w-full">
      <div className="mx-auto max-w-7xl px-6 py-3 rounded-2xl bg-slate-950/80 backdrop-blur-2xl border border-slate-800/80 shadow-2xl shadow-black/80 flex items-center justify-between gap-4 transition-all">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Car className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              PrimeDrew
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              .AI
            </span>
          </div>
        </Link>

        {/* Center Nav Links - Glass Pill Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-700 font-bold text-cyan-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.name}
                {item.badge && (
                  <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded ml-0.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-2.5 relative">
          
          {/* Action CTAs based on Role & Host Approval */}
          {isAdmin ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={ShieldCheck}
              onClick={() => navigate('/admin')}
              className="hidden sm:inline-flex bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-extrabold shadow-lg shadow-amber-950/40 border-0"
            >
              Master Admin
            </Button>
          ) : isHostApproved ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => navigate('/host')}
              className="hidden sm:inline-flex border-slate-800 hover:border-cyan-500 hover:bg-cyan-950/30 text-slate-200"
            >
              List Vehicle
            </Button>
          ) : isLoggedIn ? (
            isHostPending ? (
              <button
                type="button"
                onClick={() => navigate('/host')}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/40 transition-colors"
                title="Host Application under review by Master Admin"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Host Reviewing</span>
              </button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                leftIcon={Sparkles}
                onClick={openHostModal}
                className="hidden sm:inline-flex border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/50 text-cyan-300 font-bold"
              >
                Become a Host
              </Button>
            )
          ) : (
            <Button
              variant="outline"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => openAuthModal('host')}
              className="hidden sm:inline-flex border-slate-800 hover:border-cyan-500 hover:bg-cyan-950/30 text-slate-200"
            >
              Become a Host
            </Button>
          )}

          {/* User Auth State */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2.5 relative" ref={profileDropdownRef}>
              
              {/* KYC Badge */}
              <div className="hidden sm:block">
                {getKycBadge()}
              </div>

              {/* Profile Avatar Trigger */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl border transition-all cursor-pointer text-slate-200 ${
                  isAdmin ? 'bg-slate-900 border-amber-500/40 hover:border-amber-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg text-white font-bold text-xs flex items-center justify-center ${
                  isAdmin ? 'bg-gradient-to-tr from-amber-500 to-indigo-600' : 'bg-gradient-to-tr from-cyan-500 to-blue-600'
                }`}>
                  {effectiveName[0].toUpperCase()}
                </div>
                <span className="text-xs font-bold hidden lg:inline max-w-[120px] truncate">
                  {effectiveName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Sleek Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-800/90 p-2.5 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-200">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-2">
                    {isEditingName ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="text"
                          value={customNameInput}
                          onChange={(e) => setCustomNameInput(e.target.value)}
                          placeholder="Your Name"
                          className="w-full text-xs font-bold bg-slate-900 border border-cyan-500/50 rounded-lg px-2 py-1 text-white outline-none focus:ring-1 focus:ring-cyan-500"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        />
                        <button
                          onClick={handleSaveName}
                          className="p-1 rounded-md bg-cyan-500 text-black hover:bg-cyan-400 cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <p className="text-xs font-bold text-white truncate max-w-[170px]">{effectiveName}</p>
                        <button
                          onClick={() => {
                            setCustomNameInput(effectiveName.startsWith('User ') ? '' : effectiveName);
                            setIsEditingName(true);
                          }}
                          className="text-slate-500 hover:text-cyan-400 p-0.5 cursor-pointer"
                          title="Edit Name"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{user?.phone || user?.email}</p>
                    <div className="mt-2 sm:hidden">{getKycBadge()}</div>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-400 hover:bg-amber-950/30 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Master Admin Station
                    </Link>
                  )}

                  <Link
                    to="/vehicles"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                  >
                    <Car className="w-3.5 h-3.5 text-cyan-400" />
                    Browse Fleet
                  </Link>

                  <Link
                    to="/inspections"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    AI Damage Studio
                  </Link>

                  {isHostApproved ? (
                    <>
                      <Link
                        to="/host"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                        Host Fleet Hub
                      </Link>

                      <button
                        onClick={() => {
                          toggleActiveRole();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                          Switch to {activeRole === 'host' ? 'Renter Mode' : 'Host Portal'}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400 uppercase border border-slate-800">
                          {activeRole}
                        </span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        openHostModal();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-cyan-400 hover:bg-cyan-950/30 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Apply for Host Verification
                    </button>
                  )}

                  <div className="border-t border-slate-800 my-1.5" />

                  <button
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}

              {/* Verified Identity Toast Popover */}
              {showVerifiedToast && (
                <div className="absolute right-0 top-12 z-50 w-72 bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-500/40 p-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-emerald-950 text-emerald-400 rounded-full shrink-0 border border-emerald-500/30">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-white block">Biometric ID Verified</span>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Your EasyOCR & DeepFace biometric record is active for {effectiveName}. Keyless instant bookings enabled.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowVerifiedToast(false)}
                      className="text-slate-400 hover:text-white p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={User}
              onClick={() => openAuthModal('renter')}
              className="px-4 py-2 font-bold"
            >
              Sign In
            </Button>
          )}

        </div>

      </div>
    </header>
  );
};

export default Navbar;
