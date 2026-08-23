import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import AuthModal from './components/auth/AuthModal';
import Home from './pages/Home';
import VehicleDiscovery from './pages/VehicleDiscovery';
import VehicleDetailsPage from './pages/VehicleDetailsPage';
import HostDashboardPage from './pages/HostDashboardPage';
import InspectionPage from './pages/InspectionPage';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/vehicles" element={<VehicleDiscovery />} />
              <Route path="/vehicles/:id" element={<VehicleDetailsPage />} />
              <Route path="/host" element={<HostDashboardPage />} />
              <Route path="/inspections" element={<InspectionPage />} />
            </Routes>
          </main>
          <AuthModal />

          {/* Footer */}
          <footer className="bg-white border-t border-slate-100 py-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-semibold text-slate-700">PrimeDrew P2P Smart Mobility Platform</span>
              <span>© {new Date().getFullYear()} PrimeDrew. AI Biometric KYC & YOLOv8 Telemetry Engine.</span>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
