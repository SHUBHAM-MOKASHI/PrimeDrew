'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Star, ChevronRight, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import ThreeM4Experience from '../components/home/ThreeM4Experience';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();

  const categories = [
    { name: 'SUVs & Cruisers', tag: 'Spacious & All-Terrain', count: '120+ Vehicles', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600', query: 'SUV' },
    { name: 'Electric Fleet (EV)', tag: 'Zero Emissions, Tech Ready', count: '85+ Vehicles', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=600', query: 'EV' },
    { name: 'Executive Sedans', tag: 'Comfort & Business Class', count: '140+ Vehicles', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600', query: 'Sedan' },
    { name: 'Superbikes & Scooters', tag: 'Agile Urban Mobility', count: '90+ Vehicles', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600', query: 'Bike' }
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
              <span>View All Fleet</span>
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

      {/* Featured Fleet Section */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Zap className="w-3.5 h-3.5" />
                Featured Listings
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Top Verified <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">Listings</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Biometrically pre-screened vehicles ready for instant keyless unlock</p>
            </div>
            <button
              onClick={() => navigate('/vehicles')}
              className="self-start sm:self-auto bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white hover:border-blue-500 hover:bg-blue-950/40 transition-all text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Browse All Fleet</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredFleet.map((v) => (
              <div
                key={v.id}
                className="bg-slate-900/80 border border-slate-800/90 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-xl shadow-black/60 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/40 hover:-translate-y-1.5 p-4 flex flex-col group cursor-pointer"
                onClick={() => navigate(`/vehicles/${v.id}`)}
              >
                <div className="relative h-52 overflow-hidden rounded-2xl bg-slate-950">
                  <img
                    src={v.image}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute top-3 right-3 bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-sm inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Host
                  </span>
                </div>
                <div className="pt-4 pb-2 px-1 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                        {v.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {v.rating} ({v.reviews})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                      {v.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{v.specs}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-white">₹{v.dailyRate}</span>
                      <span className="text-xs text-slate-400"> / day</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAuthModal('renter');
                      }}
                      className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs px-4 py-2 shadow-lg shadow-blue-600/30 rounded-xl active:scale-95 transition-all cursor-pointer"
                    >
                      Reserve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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

    </div>
  );
};

export default Home;
