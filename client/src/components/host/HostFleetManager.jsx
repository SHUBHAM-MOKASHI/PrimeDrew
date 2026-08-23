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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Fleet Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage listing availability, pricing rates, and verification telemetry</p>
        </div>
        <Button variant="primary" size="sm" onClick={onOpenAddWizard}>
          Add New Vehicle
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-3">Vehicle Details</th>
              <th className="p-3">Registration Plate</th>
              <th className="p-3">Verification</th>
              <th className="p-3">Daily Rate</th>
              <th className="p-3">Listing State</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {fleetList.map((vehicle) => {
              const id = vehicle._id || vehicle.id;
              const isAvailable = vehicle.status === 'available';

              return (
                <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=200'}
                        alt={vehicle.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                      />
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{vehicle.title}</span>
                        <span className="text-[11px] text-slate-400 font-semibold">{vehicle.category} • {vehicle.specs?.transmission || 'Automatic'}</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 font-mono font-semibold text-slate-700">{vehicle.plateNumber}</td>

                  <td className="p-3">
                    {vehicle.verificationStatus === 'approved' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-bold text-slate-900">
                    ₹{vehicle.pricing?.baseDailyRate || vehicle.baseDailyRate || 2500}/day
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => handleToggle(id)}
                      className="inline-flex items-center gap-1.5 font-bold text-xs cursor-pointer"
                    >
                      {isAvailable ? (
                        <>
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                          <span className="text-emerald-700">Available</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                          <span className="text-slate-400">Paused</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Vehicle">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Inspection History">
                        <Camera className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteVehicle && onDeleteVehicle(id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
