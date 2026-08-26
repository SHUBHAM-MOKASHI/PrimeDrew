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
          <span className="bg-rose-950/80 text-rose-400 border border-rose-500/40 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> High Damage Risk
          </span>
        );
      case 'Moderate':
        return (
          <span className="bg-amber-950/80 text-amber-400 border border-amber-500/40 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Moderate Damage Detected
          </span>
        );
      default:
        return (
          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pre-Trip Verified Clean
          </span>
        );
    }
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-zinc-800/80 p-6 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-100">
            {stage === 'pickup' ? 'Pre-Trip Pickup Inspection Report' : 'Post-Trip Return Inspection Report'}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">YOLOv8 Object Detection Bounding Box Summary</p>
        </div>
        {getSeverityBadge()}
      </div>

      {/* Dispute Warning Banner if Post-Trip reveals new damages */}
      {hasNewDisputeDamage && stage === 'dropoff' && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 text-xs text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm text-rose-100 block">New Unrecorded Damage Detected!</span>
            <p className="text-rose-300 mt-0.5 leading-snug">
              Post-trip AI scan detected new structural or surface damages not present in the pre-trip baseline inspection. Security deposit hold (₹2,000 - ₹5,000) may be flagged for host review.
            </p>
          </div>
        </div>
      )}

      {/* Detections Itemized Log Table */}
      {detections.length === 0 ? (
        <div className="bg-zinc-950/60 rounded-2xl p-8 text-center text-zinc-400 text-xs space-y-1 border border-zinc-800">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <span className="font-bold text-zinc-100 text-sm block">No Bounding Box Damages Detected</span>
          <p>Vehicle exterior matches clean platform quality guidelines.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="p-3">#</th>
                <th className="p-3">Damage Classification</th>
                <th className="p-3">AI Confidence</th>
                <th className="p-3">Severity Rating</th>
                <th className="p-3 text-right">Acknowledgement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {detections.map((det, idx) => {
                const isSelected = selectedDetectionIndex === idx;
                const isAck = !!acknowledgedItems[idx];

                return (
                  <tr
                    key={idx}
                    onClick={() => onSelectDetection && onSelectDetection(idx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-500/20 font-semibold border-l-2 border-indigo-400' : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    <td className="p-3 font-bold text-zinc-500 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-bold text-zinc-100 block">{det.damageType}</span>
                      <span className="text-[11px] text-zinc-400">{det.location || 'Exterior Surface'}</span>
                    </td>
                    <td className="p-3 font-bold text-indigo-400 font-mono">
                      {Math.round((det.confidence || 0.9) * 100)}%
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          det.damageType?.toLowerCase().includes('dent')
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
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
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-indigo-400 cursor-pointer"
                      >
                        {isAck ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600" />
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

      <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo-400" /> AI Confidence Threshold: &gt;= 85% Precision
        </span>
        <span className="font-bold text-zinc-200 font-mono">
          {Object.keys(acknowledgedItems).length} of {detections.length} Items Signed
        </span>
      </div>

    </div>
  );
};

export default DamageReportCard;

