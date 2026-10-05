'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Car } from 'lucide-react';
import HeroSearchBar from '../components/discovery/HeroSearchBar';
import FilterBar from '../components/discovery/FilterBar';
import VehicleCard from '../components/discovery/VehicleCard';
import BookingCheckoutDrawer from '../components/booking/BookingCheckoutDrawer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Button from '../components/common/Button';
import { getVehicles } from '../services/vehicleService';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export const VehicleDiscovery = () => {
  const { user, token, kycStatus, openAuthModal, openKycModal } = useAuth();
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    transmission: 'All',
    fuelType: 'All',
    seats: 'Any',
    evOnly: searchParams.get('category') === 'EV',
    verifiedOnly: false,
    priceRange: 10000,
    location: searchParams.get('location') || 'Mumbai, MH',
    pickupDate: searchParams.get('pickupDate') || '',
    dropoffDate: searchParams.get('dropoffDate') || ''
  });

  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlLocation = searchParams.get('location');
    const urlPickup = searchParams.get('pickupDate');
    const urlDropoff = searchParams.get('dropoffDate');

    if (urlCategory !== null || urlLocation !== null || urlPickup !== null || urlDropoff !== null) {
      setFilters((prev) => ({
        ...prev,
        category: urlCategory ?? prev.category,
        location: urlLocation ?? prev.location,
        pickupDate: urlPickup ?? prev.pickupDate,
        dropoffDate: urlDropoff ?? prev.dropoffDate,
        evOnly: urlCategory === 'EV' ? true : prev.evOnly
      }));
    }
  }, [searchParams]);

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const RAW_API_URL =
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
          ? 'https://primedrew-api.onrender.com'
          : '');
      const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

      const params = {};
      if (filters.category && filters.category !== 'All') params.category = filters.category;
      if (filters.transmission && filters.transmission !== 'All') params.transmission = filters.transmission;
      if (filters.fuelType && filters.fuelType !== 'All') params.fuelType = filters.fuelType;
      if (filters.seats && filters.seats !== 'Any') params.seats = filters.seats;

      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/api/vehicles`, { params });
      } catch {
        response = await getVehicles(params);
      }

      const liveData = response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
      setVehicles(Array.isArray(liveData) ? liveData : []);
    } catch (err) {
      console.error('[Vehicles] Failed to fetch live vehicles from database:', err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, [filters.category, filters.transmission, filters.fuelType, filters.seats]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      transmission: 'All',
      fuelType: 'All',
      seats: 'Any',
      evOnly: false,
      verifiedOnly: false,
      priceRange: 10000,
      location: 'Mumbai, MH',
      pickupDate: '',
      dropoffDate: ''
    });
  };

  const handleQuickBook = (v) => {
    // Case A: User is NOT logged in -> Open standard Login / Auth modal
    if (!token || !user) {
      openAuthModal('renter');
      return;
    }

    // Case B: User is LOGGED IN but KYC is NOT verified -> Open Biometric KYC Verification Modal directly
    const isVerified = user?.isKycVerified || user?.kycStatus === 'verified' || kycStatus === 'verified';
    if (!isVerified) {
      openKycModal();
      return;
    }

    // Case C: User is LOGGED IN and KYC is VERIFIED -> Open Direct Booking / Checkout modal
    setSelectedVehicle(v);
    setIsCheckoutOpen(true);
  };

  const filteredList = vehicles.filter((v) => {
    if (filters.category && filters.category !== 'All') {
      const cat = (v.category || '').toLowerCase();
      const targetCat = filters.category.toLowerCase();
      if (!cat.includes(targetCat) && targetCat !== cat) return false;
    }
    if (filters.evOnly) {
      const isEv =
        (v.category || '').toUpperCase() === 'EV' ||
        (v.fuelType || '').toUpperCase() === 'EV' ||
        (v.specs?.fuelType || '').toUpperCase() === 'EV';
      if (!isEv) return false;
    }
    if (filters.transmission !== 'All') {
      const trans = (v.transmission || v.specs?.transmission || '').toLowerCase();
      if (trans !== filters.transmission.toLowerCase()) return false;
    }
    if (filters.fuelType !== 'All') {
      const fuel = (v.fuelType || v.specs?.fuelType || '').toLowerCase();
      if (fuel !== filters.fuelType.toLowerCase()) return false;
    }
    if (filters.seats !== 'Any') {
      const requiredSeats = parseInt(filters.seats, 10);
      const vehicleSeats = Number(v.seats || v.specs?.seats || 0);
      if (vehicleSeats && vehicleSeats < requiredSeats) return false;
    }
    if (filters.priceRange) {
      const daily = Number(v.pricing?.baseDailyRate || v.baseDailyRate || v.dailyRate || 0);
      if (daily && daily > filters.priceRange) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#080d1a] to-[#020617] text-slate-100 py-6 space-y-6">
      
      {/* Sticky/Floating Hero Search Bar */}
      <div className="px-4 sm:px-6">
        <HeroSearchBar
          onSearch={(queryParams) => {
            setFilters((prev) => ({ ...prev, ...queryParams }));
          }}
          initialParams={filters}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Catalog Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Vehicles <span className="text-xs font-normal text-cyan-400 font-mono">({filteredList.length} Found)</span>
          </h2>
        </div>

        <ErrorBoundary>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-slate-900/80 rounded-3xl border border-slate-800 shadow-xl animate-pulse p-4 flex flex-col justify-between">
                  <div className="h-44 bg-slate-950 rounded-2xl" />
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            /* Sleek Dark-themed Zero State when no vehicles exist in MongoDB */
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl shadow-black space-y-6 backdrop-blur-xl">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center">
                <Car className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">No vehicles listed yet</h3>
                <p className="text-sm text-slate-400">
                  Be the first to list a car on PrimeDrew!
                </p>
              </div>
              <div>
                <Link to="/host/list-vehicle">
                  <Button variant="primary" className="py-3 px-6 text-sm font-bold shadow-lg shadow-cyan-950/50">
                    + List Vehicle
                  </Button>
                </Link>
              </div>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-slate-900/80 rounded-3xl p-12 text-center border border-slate-800 shadow-2xl shadow-black space-y-3">
              <h3 className="text-lg font-bold text-white">No vehicles match your active filters</h3>
              <p className="text-xs text-slate-400">Try adjusting your category, transmission, or fuel query.</p>
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredList.map((vehicle) => (
                <VehicleCard
                  key={vehicle._id || vehicle.id}
                  vehicle={vehicle}
                  onQuickBook={handleQuickBook}
                />
              ))}
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* Booking Checkout Drawer */}
      <ErrorBoundary>
        {selectedVehicle && (
          <BookingCheckoutDrawer
            isOpen={isCheckoutOpen}
            onClose={() => {
              setIsCheckoutOpen(false);
              setSelectedVehicle(null);
            }}
            vehicle={selectedVehicle}
          />
        )}
      </ErrorBoundary>
    </div>
  );
};

export default VehicleDiscovery;
