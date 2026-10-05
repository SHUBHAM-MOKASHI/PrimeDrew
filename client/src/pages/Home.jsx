import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import ThreeM4Experience from '../components/home/ThreeM4Experience';
import BookingCheckoutDrawer from '../components/booking/BookingCheckoutDrawer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import StaggeredGrid from '../components/StaggeredGrid';
import { useAuth } from '../context/AuthContext';
import { getVehicles } from '../services/vehicleService';

export const Home = () => {
  const navigate = useNavigate();
  const { user, token, kycStatus, openAuthModal, openKycModal } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const fetchHomeFleet = async () => {
      try {
        const response = await getVehicles();
        const liveList = response?.data || (Array.isArray(response) ? response : []);
        setVehicles(Array.isArray(liveList) ? liveList : []);
      } catch (err) {
        console.error('[Home] Failed to load live fleet:', err);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeFleet();
  }, []);

  const categories = [
    { name: 'SUVs & Cruisers', tag: 'Spacious & All-Terrain', count: 'Explore All', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600', query: 'SUV' },
    { name: 'Electric Fleet (EV)', tag: 'Zero Emissions, Tech Ready', count: 'Explore All', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600', query: 'EV' },
    { name: 'Executive Sedans', tag: 'Comfort & Business Class', count: 'Explore All', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600', query: 'Sedan' },
    { name: 'Superbikes & Scooters', tag: 'Agile Urban Mobility', count: 'Explore All', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600', query: 'Bike' }
  ];

  const handleBookClick = (e, vehicle) => {
    e.stopPropagation();
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
    setSelectedVehicle({
      ...vehicle,
      _id: vehicle.id || vehicle._id,
      baseDailyRate: vehicle.dailyRate || vehicle.baseDailyRate || 2500,
      baseHourlyRate: vehicle.hourlyRate || vehicle.baseHourlyRate || 300,
      pricing: {
        baseDailyRate: vehicle.dailyRate || 2500,
        baseHourlyRate: vehicle.hourlyRate || 300,
        securityDeposit: 2500
      },
      images: vehicle.image ? [vehicle.image] : vehicle.images
    });
    setIsCheckoutOpen(true);
  };

  // --- Staggered Grid Dynamic Fleet Transformation ---
  const activeFleet = vehicles;

  // Map real vehicles from MongoDB to StaggeredGrid Bento Items
  const bentoItems = activeFleet.length > 0
    ? activeFleet.slice(0, 4).map((car, idx) => {
        const dailyPrice = Number(car.pricing?.baseDailyRate || car.baseDailyRate || car.dailyRate || 0);
        const carImage = car.images?.[0] || car.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80';
        return {
          id: car._id || car.id || `bento-${idx}`,
          title: car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Verified Vehicle',
          subtitle: car.category || (dailyPrice ? `₹${dailyPrice.toLocaleString()}/day` : 'Exotic Fleet'),
          description: car.tagline || (typeof car.specs === 'string' ? car.specs : `${car.specs?.transmission || 'Automatic'} • ${car.specs?.fuelType || 'Petrol'} • ${car.specs?.seats || 5} Seats`),
          icon: <span className="text-xs font-bold text-sky-400">{dailyPrice ? `₹${dailyPrice.toLocaleString()}/day` : 'Available'}</span>,
          image: carImage,
          onClick: (e) => {
            if (car._id || car.id) {
              navigate(`/vehicles/${car._id || car.id}`);
            } else if (typeof handleBookClick === 'function') {
              handleBookClick(e || { stopPropagation: () => {} }, car);
            }
          }
        };
      })
    : [
        {
          id: 'list-vehicle-callout',
          title: 'Host Your Vehicle on PrimeDrew',
          subtitle: 'Zero Listing Fees • Verified Renters',
          description: 'Earn up to ₹45,000/month with automated AI damage inspection & smart escrow lock.',
          icon: <span className="text-xs font-bold text-cyan-400">+ List Vehicle</span>,
          image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
          onClick: () => navigate('/host/list-vehicle')
        }
      ];

  // Collect real fleet images for background grid flow
  const extractedImages = activeFleet.map((v) => v.images?.[0] || v.image).filter(Boolean);
  const gridImages = extractedImages.length >= 4 ? extractedImages : [
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80'
  ];
  // ----------------------------------------------------

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#030712] via-[#080d1a] to-[#020617] text-slate-100">
      
      {/* 3D BMW M4 Showroom Showcase */}
      <ThreeM4Experience />

      {/* Category Grid Section */}
      <section className="py-16 relative border-y border-slate-800/80 bg-slate-950/60 overflow-hidden">
        {/* Subtle Ambient Blue Bloom */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <div className="w-[800px] h-[350px] bg-cyan-600/5 blur-[140px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Fleet Categories
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Explore Fleet <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">Categories</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">From high-efficiency EV commuters to rugged 4x4 explorers</p>
            </div>
            <button
              onClick={() => navigate('/vehicles')}
              className="self-start sm:self-auto bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white hover:border-cyan-500 hover:bg-cyan-950/40 transition-all text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Browse Vehicles</span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => navigate(`/vehicles?category=${cat.query}`)}
                className="group relative bg-slate-900/70 border border-slate-800 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl shadow-black/50 transition-all duration-300 hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-950/30 hover:-translate-y-1 cursor-pointer flex flex-col"
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <span className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-700/80 text-cyan-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-md">
                    {cat.count}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors text-base sm:text-lg">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{cat.tag}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive GSAP Staggered Bento Grid Fleet Section */}
      {/* Staggered Grid Dynamic Fleet Section */}
      <section id="fleet" className="w-full py-16 bg-neutral-950 relative overflow-hidden">
        <StaggeredGrid 
          bentoItems={bentoItems} 
          centerText="PRIME FLEET" 
          images={gridImages} 
          showFooter={false} 
        />
      </section>

      {/* Trust & AI Security Feature Section */}
      <section className="py-16 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-950 via-[#0a1226] to-slate-950 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl shadow-black relative overflow-hidden text-white">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> Instant AI Identity & Damage Intelligence
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Zero Disputes. <br />
                Automated YOLOv8 Inspection.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
                Our platform uses EasyOCR and DeepFace for 60-second biometric KYC verification, combined with YOLOv8 computer vision to automatically detect pre-existing damages during pickup and drop-off.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="primary" onClick={() => navigate('/inspections')}>
                  Try AI Damage Scanner
                </Button>
                <Button variant="outline" className="border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800" onClick={() => openAuthModal('host')}>
                  Become a Host
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Booking Modal */}
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

export default Home;
