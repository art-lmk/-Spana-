import React from 'react';
import { Award, ShieldCheck, MapPin, Users, Lock, ArrowRight } from 'lucide-react';

interface AboutSectionProps {
  isSignedIn: boolean;
  onOpenSignIn: () => void;
  onScrollToArtisans: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  isSignedIn,
  onOpenSignIn,
  onScrollToArtisans
}) => {
  return (
    <section
      id="about-section"
      className="bg-gradient-to-br from-[#FFF0E6] via-[#F6F4F3] to-[#E5EDF4] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 border-b border-[#303C43]/10"
    >
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
        {/* Top Editorial Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-0.5 bg-[#F86828]" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#F86828]">About Spana</p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#303C43] font-['Outfit',sans-serif] leading-snug">
              Connecting Kenyan homes and businesses with trusted, accountable fundis
            </h2>
            <p className="text-sm sm:text-base text-[#303C43]/80 leading-relaxed max-w-2xl">
              Finding a reliable plumber, electrician, or carpenter shouldn&apos;t depend on word-of-mouth guesswork or risky upfront cash. Spana brings verified credentials, clear KES pricing, and M-Pesa escrow protection into one open marketplace built around how Kenya actually works.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-wrap lg:justify-end items-center gap-3">
            {isSignedIn ? (
              <button
                type="button"
                onClick={onScrollToArtisans}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#F86828] hover:bg-[#E05618] text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs"
              >
                <span>Browse Artisans</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSignIn}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#F86828] hover:bg-[#E05618] text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs"
              >
                <span>Sign In to View Artisans</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-4 py-2.5 rounded-lg bg-white/80 hover:bg-white border border-[#303C43]/15 text-[#303C43] text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Clean 3-Card Trust Signals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: Dual-Tier Verification */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white/85 backdrop-blur-xs hover:bg-white border border-[#303C43]/12 hover:border-[#F86828]/50 hover:shadow-md hover:shadow-[#303C43]/10 transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFE8DA] to-[#FFF4EE] text-[#F86828] border border-[#F86828]/25 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E6EEF5] to-[#F4F8FB] text-[#303C43] border border-[#303C43]/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#303C43] font-['Outfit',sans-serif]">
                Dual-Tier Verification
              </h3>

              <p className="text-xs sm:text-sm text-[#303C43]/75 leading-relaxed">
                Every artisan on Spana passes strict screening so nobody unvetted enters your home—combining formal credentials with proven community accountability.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-3 border-t border-[#303C43]/10">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#FFF4EE] border border-[#F86828]/20 text-xs text-[#303C43]">
                <Award className="w-4 h-4 text-[#F86828] shrink-0" />
                <span>
                  <strong className="font-bold">NITA-Certified</strong> · Official government trade test grades
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#F1F5F8] border border-[#303C43]/15 text-xs text-[#303C43]">
                <Users className="w-4 h-4 text-[#303C43] shrink-0" />
                <span>
                  <strong className="font-bold">Community / Peer-Vetted</strong> · ID &amp; master guild checks
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: M-Pesa Escrow Protection */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white/85 backdrop-blur-xs hover:bg-white border border-[#303C43]/12 hover:border-[#F86828]/50 hover:shadow-md hover:shadow-[#303C43]/10 transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] text-emerald-700 border border-emerald-600/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#303C43] font-['Outfit',sans-serif]">
                M-Pesa Escrow Protection
              </h3>

              <p className="text-xs sm:text-sm text-[#303C43]/75 leading-relaxed">
                No risky upfront cash handoffs or incomplete work. Your M-Pesa payment stays ring-fenced in Spana Escrow throughout the repair.
              </p>
            </div>

            <div className="pt-3 border-t border-[#303C43]/10">
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-gradient-to-r from-emerald-50 to-[#F2FAF6] border border-emerald-600/25">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Escrow Guarantee
                  </span>
                  <p className="text-xs font-semibold text-[#303C43] leading-snug">
                    &ldquo;Funds held safely until you sign off on the job.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: AI Proximity Matching */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white/85 backdrop-blur-xs hover:bg-white border border-[#303C43]/12 hover:border-[#F86828]/50 hover:shadow-md hover:shadow-[#303C43]/10 transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFE8DA] to-[#FFF4EE] text-[#F86828] border border-[#F86828]/25 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#303C43] font-['Outfit',sans-serif]">
                AI Proximity Matching
              </h3>

              <p className="text-xs sm:text-sm text-[#303C43] font-medium leading-relaxed">
                &ldquo;Matched by exact location and skill—no endless WhatsApp group asking.&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-[#303C43]/10">
              <div className="px-3.5 py-3 rounded-lg bg-[#F4F7FA] border border-[#303C43]/12 text-xs text-[#303C43]/80 leading-snug">
                Ranks specialists in your estate and sub-county by real GPS distance, verified skill match, and live availability.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

