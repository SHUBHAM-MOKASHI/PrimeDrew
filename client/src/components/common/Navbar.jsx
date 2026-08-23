import React from 'react';
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
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, activeRole, kycStatus, logout, toggleActiveRole, openAuthModal } = useAuth();

  const categories = [
    { name: 'All Vehicles', icon: SlidersHorizontal, path: '/vehicles' },
    { name: 'Cars', icon: Car, path: '/vehicles?category=Sedan' },
    { name: 'SUVs', icon: Car, path: '/vehicles?category=SUV' },
    { name: 'EVs', icon: Zap, path: '/vehicles?category=EV' },
    { name: 'Bikes', icon: Bike, path: '/vehicles?category=Bike' }
  ];

  const getKycBadge = () => {
    switch (kycStatus) {
      case 'verified':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Verified Host/Renter
          </span>
        );
      case 'pending':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            KYC Pending
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            Unverified
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
                PrimeDrew
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-600 -mt-1">
                P2P Mobility
              </span>
            </div>
          </Link>

          {/* Category Shortcuts Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/50">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = location.pathname + location.search === cat.path;
              return (
                <Link
                  key={cat.name}
                  to={cat.path}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.name}
                </Link>
              );
            })}
          </nav>

          {/* User Controls & Actions */}
          <div className="flex items-center gap-3">
            {/* AI Inspection Scanner Shortcut */}
            <Link to="/inspections">
              <Button variant="ghost" size="sm" leftIcon={Sparkles} className="hidden sm:inline-flex text-indigo-600 hover:bg-indigo-50">
                AI Scanner
              </Button>
            </Link>

            {/* Role Badge Toggle */}
            <button
              onClick={toggleActiveRole}
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Toggle Renter vs Host Mode"
            >
              <Repeat className="w-3.5 h-3.5 text-indigo-600" />
              <span>{activeRole === 'host' ? 'Host Portal' : 'Renter Mode'}</span>
            </button>

            {/* List Your Vehicle CTA */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => {
                if (!isLoggedIn) {
                  openAuthModal('host');
                } else {
                  navigate('/host');
                }
              }}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              List Vehicle
            </Button>

            {/* User Profile / Auth State */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-900">{user?.name}</span>
                  {getKycBadge()}
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button variant="primary" size="sm" leftIcon={User} onClick={() => openAuthModal('renter')}>
                Sign In
              </Button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
