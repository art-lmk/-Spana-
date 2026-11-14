import React, { useState, useEffect } from 'react';
import { 
  HardHat, 
  ShieldCheck, 
  Award, 
  Wallet, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Edit3, 
  LogOut, 
  DollarSign, 
  ArrowUpRight, 
  Wrench, 
  Briefcase, 
  Star, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Check, 
  X, 
  Send, 
  ExternalLink,
  PlusCircle,
  Building,
  RefreshCw,
  Sliders,
  CheckCircle,
  Bell
} from 'lucide-react';
import { Fundi, AppUser, BookingResponse, RplApplication, TradeCategory } from '../types';
import { NotificationsModal } from './NotificationsModal';
import { formatCurrency } from '../utils/format';

interface ArtisanDashboardProps {
  currentUser: AppUser;
  onLogout: () => void;
  allFundis: Fundi[];
  onFundiUpdated?: (updatedFundi: Fundi) => void;
  onSwitchToMarketplace?: () => void;
}

const TRADE_CATEGORIES: TradeCategory[] = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Masonry',
  'Painting',
  'Welding',
  'Roofing',
  'HVAC',
  'Appliance Repair',
  'Solar PV & Inverters',
  'Motor Vehicle Mechanics',
  'Electronics & Appliance Repair'
];

const NITA_CENTRES = [
  'NITA Nairobi Industrial Training Centre (Commercial St)',
  'NITA Textile Training Institute (Athi River)',
  'NITA Kisumu Regional Training Centre',
  'NITA Mombasa Regional Training Centre',
  'NITA Nakuru Regional Training Centre'
];

export const ArtisanDashboard: React.FC<ArtisanDashboardProps> = ({
  currentUser,
  onLogout,
  allFundis,
  onFundiUpdated,
  onSwitchToMarketplace
}) => {
  // Active fundi state
  const [activeFundi, setActiveFundi] = useState<Fundi | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'payments' | 'profile' | 'rpl'>('overview');

  // Bookings state
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [bookingsFilter, setBookingsFilter] = useState<'all' | 'pending' | 'dispatched' | 'completed'>('all');
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  // RPL modal / state
  const [showRplModal, setShowRplModal] = useState(false);
  const [rplTargetGrade, setRplTargetGrade] = useState<'Grade III (Foundation)' | 'Grade II (Intermediate)' | 'Grade I (Master Technician)'>('Grade II (Intermediate)');
  const [rplPreferredCenter, setRplPreferredCenter] = useState(NITA_CENTRES[0]);
  const [rplWorkshop, setRplWorkshop] = useState('Independent Local Jua Kali Workshop');
  const [rplSkillsSummary, setRplSkillsSummary] = useState('');
  const [rplSubmitting, setRplSubmitting] = useState(false);
  const [rplSuccessMessage, setRplSuccessMessage] = useState<string | null>(null);
  const [rplApplications, setRplApplications] = useState<RplApplication[]>([]);

  // Profile Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    bio: '',
    primaryCategory: 'Plumbing' as TradeCategory,
    experienceYears: 5,
    hourlyRateKes: 800,
    fixedInspectionFeeKes: 500,
    neighborhood: '',
    address: '',
    emergencyAvailable: false,
    isAvailableNow: true,
    skillsString: '',
    toolsString: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);

  // Switch Artisan selector for testing
  const [showSwitchFundi, setShowSwitchFundi] = useState(false);

  // Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchArtisanNotifications = async (fundiId: string) => {
    try {
      const res = await fetch(`/api/notifications?role=artisan&recipientId=${fundiId}`);
      if (res.ok) {
        const notifs = await res.json();
        if (Array.isArray(notifs)) {
          setUnreadNotificationsCount(notifs.filter((n: any) => !n.read).length);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch artisan notifications:', err);
    }
  };

  // Find or initialize active artisan
  useEffect(() => {
    let matched: Fundi | undefined;
    if (currentUser.fundiId) {
      matched = allFundis.find(f => f.id === currentUser.fundiId);
    }
    
    // If not matched yet, try matching by email or name
    if (!matched && currentUser.email) {
      matched = allFundis.find(f => 
        f.name.toLowerCase().includes(currentUser.displayName.toLowerCase().split(' ')[0])
      );
    }

    // Default to an RPL-eligible fundi if none matched (e.g. fundi-4 Ezekiel Odhiambo, appliance repair RPL candidate)
    if (!matched) {
      matched = allFundis.find(f => !f.nitaAccredited && f.rplEligible) || allFundis[0];
    }

    if (matched) {
      setActiveFundi(matched);
      populateEditForm(matched);
    }
    setLoading(false);
  }, [currentUser.fundiId, allFundis]);

  // Load bookings for active fundi
  const fetchBookings = async (fundiId: string) => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data: BookingResponse[] = await res.json();
        // Filter for this fundi or general unassigned
        const myBookings = data.filter(b => b.details.fundiId === fundiId || b.details.fundiId === 'all');
        setBookings(myBookings);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  // Load RPL applications for active fundi
  const fetchRplApplications = async (fundiId: string) => {
    try {
      const res = await fetch(`/api/rpl/applications/${fundiId}`);
      if (res.ok) {
        const apps: RplApplication[] = await res.json();
        setRplApplications(apps);
      }
    } catch (err) {
      console.error('Failed to load RPL applications:', err);
    }
  };

  useEffect(() => {
    if (activeFundi) {
      fetchBookings(activeFundi.id);
      fetchRplApplications(activeFundi.id);
      fetchArtisanNotifications(activeFundi.id);
      const timer = setInterval(() => fetchArtisanNotifications(activeFundi.id), 8000);
      return () => clearInterval(timer);
    }
  }, [activeFundi?.id]);

  const populateEditForm = (fundi: Fundi) => {
    setEditForm({
      name: fundi.name,
      phone: fundi.phone,
      whatsapp: fundi.whatsapp || fundi.phone,
      bio: fundi.bio,
      primaryCategory: fundi.primaryCategory,
      experienceYears: fundi.experienceYears,
      hourlyRateKes: fundi.hourlyRateKes,
      fixedInspectionFeeKes: fundi.fixedInspectionFeeKes,
      neighborhood: fundi.location.neighborhood || '',
      address: fundi.location.address || '',
      emergencyAvailable: fundi.emergencyAvailable,
      isAvailableNow: fundi.isAvailableNow,
      skillsString: fundi.skills.join(', '),
      toolsString: fundi.toolsEquipment.join(', ')
    });
    setRplSkillsSummary(fundi.skills.join(', '));
  };

  const handleSelectDifferentFundi = (f: Fundi) => {
    setActiveFundi(f);
    populateEditForm(f);
    setShowSwitchFundi(false);
  };

  // Handle Booking Status Update (Accept & Dispatch, Mark Complete)
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'dispatched' | 'completed') => {
    setUpdatingBookingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          estimatedArrivalMinutes: newStatus === 'dispatched' ? 20 : 0
        })
      });

      if (res.ok) {
        const result = await res.json();
        setBookings(prev => prev.map(b => b.bookingId === bookingId ? result.booking : b));
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFundi) return;

    setSavingProfile(true);
    setProfileSuccessMessage(null);

    const skillsArray = editForm.skillsString
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const toolsArray = editForm.toolsString
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/fundis/${activeFundi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          whatsapp: editForm.whatsapp,
          bio: editForm.bio,
          primaryCategory: editForm.primaryCategory,
          experienceYears: editForm.experienceYears,
          hourlyRateKes: editForm.hourlyRateKes,
          fixedInspectionFeeKes: editForm.fixedInspectionFeeKes,
          neighborhood: editForm.neighborhood,
          address: editForm.address,
          emergencyAvailable: editForm.emergencyAvailable,
          isAvailableNow: editForm.isAvailableNow,
          skills: skillsArray.length > 0 ? skillsArray : activeFundi.skills,
          toolsEquipment: toolsArray.length > 0 ? toolsArray : activeFundi.toolsEquipment
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveFundi(data.fundi);
        if (onFundiUpdated) onFundiUpdated(data.fundi);
        setProfileSuccessMessage('Your artisan profile was successfully updated!');
        setIsEditingProfile(false);
        setTimeout(() => setProfileSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async () => {
    if (!activeFundi) return;
    const newStatus = !activeFundi.isAvailableNow;
    try {
      const res = await fetch(`/api/fundis/${activeFundi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailableNow: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveFundi(data.fundi);
        setEditForm(prev => ({ ...prev, isAvailableNow: newStatus }));
        if (onFundiUpdated) onFundiUpdated(data.fundi);
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  // Handle RPL Application Submission
  const handleSubmitRpl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFundi) return;

    setRplSubmitting(true);
    setRplSuccessMessage(null);

    try {
      const res = await fetch('/api/rpl/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundiId: activeFundi.id,
          targetGrade: rplTargetGrade,
          preferredCenter: rplPreferredCenter,
          apprenticeshipWorkshop: rplWorkshop,
          practicalSkillsSummary: rplSkillsSummary
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveFundi(data.fundi);
        setRplApplications(prev => [data.application, ...prev]);
        if (onFundiUpdated) onFundiUpdated(data.fundi);
        setRplSuccessMessage(`RPL Application submitted successfully! Reference: ${data.application.id}. KNQA assessment desk will coordinate practical assessment at ${rplPreferredCenter}.`);
        setShowRplModal(false);
      }
    } catch (err) {
      console.error('Failed to submit RPL application:', err);
    } finally {
      setRplSubmitting(false);
    }
  };

  if (loading || !activeFundi) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Calculate stats
  const totalEarned = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.details.agreedFeeKes || 0), 0);

  const pendingEscrow = bookings
    .filter(b => b.status !== 'completed' && (b.details as any).escrowStatus === 'held_in_escrow')
    .reduce((sum, b) => sum + (b.details.agreedFeeKes || 0), 0);

  const completedJobsCount = bookings.filter(b => b.status === 'completed').length;
  const pendingActionCount = bookings.filter(b => b.status === 'pending_fundi_ack' || b.status === 'confirmed').length;

  const filteredBookings = bookings.filter(b => {
    if (bookingsFilter === 'pending') return b.status === 'pending_fundi_ack' || b.status === 'confirmed';
    if (bookingsFilter === 'dispatched') return b.status === 'dispatched';
    if (bookingsFilter === 'completed') return b.status === 'completed';
    return true;
  });

  const isRplCandidate = !activeFundi.nitaAccredited || activeFundi.rplEligible;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* TOP NOTIFICATION / REMINDER BAR FOR RPL IF NOT NITA ACCREDITED */}
      {isRplCandidate && (
        <div id="rpl-reminder-banner" className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-3 border-b border-amber-500/40 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-black/20 shrink-0 mt-0.5 sm:mt-0">
                <Award className="w-5 h-5 text-amber-200 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold flex items-center gap-2 flex-wrap">
                  <span>Recognition of Prior Learning (RPL) Opportunity</span>
                  <span className="text-[10px] uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-md font-extrabold text-amber-200">
                    KNQA / NITA Framework
                  </span>
                </p>
                <p className="text-xs text-amber-100 max-w-2xl leading-relaxed">
                  You are registered as an Apprenticeship Master with <strong>{activeFundi.experienceYears}+ years</strong> field experience. 
                  You qualify to get officially <strong>NITA Certified</strong> via practical RPL assessment without classroom study!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
              {activeFundi.rplStatus === 'application_submitted' || activeFundi.rplStatus === 'assessment_scheduled' ? (
                <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/60 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>RPL Application Active ({activeFundi.rplStatus.replace('_', ' ')})</span>
                </div>
              ) : (
                <button
                  id="apply-rpl-banner-btn"
                  onClick={() => setShowRplModal(true)}
                  className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Apply for NITA RPL Now</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN TOP NAVIGATION BAR */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-white px-2.5 py-1 rounded-lg shadow-xs shrink-0 flex items-center">
              <img
                src="/assets/aistudio/image_26f206ae_4bec248c.jpg"
                alt="Spana"
                className="h-6 sm:h-7 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-md border border-orange-500/30">
                  Artisan Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Professional Artisan Command Center
              </p>
            </div>
          </div>

          {/* Right Actions: Availability status, Switch Artisan, Profile, Logout */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            
            {/* Online / Offline Toggle */}
            <button
              id="availability-toggle-btn"
              onClick={handleToggleAvailability}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
                activeFundi.isAvailableNow 
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title="Click to toggle availability for new customer bookings"
            >
              <span className={`w-2 h-2 rounded-full ${activeFundi.isAvailableNow ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="hidden sm:inline">{activeFundi.isAvailableNow ? 'Available for Jobs' : 'Offline / On Leave'}</span>
              <span className="sm:hidden">{activeFundi.isAvailableNow ? 'Online' : 'Offline'}</span>
            </button>

            {/* Test Helper: Switch Artisan profile button */}
            <button
              onClick={() => setShowSwitchFundi(!showSwitchFundi)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-700 hidden md:flex items-center gap-1.5 cursor-pointer"
              title="Switch demo artisan profile"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Switch Artisan</span>
            </button>

            {/* View Public Marketplace / Customer catalog */}
            {onSwitchToMarketplace && (
              <button
                id="artisan-view-marketplace-btn"
                onClick={onSwitchToMarketplace}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                title="Browse the customer marketplace directory"
              >
                <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">Browse Marketplace</span>
                <span className="sm:hidden">Market</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              id="artisan-notifications-bell-btn"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Job Notifications & Cash Dispatch Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Artisan Avatar & Name */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img 
                src={activeFundi.avatarUrl} 
                alt={activeFundi.name}
                className="w-9 h-9 rounded-xl object-cover border border-orange-500/30 ring-2 ring-slate-800" 
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-white truncate max-w-[120px]">{activeFundi.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{activeFundi.primaryCategory}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="artisan-logout-btn"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
              title="Log out of Artisan Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* SWITCH ARTISAN DROPDOWN OVERLAY (FOR DEMO/TESTING) */}
      {showSwitchFundi && (
        <div className="bg-slate-900 border-b border-slate-800 p-4 shadow-xl z-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Switch Active Artisan Account (Test Non-Accredited RPL vs Accredited)
              </h4>
              <button 
                onClick={() => setShowSwitchFundi(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {allFundis.slice(0, 8).map(f => (
                <button
                  key={f.id}
                  onClick={() => handleSelectDifferentFundi(f)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    activeFundi.id === f.id 
                      ? 'bg-orange-500/10 border-orange-500 text-white' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <img src={f.avatarUrl} alt={f.name} className="w-8 h-8 rounded-lg object-cover" />
                  <div className="truncate text-xs">
                    <p className="font-bold truncate">{f.name}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>{f.primaryCategory}</span>
                      <span>•</span>
                      {f.nitaAccredited ? (
                        <span className="text-emerald-400">NITA Cert</span>
                      ) : (
                        <span className="text-amber-400">RPL Candidate</span>
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex gap-2 sm:gap-6 overflow-x-auto py-2.5 scrollbar-none">
          <button
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            id="tab-bookings"
            onClick={() => setActiveTab('bookings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Clients & Bookings</span>
            {pendingActionCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingActionCount}
              </span>
            )}
          </button>

          <button
            id="tab-payments"
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Payments & Escrow</span>
            {pendingEscrow > 0 && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-1.5 py-0.2 rounded-full">
                KES {formatCurrency(pendingEscrow)}
              </span>
            )}
          </button>

          <button
            id="tab-rpl"
            onClick={() => setActiveTab('rpl')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'rpl'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>RPL Certification</span>
            {isRplCandidate && (
              <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                Eligible
              </span>
            )}
          </button>

          <button
            id="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {profileSuccessMessage && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/50 text-emerald-200 px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{profileSuccessMessage}</span>
        </div>
      )}

      {rplSuccessMessage && (
        <div className="bg-amber-950/80 border-b border-amber-500/50 text-amber-200 px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{rplSuccessMessage}</span>
        </div>
      )}

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* HERO ARTISAN IDENTITY CARD */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/5 blur-3xl pointer-events-none rounded-full" />

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                  <div className="relative">
                    <img 
                      src={activeFundi.avatarUrl} 
                      alt={activeFundi.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-orange-500/40 shadow-lg"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                      activeFundi.isAvailableNow ? 'bg-emerald-500' : 'bg-slate-600'
                    }`} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-['Outfit',sans-serif]">
                        {activeFundi.name}
                      </h2>
                      {activeFundi.nitaAccredited ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          NITA Certified ({activeFundi.nitaCertificationLevel?.split('(')[0] || 'Grade I'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          Apprenticeship Master • RPL Candidate
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 flex-wrap">
                      <span className="text-orange-400 font-semibold">{activeFundi.primaryCategory}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {activeFundi.location.neighborhood || 'Nairobi'}, Kenya
                      </span>
                      <span>•</span>
                      <span>{activeFundi.experienceYears} Years Hands-on Experience</span>
                    </p>

                    <div className="pt-1 flex items-center gap-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {activeFundi.rating} ({activeFundi.reviewCount} customer reviews)
                      </span>
                      <span>•</span>
                      <span>Rate: <strong className="text-white">KES {formatCurrency(activeFundi?.hourlyRateKes ?? 0)}/hr</strong></span>
                      <span>•</span>
                      <span>Phone: <strong className="text-slate-200">{activeFundi.phone}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-wrap gap-2.5 shrink-0 self-stretch sm:self-auto">
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Change Profile</span>
                  </button>

                  {isRplCandidate && (
                    <button
                      onClick={() => setShowRplModal(true)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>RPL Application</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* KEY METRICS BENTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Escrow Earnings */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total Earnings (Completed)</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  KES {formatCurrency(totalEarned)}
                </div>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  {completedJobsCount} jobs completed & paid via M-Pesa
                </p>
              </div>

              {/* In Escrow */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Protected in Escrow</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-400 tracking-tight">
                  KES {formatCurrency(pendingEscrow)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Released automatically upon job completion
                </p>
              </div>

              {/* Client Bookings */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Client Bookings</span>
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {bookings.length}
                </div>
                <p className="text-[11px] text-orange-400 font-medium">
                  {pendingActionCount} awaiting your dispatch
                </p>
              </div>

              {/* Accreditation & RPL Route */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Accreditation Status</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-base font-extrabold text-white truncate">
                  {activeFundi.nitaAccredited ? 'NITA Grade I' : 'RPL Candidate'}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeFundi.nitaAccredited ? activeFundi.nitaTradeTestNo : 'KNQA Prior Learning Pathway'}
                </p>
              </div>

            </div>

            {/* RECENT BOOKINGS PREVIEW & QUICK ACTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Recent Client Bookings */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>Clients Who Have Booked You</span>
                    </h3>
                    <p className="text-xs text-slate-400">Real-time requests with held escrow fees</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
                  >
                    <span>View All ({bookings.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No active client bookings yet. When clients book you from the catalog, they appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map(booking => (
                      <div 
                        key={booking.bookingId}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-white">
                                {booking.details.customerName}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                booking.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : booking.status === 'dispatched'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {booking.status === 'completed' ? 'Completed & Paid' : booking.status === 'dispatched' ? 'En Route / Dispatched' : 'Pending Acceptance'}
                              </span>
                              {booking.details.isEmergency && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                  Emergency
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                              {booking.details.jobDescription}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-emerald-400">
                              KES {formatCurrency(booking.details?.agreedFeeKes ?? booking.details?.estimatedCostKes ?? 1500)}
                            </span>
                            <p className="text-[10px] text-slate-500">
                              {(booking.details as any)?.escrowStatus === 'released_to_mpesa' ? 'M-Pesa Released' : 'In Safe Escrow'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {booking.details.location?.neighborhood || 'Nairobi'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {booking.details.customerPhone}
                            </span>
                          </div>

                          {/* Quick Action Button */}
                          {booking.status === 'pending_fundi_ack' || booking.status === 'confirmed' ? (
                            <button
                              disabled={updatingBookingId === booking.bookingId}
                              onClick={() => handleUpdateBookingStatus(booking.bookingId, 'dispatched')}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              <span>Accept & Dispatch</span>
                            </button>
                          ) : booking.status === 'dispatched' ? (
                            <button
                              disabled={updatingBookingId === booking.bookingId}
                              onClick={() => handleUpdateBookingStatus(booking.bookingId, 'completed')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              <span>Complete Job & Release Escrow</span>
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              M-Pesa Receipt: {(booking.details as any).mpesaReceiptNo || 'Verified'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Col: RPL Status & Action Box */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">NITA RPL Certification</h3>
                      <p className="text-[11px] text-slate-400">Recognition of Prior Learning</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Status:</span>
                      <strong className="text-amber-400">
                        {activeFundi.nitaAccredited 
                          ? 'Certified (Formal NITA)' 
                          : activeFundi.rplStatus 
                            ? activeFundi.rplStatus.replace('_', ' ').toUpperCase() 
                            : 'QUALIFIED TO APPLY'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-400">
                      <span>Experience Route:</span>
                      <strong className="text-slate-200 capitalize">
                        {activeFundi.experienceRoute?.replace('_', ' ') || 'Apprenticeship'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-400">
                      <span>Assigned Centre:</span>
                      <strong className="text-slate-200 text-right truncate max-w-[140px]">
                        {activeFundi.rplCenter || 'NITA Nairobi'}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Under the Kenya National Qualifications Authority (KNQA), skilled informal workers with 3+ years experience can convert hands-on competency into accredited NITA Trade Test certificates.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (isRplCandidate) {
                        setShowRplModal(true);
                      } else {
                        setActiveTab('rpl');
                      }
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{isRplCandidate ? 'Open RPL Application' : 'View Certification Profile'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================== TAB 2: CLIENTS & BOOKINGS ===================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div>
                <h3 className="text-base font-bold text-white">Client Bookings & Job Dispatch</h3>
                <p className="text-xs text-slate-400">All customer requests booked with you</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['all', 'pending', 'dispatched', 'completed'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setBookingsFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                      bookingsFilter === filter 
                        ? 'bg-orange-600 text-white' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No {bookingsFilter} bookings found</p>
                <p className="text-xs">When clients book your services, their job and location details will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBookings.map(booking => (
                  <div 
                    key={booking.bookingId}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white">
                            {booking.details.customerName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            booking.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : booking.status === 'client_completed'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : booking.status === 'dispatched'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {booking.status === 'client_completed' ? 'Client Confirmed' : booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-orange-400 font-semibold mt-0.5">
                          {booking.details.serviceCategory}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-400">
                          KES {formatCurrency(booking.details?.agreedFeeKes ?? booking.details?.estimatedCostKes ?? 1500)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {booking.status === 'completed'
                            ? 'Paid via M-Pesa'
                            : booking.status === 'client_completed'
                            ? 'Ready for Cash Dispatch'
                            : 'Held in Safe Escrow'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                      <p className="font-semibold text-slate-200">Customer Problem Description:</p>
                      <p className="text-slate-400 leading-relaxed">{booking.details.jobDescription}</p>
                    </div>

                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{booking.details.location?.address || 'Nairobi'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Scheduled: {booking.details.scheduledDate || 'Immediate'} at {booking.details.scheduledTime || 'ASAP'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <a href={`tel:${booking.details.customerPhone}`} className="text-orange-400 hover:underline">
                          {booking.details.customerPhone}
                        </a>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <a
                        href={`https://wa.me/${booking.details.customerPhone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(booking.details.customerName)},%20I%20am%20${encodeURIComponent(activeFundi.name)}%20from%20Fundi%20Connect.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>WhatsApp Client</span>
                      </a>

                      {booking.status === 'pending_fundi_ack' || booking.status === 'confirmed' ? (
                        <button
                          disabled={updatingBookingId === booking.bookingId}
                          onClick={() => handleUpdateBookingStatus(booking.bookingId, 'dispatched')}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch & Head to Client</span>
                        </button>
                      ) : booking.status === 'dispatched' ? (
                        <button
                          disabled={updatingBookingId === booking.bookingId}
                          onClick={() => handleUpdateBookingStatus(booking.bookingId, 'completed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      ) : booking.status === 'client_completed' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/70 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                          <span>Client Signed Off • Admin Dispatching Cash</span>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Paid: {booking.mpesaPayoutRef || (booking.details as any).mpesaReceiptNo || 'QMP8929104'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: PAYMENTS & ESCROW ===================== */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            
            {/* Balance Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Net Paid Out</span>
                <div className="text-3xl font-black text-white">KES {formatCurrency(totalEarned)}</div>
                <p className="text-[11px] text-slate-400">Disbursed directly to your M-Pesa line: {activeFundi.phone}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Protected Escrow Balance</span>
                <div className="text-3xl font-black text-amber-300">KES {formatCurrency(pendingEscrow)}</div>
                <p className="text-[11px] text-slate-400">Guaranteed client funds locked in Fundi Escrow vault</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Escrow Fee</span>
                <div className="text-3xl font-black text-slate-200">0% <span className="text-sm font-normal text-emerald-400">Waived</span></div>
                <p className="text-[11px] text-slate-400">Artisans retain 100% of their labor charges</p>
              </div>
            </div>

            {/* Escrow Transaction Ledger */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">M-Pesa Escrow Ledger</h3>
                  <p className="text-xs text-slate-400">Itemized audit of customer deposits and payouts</p>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                  Instant M-Pesa B2C Payouts
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Booking ID</th>
                      <th className="pb-3 font-semibold">Client</th>
                      <th className="pb-3 font-semibold">Service</th>
                      <th className="pb-3 font-semibold">Amount (KES)</th>
                      <th className="pb-3 font-semibold">Escrow State</th>
                      <th className="pb-3 font-semibold">M-Pesa Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {bookings.map(b => (
                      <tr key={b.bookingId} className="hover:bg-white/5 transition">
                        <td className="py-3 font-mono font-bold text-white">{b.bookingId}</td>
                        <td className="py-3">{b.details?.customerName || 'Client'}</td>
                        <td className="py-3 text-slate-400">{b.details?.serviceCategory || (b.details as any)?.category || 'Artisan Service'}</td>
                        <td className="py-3 font-bold text-emerald-400">KES {formatCurrency(b.details?.agreedFeeKes ?? b.details?.estimatedCostKes ?? 1500)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {b.status === 'completed' ? 'Released to M-Pesa' : 'Held in Escrow'}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-400">
                          {(b.details as any).mpesaReceiptNo || (b.status === 'completed' ? 'QMK8929104' : 'Pending Completion')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ===================== TAB 4: RPL CERTIFICATION DETAILS ===================== */}
        {activeTab === 'rpl' && (
          <div className="space-y-6">
            
            {/* RPL Information Header */}
            <div className="bg-gradient-to-br from-amber-950/90 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                      KNQA National Policy Framework
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      NITA Practical Trade Testing
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit',sans-serif]">
                    Recognition of Prior Learning (RPL)
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Recognition of Prior Learning (RPL) is a certified governmental initiative managed by the 
                    <strong> Kenya National Qualifications Authority (KNQA)</strong> and <strong>NITA</strong>. 
                    It gives experienced informal artisans who learned their craft through apprenticeships, family businesses, or on-the-job Jua Kali experience the opportunity to be assessed purely on practical skill and receive the exact same 
                    <strong> National Trade Test Certificate</strong> as graduates from formal technical colleges.
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => setShowRplModal(true)}
                    className="px-6 py-3.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-500 hover:to-orange-400 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-orange-600/30 transition flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                  >
                    <Award className="w-5 h-5" />
                    <span>Apply / Submit Portfolio</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RPL Process Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 font-black text-sm flex items-center justify-center">
                  1
                </div>
                <h4 className="text-sm font-bold text-white">Application & Portfolio</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Submit proof of 3+ years informal apprenticeship or Jua Kali practice along with customer references.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center">
                  2
                </div>
                <h4 className="text-sm font-bold text-white">Practical Assessment</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Undertake a practical hands-on trade test at your nearest NITA centre (e.g., Commercial St Nairobi or Kisumu).
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
                  3
                </div>
                <h4 className="text-sm font-bold text-white">NITA Certification</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Awarded official NITA Grade III, II, or I Master Certificate, elevating your customer trust and earnings.
                </p>
              </div>
            </div>

            {/* Existing Applications Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Your RPL Applications History</span>
              </h3>

              {rplApplications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-3">
                  <p>You haven't submitted an RPL application yet.</p>
                  <button
                    onClick={() => setShowRplModal(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition text-xs"
                  >
                    Start Your Application Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rplApplications.map(app => (
                    <div 
                      key={app.id} 
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">{app.id}</span>
                          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                            {app.targetGrade}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500/40">
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <p><strong>Center:</strong> {app.preferredCenter}</p>
                        <p><strong>Workshop:</strong> {app.apprenticeshipWorkshop}</p>
                        <p><strong>Skills:</strong> {app.practicalSkillsSummary}</p>
                        {app.scheduledAssessmentDate && (
                          <p className="text-emerald-400 font-semibold">
                            <strong>Practical Assessment Date:</strong> {app.scheduledAssessmentDate}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===================== TAB 5: PROFILE MANAGEMENT (EDIT PROFILE) ===================== */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1 border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" />
                <span>Edit Your Public Artisan Profile</span>
              </h3>
              <p className="text-xs text-slate-400">
                Update your rates, contact details, trade category, and equipment so homeowners can hire you.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Full Name / Business Name:</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Primary Trade Category:</label>
                  <select
                    value={editForm.primaryCategory}
                    onChange={e => setEditForm({ ...editForm, primaryCategory: e.target.value as TradeCategory })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  >
                    {TRADE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Direct Phone Number (For Calls):</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">WhatsApp Line (For Inquiries):</label>
                  <input
                    type="tel"
                    value={editForm.whatsapp}
                    onChange={e => setEditForm({ ...editForm, whatsapp: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Hourly Labor Rate (KES):</label>
                  <input
                    type="number"
                    value={editForm.hourlyRateKes}
                    onChange={e => setEditForm({ ...editForm, hourlyRateKes: Number(e.target.value) })}
                    min="300"
                    step="50"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Fixed Inspection Fee (KES):</label>
                  <input
                    type="number"
                    value={editForm.fixedInspectionFeeKes}
                    onChange={e => setEditForm({ ...editForm, fixedInspectionFeeKes: Number(e.target.value) })}
                    min="0"
                    step="50"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Practical Experience (Years):</label>
                  <input
                    type="number"
                    value={editForm.experienceYears}
                    onChange={e => setEditForm({ ...editForm, experienceYears: Number(e.target.value) })}
                    min="1"
                    max="45"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Primary Neighborhood / Estate:</label>
                  <input
                    type="text"
                    value={editForm.neighborhood}
                    onChange={e => setEditForm({ ...editForm, neighborhood: e.target.value })}
                    placeholder="e.g. Westlands, Kilimani, Roysambu, South B"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Workshop / Base Address:</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="e.g. Commercial Street, Industrial Area, Nairobi"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Skills (Comma-separated):</label>
                <input
                  type="text"
                  value={editForm.skillsString}
                  onChange={e => setEditForm({ ...editForm, skillsString: e.target.value })}
                  placeholder="e.g. Washing Machine Drum Bearings, Refrigeration Leak Detection, Microwave Diagnostics"
                  className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Tools & Specialized Equipment (Comma-separated):</label>
                <input
                  type="text"
                  value={editForm.toolsString}
                  onChange={e => setEditForm({ ...editForm, toolsString: e.target.value })}
                  placeholder="e.g. Digital Refrigerant Sniffer, Bearing Puller Set, True-RMS Multimeter"
                  className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Bio & Introduction for Clients:</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.emergencyAvailable}
                    onChange={e => setEditForm({ ...editForm, emergencyAvailable: e.target.checked })}
                    className="rounded-md border-slate-700 text-orange-600 focus:ring-orange-500 bg-slate-950 w-4 h-4"
                  />
                  <span>Available for 24/7 Night & Weekend Emergencies</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isAvailableNow}
                    onChange={e => setEditForm({ ...editForm, isAvailableNow: e.target.checked })}
                    className="rounded-md border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
                  />
                  <span>Currently Available for Dispatch</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-600/20 disabled:opacity-60 cursor-pointer"
                >
                  {savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Profile Changes</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* ===================== RPL APPLICATION MODAL ===================== */}
      {showRplModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">NITA Recognition of Prior Learning (RPL)</h3>
                  <p className="text-xs text-slate-400">Formal KNQA certification based on hands-on craft</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRplModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-1">
              <p className="font-bold">No Classroom Exam Required</p>
              <p className="text-amber-300/80 leading-relaxed">
                As a practicing artisan with <strong>{activeFundi.experienceYears}+ years</strong> of informal field experience, NITA will evaluate you on practical trade testing at your chosen regional centre.
              </p>
            </div>

            <form onSubmit={handleSubmitRpl} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Target Certification Grade:</label>
                <select
                  value={rplTargetGrade}
                  onChange={e => setRplTargetGrade(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-amber-500"
                >
                  <option value="Grade III (Foundation)">Grade III (Foundation - Entry Artisan)</option>
                  <option value="Grade II (Intermediate)">Grade II (Intermediate - Skilled Craftsman)</option>
                  <option value="Grade I (Master Technician)">Grade I (Master Technician - Senior Lead)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Preferred NITA Practical Assessment Centre:</label>
                <select
                  value={rplPreferredCenter}
                  onChange={e => setRplPreferredCenter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-amber-500"
                >
                  {NITA_CENTRES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Apprenticeship / Workshop Background:</label>
                <input
                  type="text"
                  value={rplWorkshop}
                  onChange={e => setRplWorkshop(e.target.value)}
                  placeholder="e.g. Kamukunji Metal Guild / Gikomba Carpentry Workshop / Family Business"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Summary of Practical Competencies for Practical Testing:</label>
                <textarea
                  rows={3}
                  value={rplSkillsSummary}
                  onChange={e => setRplSkillsSummary(e.target.value)}
                  placeholder="Describe the tasks you perform daily with confidence (e.g. copper pipe soldering, circuit breaker installation, inverter synchronizing)"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRplModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rplSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md disabled:opacity-60 cursor-pointer"
                >
                  {rplSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit RPL Application</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        Spana Artisan Hub • Empowering Kenya's skilled trades with verified credentials, NITA RPL recognition, and M-Pesa escrow protection.
      </footer>

      {/* Artisan Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          if (activeFundi?.id) fetchArtisanNotifications(activeFundi.id);
        }}
        userRole="artisan"
        userId={activeFundi?.id}
        onOpenBookings={() => {
          setActiveTab('bookings');
          setIsNotificationsOpen(false);
        }}
      />

    </div>
  );
};
