import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import AuthModal from './components/auth/AuthModal';
import KYCModal from './components/kyc/KYCModal';
import Home from './pages/Home';
import VehicleDiscovery from './pages/VehicleDiscovery';
import VehicleDetailsPage from './pages/VehicleDetailsPage';
import HostDashboardPage from './pages/HostDashboardPage';
import ListVehicle from './pages/host/ListVehicle';
import InspectionPage from './pages/InspectionPage';
import VehicleInspectionStudio from './components/studio/VehicleInspectionStudio';
import AdminDashboard from './pages/AdminDashboard';
import HostApplicationModal from './components/host/HostApplicationModal';

export function AppContent() {
  const { isKycModalOpen, closeKycModal, isHostModalOpen, closeHostModal } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#030712] via-[#080d1a] to-[#020617] text-slate-100 selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      
      {/* Ambient Blue & Cyan Light Blooms */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-indigo-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-[600px] -left-40 w-[600px] h-[400px] bg-blue-600/10 blur-[140px] rounded-full" />
        <div className="absolute top-[1200px] -right-40 w-[600px] h-[400px] bg-cyan-600/10 blur-[140px] rounded-full" />
      </div>

      <Navbar />
      
      <main className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehicles" element={<VehicleDiscovery />} />
          <Route path="/vehicles/:id" element={<VehicleDetailsPage />} />
          <Route path="/vehicle/:id" element={<VehicleDetailsPage />} />
          
          {/* AI Inspection Studio Routes */}
          <Route path="/inspections" element={<VehicleInspectionStudio />} />
          <Route path="/inspection/:bookingId" element={<VehicleInspectionStudio />} />
          <Route path="/inspection" element={<VehicleInspectionStudio />} />
          <Route path="/inspection-studio" element={<VehicleInspectionStudio />} />
          <Route path="/ai-studio" element={<VehicleInspectionStudio />} />
          <Route path="/studio" element={<VehicleInspectionStudio />} />
          <Route path="/damage-studio" element={<VehicleInspectionStudio />} />
          
          <Route path="/host" element={<HostDashboardPage />} />
          <Route path="/host/list-vehicle" element={<ListVehicle />} />
          <Route path="/host/list" element={<ListVehicle />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>

      <AuthModal />
      <KYCModal isOpen={isKycModalOpen} onClose={closeKycModal} />
      <HostApplicationModal isOpen={isHostModalOpen} onClose={closeHostModal} />

      {/* Obsidian Cyber Glass Footer */}
      <footer className="relative z-10 bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-2xl py-10 text-xs text-slate-400 mt-16 shadow-2xl shadow-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white tracking-wide">PrimeDrew P2P Mobility</span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 font-mono">
              Biometric KYC & YOLOv8 Engine
            </span>
          </div>
          <span className="text-slate-500">© {new Date().getFullYear()} PrimeDrew AI Platform. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
