import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  ShieldAlert, 
  ArrowRight, 
  Loader2, 
  DollarSign, 
  HelpCircle,
  Award
} from 'lucide-react';
import { ProblemDiagnosis, TradeCategory } from '../types';
import { formatCurrency } from '../utils/format';

interface AiTroubleshootModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiagnosisCategory: (category: TradeCategory, query?: string) => void;
}

const PRESET_PROBLEMS = [
  '🇰🇪 Sheng: Instant shower inashoot stima keja na inachoma fuse mara moja.',
  '🇹🇿🇰🇪 Swahili: Bomba kuu limepasuka ukutani na maji mengi yanamwagika.',
  'Water is dripping through the ceiling near a light fixture and the circuit breaker tripped.',
  'Washing machine refuses to drain water and vibrates aggressively on spin cycle.',
  'Sliding compound gate motor is humming loudly but refusing to open.',
  'Hardwood front door swollen and completely jammed after heavy rainfall.'
];

export const AiTroubleshootModal: React.FC<AiTroubleshootModalProps> = ({
  isOpen,
  onClose,
  onApplyDiagnosisCategory,
}) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<ProblemDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (textToDiagnose?: string) => {
    const text = textToDiagnose || description;
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemDescription: text })
      });

      if (!res.ok) {
        throw new Error('Failed to diagnose issue');
      }

      const data: ProblemDiagnosis = await res.json();
      setDiagnosis(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during diagnosis');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!diagnosis) return;
    onApplyDiagnosisCategory(diagnosis.suggestedCategory, diagnosis.recommendedSkills[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="ai-triage-modal"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-7 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-amber-200 fill-amber-200" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-['Outfit',sans-serif]">
              AI Smart Issue Triage
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-100 max-w-lg">
            Describe what’s broken or leaking in plain English. Gemini AI analyzes safety risks, estimates repair costs, and routes you to the exact right local fundi.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Input Area */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              What seems to be the problem?
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. My instant shower has cold water and sparks when I flip the bathroom switch, also water pressure is low..."
                className="w-full p-3.5 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-sm text-slate-900 outline-hidden transition"
              />
            </div>
          </div>

          {/* Preset Prompts */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Or tap a common scenario:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PROBLEMS.slice(0, 4).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDescription(preset);
                    handleAnalyze(preset);
                  }}
                  className="text-left text-[11px] bg-slate-100 hover:bg-orange-50 hover:text-orange-900 hover:border-orange-200 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 transition"
                >
                  {preset.slice(0, 45)}...
                </button>
              ))}
            </div>
          </div>

          {/* Diagnose Button */}
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !description.trim()}
            className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm shadow-orange-600/30 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Issue & Triaging Skills...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Diagnose with AI</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
              {error}
            </div>
          )}

          {/* Diagnosis Result Card */}
          {diagnosis && (
            <div className="space-y-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
              
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
                
                {/* Result Title & Urgency */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                      Recommended Trade
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      {diagnosis.suggestedCategory} Professional
                    </h3>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    diagnosis.urgencyLevel === 'critical_emergency' || diagnosis.urgencyLevel === 'high'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {diagnosis.urgencyLevel.replace('_', ' ')}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {diagnosis.problemSummary}
                </p>

                {/* Cost Estimate */}
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70">
                  <div className="text-[11px] font-bold text-amber-900 uppercase">Estimated Budget (Labor + Typical Spares)</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    KES {formatCurrency(diagnosis.estimatedCostRangeKes?.min ?? 500)} - KES {formatCurrency(diagnosis.estimatedCostRangeKes?.max ?? 4500)}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{diagnosis.estimatedCostRangeKes?.explanation}</div>
                </div>

                {/* NITA National Quality Standard */}
                <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200/80 flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-950">
                    <strong className="block font-bold text-blue-900">NITA Certification Level: Grade I / II Recommended</strong>
                    <span>Spana verifies National Industrial Training Authority (NITA) trade test credentials for this trade category.</span>
                  </div>
                </div>

                {/* Safety Precautions */}
                {diagnosis.safetyPrecautions.length > 0 && (
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-200/70">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Immediate Safety Precautions</span>
                    </div>
                    <ul className="text-xs text-rose-900 space-y-1 list-disc list-inside">
                      {diagnosis.safetyPrecautions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended tools */}
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-800">Fundi Required Equipment:</strong> {diagnosis.recommendedToolsOrParts.join(', ')}
                </div>

              </div>

              {/* Action Button */}
              <button
                onClick={handleApply}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition hover:scale-[1.01]"
              >
                <span>Find Nearby {diagnosis.suggestedCategory} Fundis Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
