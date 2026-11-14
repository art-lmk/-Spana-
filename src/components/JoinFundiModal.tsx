import React, { useState } from 'react';
import { 
  X, 
  HardHat, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  DollarSign, 
  Phone, 
  Wrench, 
  User, 
  FileText
} from 'lucide-react';
import { TradeCategory } from '../types';

interface JoinFundiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFundiRegistered: () => void;
}

const CATEGORIES: TradeCategory[] = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Masonry',
  'Appliance Repair',
  'Welding',
  'Roofing',
  'HVAC & AC',
  'Landscaping'
];

export const JoinFundiModal: React.FC<JoinFundiModalProps> = ({
  isOpen,
  onClose,
  onFundiRegistered,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+254 7');
  const [primaryCategory, setPrimaryCategory] = useState<TradeCategory>('Plumbing');
  const [neighborhood, setNeighborhood] = useState('Westlands');
  const [experienceYears, setExperienceYears] = useState(5);
  const [hourlyRateKes, setHourlyRateKes] = useState(800);
  const [bio, setBio] = useState('');
  const [skillsText, setSkillsText] = useState('Leak detection, PPR Pipe Fitting, Instant Showers');
  const [emergencyAvailable, setEmergencyAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSubmitting(true);

    try {
      const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/fundis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          whatsapp: phone.trim().replace(/[^0-9]/g, ''),
          primaryCategory,
          neighborhood,
          experienceYears,
          hourlyRateKes,
          bio: bio.trim() || `Professional ${primaryCategory} expert serving ${neighborhood} and surrounding areas.`,
          skills: skills.length > 0 ? skills : [primaryCategory],
          emergencyAvailable
        })
      });

      if (res.ok) {
        setSuccess(true);
        onFundiRegistered();
      }
    } catch (err) {
      console.error('Error registering fundi:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="join-fundi-modal"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-xs">
              <HardHat className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black font-['Outfit',sans-serif]">
              Register as a Skilled Pro (Fundi)
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Join the Spana proximity network to receive high-intent customer requests directly near your workshop or location.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Welcome to Spana!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your profile has been listed on the live map and recommendation model with instant dispatch capability.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close & View on Map
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Official Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. David Karani"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (Calls & WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Primary Trade Category</label>
                  <select
                    value={primaryCategory}
                    onChange={(e) => setPrimaryCategory(e.target.value as TradeCategory)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Primary Location / Base Area</label>
                  <input
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="e.g. Westlands / Kilimani"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hourly Rate (KES)</label>
                  <input
                    type="number"
                    step="50"
                    min="300"
                    value={hourlyRateKes}
                    onChange={(e) => setHourlyRateKes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Key Skills & Equipment (Comma Separated)</label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="e.g. PPR Welding, Drain Unblocking, Instant Shower Installation"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Professional Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Briefly describe your certifications, specialties, and experience..."
                  className="w-full p-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="emergency-avail-check"
                  checked={emergencyAvailable}
                  onChange={(e) => setEmergencyAvailable(e.target.checked)}
                  className="w-4 h-4 accent-orange-600 cursor-pointer"
                />
                <label htmlFor="emergency-avail-check" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Available for Emergency Calls (&lt;30 min dispatch)
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-md transition"
              >
                {submitting ? 'Submitting Registration...' : 'Complete Artisan Registration'}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
