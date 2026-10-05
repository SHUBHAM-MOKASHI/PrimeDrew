import React, { useState, useEffect } from 'react';
import { DollarSign, ShieldCheck, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { getHostBookings } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';

export const EarningsAnalytics = () => {
  const { token } = useAuth();
  const [payouts, setPayouts] = useState([]);
  const [earningsData, setEarningsData] = useState({
    gross: 0,
    platformFee: 0,
    netPayout: 0,
    pendingEscrow: 0
  });

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!token) return;
      try {
        const res = await getHostBookings(token);
        const bookings = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(bookings) && bookings.length > 0) {
          let gross = 0;
          let pendingEscrow = 0;
          let netPayout = 0;
          const mapped = bookings.map((b, i) => {
            const amount = b.totalPayout || b.pricingBreakdown?.totalAmount || 0;
            gross += amount;
            if (b.tripStatus === 'completed') {
              netPayout += Math.round(amount * 0.9);
            } else {
              pendingEscrow += amount;
            }
            return {
              id: b._id || b.id || `po_${i}`,
              bookingId: b._id || b.id || `bk_${i}`,
              vehicle: b.vehicle?.title || b.vehicleTitle || 'Booked Vehicle',
              date: b.dates || (b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'),
              amount: amount,
              status: b.tripStatus === 'completed' ? 'Transferred to Bank' : 'Pending Escrow Hold',
              utr: b.tripStatus === 'completed' ? `UTR-${b._id?.slice(-4) || '2026'}` : 'Pending Completion'
            };
          });
          setPayouts(mapped);
          setEarningsData({
            gross,
            platformFee: Math.round(gross * 0.1),
            netPayout,
            pendingEscrow
          });
        } else {
          setPayouts([]);
          setEarningsData({ gross: 0, platformFee: 0, netPayout: 0, pendingEscrow: 0 });
        }
      } catch {
        setPayouts([]);
      }
    };
    fetchEarnings();
  }, [token]);

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
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-500 font-medium">
                    No completed trips or payouts yet. Payouts will automatically settle here after trip completions.
                  </td>
                </tr>
              ) : (
                payouts.map((po) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EarningsAnalytics;

