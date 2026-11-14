import React from 'react';
import { ShieldCheck, Phone, ArrowRight, Wallet } from 'lucide-react';

interface HowItWorksSectionProps {
  isSignedIn: boolean;
  onOpenSignIn: () => void;
  onOpenKabambe: () => void;
  onScrollToArtisans: () => void;
}

const STEPS = [
  {
    num: '01.',
    title: 'Pick a trade or search a skill',
    detail: 'Filter verified Kenyan artisans by specialty—from PPR pipe welding and three-phase wiring to carpentry and appliance repair—sorted by proximity to your estate.'
  },
  {
    num: '02.',
    title: 'Compare upfront inspection rates',
    detail: 'Every artisan lists fixed inspection fees, hourly KES benchmarks, toolkits, and NITA or RPL credential status before you book.'
  },
  {
    num: '03.',
    title: 'Lock payment in M-Pesa escrow',
    detail: 'Deposit the agreed fee via M-Pesa Express into Spana Escrow. Your funds remain protected while the technician travels to your site and completes the work.'
  },
  {
    num: '04.',
    title: 'Inspect, sign off & release payout',
    detail: 'Only after you verify the repair and sign off in the app (or via *384*45# USSD) does Spana release payment directly to the artisan.'
  }
];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  isSignedIn,
  onOpenSignIn,
  onOpenKabambe,
  onScrollToArtisans
}) => {
  return (
    <>
      {/* HOW IT WORKS SECTION (Rich Spana Steel Slate Gradient Band) */}
      <section
        id="how-it-works"
        className="relative overflow-hidden bg-gradient-to-br from-[#232C31] via-[#303C43] to-[#3B4A54] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-block w-6 h-0.5 bg-[#F86828]" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#FF9B6B]">How Spana works</p>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-['Outfit',sans-serif]">
                From request to signed-off repair in four straightforward steps
              </h2>
            </div>

            <button
              type="button"
              onClick={isSignedIn ? onScrollToArtisans : onOpenSignIn}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-[#FF9B6B] transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isSignedIn ? 'Browse available artisans' : 'Sign in to view artisans'}</span>
              <ArrowRight className="w-4 h-4 text-[#F86828]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-2xl bg-gradient-to-br from-[#3C4B54]/90 to-[#2A353C]/90 border border-white/12 hover:border-[#F86828]/65 transition-colors space-y-3 shadow-sm"
              >
                <span className="text-xl font-extrabold font-mono tabular-nums text-[#F86828] block">
                  {step.num}
                </span>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESCROW & OFFLINE KABAMBE USSD SECTION */}
      <section
        id="escrow-ussd"
        className="bg-gradient-to-br from-[#E4ECF3] via-[#F2F4F7] to-[#FFE7D8] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 border-b border-[#303C43]/12"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: M-Pesa Escrow */}
          <div className="bg-gradient-to-br from-white/95 to-[#EDF2F7]/95 rounded-2xl border border-[#303C43]/15 p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#303C43]">
                <Wallet className="w-4 h-4 text-[#F86828]" />
                <span>M-Pesa Escrow Protection</span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#303C43] font-['Outfit',sans-serif]">
                Zero upfront cash risk for homeowners or artisans
              </h3>
              <p className="text-sm text-[#303C43]/75 leading-relaxed">
                Clients never lose deposits to no-shows, and artisans never finish a job without guaranteed payment waiting. M-Pesa Express holds the agreed fee transparently until both sides confirm completion.
              </p>
            </div>

            <div className="pt-4 border-t border-[#303C43]/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#303C43]/70">
                <ShieldCheck className="w-4 h-4 text-[#F86828]" />
                <span>5% flat escrow platform fee · Instant M-Pesa payout</span>
              </div>
              <button
                type="button"
                onClick={onOpenSignIn}
                className="px-4 py-2.5 bg-[#303C43] hover:bg-[#232C31] text-white text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer"
              >
                Sign In to Book
              </button>
            </div>
          </div>

          {/* Card 2: Offline Kabambe (*384*45#) */}
          <div className="bg-gradient-to-br from-[#FFE8DA]/95 via-[#FFF4EE]/95 to-white/95 rounded-2xl border border-[#F86828]/30 p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F86828]">
                <Phone className="w-4 h-4" />
                <span>Feature-Phone USSD &amp; SMS Gateway</span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#303C43] font-['Outfit',sans-serif]">
                Works offline on any Kabambe via <span className="font-mono text-[#F86828]">*384*45#</span>
              </h3>
              <p className="text-sm text-[#303C43]/75 leading-relaxed">
                Not every technician or homeowner is on Wi-Fi or a smartphone. Dial <strong className="font-mono text-[#303C43]">*384*45#</strong> or text <strong className="font-mono text-[#303C43]">22450</strong> in Kiswahili or English to request a nearby artisan, check escrow status, or trigger emergency dispatch.
              </p>
            </div>

            <div className="pt-4 border-t border-[#F86828]/15 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-medium text-[#303C43]/70">
                Interactive GSM USSD &amp; SMS simulator built in
              </span>
              <button
                type="button"
                onClick={onOpenKabambe}
                className="px-4 py-2.5 bg-[#F86828] hover:bg-[#E05618] text-white text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer shadow-xs"
              >
                Open Kabambe Simulator
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
