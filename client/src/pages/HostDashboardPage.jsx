import React, { useState, useEffect } from 'react';
import { Car, DollarSign, Clock, CheckCircle2, Plus, Calendar, CreditCard, SlidersHorizontal, Users } from 'lucide-react';
import Button from '../components/common/Button';
import HostFleetManager from '../components/host/HostFleetManager';
import IncomingBookingsList from '../components/host/IncomingBookingsList';
import EarningsAnalytics from '../components/host/EarningsAnalytics';
import VehicleListingWizard from '../components/host/VehicleListingWizard';
import { getHostFleet } from '../services/hostService';
import { useAuth } from '../context/AuthContext';

export const HostDashboardPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'requests' | 'earnings'
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [fleet, setFleet] = useState([
    {
      _id: 'v101',
      title: 'Tesla Model 3 Performance',
      plateNumber: 'MH-02-EV-9821',
      category: 'EV',
      pricing: { baseDailyRate: 4200 },
      baseDailyRate: 4200,
      status: 'available',
      verificationStatus: 'approved',
      images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=400']
    },
    {
      _id: 'v102',
      title: 'Mahindra Thar 4x4 Convertible',
      plateNumber: 'MH-12-TH-4410',
      category: 'SUV',
      pricing: { baseDailyRate: 3200 },
      baseDailyRate: 3200,
      status: 'available',
      verificationStatus: 'approved',
      images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400']
    }
  ]);

  useEffect(() => {
    const fetchFleetData = async () => {
      if (!token) return;
      try {
        const response = await getHostFleet(token);
        if (response.data && response.data.length > 0) {
          setFleet(response.data);
        }
      } catch {
        // Keep fallback data
      }
    };
    fetchFleetData();
  }, [token]);

  const handleVehicleCreated = (newVehicle) => {
    setFleet((prev) => [newVehicle, ...prev]);
  };

  const handleDeleteVehicle = (id) => {
    setFleet((prev) => prev.filter((item) => (item._id || item.id) !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header & Quick Action Shortcuts */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full mb-2">
              <Car className="w-3.5 h-3.5" /> Fleet Host Operations Portal
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900">Host Command Center</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your vehicle fleet, approve incoming renter requests, and track escrow settlements.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="primary" leftIcon={Plus} onClick={() => setIsWizardOpen(true)}>
              Add New Vehicle
            </Button>
            <Button variant="outline" size="sm" leftIcon={Calendar} onClick={() => setActiveTab('fleet')}>
              Calendar
            </Button>
            <Button variant="outline" size="sm" leftIcon={CreditCard} onClick={() => setActiveTab('earnings')}>
              Payouts
            </Button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Total Active Vehicles</span>
              <span className="text-2xl font-extrabold text-slate-900">{fleet.length} Listed</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Completed Trips</span>
              <span className="text-2xl font-extrabold text-slate-900">42 Trips</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Net Monthly Earnings</span>
              <span className="text-2xl font-extrabold text-slate-900">₹48,600</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Pending Requests</span>
              <span className="text-2xl font-extrabold text-slate-900">2 Requests</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'fleet'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Fleet Management ({fleet.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" /> Incoming Requests (2)
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'earnings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
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
      <VehicleListingWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onVehicleCreated={handleVehicleCreated}
      />
    </div>
  );
};

export default HostDashboardPage;
