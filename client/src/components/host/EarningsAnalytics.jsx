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
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Gross Revenue</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">₹{earningsData.gross}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Total fare collected</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Platform Fee (10%)</span>
          <span className="text-2xl font-extrabold text-slate-700 mt-1 block">-₹{earningsData.platformFee}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Maintenance & Insurance</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Net Bank Payouts</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">₹{earningsData.netPayout}</span>
          <span className="text-[11px] text-emerald-700 mt-1 font-semibold block">Settled to Account</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Pending Escrow</span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1 block">₹{earningsData.pendingEscrow}</span>
          <span className="text-[11px] text-amber-700 mt-1 font-semibold block">Active Trips Hold</span>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Escrow Payout Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated bank settlements following trip completion & inspection signoff</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            Bank Account: XXXX-8921 <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3">Payout Ref</th>
                <th className="p-3">Booking / Vehicle</th>
                <th className="p-3">Date</th>
                <th className="p-3">Net Payout</th>
                <th className="p-3 text-right">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {payouts.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{po.id}</td>
                  <td className="p-3">
                    <span className="font-bold text-slate-800 block">{po.vehicle}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{po.bookingId}</span>
                  </td>
                  <td className="p-3 text-slate-600 font-semibold">{po.date}</td>
                  <td className="p-3 font-extrabold text-slate-900">₹{po.amount}</td>
                  <td className="p-3 text-right">
                    {po.status === 'Transferred to Bank' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Settled ({po.utr})
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" /> Escrow Hold
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
