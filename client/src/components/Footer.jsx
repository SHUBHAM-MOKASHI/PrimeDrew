import React from 'react';
import { Link } from 'react-router-dom';
import { FaCarAlt } from 'react-icons/fa';

export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="relative w-full bg-[#0a0a0a] text-zinc-400 pt-20 pb-12 overflow-hidden border-t border-zinc-900/80">
      {/* Upper Grid Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 md:grid-cols-6 gap-10 pb-20">
        {/* Brand Column */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <FaCarAlt className="w-5 h-5"/>
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                PrimeDrew<span className="text-sky-400">.AI</span>
              </span>
            </div>
            <p className="mt-4 text-xs text-zinc-400 leading-relaxed max-w-sm">
              Autonomous peer-to-peer vehicle sharing with real-time biometric KYC and Gemini Vision differential damage audits.
            </p>
          </div>
          <p className="mt-8 text-xs text-zinc-400">
            © copyright PrimeDrew {currentYear}. All rights reserved.
          </p>
        </div>

        {/* Navigation Column 1: Pages */}
        <div>
          <h4 className="text-sm font-semibold text-white tracking-wider mb-4">Pages</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link className="hover:text-white transition-colors" to="/vehicles">All Vehicles</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/damage-studio">AI Damage Studio</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/host">Host Studio</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/kyc">Biometric KYC</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/audit">Escrow Audits</Link></li>
          </ul>
        </div>

        {/* Navigation Column 2: Socials */}
        <div>
          <h4 className="text-sm font-semibold text-white tracking-wider mb-4">Socials</h4>
          <ul className="space-y-2.5 text-xs">
            <li><a href="https://github.com/SHUBHAM-MOKASHI" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
            <li><a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter / X</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
          </ul>
        </div>

        {/* Navigation Column 3: Legal */}
        <div>
          <h4 className="text-sm font-semibold text-white tracking-wider mb-4">Legal</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link className="hover:text-white transition-colors" to="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/terms">Terms of Service</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/escrow-policy">Escrow Policy</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/guidelines">Damage Guidelines</Link></li>
          </ul>
        </div>

        {/* Navigation Column 4: Register / Auth */}
        <div>
          <h4 className="text-sm font-semibold text-white tracking-wider mb-4">Register</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link className="hover:text-white transition-colors" to="/signup">Sign Up</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/login">Host Login</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/renter-login">Renter Login</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/forgot-password">Forgot Password</Link></li>
          </ul>
        </div>
      </div>

      {/* Massive Semi-Transparent Watermark Logo at the Bottom */}
      <div className="w-full flex justify-center items-end pointer-events-none select-none overflow-hidden pt-4">
        <h1 className="text-[clamp(4.5rem,18vw,16rem)] font-black tracking-tighter text-white/[0.04] leading-none whitespace-nowrap text-center -mb-4 md:-mb-8">
          PrimeDrew
        </h1>
      </div>
    </footer>
  );
}

export default Footer;
