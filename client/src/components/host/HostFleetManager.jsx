import React, { useState } from 'react';
import { ShieldCheck, ToggleLeft, ToggleRight, Trash2, Edit3, Camera } from 'lucide-react';
import Button from '../common/Button';

export const HostFleetManager = ({ fleet = [], onToggleStatus, onDeleteVehicle, onOpenAddWizard }) => {
  const [fleetList, setFleetList] = useState(fleet);

  const handleToggle = (id) => {
    setFleetList((prev) =>
      prev.map((item) => {
        if (item._id === id || item.id === id) {
          const nextStatus = item.status === 'available' ? 'unlisted' : 'available';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
    if (onToggleStatus) onToggleStatus(id);
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-zinc-800/80 shadow-2xl overflow-hidden space-y-4 p-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Fleet Management</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Manage listing availability, pricing rates, and verification telemetry</p>
        </div>
        <Button variant="primary" size="sm" onClick={onOpenAddWizard} className="shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          Add New Vehicle
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <th className="p-3">Vehicle Details</th>
              <th className="p-3">Registration Plate</th>
              <th className="p-3">Verification</th>
              <th className="p-3">Daily Rate</th>
              <th className="p-3">Listing State</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-xs">
            {fleetList.map((vehicle) => {
              const id = vehicle._id || vehicle.id;
              const isAvailable = vehicle.status === 'available';

              return (
                <tr key={id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=200'}
                        alt={vehicle.title}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-700/60"
                      />
                      <div>
                        <span className="font-bold text-zinc-100 text-sm block">{vehicle.title}</span>
                        <span className="text-[11px] text-zinc-400 font-semibold">{vehicle.category} • {vehicle.specs?.transmission || 'Automatic'}</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 font-mono font-semibold text-zinc-300">{vehicle.plateNumber}</td>

                  <td className="p-3">
                    {vehicle.verificationStatus === 'approved' ? (
                      <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="bg-amber-950/80 text-amber-400 border border-amber-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-bold text-zinc-100 font-mono">
                    ₹{vehicle.pricing?.baseDailyRate || vehicle.baseDailyRate || 2500}/day
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => handleToggle(id)}
                      className="inline-flex items-center gap-1.5 font-bold text-xs cursor-pointer"
                    >
                      {isAvailable ? (
                        <>
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                          <span className="text-emerald-400">Available</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 text-zinc-600" />
                          <span className="text-zinc-500">Paused</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" title="Edit Vehicle">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" title="Inspection History">
                        <Camera className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteVehicle && onDeleteVehicle(id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HostFleetManager;

