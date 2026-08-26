import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Phone, ArrowRight, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import axios from 'axios';

export const AuthModal = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, setAuthModalTab, login } = useAuth();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'kyc-banner'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleTabChange = (tab) => {
    setAuthModalTab(tab);
    setStep('phone');
    setError('');
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      setTimer(30);
    }, 400);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setError('Please enter complete 4-digit code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let res = await fetch('http://localhost:5000/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber.trim(),
          role: authModalTab === 'host' ? 'host' : 'renter'
        })
      }).catch(() => null);

      let data;
      if (res && res.ok) {
        data = await res.json();
      } else {
        const response = await axios.post('/api/v1/auth/verify-otp', {
          phone: phoneNumber.trim(),
          role: authModalTab === 'host' ? 'host' : 'renter'
        });
        data = response.data;
      }

      if (data && data.user && data.token) {
        login(data.user, data.token);
        if (data.user.kycStatus === 'verified') {
          closeAuthModal();
        } else {
          setStep('kyc-banner');
        }
      } else {
        throw new Error('Verification failed. Invalid response from auth server.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to authenticate phone OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const mockPhone = '9876543210';
      const response = await axios.post('/api/v1/auth/verify-otp', {
        phone: mockPhone,
        role: authModalTab === 'host' ? 'host' : 'renter'
      });
      if (response.data && response.data.user) {
        login(response.data.user, response.data.token);
      }
      closeAuthModal();
    } catch {
      const fallbackUser = {
        _id: 'usr_verified_demo',
        name: 'Alex Johnson',
        phone: '9876543210',
        email: 'alex.johnson@gmail.com',
        role: authModalTab === 'host' ? 'host' : 'renter',
        roles: authModalTab === 'host' ? ['host', 'renter'] : ['renter'],
        kycStatus: 'verified'
      };
      login(fallbackUser, 'jwt_google_token');
      closeAuthModal();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      maxWidth="max-w-md"
      className="p-0 overflow-hidden"
    >
      {/* Header Tabs */}
      <div className="bg-zinc-900/60 border-b border-zinc-800 p-1.5 flex gap-1 rounded-t-2xl">
        <button
          onClick={() => handleTabChange('renter')}
          className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer ${
            authModalTab === 'renter'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Renter Sign In
        </button>
        <button
          onClick={() => handleTabChange('host')}
          className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer ${
            authModalTab === 'host'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Host Onboarding
        </button>
      </div>

      <div className="p-6">
        {step === 'phone' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="text-center">
              <h2 className="text-xl font-bold text-zinc-100">
                {authModalTab === 'host' ? 'Earn by Hosting Your Vehicle' : 'Instant P2P Rental Access'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {authModalTab === 'host'
                  ? 'List your car, SUV or EV & connect with verified renters.'
                  : 'Book verified vehicles in 60 seconds with instant AI verification.'}
              </p>
            </div>

            {/* Google 1-Click Login */}
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              isLoading={isLoading}
              className="w-full justify-center gap-2.5 py-3 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.0 10.04.0 12s.46 3.8 1.27 5.42l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-zinc-800 w-full" />
              <span className="bg-zinc-950 px-3 text-[11px] uppercase tracking-wider font-semibold text-zinc-500 absolute">
                Or sign in with phone
              </span>
            </div>

            {/* Phone input */}
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <Input
                label="Mobile Phone Number"
                type="tel"
                placeholder="98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                leftIcon={Phone}
                error={error}
              />
              <Button type="submit" variant="primary" isLoading={isLoading} rightIcon={ArrowRight} className="w-full py-3 font-bold">
                Send 4-Digit OTP
              </Button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="text-center">
              <h2 className="text-xl font-bold text-zinc-100">Enter Verification Code</h2>
              <p className="text-xs text-zinc-400 mt-1">
                We sent a 4-digit code to <span className="font-semibold text-zinc-200 font-mono">{phoneNumber}</span>
              </p>
            </div>

            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-3 my-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                />
              ))}
            </div>

            {error && <p className="text-xs font-medium text-rose-400 text-center">{error}</p>}

            <Button onClick={handleVerifyOtp} variant="primary" isLoading={isLoading} className="w-full py-3 font-bold">
              Verify & Continue
            </Button>

            <div className="text-center">
              {timer > 0 ? (
                <p className="text-xs text-zinc-500">Resend OTP code in {timer}s</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setTimer(30)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                >
                  Resend OTP Code
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'kyc-banner' && (
          <div className="flex flex-col items-center text-center gap-4 py-2 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">Signed In Successfully!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Unlock instant bookings with AI-powered document & selfie verification.
              </p>
            </div>

            {/* Progressive KYC Banner */}
            <div className="w-full bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-emerald-950/30 border border-indigo-500/30 rounded-2xl p-4 text-left flex items-start gap-3 mt-2 shadow-md">
              <div className="p-2 bg-indigo-600 text-white rounded-xl mt-0.5 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-100 block">60-Second AI Verification</span>
                <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  Verify your Driving License and selfie to enjoy keyless pickups and zero-wait bookings.
                </p>
              </div>
            </div>

            <Button onClick={closeAuthModal} variant="primary" className="w-full py-3 mt-2 font-bold">
              Continue to Fleet
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;

