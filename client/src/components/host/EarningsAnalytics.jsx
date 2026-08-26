import React from 'react';
import { DollarSign, ShieldCheck, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react';

export const EarningsAnalytics = () => {
  const earningsData = {
    gross: 54000,
    platformFee: 5400, // 10%
    netPayout: 48600,
    pendingEscrow: 9240
  };

  const payouts = [
    {
      id: 'po_101',
      bookingId: 'bk_9812',
      vehicle: 'Tesla Model 3 Performance',
      date: '20 Aug 2026',
      amount: 11340,
      status: 'Transferred to Bank',
      utr: 'UTR-9821-2026'
    },
    {
      id: 'po_102',
      bookingId: 'bk_9855',
      vehicle: 'Mahindra Thar 4x4',
      date: '15 Aug 2026',
      amount: 8640,
      status: 'Transferred to Bank',
      utr: 'UTR-9822-2026'
    },
    {
      id: 'po_103',
      bookingId: 'bk_9901',
      vehicle: 'Tesla Model 3 Performance',
      date: '24 Aug 2026',
      amount: 9240,
      status: 'Pending Escrow Hold',
      utr: 'Pending Trip Completion'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Payout Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 border border-zinc-800/80 shadow-md">
          <span className="text-xs font-semibold text-zinc-400 block">Gross Revenue</span>
          <span className="text-2xl font-extrabold text-zinc-100 mt-1 block font-mono">₹{earningsData.gross}</span>
          <span className="text-[11px] text-zinc-500 mt-1 block">Total fare collected</span>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 border border-zinc-800/80 shadow-md">
          <span className="text-xs font-semibold text-zinc-400 block">Platform Fee (10%)</span>
          <span className="text-2xl font-extrabold text-rose-400 mt-1 block font-mono">-₹{earningsData.platformFee}</span>
          <span className="text-[11px] text-zinc-500 mt-1 block">Maintenance & Telemetry</span>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 border border-zinc-800/80 shadow-md">
          <span className="text-xs font-semibold text-zinc-400 block">Net Bank Payouts</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block font-mono">₹{earningsData.netPayout}</span>
          <span className="text-[11px] text-emerald-500 mt-1 font-semibold block">Settled to Account</span>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 border border-zinc-800/80 shadow-md">
          <span className="text-xs font-semibold text-zinc-400 block">Pending Escrow</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block font-mono">₹{earningsData.pendingEscrow}</span>
          <span className="text-[11px] text-amber-500 mt-1 font-semibold block">Active Trips Hold</span>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-zinc-800/80 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Escrow Payout Ledger</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Automated bank settlements following trip completion & inspection signoff</p>
          </div>
          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1 font-mono">
            Bank Account: XXXX-8921 <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="p-3">Payout Ref</th>
                <th className="p-3">Booking / Vehicle</th>
                <th className="p-3">Date</th>
                <th className="p-3">Net Payout</th>
                <th className="p-3 text-right">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {payouts.map((po) => (
                <tr key={po.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-zinc-300">{po.id}</td>
                  <td className="p-3">
                    <span className="font-bold text-zinc-100 block">{po.vehicle}</span>
                    <span className="text-[11px] text-zinc-500 font-mono">{po.bookingId}</span>
                  </td>
                  <td className="p-3 text-zinc-400 font-semibold">{po.date}</td>
                  <td className="p-3 font-extrabold text-zinc-100 font-mono">₹{po.amount}</td>
                  <td className="p-3 text-right">
                    {po.status === 'Transferred to Bank' ? (
                      <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Settled ({po.utr})
                      </span>
                    ) : (
                      <span className="bg-amber-950/80 text-amber-400 border border-amber-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" /> Escrow Hold
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EarningsAnalytics;

