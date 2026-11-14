import React, { useState } from 'react';
import { 
  X, 
  Star, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Wrench, 
  Award, 
  Check, 
  Image as ImageIcon,
  Send,
  Zap,
  HardHat
} from 'lucide-react';
import { Fundi, Review } from '../types';
import { formatDistance, estimateTravelTimeMinutes } from '../utils/distance';
import { formatCurrency } from '../utils/format';

interface FundiDetailModalProps {
  fundi: Fundi | null;
  onClose: () => void;
  onBookNow: (fundi: Fundi) => void;
  onAddReview: (fundiId: string, review: { authorName: string; rating: number; comment: string; jobType: string }) => void;
  highlightSkill?: string;
}

export const FundiDetailModal: React.FC<FundiDetailModalProps> = ({
  fundi,
  onClose,
  onBookNow,
  onAddReview,
  highlightSkill,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews'>('overview');
  
  // Review form state
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewJobType, setNewReviewJobType] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!fundi) return null;

  const distance = fundi.distanceKm ?? 0;
  const travelTime = estimateTravelTimeMinutes(distance);

  const handleWhatsApp = () => {
    const cleanPhone = fundi.whatsapp.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hi ${fundi.name}, I found your ${fundi.primaryCategory} profile on Spana and would like to request an inspection/repair in ${fundi.location.neighborhood || 'my area'}.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${fundi.phone}`;
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    onAddReview(fundi.id, {
      authorName: newReviewAuthor.trim(),
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      jobType: newReviewJobType.trim() || `${fundi.primaryCategory} Repair`
    });

    setReviewSubmitted(true);
    setNewReviewAuthor('');
    setNewReviewComment('');
    setNewReviewJobType('');
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="fundi-detail-modal"
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        
        {/* Header Bar */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <img
                src={fundi.avatarUrl}
                alt={fundi.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-orange-500/80 shadow-lg"
                referrerPolicy="no-referrer"
              />
              {fundi.isAvailableNow && (
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold border-2 border-slate-900 shadow-xs">
                  Available
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Outfit',sans-serif]">
                  {fundi.name}
                </h2>
                {fundi.artisanId && (
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-slate-200 border border-white/20 font-mono text-xs font-semibold" title={`Artisan Registration ID: ${fundi.artisanId}`}>
                    ID: {fundi.artisanId}
                  </span>
                )}
                {fundi.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Pro
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 mb-2">
                <span className="font-bold text-orange-400">{fundi.primaryCategory}</span>
                <span>•</span>
                <span>{fundi.experienceYears} Years Experience</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  {fundi.location.neighborhood}, {fundi.location.city}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1 font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>{fundi.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({fundi.reviewCount} reviews)</span>
                </div>
                <span className="text-slate-300 font-medium">
                  <strong>{fundi.jobsCompleted}</strong> Jobs Completed
                </span>
                <span className="text-slate-300 font-medium">
                  📍 <strong>{formatDistance(distance)}</strong> away (~{travelTime} min ETA)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview & Skills
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'portfolio'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Portfolio & Photos ({fundi.portfolio.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'reviews'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Reviews & Ratings ({fundi.reviews.length})
          </button>
        </div>

        {/* Tab Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Bio */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  About Artisan
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {fundi.bio}
                </p>
              </div>

              {/* Pricing Cards */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Transparent Pricing & Rates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-200/80">
                    <span className="text-xs font-medium text-slate-600 block">Standard Labor Rate</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      KES {formatCurrency(fundi.hourlyRateKes)} <span className="text-xs font-normal text-slate-500">/ hour</span>
                    </div>
                    <span className="text-[11px] text-slate-500">For ongoing repairs and installations</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-xs font-medium text-slate-600 block">Site Inspection / Assessment</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      KES {formatCurrency(fundi.fixedInspectionFeeKes)} <span className="text-xs font-normal text-slate-500">fixed</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Credited towards labor if job proceeds</span>
                  </div>
                </div>
              </div>

              {/* Skills & Specializations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Specialized Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {fundi.skills.map((skill, idx) => {
                    const normHighlight = highlightSkill ? highlightSkill.trim().toLowerCase() : '';
                    const isMatch = normHighlight && skill.toLowerCase().includes(normHighlight);
                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                          isMatch
                            ? 'bg-orange-100 text-orange-900 border-orange-300 ring-2 ring-orange-500/20 shadow-xs'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <Check className={`w-3 h-3 ${isMatch ? 'text-orange-700' : 'text-orange-600'}`} />
                        <span>{skill}</span>
                        {isMatch && (
                          <span className="text-[10px] font-bold bg-orange-600 text-white px-1.5 py-0.2 rounded-md">
                            Matched
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Tools & Equipment */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Tools & Equipment Carried
                </h4>
                <div className="flex flex-wrap gap-2">
                  {fundi.toolsEquipment.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200/80 flex items-center gap-1.5"
                    >
                      <Wrench className="w-3 h-3 text-amber-700" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trust & Verification Badges */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Trust & Security Verification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-800">National ID Verified</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-800">Criminal Record Checked</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-800">Skill Vetted Pro</span>
                  </div>
                </div>
              </div>

              {/* Official NITA Accreditation Card */}
              <div className={`p-4 rounded-2xl border ${
                fundi.nitaAccredited 
                  ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-blue-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    fundi.nitaAccredited 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {fundi.nitaAccredited 
                          ? 'NITA National Accreditation Status: VERIFIED' 
                          : 'NITA National Accreditation Status: NOT REGISTERED'}
                      </h4>
                      {fundi.nitaAccredited ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[11px] font-bold border border-blue-300">
                          Accredited Artisan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-medium">
                          Guild Apprentice
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {fundi.nitaAccredited ? (
                        <>
                          This artisan holds certified competency accreditation from the{' '}
                          <strong>National Industrial Training Authority (NITA) Kenya</strong>.
                          {fundi.nitaCertificationLevel && (
                            <span className="block mt-1 font-semibold text-blue-950">
                              Certification: {fundi.nitaCertificationLevel}
                            </span>
                          )}
                          {fundi.nitaTradeTestNo && (
                            <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                              Trade Test Ref: {fundi.nitaTradeTestNo}
                            </span>
                          )}
                        </>
                      ) : (
                        'This artisan operates under peer guild verification. Standard identity checks and customer satisfaction ratings apply.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              {fundi.portfolio.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No portfolio images uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fundi.portfolio.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-44 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-3.5">
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{item.category}</span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{item.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                        <span className="text-[10px] text-slate-400 block mt-2">Completed {item.completionDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              
              {/* Existing reviews */}
              <div className="space-y-3">
                {fundi.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                          {rev.authorName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{rev.authorName}</span>
                        {rev.verifiedJob && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Verified Job</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="text-[11px] font-semibold text-slate-500 ml-1.5">• {rev.jobType}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>

              {/* Add Review Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/70 border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Leave a Customer Review
                </h4>
                
                {reviewSubmitted ? (
                  <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Thank you! Your verified review was added.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={newReviewAuthor}
                          onChange={(e) => setNewReviewAuthor(e.target.value)}
                          placeholder="e.g. Joy Kimani"
                          className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs outline-hidden focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Job Performed</label>
                        <input
                          type="text"
                          value={newReviewJobType}
                          onChange={(e) => setNewReviewJobType(e.target.value)}
                          placeholder="e.g. Instant Shower repair"
                          className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs outline-hidden focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Rating</label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setNewReviewRating(num)}
                            className="p-1 text-amber-500 hover:scale-110 transition"
                          >
                            <Star className={`w-5 h-5 ${num <= newReviewRating ? 'fill-amber-500' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Comment</label>
                      <textarea
                        required
                        rows={2}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Describe the speed, quality, and professionalism..."
                        className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs outline-hidden focus:border-orange-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Review
                    </button>
                  </form>
                )}

              </div>

            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </button>
            <button
              onClick={handleCall}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition"
            >
              <Phone className="w-4 h-4" />
              <span>Direct Call</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onBookNow(fundi);
            }}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Book Appointment / Dispatch
          </button>
        </div>

      </div>
    </div>
  );
};
