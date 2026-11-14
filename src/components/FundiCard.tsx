import React from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  HardHat,
  Award
} from 'lucide-react';
import { Fundi } from '../types';
import { formatDistance, estimateTravelTimeMinutes } from '../utils/distance';
import { formatCurrency } from '../utils/format';

interface FundiCardProps {
  fundi: Fundi;
  isSelected: boolean;
  onSelect: (fundi: Fundi) => void;
  onBookNow: (fundi: Fundi) => void;
  onViewDetails: (fundi: Fundi) => void;
  userLocation?: any;
  highlightSkill?: string;
}

export const FundiCard: React.FC<FundiCardProps> = ({
  fundi,
  isSelected,
  onSelect,
  onBookNow,
  onViewDetails,
  highlightSkill,
}) => {
  const distance = fundi.distanceKm ?? 0;
  const travelTime = estimateTravelTimeMinutes(distance);
  const matchScore = fundi.matchScore ?? 90;

  // Match score color
  const getMatchScoreBadge = () => {
    if (matchScore >= 90) {
      return 'bg-emerald-500 text-white';
    } else if (matchScore >= 80) {
      return 'bg-amber-500 text-white';
    }
    return 'bg-slate-700 text-white';
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = fundi.whatsapp.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hi ${fundi.name}, I found your ${fundi.primaryCategory} profile on Spana and would like to inquire about a job.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${fundi.phone}`;
  };

  return (
    <div
      id={`fundi-card-${fundi.id}`}
      onClick={() => onSelect(fundi)}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 sm:p-5 ${
        isSelected
          ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md bg-orange-50/20'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Top Banner Row: Match Score & Proximity */}
      <div className="flex items-center justify-between gap-2 mb-3">
        
        {/* ML Recommendation Match Pill */}
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide shadow-xs ${getMatchScoreBadge()}`}>
            <Sparkles className="w-3 h-3 fill-current" />
            {matchScore}% Match
          </span>
          {fundi.emergencyAvailable && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <Zap className="w-2.5 h-2.5 text-rose-600 fill-rose-600" />
              Fast Dispatch
            </span>
          )}
        </div>

        {/* Calculated Distance & ETA (Click to view on bottom map) */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(fundi);
            const mapEl = document.getElementById('artisan-map-section');
            if (mapEl) {
              mapEl.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 px-2.5 py-1 rounded-lg border border-slate-200/60 transition cursor-pointer"
          title="Click to view artisan on the map at the bottom of the page"
        >
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <span>{formatDistance(distance)}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">~{travelTime}m</span>
        </div>

      </div>

      {/* Main Info Body */}
      <div className="flex gap-3.5 sm:gap-4 items-start">
        
        {/* Avatar with Availability Indicator */}
        <div 
          className="relative shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(fundi);
          }}
          title="View profile & verification certificates"
        >
          <img
            src={fundi.avatarUrl}
            alt={fundi.name}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border border-slate-200 shadow-xs hover:opacity-95 transition"
            referrerPolicy="no-referrer"
          />
          {fundi.isAvailableNow ? (
            <span 
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs" 
              title="Available Now"
            />
          ) : (
            <span 
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 border-2 border-white rounded-full shadow-xs" 
              title="Busy / Scheduled"
            />
          )}
        </div>

        {/* Profile Summary */}
        <div className="flex-1 min-w-0">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(fundi);
              }}
              className="text-base font-bold text-slate-900 truncate hover:text-orange-600 hover:underline cursor-pointer"
              title="Click to view artisan profile"
            >
              {fundi.name}
            </h3>
            {fundi.artisanId && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded-md shrink-0" title={`Artisan Registration / ID: ${fundi.artisanId}`}>
                ID: {fundi.artisanId}
              </span>
            )}
            {fundi.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-emerald-600" title="Verified Artisan with ID & Background Check">
                <ShieldCheck className="w-4 h-4 fill-emerald-100" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
            <span className="font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/50">
              {fundi.primaryCategory}
            </span>
            <span>•</span>
            <span>{fundi.experienceYears} yrs exp</span>
            <span>•</span>
            <span className="truncate text-slate-500">{fundi.location.neighborhood}</span>
          </div>

          {/* Rating & Jobs */}
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <div className="flex items-center gap-1 font-bold text-slate-900 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{fundi.rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-600 font-medium">({fundi.reviewCount} reviews)</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-semibold">{fundi.jobsCompleted} completed</span>
          </div>

          {/* NITA Accreditation Status Tag */}
          <div className="mt-2">
            {fundi.nitaAccredited ? (
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs"
                title={`Verified NITA Certification: ${fundi.nitaCertificationLevel || 'NITA Accredited'}`}
              >
                <Award className="w-3 h-3 text-blue-700 shrink-0" />
                <span className="truncate max-w-[170px]">
                  {fundi.nitaCertificationLevel || 'NITA Accredited'}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
                Non-NITA Registered
              </span>
            )}
          </div>

        </div>

      </div>

      {/* AI Match Reasons Bullets */}
      {fundi.matchReasons && fundi.matchReasons.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
          {fundi.matchReasons.slice(0, 2).map((reason, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills Chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {(() => {
          const normHighlight = highlightSkill ? highlightSkill.trim().toLowerCase() : '';
          const sortedSkills = [...fundi.skills].sort((a, b) => {
            if (!normHighlight) return 0;
            const aMatch = a.toLowerCase().includes(normHighlight);
            const bMatch = b.toLowerCase().includes(normHighlight);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });

          return (
            <>
              {sortedSkills.slice(0, 3).map((skill, i) => {
                const isMatch = normHighlight && skill.toLowerCase().includes(normHighlight);
                return (
                  <span 
                    key={i} 
                    className={`text-[10px] px-2 py-0.5 rounded-md border ${
                      isMatch
                        ? 'font-bold bg-orange-100 text-orange-900 border-orange-300 ring-1 ring-orange-400/30'
                        : 'font-medium bg-slate-100 text-slate-700 border-slate-200/60'
                    }`}
                  >
                    {skill}
                  </span>
                );
              })}
              {sortedSkills.length > 3 && (
                <span className="text-[10px] font-medium text-slate-600 px-1.5 py-0.5">
                  +{sortedSkills.length - 3} more
                </span>
              )}
            </>
          );
        })()}
      </div>

      {/* Pricing & Action Bar */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
        
        {/* Rates */}
        <div>
          <div className="text-xs text-slate-600 font-medium">From</div>
          <div className="text-sm font-extrabold text-slate-900">
            KES {formatCurrency(fundi.hourlyRateKes)}
            <span className="text-xs font-normal text-slate-600">/hr</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5">
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(fundi);
            }}
            className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition"
            title="View artisan bio, portfolio & NITA certification"
          >
            Profile
          </button>

          <button
            onClick={handleWhatsApp}
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
            title="Chat on WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={handleCall}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            title="Call Artisan"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookNow(fundi);
            }}
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm shadow-orange-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Book Fundi
          </button>

        </div>

      </div>

    </div>
  );
};
