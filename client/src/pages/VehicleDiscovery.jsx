import React, { useState, useEffect } from 'react';
import HeroSearchBar from '../components/discovery/HeroSearchBar';
import FilterBar from '../components/discovery/FilterBar';
import VehicleCard from '../components/discovery/VehicleCard';
import BookingCheckoutDrawer from '../components/booking/BookingCheckoutDrawer';
import { getVehicles } from '../services/vehicleService';

export const VehicleDiscovery = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: '',
    transmission: 'All',
    fuelType: 'All',
    seats: 'Any',
    evOnly: false,
    verifiedOnly: false,
    priceRange: 10000,
    location: 'Mumbai, MH'
  });

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category && filters.category !== 'All') params.category = filters.category;
      if (filters.transmission && filters.transmission !== 'All') params.transmission = filters.transmission;
      if (filters.fuelType && filters.fuelType !== 'All') params.fuelType = filters.fuelType;

      const response = await getVehicles(params);
      if (response.data && response.data.length > 0) {
        setVehicles(response.data);
      } else {
        useFallbackFleet();
      }
    } catch {
      useFallbackFleet();
    } finally {
      setLoading(false);
    }
  };

  const useFallbackFleet = () => {
    const mockList = [
      {
        _id: 'v1',
        title: 'Tesla Model 3 Performance',
        category: 'EV',
        transmission: 'Automatic',
        fuelType: 'EV',
        baseHourlyRate: 350,
        baseDailyRate: 4200,
        securityDeposit: 3000,
        hostName: 'Rahul S.',
        rating: 4.98,
        reviewsCount: 42,
        specs: { seats: 5, transmission: 'Automatic', fuelType: 'EV' },
        pricing: { baseHourlyRate: 350, baseDailyRate: 4200, securityDeposit: 3000 },
        images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600']
      },
      {
        _id: 'v2',
        title: 'Mahindra Thar 4x4 Convertible',
        category: 'SUV',
        transmission: 'Manual',
        fuelType: 'Diesel',
        baseHourlyRate: 280,
        baseDailyRate: 3200,
        securityDeposit: 2500,
        hostName: 'Priya K.',
        rating: 4.91,
        reviewsCount: 68,
        specs: { seats: 4, transmission: 'Manual', fuelType: 'Diesel' },
        pricing: { baseHourlyRate: 280, baseDailyRate: 3200, securityDeposit: 2500 },
        images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600']
      },
      {
        _id: 'v3',
        title: 'BMW 3 Series M Sport',
        category: 'Luxury',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        baseHourlyRate: 550,
        baseDailyRate: 6500,
        securityDeposit: 5000,
        hostName: 'Anand V.',
        rating: 4.99,
        reviewsCount: 31,
        specs: { seats: 5, transmission: 'Automatic', fuelType: 'Petrol' },
        pricing: { baseHourlyRate: 550, baseDailyRate: 6500, securityDeposit: 5000 },
        images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600']
      },
      {
        _id: 'v4',
        title: 'Ather 450X Gen 3',
        category: 'Bike',
        transmission: 'Automatic',
        fuelType: 'EV',
        baseHourlyRate: 80,
        baseDailyRate: 850,
        securityDeposit: 1000,
        hostName: 'Siddharth M.',
        rating: 4.88,
        reviewsCount: 19,
        specs: { seats: 2, transmission: 'Automatic', fuelType: 'EV' },
        pricing: { baseHourlyRate: 80, baseDailyRate: 850, securityDeposit: 1000 },
        images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600']
      }
    ];
    setVehicles(mockList);
  };

  useEffect(() => {
    fetchFleet();
  }, [filters.category, filters.transmission, filters.fuelType]);

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
      location: 'Mumbai, MH'
    });
  };

  const handleQuickBook = (v) => {
    setSelectedVehicle(v);
    setIsCheckoutOpen(true);
  };

  const filteredList = vehicles.filter((v) => {
    if (filters.evOnly && v.category !== 'EV' && v.fuelType !== 'EV' && v.specs?.fuelType !== 'EV') return false;
    if (filters.transmission !== 'All' && v.transmission !== filters.transmission && v.specs?.transmission !== filters.transmission) return false;
    if (filters.fuelType !== 'All' && v.fuelType !== filters.fuelType && v.specs?.fuelType !== filters.fuelType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-6 space-y-6">
      
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
          <h2 className="text-xl font-bold text-slate-900">
            Available Fleet <span className="text-xs font-normal text-slate-500">({filteredList.length} Vehicles Found)</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse p-4 flex flex-col justify-between">
                <div className="h-40 bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
            <h3 className="text-lg font-bold text-slate-900">No vehicles match your active filters</h3>
            <p className="text-xs text-slate-500">Try adjusting your price range, transmission, or location query.</p>
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-indigo-600 hover:underline"
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
      </div>

      {/* Booking Checkout Drawer */}
      <BookingCheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        vehicle={selectedVehicle}
      />
    </div>
  );
};

export default VehicleDiscovery;
