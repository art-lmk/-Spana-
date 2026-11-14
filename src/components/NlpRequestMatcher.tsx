import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Award, 
  ShieldCheck, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  SlidersHorizontal,
  Zap,
  ArrowRight,
  RotateCcw,
  Check,
  Star,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { Fundi, NlpMatchResult, LocationCoordinates, TradeCategory } from '../types';
import { formatDistance, estimateTravelTimeMinutes } from '../utils/distance';
import { formatCurrency } from '../utils/format';

interface NlpRequestMatcherProps {
  userLocation: LocationCoordinates;
  onBookNow: (fundi: Fundi) => void;
  onViewFundiDetails: (fundi: Fundi) => void;
  onApplyCategoryFilter?: (category: TradeCategory, query?: string) => void;
}

const PRESET_PROMPTS = [
  {
    title: '🇰🇪 Sheng: Stima inashoot & Socket inachoma',
    prompt: 'Oya niaje! Keja yangu stima inashoot cheche kwa socket ya kitchen na fuse imeblow kila nikijaribu kuwasha. Natafuta fundi wa stima wa NITA Grade I ako rada chapchap.'
  },
  {
    title: '🇹🇿🇰🇪 Swahili: Bomba limepasuka & Maji yanavuja',
    prompt: 'Habari yako! Bomba la maji ya moto limepasuka kwenye ukuta na linamwaga maji mengi chumbani. Nahitaji fundi wa mabomba mwenye mashine ya kulehemu PPR afike haraka.'
  },
  {
    title: '🇰🇪 Sheng: Kabati za mbao & Milango ya keja',
    prompt: 'Niaje msee, natafuta seremala mkali anitengenezee bespoke kitchen cabinets za mahogany na wardrobes za kisasa zikiwa na droo laini za soft-close.'
  },
  {
    title: '⚡ Three-Phase Short Circuit & Breaker Surge',
    prompt: 'I have a three-phase power tripping issue in my workshop. Circuit breakers trip whenever the heavy load turns on. Need an EPRA and NITA Grade I certified electrician with a Megger insulation tester to audit the distribution board.'
  },
  {
    title: '🚿 PPR Water Pipe Burst & Solar Booster Leak',
    prompt: 'Severe pressurized water leak from PPR pipe joint connected to rooftop solar water heater. Water dripping into gypsum ceiling. Need an experienced plumber with PPR heat fusion machine for urgent repair.'
  },
  {
    title: '❄️ Inverter Double-Door Refrigerator Not Cooling',
    prompt: 'Our Ramtons double-door inverter fridge compressor runs continuously but temperature stays warm. Need a certified appliance technician to inspect refrigerant gas levels, capillary tubes, and relay.'
  },
  {
    title: '🛡️ Heavy Automated Sliding Gate & Burglar Grilles',
    prompt: 'Need heavy-duty steel security window grilles fabricated and an automated sliding gate motor track realigned and re-welded with heavy-duty arc welding.'
  },
  {
    title: '🏠 Decra Metal Roof Leak & Valley Gutter Sealing',
    prompt: 'Heavy rain is leaking through roof valley gutters and ceiling rafters. Need a certified roofing technician with safety fall harness and bitumen waterproofing membrane to fix before the storm.'
  }
];

export const NlpRequestMatcher: React.FC<NlpRequestMatcherProps> = ({
  userLocation,
  onBookNow,
  onViewFundiDetails,
  onApplyCategoryFilter
}) => {
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nlpResult, setNlpResult] = useState<NlpMatchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Matching filters
  const [nitaOnly, setNitaOnly] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState(30);
  const [expandedSafety, setExpandedSafety] = useState(true);

  const handleAnalyzeAndMatch = async (customPrompt?: string) => {
    const textToAnalyze = customPrompt || promptText;
    if (!textToAnalyze.trim()) {
      setErrorMessage('Please type or select a request description before running NLP analysis.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/nlp-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToAnalyze.trim(),
          userLat: userLocation.lat,
          userLng: userLocation.lng,
          maxDistanceKm,
          nitaOnly
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.result) {
        setNlpResult(data.result);
      } else {
        throw new Error('Invalid response structure from NLP analysis engine');
      }
    } catch (err: any) {
      console.error('NLP request match error:', err);
      setErrorMessage(err.message || 'Failed to analyze request. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (presetPrompt: string) => {
    setPromptText(presetPrompt);
    handleAnalyzeAndMatch(presetPrompt);
  };

  const handleClear = () => {
    setPromptText('');
    setNlpResult(null);
    setErrorMessage(null);
  };

  const filteredFundis = (nlpResult?.matchingFundis || []).filter(f => {
    if (nitaOnly && !f.nitaAccredited) return false;
    return true;
  });

  const nitaAccreditedCount = filteredFundis.filter(f => f.nitaAccredited).length;

  const handleWhatsApp = (fundi: Fundi, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = fundi.whatsapp.replace(/[^0-9]/g, '');
    const diagNote = nlpResult ? ` Regarding my request: "${nlpResult.problemSummary}"` : '';
    const message = encodeURIComponent(`Hi ${fundi.name}, I found your ${fundi.primaryCategory} profile on Spana NLP Triage.${diagNote} Are you available to inspect?`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleCall = (fundi: Fundi, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${fundi.phone}`;
  };

  return (
    <div id="nlp-request-matcher-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-7 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Gemini NLP Diagnostic Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                NITA Standard Grounded
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Outfit',sans-serif]">
              Outline Your Request & Match Certified Artisans
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Describe your specific repair, installation, or fabrication issue in plain text. Our NLP model extracts required technical skills, safety guidelines, and connects you with accredited artisans possessing exact field experience.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 backdrop-blur-xs shrink-0">
            <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <div className="text-slate-300 text-[10px]">Active User Coordinates</div>
              <div className="font-bold text-white">{userLocation.neighborhood || 'Nairobi Central'} (~{userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)})</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form & Input Area */}
      <div className="p-5 sm:p-7 space-y-5 bg-slate-50/50">
        
        {/* Textarea Input Card */}
        <div className="relative bg-white rounded-2xl border border-slate-300 shadow-xs focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all p-3 sm:p-4">
          <label htmlFor="nlp-request-input" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
            Detailed Issue or Maintenance Scope
          </label>
          <textarea
            id="nlp-request-input"
            rows={4}
            value={promptText}
            onChange={(e) => {
              setPromptText(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Outline your problem (e.g., 'Instant shower heater tripping master circuit breaker in Kilimani with burnt smell. Need a certified NITA Grade I electrician with insulation tester immediately...')"
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent resize-y min-h-[90px] focus:outline-hidden"
          />

          {/* Action Bar inside textarea */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-2 flex-wrap">
            <div className="text-xs text-slate-400 font-medium">
              {promptText.length} characters • Plain English or technical phrasing supported
            </div>
            
            <div className="flex items-center gap-2">
              {promptText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={() => handleAnalyzeAndMatch()}
                disabled={isLoading || !promptText.trim()}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white text-xs font-extrabold shadow-sm shadow-orange-600/30 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Request with NLP...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-orange-200 fill-orange-200" />
                    <span>Analyze & Display Matching Artisans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preset Sample Prompts for Instant Testing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              Instant Request Templates (Click to Test NLP Triage):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESET_PROMPTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(preset.prompt)}
                className="text-left p-2.5 rounded-xl bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-300 text-slate-800 text-xs font-semibold transition group flex flex-col justify-between"
              >
                <div className="font-bold text-slate-900 group-hover:text-orange-700 flex items-center justify-between">
                  <span>{preset.title}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-orange-600 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-normal">
                  {preset.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Artisan Matching Filters:</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* NITA Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200">
              <input
                type="checkbox"
                checked={nitaOnly}
                onChange={(e) => setNitaOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-700" />
                NITA Accredited Only
              </span>
            </label>

            {/* Distance Filter */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>Search Radius:</span>
              <select
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold px-2 py-1 focus:outline-hidden"
              >
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

      </div>

      {/* NLP ANALYSIS & MATCHING RESULTS SECTION */}
      {nlpResult && (
        <div id="nlp-analysis-results" className="p-5 sm:p-7 border-t border-slate-200 space-y-6 animate-in fade-in duration-200">
          
          {/* Top Diagnosis Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-orange-500 text-white">
                    {nlpResult.identifiedCategory} Trade
                  </span>
                  
                  {nlpResult.urgencyLevel === 'critical_emergency' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Critical Emergency
                    </span>
                  )}
                  {nlpResult.urgencyLevel === 'high' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white">
                      High Priority
                    </span>
                  )}
                  {nlpResult.urgencyLevel === 'medium' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500 text-white">
                      Standard Maintenance
                    </span>
                  )}
                  {nlpResult.urgencyLevel === 'low' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500 text-white">
                      Scheduled Project
                    </span>
                  )}

                  <span className="text-xs text-slate-300 font-medium">
                    Engine: <strong className="text-slate-100 font-mono">{nlpResult.engineUsed}</strong>
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white font-['Outfit',sans-serif] leading-snug">
                  {nlpResult.problemSummary}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {nlpResult.aiAnalysisExplanation}
                </p>
              </div>

              {/* Estimated Labor & Recommended NITA Level */}
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 text-right shrink-0 space-y-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-300">Estimated Labor Budget</div>
                  <div className="text-lg font-black text-orange-400">
                    KES {formatCurrency(nlpResult.estimatedCostRangeKes?.min ?? 800)} – {formatCurrency(nlpResult.estimatedCostRangeKes?.max ?? 3500)}
                  </div>
                  <div className="text-[10px] text-slate-400">{nlpResult.estimatedCostRangeKes?.explanation}</div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] uppercase font-bold text-blue-300 flex items-center justify-end gap-1">
                    <Award className="w-3 h-3 text-blue-400" />
                    Recommended Competency
                  </div>
                  <div className="text-xs font-extrabold text-white mt-0.5">
                    {nlpResult.nitaCertificationRecommended}
                  </div>
                </div>
              </div>
            </div>

            {/* Extracted Skills & Required Tools Row */}
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Skills Extracted by Model */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  NLP Extracted Trade Skills ({nlpResult.extractedSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {nlpResult.extractedSkills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs font-semibold border border-white/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tools & Diagnostic Gear Required */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  Recommended Diagnostic Equipment
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {nlpResult.requiredEquipmentOrTools.map((tool, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 text-xs font-semibold border border-amber-400/30"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Safety Advisory Banner */}
            {nlpResult.safetyAdvisory && nlpResult.safetyAdvisory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setExpandedSafety(!expandedSafety)}
                  className="w-full flex items-center justify-between text-xs font-bold text-amber-300 hover:text-amber-200"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Immediate Safety Advisory for Homeowner ({nlpResult.safetyAdvisory.length} Precautions)
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedSafety ? 'rotate-180' : ''}`} />
                </button>

                {expandedSafety && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-200 pl-4 list-disc">
                    {nlpResult.safetyAdvisory.map((adv, idx) => (
                      <li key={idx} className="leading-relaxed">{adv}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

          </div>

          {/* ARTISANS MATCHED BY NLP LISTING */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Artisans with Matching Experience</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                    {filteredFundis.length} Qualified Found
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ranked by NLP semantic skill overlap, proximity to your location, and verified NITA accreditation status.
                </p>
              </div>

              {onApplyCategoryFilter && (
                <button
                  type="button"
                  onClick={() => onApplyCategoryFilter(nlpResult.identifiedCategory, nlpResult.extractedSkills[0])}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <span>Apply Category Filter to Main Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Empty State */}
            {filteredFundis.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <Award className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-bold text-slate-800">No matching artisans in current radius</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Try unchecking "NITA Accredited Only" or increasing the search radius to 50 km.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNitaOnly(false);
                    setMaxDistanceKm(50);
                  }}
                  className="mt-3 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Reset Filters (Show All Artisans)
                </button>
              </div>
            )}

            {/* Artisan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFundis.map((fundi, rankIdx) => {
                const distance = fundi.distanceKm ?? 0;
                const travelTime = estimateTravelTimeMinutes(distance);

                return (
                  <div
                    key={fundi.id}
                    id={`nlp-matched-fundi-${fundi.id}`}
                    onClick={() => onViewFundiDetails(fundi)}
                    className="group relative bg-white rounded-2xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all p-4.5 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      
                      {/* Top Row: Rank, Match Score & Proximity */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-slate-900 text-white">
                            #{rankIdx + 1} Fit
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-current" />
                            {fundi.matchScore ?? 90}% Match
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          <MapPin className="w-3 h-3 text-orange-600" />
                          <span>{formatDistance(distance)}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">~{travelTime}m</span>
                        </div>
                      </div>

                      {/* Artisan Details */}
                      <div className="flex gap-3 items-start">
                        <div className="relative shrink-0">
                          <img
                            src={fundi.avatarUrl}
                            alt={fundi.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                          {fundi.isAvailableNow && (
                            <span 
                              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" 
                              title="Available Now"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {fundi.name}
                            </h4>
                            {fundi.isVerified && (
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Verified Background Check" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                            <span className="font-semibold text-orange-700">{fundi.primaryCategory}</span>
                            <span>•</span>
                            <span>{fundi.experienceYears} yrs exp</span>
                            <span>•</span>
                            <span className="text-slate-500">{fundi.location.neighborhood}</span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <div className="flex items-center gap-1 font-bold text-slate-900 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{fundi.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-slate-500">({fundi.reviewCount} reviews)</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 font-semibold">{fundi.jobsCompleted} jobs</span>
                          </div>
                        </div>
                      </div>

                      {/* CRITICAL: NITA ACCREDITATION STATUS DISPLAY */}
                      <div className="mt-3">
                        {fundi.nitaAccredited ? (
                          <div className="p-2 rounded-xl bg-blue-50/90 border border-blue-200/90 flex items-start gap-2">
                            <Award className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="text-[11px] font-black text-blue-900 flex items-center gap-1 flex-wrap">
                                <span>NITA Accredited:</span>
                                <span className="text-blue-700 font-extrabold">{fundi.nitaCertificationLevel || 'NITA Grade I Pro'}</span>
                              </div>
                              {fundi.nitaTradeTestNo && (
                                <div className="text-[10px] text-blue-600/80 font-mono mt-0.5">
                                  Ref: {fundi.nitaTradeTestNo}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2 text-slate-500">
                            <Info className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-[11px] font-medium">
                              Non-NITA Registered (Peer Guild Rated)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* NLP Matched Reasons Bullets */}
                      {fundi.matchReasons && fundi.matchReasons.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                          {fundi.matchReasons.slice(0, 2).map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Relevant Skills Chips */}
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {fundi.skills.slice(0, 3).map((skill, i) => (
                          <span 
                            key={i} 
                            className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                    </div>

                    {/* Rates & Actions Bar */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Rate from</div>
                        <div className="text-sm font-black text-slate-900">
                          KES {formatCurrency(fundi.hourlyRateKes)}
                          <span className="text-[11px] font-normal text-slate-500">/hr</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleWhatsApp(fundi, e)}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleCall(fundi, e)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                          title="Call Artisan"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookNow(fundi);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm shadow-orange-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
