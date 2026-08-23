import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, MessageSquare, Calendar, DollarSign } from 'lucide-react';
import Button from '../common/Button';

export const IncomingBookingsList = () => {
  const [requests, setRequests] = useState([
    {
      id: 'b101',
      renterName: 'Vikram Mehta',
      renterKyc: 'verified',
      vehicleTitle: 'Tesla Model 3 Performance',
      dates: '24 Aug - 27 Aug 2026 (3 Days)',
      totalPayout: 11340,
      status: 'requested'
    },
    {
      id: 'b102',
      renterName: 'Ananya Roy',
      renterKyc: 'verified',
      vehicleTitle: 'Mahindra Thar 4x4 Convertible',
      dates: '28 Aug - 29 Aug 2026 (1 Day)',
      totalPayout: 3150,
      status: 'requested'
    }
  ]);

  const handleApprove = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    alert('Booking approved! Escrow payment locked.');
  };

  const handleDecline = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Incoming Booking Requests</h2>
          <p className="text-xs text-slate-500 mt-0.5">Approve incoming trip requests from verified local renters</p>
        </div>
        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {requests.length} Pending
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 text-xs space-y-1">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <span className="font-bold text-slate-800 text-sm block">All Requests Reviewed</span>
          <p>You have no pending booking requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <div key={req.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{req.renterName}</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Renter
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-700">{req.vehicleTitle}</p>
                
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{req.dates}</span>
                </div>

                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Net Escrow Payout: ₹{req.totalPayout}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                <Button variant="ghost" size="sm" leftIcon={MessageSquare} className="text-slate-600">
                  Message
                </Button>
                <Button variant="outline" size="sm" leftIcon={XCircle} onClick={() => handleDecline(req.id)}>
                  Decline
                </Button>
                <Button variant="primary" size="sm" leftIcon={CheckCircle2} onClick={() => handleApprove(req.id)}>
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncomingBookingsList;
