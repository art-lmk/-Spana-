import React from 'react';
import { Handshake, ShieldCheck, MapPin, Wrench, Phone } from 'lucide-react';
import { LocationCoordinates } from '../types';

interface LandingLogoBannerProps {
  userLocation: LocationCoordinates;
  totalArtisansCount?: number;
  onOpenKabambe?: () => void;
}

export const LandingLogoBanner: React.FC<LandingLogoBannerProps> = ({
  userLocation,
  totalArtisansCount = 38,
  onOpenKabambe
}) => {
  return (
    <section 
      id="handii-landing-logo" 
      className="w-full bg-gradient-to-b from-white via-slate-50/80 to-slate-100/50 border-b border-slate-200/90 py-5 sm:py-6 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Device-friendly Handii Logo */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          
          {/* Logo Emblem Icon */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/20 flex items-center justify-center ring-4 ring-orange-500/10">
              <Handshake className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-slate-900 border-2 border-white flex items-center justify-center text-amber-400">
              <Wrench className="w-3 h-3" />
            </div>
          </div>

          {/* Logo Typography & Tagline */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-['Outfit',sans-serif] leading-none">
                Hand<span className="text-orange-600">ii</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200/80">
                Kenya 🇰🇪
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              National Industrial Training Authority (NITA) Certified Artisans & Escrow Protection
            </p>
          </div>

        </div>

        {/* Location, USSD Offline Pill & Real-time Verified Stats Badge */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center md:justify-end text-xs text-slate-600">
          
          {onOpenKabambe && (
            <button
              onClick={onOpenKabambe}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-emerald-500/30 shadow-2xs font-semibold cursor-pointer transition active:scale-95"
              title="Click to test offline USSD for non-smartphone users (*384*45#)"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline Kabambe: <strong className="font-mono text-white">*384*45#</strong></span>
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs font-semibold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Near: <strong>{userLocation.neighborhood || userLocation.city || 'Nairobi'}</strong></span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{totalArtisansCount} Verified Fundis Available</span>
          </div>
        </div>

      </div>
    </section>
  );
};
