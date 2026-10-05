'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  Wand2,
  LayoutGrid,
  ShieldCheck,
  User,
  LogOut,
  PlusCircle,
  Repeat,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  Edit2,
  Check,
  Crown,
  Clock,
  Menu,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export function NotchNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    token,
    isLoggedIn,
    activeRole,
    kycStatus,
    isAdmin,
    isHostApproved,
    isHostPending,
    logout,
    updateUser,
    toggleActiveRole,
    openAuthModal,
    openKycModal,
    openHostModal
  } = useAuth();

  const [showVerifiedToast, setShowVerifiedToast] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const toastTimeoutRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const isVerified = user?.kycStatus === 'verified' || kycStatus === 'verified' || user?.isKycVerified || isAdmin;

  const isUserAdmin = isAdmin || user?.role === 'admin' || user?.role === 'ADMIN' || user?.role === 'superadmin' || user?.roles?.some(r => (typeof r === 'string' ? r.toUpperCase() : '') === 'ADMIN');

  const displayName = isUserAdmin
    ? "Shubham"
    : ((user?.fullName && !user.fullName.startsWith('User ') ? user.fullName : null) ||
       (user?.name && !user.name.startsWith('User ') ? user.name : null) ||
       user?.kycDetails?.extractedData?.name ||
       (user?.phone ? `User ${user.phone.slice(-4)}` : 'User'));

  const displayFirstName = displayName.startsWith('User ')
    ? (user?.phone ? user.phone.slice(-4) : 'User')
    : displayName.split(' ')[0];

  useEffect(() => {
    if (user?.name) {
      setCustomNameInput(user.name);
    }
  }, [user]);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleSaveName = async () => {
    if (!customNameInput.trim()) return;
    const trimmed = customNameInput.trim();

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

  const handleListVehicleClick = () => {
    if (isAdmin) {
      navigate('/admin');
    } else if (isHostApproved) {
      navigate('/host/list-vehicle');
    } else if (isLoggedIn) {
      if (isHostPending) {
        navigate('/host');
      } else {
        openHostModal();
      }
    } else {
      openAuthModal('host');
    }
  };

  const getKycBadge = () => {
    if (isAdmin) {
      return (
        <span
          className="bg-amber-950/80 text-amber-300 border border-amber-500/50 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] backdrop-blur-md whitespace-nowrap shrink-0"
          title="Master Admin Superuser clearance"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          <span>Super Admin</span>
        </span>
      );
    }

    if (isVerified) {
      return (
        <button
          type="button"
          onClick={handleBadgeClick}
          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 cursor-pointer hover:bg-emerald-950/60 transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)] backdrop-blur-md whitespace-nowrap shrink-0"
          title="Verified Account - Click to view status"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>✓ Verified {displayFirstName}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleBadgeClick}
        className="bg-amber-500/10 text-amber-400 border border-amber-500/40 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 cursor-pointer hover:bg-amber-950/60 transition-all shadow-[0_0_10px_rgba(245,158,11,0.15)] animate-pulse backdrop-blur-md whitespace-nowrap shrink-0"
        title="KYC Pending - Click to verify ID in 60s"
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>! KYC Pending</span>
      </button>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full select-none">
      <div className="relative w-full flex items-start justify-center">
        
        {/* LEFT WING (Desktop) */}
        <div className="hidden lg:flex w-12 md:w-20 lg:w-28 shrink-0 h-[40px] bg-[#080b14]/90 backdrop-blur-md border-b border-sky-500/10 items-center justify-start pl-3 lg:pl-6 pr-2 gap-3 text-[11px] text-slate-400 font-mono z-10 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-semibold tracking-wider uppercase text-[10px] hidden xl:inline">AI Fleet Online</span>
          </div>
        </div>

        {/* LEFT NOTCH CURVE SVG */}
        <div className="hidden lg:block shrink-0 pointer-events-none z-10">
          <svg
            viewBox="0 0 50 64"
            className="w-[50px] h-[64px] block text-[#080b14]/90 fill-current drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            preserveAspectRatio="none"
          >
            <path d="M0 0 H50 V64 C25 64 25 40 0 40 Z" />
            <path
              d="M0 40 C25 40 25 64 50 64"
              fill="none"
              stroke="rgba(56, 189, 248, 0.2)"
              strokeWidth="1.2"
            />
          </svg>
        </div>

        {/* CENTER NOTCH SLICE */}
        <div className="relative flex-1 min-w-0 max-w-7xl mx-auto w-full h-[64px] bg-[#080b14]/90 backdrop-blur-md border-b border-sky-500/10 px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 md:gap-3 shadow-2xl shadow-cyan-950/20 overflow-visible z-20">
          
          {/* Futuristic Horizontal Accent Lines */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/35 to-transparent pointer-events-none" />

          {/* LEFT NAV: Brand + Navigation Items */}
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4 shrink-0 z-30 relative">
            {/* PrimeDrew Brand Logo */}
            <Link to="/" className="flex items-center gap-2 md:gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                <Car className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  PrimeDrew
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  .AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-1">
              <Link
                to="/vehicles"
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  location.pathname === '/vehicles'
                    ? 'bg-slate-800/90 text-cyan-400 font-bold border border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vehicles</span>
              </Link>

              <Link
                to="/damage-studio"
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  location.pathname === '/damage-studio' || location.pathname === '/inspections'
                    ? 'bg-slate-800/90 text-cyan-400 font-bold border border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Damage Studio</span>
              </Link>

              <Link
                to="/host"
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  location.pathname === '/host'
                    ? 'bg-slate-800/90 text-cyan-400 font-bold border border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span>Host Studio</span>
              </Link>
            </nav>
          </div>

          {/* RIGHT NAV: List Vehicle, KYC Badge, User Profile, Mobile Toggle */}
          <div className="flex items-center gap-2 md:gap-2.5 shrink-0 z-30 relative pr-2 md:pr-4">
            {/* + List Vehicle Button */}
            <button
              type="button"
              onClick={handleListVehicleClick}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/20 text-cyan-300 transition-all shadow-[0_0_12px_rgba(56,189,248,0.15)] cursor-pointer whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ List Vehicle</span>
            </button>

            {/* KYC Status Badge */}
            {isLoggedIn && (
              <div className="hidden sm:block shrink-0">
                {getKycBadge()}
              </div>
            )}

            {/* User Profile Dropdown */}
            {isLoggedIn ? (
              <div className="relative shrink-0" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center gap-1.5 md:gap-2 p-1 pl-1.5 pr-2 md:p-1.5 md:pl-2 md:pr-2.5 rounded-xl border transition-all cursor-pointer text-slate-200 whitespace-nowrap shrink-0 ${
                    isAdmin
                      ? 'bg-slate-900 border-amber-500/40 hover:border-amber-500'
                      : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                    isAdmin ? 'bg-gradient-to-tr from-amber-500 to-indigo-600' : 'bg-gradient-to-tr from-cyan-500 to-blue-600'
                  }`}>
                    {isAdmin ? 'U' : (displayName[0]?.toUpperCase() || 'U')}
                  </div>
                  <span className="text-xs font-bold hidden sm:inline truncate max-w-[140px] md:max-w-none">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
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
                          <p className="text-xs font-bold text-white truncate max-w-[170px]">{displayName}</p>
                          <button
                            onClick={() => {
                              setCustomNameInput(displayName.startsWith('User ') ? '' : displayName);
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
                      to="/damage-studio"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
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
                          Your EasyOCR & DeepFace biometric record is active for {displayName}. Keyless instant bookings enabled.
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
              <button
                type="button"
                onClick={() => openAuthModal('renter')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* RIGHT NOTCH CURVE SVG */}
        <div className="hidden lg:block shrink-0 pointer-events-none z-10">
          <svg
            viewBox="0 0 50 64"
            className="w-[50px] h-[64px] block text-[#080b14]/90 fill-current drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            preserveAspectRatio="none"
          >
            <path d="M0 0 H50 V40 C25 40 25 64 0 64 Z" />
            <path
              d="M0 64 C25 64 25 40 50 40"
              fill="none"
              stroke="rgba(56, 189, 248, 0.2)"
              strokeWidth="1.2"
            />
          </svg>
        </div>

        {/* RIGHT WING (Desktop) */}
        <div className="hidden lg:flex w-12 md:w-20 lg:w-28 shrink-0 h-[40px] bg-[#080b14]/90 backdrop-blur-md border-b border-sky-500/10 items-center justify-end pr-3 lg:pr-6 pl-2 gap-3 text-[11px] text-slate-400 font-mono z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 text-slate-300 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="hidden xl:inline">Mumbai 24/7</span>
          </div>
        </div>

      </div>

      {/* MOBILE DRAWER (Framer-Motion Animated Dropdown) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="md:hidden w-full bg-[#080b14]/98 backdrop-blur-3xl border-b border-sky-500/20 px-6 py-5 shadow-2xl flex flex-col gap-3 overflow-hidden text-slate-200"
          >
            <Link
              to="/vehicles"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              <Car className="w-4 h-4 text-cyan-400" />
              <span>Vehicles</span>
            </Link>

            <Link
              to="/damage-studio"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              <Wand2 className="w-4 h-4 text-cyan-400" />
              <span>AI Damage Studio</span>
            </Link>

            <Link
              to="/host"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <span>Host Studio</span>
            </Link>

            <div className="border-t border-slate-800/80 my-1" />

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleListVehicleClick();
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>+ List Vehicle</span>
            </button>

            {isLoggedIn ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-slate-400">KYC Status:</span>
                  {getKycBadge()}
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {effectiveName[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[160px]">{effectiveName}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  openAuthModal('renter');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-cyan-500/25 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default NotchNavbar;
