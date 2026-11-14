import React, { useState } from 'react';
import { Search, MapPin, Phone, ArrowRight, Wrench } from 'lucide-react';
import { LocationCoordinates } from '../types';
import { POPULAR_LOCATIONS } from '../data/mockFundis';
import heroCraftsmanImg from '../assets/images/spana_hero_craftsman_1794587925809.jpg';
import { StoreBadges } from './StoreBadges';

interface LandingHeroProps {
  userLocation: LocationCoordinates;
  onLocationChange: (loc: LocationCoordinates) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalArtisansCount: number;
  onBrowseArtisans: () => void;
  onOpenSignIn: () => void;
  onOpenKabambe: () => void;
  isSignedIn: boolean;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  userLocation,
  onLocationChange,
  searchQuery,
  onSearchChange,
  totalArtisansCount,
  onBrowseArtisans,
  onOpenSignIn,
  onOpenKabambe,
  isSignedIn
}) => {
  const [imgError, setImgError] = useState(false);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBrowseArtisans();
  };

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-[#E1E8F0] via-[#F2F5F8] to-[#FFE2D0] border-b border-[#303C43]/15"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F86828]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#303C43]/10 blur-3xl"
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Core Proposition & Natural Search */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#F86828] tracking-wide">
              <span>Nairobi &amp; Across Kenya</span>
              <span aria-hidden="true" className="text-[#303C43]/30">·</span>
              <span className="text-[#303C43]/75">NITA Verified Network</span>
              <span aria-hidden="true" className="text-[#303C43]/30">·</span>
              <span className="text-[#303C43]/75">M-Pesa Escrow</span>
            </div>

            <div className="space-y-4">
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#303C43] font-['Outfit',sans-serif] leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                Trusted Kenyan artisans for every repair,{' '}
                <span className="text-[#F86828]">backed by escrow.</span>
              </h1>
              <p className="text-base text-[#303C43]/75 leading-relaxed max-w-xl">
                Connect with vetted plumbers, electricians, carpenters, and appliance technicians near your estate. Compare upfront inspection rates and release M-Pesa funds only when the work is done.
              </p>
            </div>

            {/* Integrated Hero Search & Location Bar */}
            <form
              onSubmit={handleHeroSearchSubmit}
              className="bg-white p-2 rounded-xl border border-[#303C43]/15 shadow-lg shadow-[#303C43]/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-[#303C43]/40 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="What do you need fixed? (e.g. burst pipe, wiring)"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F7F8FA] focus:bg-white rounded-lg border border-transparent focus:border-[#F86828] text-sm text-[#303C43] placeholder:text-[#303C43]/45 focus:outline-hidden transition"
                />
              </div>

              <div className="relative sm:w-44 flex items-center">
                <MapPin className="w-4 h-4 text-[#F86828] absolute left-3 pointer-events-none" />
                <select
                  aria-label="Select neighborhood"
                  value={userLocation.neighborhood || ''}
                  onChange={(e) => {
                    const chosen = POPULAR_LOCATIONS.find((l) => l.name === e.target.value);
                    if (chosen) {
                      onLocationChange({
                        lat: chosen.lat,
                        lng: chosen.lng,
                        neighborhood: chosen.name,
                        address: `${chosen.name}, Nairobi, Kenya`,
                        city: 'Nairobi'
                      });
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2.5 bg-[#F7F8FA] focus:bg-white rounded-lg border border-transparent focus:border-[#F86828] text-sm text-[#303C43] font-medium focus:outline-hidden cursor-pointer transition"
                >
                  {POPULAR_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#F86828] hover:bg-[#E05618] text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <span>{isSignedIn ? 'Find Artisans' : 'Sign In & Browse'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Clean Action & Trust Links */}
            <div className="flex flex-wrap items-center gap-5 pt-1 text-sm">
              {!isSignedIn && (
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="font-semibold text-[#303C43] hover:text-[#F86828] underline underline-offset-4 decoration-[#F86828] transition cursor-pointer"
                >
                  Sign in as Customer, Artisan, or Admin
                </button>
              )}

              <button
                type="button"
                onClick={onOpenKabambe}
                className="inline-flex items-center gap-1.5 text-[#303C43]/75 hover:text-[#303C43] font-medium transition cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#F86828]" />
                <span>No smartphone? Dial <strong className="font-mono text-[#303C43]">*384*45#</strong></span>
              </button>
            </div>

            {/* Mobile App Install Badges (Google Play / App Store) */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-[#303C43]/70">Get the app:</span>
              <StoreBadges compact />
            </div>

            {/* Grounded Numeric Summary */}
            <div className="pt-5 border-t border-[#303C43]/10 grid grid-cols-3 gap-4 max-w-md tabular-nums">
              <div>
                <p className="text-2xl font-extrabold text-[#303C43]">{totalArtisansCount}+</p>
                <p className="text-xs font-medium text-[#303C43]/60">Vetted Artisans</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#F86828]">KES 500</p>
                <p className="text-xs font-medium text-[#303C43]/60">Escrow Inspection</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#303C43]">*384*45#</p>
                <p className="text-xs font-medium text-[#303C43]/60">Offline USSD</p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Hero Visual */}
          <div className="lg:col-span-6 flex">
            <div className="relative w-full rounded-2xl overflow-hidden border border-[#303C43]/15 bg-[#303C43] min-h-[320px] lg:min-h-[440px] shadow-xl shadow-[#303C43]/10">
              {!imgError ? (
                <img
                  src={heroCraftsmanImg}
                  alt="NITA-certified Kenyan tradesman inspecting residential fittings"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#303C43] text-white">
                  <Wrench className="w-10 h-10 text-[#F86828] mb-3" />
                  <p className="text-sm font-semibold">Spana Certified Artisan Network</p>
                  <p className="text-xs text-slate-300 mt-1">NITA accredited specialists across Nairobi and Kenya</p>
                </div>
              )}

              {/* Subtle Measured Scrim Caption */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1E262B]/90 via-[#303C43]/50 to-transparent p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-5 h-0.5 bg-[#F86828]" aria-hidden="true" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF9B6B]">
                    NITA Accredited Network
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-white">
                  Verified Trade Inspections Across Nairobi
                </p>
                <p className="text-xs text-slate-200 mt-0.5">
                  M-Pesa Escrow Held Until Client Sign-Off
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
