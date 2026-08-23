import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, CheckSquare, Square, AlertOctagon, Info } from 'lucide-react';
import Button from '../common/Button';

export const DamageReportCard = ({
  detections = [],
  severity = 'None',
  stage = 'pickup',
  hasNewDisputeDamage = false,
  selectedDetectionIndex,
  onSelectDetection,
  onAcknowledge
}) => {
  const [acknowledgedItems, setAcknowledgedItems] = useState({});

  const toggleAcknowledge = (index) => {
    const updated = { ...acknowledgedItems, [index]: !acknowledgedItems[index] };
    setAcknowledgedItems(updated);
    if (onAcknowledge) onAcknowledge(updated);
  };

  const getSeverityBadge = () => {
    switch (severity) {
      case 'High':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> High Damage Risk
          </span>
        );
      case 'Moderate':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Moderate Damage Detected
          </span>
        );
      default:
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Pre-Trip Verified Clean
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {stage === 'pickup' ? 'Pre-Trip Pickup Inspection Report' : 'Post-Trip Return Inspection Report'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">YOLOv8 Object Detection Bounding Box Summary</p>
        </div>
        {getSeverityBadge()}
      </div>

      {/* Dispute Warning Banner if Post-Trip reveals new damages */}
      {hasNewDisputeDamage && stage === 'dropoff' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start gap-3 animate-in fade-in">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm text-rose-950 block">New Unrecorded Damage Detected!</span>
            <p className="text-rose-700 mt-0.5 leading-snug">
              Post-trip AI scan detected new structural or surface damages not present in the pre-trip baseline inspection. Security deposit hold (₹2,000 - ₹5,000) may be flagged for host review.
            </p>
          </div>
        </div>
      )}

      {/* Detections Itemized Log Table */}
      {detections.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 text-xs space-y-1">
          <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <span className="font-bold text-slate-800 text-sm block">No Bounding Box Damages Detected</span>
          <p>Vehicle exterior matches clean platform quality guidelines.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3">#</th>
                <th className="p-3">Damage Classification</th>
                <th className="p-3">AI Confidence</th>
                <th className="p-3">Severity Rating</th>
                <th className="p-3 text-right">Acknowledgement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {detections.map((det, idx) => {
                const isSelected = selectedDetectionIndex === idx;
                const isAck = !!acknowledgedItems[idx];

                return (
                  <tr
                    key={idx}
                    onClick={() => onSelectDetection && onSelectDetection(idx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{det.damageType}</span>
                      <span className="text-[11px] text-slate-400">{det.location || 'Exterior Surface'}</span>
                    </td>
                    <td className="p-3 font-bold text-indigo-600">
                      {Math.round((det.confidence || 0.9) * 100)}%
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          det.damageType?.toLowerCase().includes('dent')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {det.damageType?.toLowerCase().includes('dent') ? 'Moderate' : 'Low'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAcknowledge(idx);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600"
                      >
                        {isAck ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{isAck ? 'Acknowledged' : 'Verify'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-400" /> AI Confidence Threshold: &gt;= 85% Precision
        </span>
        <span className="font-bold text-slate-800">
          {Object.keys(acknowledgedItems).length} of {detections.length} Items Signed
        </span>
      </div>

    </div>
  );
};

export default DamageReportCard;
