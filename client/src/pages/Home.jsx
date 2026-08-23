import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, ShieldCheck, Zap, Sparkles, Star, ChevronRight } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();
  const [location, setLocation] = useState('Mumbai, MH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/vehicles?location=${encodeURIComponent(location)}`);
  };

  const categories = [
    { name: 'SUVs & Cruisers', tag: 'Spacious & All-Terrain', count: '120+ Vehicles', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600', query: 'SUV' },
    { name: 'Electric Vehicles (EVs)', tag: 'Zero Emissions, Tech Fleet', count: '85+ Vehicles', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600', query: 'EV' },
    { name: 'Executive Sedans', tag: 'Comfort & Business Class', count: '140+ Vehicles', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600', query: 'Sedan' },
    { name: 'Superbikes & Scooters', tag: 'Urban Mobility', count: '90+ Vehicles', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600', query: 'Bike' }
  ];

  const featuredFleet = [
    {
      id: 'v1',
      title: 'Tesla Model 3 Performance',
      category: 'EV',
      rating: 4.98,
      reviews: 42,
      hourlyRate: 350,
      dailyRate: 4200,
      hostName: 'Rahul S.',
      isVerified: true,
      image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600',
      specs: 'Automatic • EV • 5 Seats'
    },
    {
      id: 'v2',
      title: 'Mahindra Thar 4x4 Convertible',
      category: 'SUV',
      rating: 4.91,
      reviews: 68,
      hourlyRate: 280,
      dailyRate: 3200,
      hostName: 'Priya K.',
      isVerified: true,
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600',
      specs: 'Manual • Diesel • 4 Seats'
    },
    {
      id: 'v3',
      title: 'BMW 3 Series M Sport',
      category: 'Luxury',
      rating: 4.99,
      reviews: 31,
      hourlyRate: 550,
      dailyRate: 6500,
      hostName: 'Anand V.',
      isVerified: true,
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600',
      specs: 'Automatic • Petrol • 5 Seats'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-indigo-50/70 via-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-3xl text-center mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Smart P2P Vehicle Sharing
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Drive Any Vehicle. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-800 bg-clip-text text-transparent">
                Instantly Verified. Zero Wait.
              </span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg mt-4 leading-relaxed max-w-2xl mx-auto">
              Rent verified local cars, SUVs, and EVs directly from hosts. Powered by 60-second AI biometric KYC and automated YOLOv8 damage inspection.
            </p>
          </div>

          {/* Search Card Container */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <Input
                label="Pickup Location"
                placeholder="City, landmark, or coordinates"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                leftIcon={MapPin}
              />
              <Input
                label="Trip Start Date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                leftIcon={Calendar}
              />
              <div className="flex gap-2">
                <Input
                  label="Trip End Date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  leftIcon={Calendar}
                  containerClassName="flex-1"
                />
                <Button type="submit" variant="primary" leftIcon={Search} className="h-[42px] mt-auto">
                  Search
                </Button>
              </div>
            </form>
          </div>

        </div>
      </section>

      {/* Category Grid Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Explore Fleet Categories</h2>
              <p className="text-xs text-slate-500 mt-1">From city commuters to luxury road-trippers</p>
            </div>
            <Button variant="ghost" size="sm" rightIcon={ChevronRight} onClick={() => navigate('/vehicles')}>
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => navigate(`/vehicles?category=${cat.query}`)}
                className="group relative rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-semibold text-white bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    {cat.count}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.tag}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Fleet Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Top Verified Listings</h2>
              <p className="text-xs text-slate-500 mt-1">Inspected vehicles ready for instant keyless booking</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/vehicles')}>
              Browse All Fleet
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredFleet.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={v.image}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 right-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 backdrop-blur-md">
                    <ShieldCheck className="w-3 h-3" /> Verified Host
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-600">{v.category}</span>
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {v.rating} ({v.reviews})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{v.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{v.specs}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-extrabold text-slate-900">₹{v.dailyRate}</span>
                      <span className="text-xs text-slate-400"> / day</span>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => openAuthModal('renter')}>
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & AI Security Feature Section */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <Zap className="w-3.5 h-3.5 text-indigo-400" /> Instant AI Identity & Damage Intelligence
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Zero Disputes. <br />
                Automated YOLOv8 Inspection.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
                Our platform uses EasyOCR and DeepFace for 60-second biometric KYC verification, combined with YOLOv8 computer vision to automatically detect pre-existing damages during pickup and drop-off.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="primary" onClick={() => navigate('/inspections')}>
                  Try AI Damage Scanner
                </Button>
                <Button variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => openAuthModal('host')}>
                  Become a Host
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
