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
    <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-zinc-800/80 p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Incoming Booking Requests</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Approve incoming trip requests from verified local renters</p>
        </div>
        <span className="bg-amber-950/80 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
          {requests.length} Pending
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="bg-zinc-950/60 rounded-2xl p-8 text-center text-zinc-400 text-xs space-y-1 border border-zinc-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <span className="font-bold text-zinc-100 text-sm block">All Requests Reviewed</span>
          <p>You have no pending booking requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <div key={req.id} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-100 text-sm">{req.renterName}</span>
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Renter
                  </span>
                </div>

                <p className="text-xs font-semibold text-zinc-300">{req.vehicleTitle}</p>
                
                <div className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{req.dates}</span>
                </div>

                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Net Escrow Payout: ₹{req.totalPayout}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                <Button variant="ghost" size="sm" leftIcon={MessageSquare} className="text-zinc-400 hover:text-zinc-200">
                  Message
                </Button>
                <Button variant="outline" size="sm" leftIcon={XCircle} onClick={() => handleDecline(req.id)} className="border-zinc-800 text-zinc-300 hover:text-rose-400">
                  Decline
                </Button>
                <Button variant="primary" size="sm" leftIcon={CheckCircle2} onClick={() => handleApprove(req.id)} className="font-bold shadow-[0_0_15px_rgba(99,102,241,0.25)]">
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

