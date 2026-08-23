import React, { useState } from 'react';
import { Car, DollarSign, Clock, CheckCircle2, XCircle, Plus, AlertCircle, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

export const HostPortal = () => {
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [fleet, setFleet] = useState([
    {
      id: 'v101',
      title: 'Tesla Model 3 Performance',
      plateNumber: 'MH-02-EV-9821',
      category: 'EV',
      dailyRate: 4200,
      status: 'available',
      verificationStatus: 'approved'
    },
    {
      id: 'v102',
      title: 'Mahindra Thar 4x4',
      plateNumber: 'MH-12-TH-4410',
      category: 'SUV',
      dailyRate: 3200,
      status: 'rented',
      verificationStatus: 'approved'
    }
  ]);

  const [bookingRequests, setBookingRequests] = useState([
    {
      id: 'b1',
      renterName: 'Vikram Mehta',
      vehicleTitle: 'Tesla Model 3 Performance',
      dates: '24 Aug - 26 Aug 2026',
      totalAmount: 9240,
      kycStatus: 'verified'
    }
  ]);

  const [newVehicle, setNewVehicle] = useState({
    title: '',
    make: '',
    model: '',
    year: '2024',
    category: 'SUV',
    plateNumber: '',
    baseDailyRate: '',
    baseHourlyRate: '',
    securityDeposit: '2000'
  });

  const handleAddVehicle = (e) => {
    e.preventDefault();
    const created = {
      id: 'v' + Date.now(),
      title: newVehicle.title || `${newVehicle.make} ${newVehicle.model}`,
      plateNumber: newVehicle.plateNumber.toUpperCase(),
      category: newVehicle.category,
      dailyRate: Number(newVehicle.baseDailyRate) || 2500,
      status: 'available',
      verificationStatus: 'pending'
    };
    setFleet([created, ...fleet]);
    setIsListModalOpen(false);
    setNewVehicle({ title: '', make: '', model: '', year: '2024', category: 'SUV', plateNumber: '', baseDailyRate: '', baseHourlyRate: '', securityDeposit: '2000' });
  };

  const handleApproveBooking = (id) => {
    setBookingRequests((prev) => prev.filter((b) => b.id !== id));
    alert('Booking approved! Escrow payment locked.');
  };

  const handleRejectBooking = (id) => {
    setBookingRequests((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Host Fleet Command Center</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage listings, approve bookings, and track vehicle revenue</p>
          </div>
          <Button variant="primary" leftIcon={Plus} onClick={() => setIsListModalOpen(true)}>
            List New Vehicle
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Total Fleet</span>
              <span className="text-2xl font-extrabold text-slate-900">{fleet.length} Listings</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Monthly Revenue</span>
              <span className="text-2xl font-extrabold text-slate-900">₹48,500</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Pending Requests</span>
              <span className="text-2xl font-extrabold text-slate-900">{bookingRequests.length} Requests</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Active Trips</span>
              <span className="text-2xl font-extrabold text-slate-900">1 Vehicle Rented</span>
            </div>
          </div>
        </div>

        {/* Incoming Booking Requests */}
        {bookingRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Incoming Booking Requests</h2>
            <div className="space-y-3">
              {bookingRequests.map((b) => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{b.renterName}</span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified Renter
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Vehicle: <span className="font-semibold">{b.vehicleTitle}</span> • {b.dates}</p>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">Total Fare: ₹{b.totalAmount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" leftIcon={XCircle} onClick={() => handleRejectBooking(b.id)}>
                      Decline
                    </Button>
                    <Button variant="primary" size="sm" leftIcon={CheckCircle2} onClick={() => handleApproveBooking(b.id)}>
                      Approve Booking
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fleet Listings Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Vehicle Fleet Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Vehicle Title</th>
                  <th className="p-4">Plate Number</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Daily Rate</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Rental Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {fleet.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{item.title}</td>
                    <td className="p-4 font-mono text-xs text-slate-600">{item.plateNumber}</td>
                    <td className="p-4 text-xs font-semibold text-indigo-600">{item.category}</td>
                    <td className="p-4 font-semibold text-slate-900">₹{item.dailyRate}/day</td>
                    <td className="p-4">
                      {item.verificationStatus === 'approved' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          Approved
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.status === 'available' ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Available</span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Rented</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* List Vehicle Modal */}
      <Modal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        title="List Your Vehicle on PrimeDrew"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <Input
            label="Make & Model"
            placeholder="e.g. Hyundai Creta 1.5"
            value={newVehicle.title}
            onChange={(e) => setNewVehicle({ ...newVehicle, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Registration Plate No."
              placeholder="MH-01-AB-1234"
              value={newVehicle.plateNumber}
              onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
              required
            />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">Category</label>
              <select
                value={newVehicle.category}
                onChange={(e) => setNewVehicle({ ...newVehicle, category: e.target.value })}
                className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500"
              >
                <option value="Hatchback">Hatchback</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="EV">EV</option>
                <option value="Bike">Bike</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Hourly Rate (₹)"
              type="number"
              placeholder="250"
              value={newVehicle.baseHourlyRate}
              onChange={(e) => setNewVehicle({ ...newVehicle, baseHourlyRate: e.target.value })}
            />
            <Input
              label="Base Daily Rate (₹)"
              type="number"
              placeholder="2800"
              value={newVehicle.baseDailyRate}
              onChange={(e) => setNewVehicle({ ...newVehicle, baseDailyRate: e.target.value })}
              required
            />
          </div>

          <Button type="submit" variant="primary" className="w-full py-3">
            Submit Vehicle for Host Verification
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default HostPortal;
