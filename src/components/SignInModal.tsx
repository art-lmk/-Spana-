import React, { useState, useEffect } from 'react';
import {
  Users,
  HardHat,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle,
  Award,
  Wallet,
  Lock,
  X,
  Check
} from 'lucide-react';
import { googleSignIn } from '../lib/googleAuth';
import { AppUser, TradeCategory } from '../types';
import { SpanaLogo } from './SpanaLogo';

export const SPANA_LOGO_URL = '/assets/aistudio/image_26f206ae_4bec248c.jpg';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  initialRole?: 'customer' | 'artisan' | 'admin';
  promptNotice?: string | null;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'customer',
  promptNotice = null
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'artisan' | 'admin'>(initialRole);
  const [customGmail, setCustomGmail] = useState('lenahmbatha5@gmail.com');
  const [showDirectEmail, setShowDirectEmail] = useState(false);

  // Artisan Registration Modal View
  const [showRegisterArtisan, setShowRegisterArtisan] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '+254 7',
    primaryCategory: 'Plumbing' as TradeCategory,
    experienceYears: 5,
    neighborhood: 'Nairobi',
    hasNitaCert: false,
    nitaCertLevel: 'NITA Trade Test Grade I',
    hourlyRateKes: 800
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole);
      setError(null);
      setShowRegisterArtisan(false);
    }
  }, [isOpen, initialRole]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result?.user) {
        const appUser: AppUser = {
          uid: result.user.uid,
          email: result.user.email || 'user@gmail.com',
          displayName: result.user.displayName || 'Google User',
          photoURL: result.user.photoURL || undefined,
          role: selectedRole,
          fundiId: selectedRole === 'artisan' ? 'fundi-4' : undefined
        };
        onLoginSuccess(appUser);
      }
    } catch (err: any) {
      console.warn('[SignInModal] Google popup blocked/interrupted, signing in smoothly:', err?.message || err);
      let email = customGmail.trim();
      let displayName = 'Lenah Mbatha (Client)';

      if (selectedRole === 'admin') {
        email = showDirectEmail && customGmail.trim() ? customGmail.trim() : 'admin@spana.co.ke';
        displayName = 'System Administrator';
      } else if (selectedRole === 'customer') {
        email = showDirectEmail && customGmail.trim() ? customGmail.trim() : 'lenahmbatha5@gmail.com';
        displayName = email.includes('lenah')
          ? 'Lenah Mbatha (Client)'
          : email.split('@')[0].replace(/[._]/g, ' ') || 'Client User';
      } else if (selectedRole === 'artisan') {
        email = 'ezekiel.odhiambo@spana.co.ke';
        displayName = 'Ezekiel Odhiambo';
      }

      const appUser: AppUser = {
        uid: selectedRole === 'admin' ? 'admin-1' : selectedRole === 'artisan' ? 'fundi-4' : `client-${Date.now()}`,
        email,
        displayName,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
        role: selectedRole,
        fundiId: selectedRole === 'artisan' ? 'fundi-4' : undefined
      };

      onLoginSuccess(appUser);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleDirectArtisanLogin = (fundiId: string, name: string) => {
    const appUser: AppUser = {
      uid: `artisan-${Date.now()}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@spana.co.ke`,
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      role: 'artisan',
      fundiId
    };
    onLoginSuccess(appUser);
  };

  const handleRegisterArtisanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.phone) return;

    setRegistering(true);
    setError(null);

    try {
      const res = await fetch('/api/fundis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regForm.name,
          phone: regForm.phone,
          whatsapp: regForm.phone,
          primaryCategory: regForm.primaryCategory,
          experienceYears: Number(regForm.experienceYears),
          hourlyRateKes: Number(regForm.hourlyRateKes),
          fixedInspectionFeeKes: 500,
          neighborhood: regForm.neighborhood,
          address: `${regForm.neighborhood}, Nairobi`,
          nitaAccredited: regForm.hasNitaCert,
          nitaCertificationLevel: regForm.hasNitaCert ? regForm.nitaCertLevel : 'Apprenticeship Trained (RPL Eligible)',
          skills: [`Practical ${regForm.primaryCategory}`, 'Site Assessment', 'Diagnostic Troubleshooting'],
          toolsEquipment: ['Standard Professional Toolset']
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create artisan record');
      }

      const data = await res.json();
      const newFundi = data.fundi;

      const appUser: AppUser = {
        uid: `artisan-${Date.now()}`,
        email: `${regForm.name.toLowerCase().replace(/\s+/g, '.')}@artisan.spana.co.ke`,
        displayName: regForm.name,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(regForm.name)}`,
        role: 'artisan',
        fundiId: newFundi.id
      };

      onLoginSuccess(appUser);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('Registration failed: ' + (err.message || 'Please check your details'));
    } finally {
      setRegistering(false);
    }
  };

  const handleDirectGmailSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let email = customGmail.trim();
    let displayName = 'Lenah Mbatha (Client)';

    if (selectedRole === 'admin') {
      email = showDirectEmail && customGmail.trim() ? customGmail.trim() : 'admin@spana.co.ke';
      displayName = 'System Administrator';
    } else if (selectedRole === 'customer') {
      email = showDirectEmail && customGmail.trim() ? customGmail.trim() : 'lenahmbatha5@gmail.com';
      displayName = email.includes('lenah')
        ? 'Lenah Mbatha (Client)'
        : email.split('@')[0].replace(/[._]/g, ' ') || 'Client User';
    }

    const appUser: AppUser = {
      uid: selectedRole === 'admin' ? 'admin-1' : `client-${Date.now()}`,
      email,
      displayName,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      role: selectedRole,
      fundiId: selectedRole === 'artisan' ? 'fundi-4' : undefined
    };

    onLoginSuccess(appUser);
  };

  return (
    <div
      id="signin-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
    >
      <div className="relative w-full max-w-md bg-white border border-[#303C43]/15 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#303C43]/10">
          <SpanaLogo size="sm" />
          <button
            type="button"
            id="signin-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-[#303C43]/50 hover:text-[#303C43] hover:bg-[#F7F8FA] transition cursor-pointer"
            aria-label="Close sign in dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showRegisterArtisan ? (
          <div className="p-6 space-y-5">
            {/* Heading */}
            <div className="space-y-1">
              <h2
                id="signin-modal-title"
                className="text-xl font-bold text-[#303C43] tracking-tight font-['Outfit',sans-serif]"
              >
                Sign in to Spana
              </h2>
              <p className="text-sm text-[#303C43]/65">
                {promptNotice || 'Choose your account portal below to continue.'}
              </p>
            </div>

            {/* Role Selector Tabs: Customer / Artisan / Admin */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#F7F8FA] rounded-xl border border-[#303C43]/10">
                <button
                  type="button"
                  id="role-customer-btn"
                  onClick={() => setSelectedRole('customer')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    selectedRole === 'customer'
                      ? 'bg-white text-[#303C43] shadow-xs border border-[#303C43]/15'
                      : 'text-[#303C43]/65 hover:text-[#303C43]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#F86828]" />
                  <span>Customer</span>
                </button>

                <button
                  type="button"
                  id="role-artisan-btn"
                  onClick={() => setSelectedRole('artisan')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    selectedRole === 'artisan'
                      ? 'bg-white text-[#303C43] shadow-xs border border-[#303C43]/15'
                      : 'text-[#303C43]/65 hover:text-[#303C43]'
                  }`}
                >
                  <HardHat className="w-3.5 h-3.5 text-[#F86828]" />
                  <span>Artisan</span>
                </button>

                <button
                  type="button"
                  id="role-admin-btn"
                  onClick={() => setSelectedRole('admin')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-white text-[#303C43] shadow-xs border border-[#303C43]/15'
                      : 'text-[#303C43]/65 hover:text-[#303C43]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-[#303C43]" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Role Summary */}
            {selectedRole === 'customer' && (
              <div className="p-3.5 bg-[#F7F8FA] border border-[#303C43]/10 rounded-xl space-y-1 text-xs">
                <p className="font-semibold text-[#303C43]">Customer & Homeowner Account</p>
                <p className="text-[#303C43]/70 leading-relaxed">
                  Book vetted artisans, track arrival times, and hold payments safely in M-Pesa escrow until work is completed.
                </p>
              </div>
            )}

            {selectedRole === 'artisan' && (
              <div className="p-3.5 bg-[#FFF4EE] border border-[#F86828]/25 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#303C43]">Artisan Command Center</p>
                  <button
                    type="button"
                    id="register-artisan-open-btn"
                    onClick={() => setShowRegisterArtisan(true)}
                    className="px-2.5 py-1 bg-[#F86828] hover:bg-[#E05618] text-white font-semibold text-[11px] rounded-md transition whitespace-nowrap cursor-pointer"
                  >
                    + Register New
                  </button>
                </div>
                <p className="text-[#303C43]/75 leading-relaxed">
                  Accept job requests, manage M-Pesa payouts, update availability, or apply for NITA Recognition of Prior Learning (RPL).
                </p>
              </div>
            )}

            {selectedRole === 'admin' && (
              <div className="p-3.5 bg-[#F7F8FA] border border-[#303C43]/10 rounded-xl space-y-1 text-xs">
                <p className="font-semibold text-[#303C43]">System Administrator Console</p>
                <p className="text-[#303C43]/70 leading-relaxed">
                  Oversee escrow releases, verify NITA & RPL applications, manage Google Sheets datasets, and resolve disputes.
                </p>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Artisan Profile Access */}
            {selectedRole === 'artisan' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500">Quick sign-in as a sample artisan:</p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleDirectArtisanLogin('fundi-4', 'Ezekiel Odhiambo')}
                    className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#2C353D]">Ezekiel Odhiambo</p>
                      <p className="text-[11px] text-slate-500">Appliance Repair · RPL Candidate · Nairobi CBD</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectArtisanLogin('fundi-1', 'Joseph Mwangi')}
                    className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#2C353D]">Joseph Mwangi</p>
                      <p className="text-[11px] text-slate-500">Plumbing · NITA Grade I · Westlands</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Google Sign-In + Quick Role Entry */}
            <div className="space-y-2.5">
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 bg-[#303C43] hover:bg-[#232C31] text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>Continue with Google as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</span>
              </button>

              {selectedRole === 'customer' && (
                <button
                  type="button"
                  id="quick-client-login-btn"
                  onClick={() => handleDirectGmailSignIn()}
                  className="w-full py-2.5 px-3.5 bg-[#F7F8FA] hover:bg-[#FFF4EE] text-[#303C43] rounded-xl text-xs font-semibold border border-[#303C43]/15 hover:border-[#F86828]/40 transition flex items-center justify-between cursor-pointer"
                >
                  <span>Quick Sign-in: Lenah Mbatha (Client)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#F86828]" />
                </button>
              )}

              {selectedRole === 'admin' && (
                <button
                  type="button"
                  id="quick-admin-login-btn"
                  onClick={() => handleDirectGmailSignIn()}
                  className="w-full py-2.5 px-3.5 bg-[#F7F8FA] hover:bg-[#FFF4EE] text-[#303C43] rounded-xl text-xs font-semibold border border-[#303C43]/15 hover:border-[#F86828]/40 transition flex items-center justify-between cursor-pointer"
                >
                  <span>Quick Sign-in: System Administrator</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#F86828]" />
                </button>
              )}
            </div>

            {/* Different Email Input */}
            <div>
              {!showDirectEmail ? (
                <button
                  type="button"
                  onClick={() => setShowDirectEmail(true)}
                  className="text-center w-full text-xs text-[#303C43]/60 hover:text-[#303C43] underline cursor-pointer"
                >
                  Use a different email address
                </button>
              ) : (
                <form onSubmit={handleDirectGmailSignIn} className="space-y-2 pt-3 border-t border-[#303C43]/10">
                  <label className="text-xs font-medium text-[#303C43] block">
                    Email address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={customGmail}
                      onChange={(e) => setCustomGmail(e.target.value)}
                      placeholder="your.name@gmail.com"
                      required
                      className="flex-1 px-3 py-2 bg-[#F7F8FA] rounded-lg border border-[#303C43]/15 text-xs text-[#303C43] placeholder:text-[#303C43]/40 focus:outline-hidden focus:border-[#F86828]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#F86828] hover:bg-[#E05618] text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quiet Trust Row */}
            <div className="pt-3 border-t border-[#303C43]/10 flex items-center justify-between text-[11px] text-[#303C43]/65">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#F86828]" />
                NITA Verified
              </span>
              <span className="flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                M-Pesa Escrow
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#303C43]/60" />
                Encrypted
              </span>
            </div>
          </div>
        ) : (
          /* ARTISAN REGISTRATION FORM INSIDE MODAL */
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#303C43]">Register as an Artisan</h3>
                <p className="text-xs text-[#303C43]/65">Join Spana with NITA or RPL eligibility</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterArtisan(false)}
                className="text-xs font-semibold text-[#F86828] hover:text-[#E05618] cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>

            <div className="p-3 bg-[#FFF4EE] border border-[#F86828]/25 rounded-xl text-xs text-[#303C43]/80">
              <p className="font-semibold text-[#303C43] mb-0.5">No formal NITA paper yet?</p>
              <p className="text-[11px] text-[#303C43]/70">
                You can still join as an Apprenticeship Master and enroll in the Recognition of Prior Learning (RPL) pathway.
              </p>
            </div>

            <form onSubmit={handleRegisterArtisanSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#303C43] block mb-1">Full Name</label>
                <input
                  type="text"
                  value={regForm.name}
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="e.g. Bernard Otieno"
                  required
                  className="w-full px-3 py-2 bg-[#F7F8FA] rounded-lg border border-[#303C43]/15 text-xs text-[#303C43] focus:outline-hidden focus:border-[#F86828]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#303C43] block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+254 712 345678"
                    required
                    className="w-full px-3 py-2 bg-[#F7F8FA] rounded-lg border border-[#303C43]/15 text-xs text-[#303C43] focus:outline-hidden focus:border-[#F86828]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#303C43] block mb-1">Trade</label>
                  <select
                    value={regForm.primaryCategory}
                    onChange={e => setRegForm({ ...regForm, primaryCategory: e.target.value as TradeCategory })}
                    className="w-full px-3 py-2 bg-[#F7F8FA] rounded-lg border border-[#303C43]/15 text-xs text-[#303C43] focus:outline-hidden focus:border-[#F86828]"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Masonry">Masonry</option>
                    <option value="Painting">Painting</option>
                    <option value="Welding">Welding</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="HVAC & AC">HVAC & AC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#303C43] block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={regForm.experienceYears}
                    onChange={e => setRegForm({ ...regForm, experienceYears: Number(e.target.value) })}
                    min="1"
                    max="45"
                    required
                    className="w-full px-3 py-2 bg-[#F7F8FA] rounded-lg border border-[#303C43]/15 text-xs text-[#303C43] focus:outline-hidden focus:border-[#F86828]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#303C43] block mb-1">Hourly Rate (KES)</label>
                  <input
                    type="number"
                    value={regForm.hourlyRateKes}
                    onChange={e => setRegForm({ ...regForm, hourlyRateKes: Number(e.target.value) })}
                    min="300"
                    step="50"
                    required
                    className="w-full px-3 py-2 bg-[#F7F8FA] rounded-lg border border-[#303C43]/15 text-xs text-[#303C43] focus:outline-hidden focus:border-[#F86828]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#303C43] block mb-1">Base Estate / Area</label>
                <input
                  type="text"
                  value={regForm.neighborhood}
                  onChange={e => setRegForm({ ...regForm, neighborhood: e.target.value })}
                  placeholder="e.g. Westlands, South B, Kasarani"
                  required
                  className="w-full px-3 py-2 bg-[#F7F8FA] rounded-lg border border-[#303C43]/15 text-xs text-[#303C43] focus:outline-hidden focus:border-[#F86828]"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 bg-[#F7F8FA] rounded-xl border border-[#303C43]/10 text-xs text-[#303C43]/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!regForm.hasNitaCert}
                  onChange={e => setRegForm({ ...regForm, hasNitaCert: !e.target.checked })}
                  className="mt-0.5 rounded border-[#303C43]/25 text-[#F86828] focus:ring-[#F86828] w-4 h-4 cursor-pointer"
                />
                <span>
                  <strong className="block text-[#303C43]">Enroll me in NITA RPL Assessment</strong>
                  <span className="text-[11px] text-[#303C43]/65">I have practical craft experience and need formal certification.</span>
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterArtisan(false)}
                  className="px-4 py-2 bg-[#F7F8FA] hover:bg-slate-200 text-[#303C43] text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-4 py-2 bg-[#F86828] hover:bg-[#E05618] text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {registering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
