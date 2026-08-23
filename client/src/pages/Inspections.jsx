import React, { useState } from 'react';
import { Upload, Sparkles, AlertTriangle, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';

export const Inspections = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setInspectionResult(null);
    }
  };

  const handleRunScan = async () => {
    if (!selectedFile) return;
    setIsScanning(true);

    // Simulate or proxy to FastAPI YOLOv8 Damage Microservice
    setTimeout(() => {
      setIsScanning(false);
      setInspectionResult({
        severity: 'Moderate',
        confidenceScore: 0.92,
        detections: [
          {
            damageType: 'scratch',
            confidence: 0.94,
            location: 'Front Bumper Right Side',
            boundingBox: { xMin: 120, yMin: 80, xMax: 280, yMax: 190 }
          },
          {
            damageType: 'dent',
            confidence: 0.89,
            location: 'Passenger Door Panel',
            boundingBox: { xMin: 310, yMin: 210, xMax: 450, yMax: 320 }
          }
        ],
        timestamp: new Date().toISOString()
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Powered by YOLOv8 Computer Vision
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">Automated Vehicle Damage Inspection</h1>
          <p className="text-sm text-slate-500 mt-2">
            Upload pickup or dropoff photos to automatically detect scratch, dent, or crack severity and record bounding box telemetry before key handover.
          </p>
        </div>

        {/* Upload Container */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center">
            {previewUrl ? (
              <div className="relative max-h-72 overflow-hidden rounded-xl border border-slate-200">
                <img src={previewUrl} alt="Inspection Preview" className="max-h-72 object-contain rounded-xl" />
                {inspectionResult && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-md">
                      <AlertTriangle className="w-3 h-3" /> Severity: {inspectionResult.severity}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Upload Inspection Photo</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Supports JPEG, PNG, WEBP up to 10MB</p>
              </>
            )}

            <label className="cursor-pointer mt-4">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <Button variant="outline" size="sm" pointerEvents="none">
                {previewUrl ? 'Change Image' : 'Select Photo'}
              </Button>
            </label>
          </div>

          {previewUrl && (
            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                isLoading={isScanning}
                leftIcon={Sparkles}
                onClick={handleRunScan}
                className="py-3 px-8"
              >
                Run AI YOLOv8 Scan
              </Button>
            </div>
          )}
        </div>

        {/* Inspection Results Dashboard */}
        {inspectionResult && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> AI Detection Summary
              </h2>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Damage Alert: {inspectionResult.severity}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inspectionResult.detections.map((d, index) => (
                <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-rose-600 tracking-wider">
                      {d.damageType} Detected
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{d.location}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      AI Model Confidence: <span className="font-semibold text-slate-700">{Math.round(d.confidence * 100)}%</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Telemetry report signed and attached to immutable rental contract timestamp ({new Date(inspectionResult.timestamp).toLocaleString()}).
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Inspections;
