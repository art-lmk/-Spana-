import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Fundi, 
  LocationCoordinates, 
  RecommendationResponse, 
  TradeCategory, 
  BookingResponse,
  EscrowTransaction,
  EscrowStatus,
  AppUser
} from './types';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { AboutSection } from './components/AboutSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { SignInModal } from './components/SignInModal';
import { SpanaLogo } from './components/SpanaLogo';
import { StoreBadges } from './components/StoreBadges';
import { AdminPortal } from './components/admin/AdminPortal';
import { ArtisanDashboard } from './components/ArtisanDashboard';
import { FundiCard } from './components/FundiCard';
import { FundiMap } from './components/FundiMap';
import { FundiDetailModal } from './components/FundiDetailModal';
import { FastApiConfigModal } from './components/FastApiConfigModal';
import { BookingModal } from './components/BookingModal';
import { JoinFundiModal } from './components/JoinFundiModal';
import { BookingsHistoryModal } from './components/BookingsHistoryModal';
import { NotificationsModal } from './components/NotificationsModal';
import { KabambeSimulatorModal } from './components/KabambeSimulatorModal';
import { GoogleSheetsDatasetModal } from './components/GoogleSheetsDatasetModal';
import { INITIAL_ESCROW_TRANSACTIONS } from './data/mockEscrow';
import { INITIAL_FUNDIS, POPULAR_LOCATIONS, CATEGORY_INFO } from './data/mockFundis';
import { rankFundis } from './utils/recommender';
import { calculateDistanceKm } from './utils/distance';
import { connectEventStream } from './utils/resilience';
import { 
  AlertCircle, 
  Loader2, 
  HardHat, 
  CheckCircle2, 
  MapPin,
  FileSpreadsheet,
  WifiOff,
  Shield,
  ArrowRight,
  Crosshair,
  Search
} from 'lucide-react';
import { 
  saveCachedArtisans, 
  getCachedArtisans,
  resolveOfflineRecommendations,
  primeOfflineCache
} from './lib/offlineArtisanCache';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export default function App() {
  // Authentication State (Visitors start on the public Spana landing page)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('spana_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Portal View Mode: Customer Landing vs Admin Interface vs Artisan Portal
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('spana_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.role === 'admin';
      }
    } catch {}
    return false;
  });
  const [isArtisanView, setIsArtisanView] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('spana_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.role === 'artisan';
      }
    } catch {}
    return false;
  });

  // Sign In Popup Modal State
  const [isSignInModalOpen, setIsSignInModalOpen] = useState<boolean>(false);
  const [signInInitialRole, setSignInInitialRole] = useState<'customer' | 'artisan' | 'admin'>('customer');
  const [signInPromptNotice, setSignInPromptNotice] = useState<string | null>(null);
  const [pendingBookingFundi, setPendingBookingFundi] = useState<Fundi | null>(null);
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [gpsStatusNote, setGpsStatusNote] = useState<string | null>(null);
  const [areaSearchInput, setAreaSearchInput] = useState<string>('');
  const [isAreaSearching, setIsAreaSearching] = useState<boolean>(false);
  const autoGpsAttemptedRef = useRef<boolean>(false);

  // User Location State (Restores customer's saved area or defaults to Nairobi Westlands)
  const [userLocation, setUserLocation] = useState<LocationCoordinates>(() => {
    try {
      const savedLoc = localStorage.getItem('spana_customer_location');
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return parsed;
        }
      }
    } catch {}
    return {
      lat: -1.2685,
      lng: 36.8045,
      neighborhood: 'Nairobi - Westlands',
      address: 'Westlands, Nairobi, Kenya',
      city: 'Nairobi'
    };
  });

  const updateCustomerLocation = useCallback((loc: LocationCoordinates) => {
    setUserLocation(loc);
    setSelectedFundi(null);
    setGpsStatusNote(null);
    try {
      localStorage.setItem('spana_customer_location', JSON.stringify(loc));
    } catch {}
  }, []);

  // Filter States (Focused 10 km proximity radius by default)
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [availableNowOnly, _setAvailableNowOnly] = useState<boolean>(false);
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [minRating, _setMinRating] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'grid'>('split');

  // FastAPI Integration State (persisted in localStorage)
  const [customFastApiUrl, setCustomFastApiUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('spana_fastapi_url') || 'http://localhost:8000/recommend';
    } catch {
      return 'http://localhost:8000/recommend';
    }
  });
  const [isFastApiActive, setIsFastApiActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('spana_fastapi_active') === 'true';
    } catch {
      return false;
    }
  });

  const handleSaveFastApiUrl = useCallback((url: string) => {
    setCustomFastApiUrl(url);
    try {
      localStorage.setItem('spana_fastapi_url', url);
    } catch {}
  }, []);

  const handleToggleFastApiActive = useCallback((active: boolean) => {
    setIsFastApiActive(active);
    try {
      localStorage.setItem('spana_fastapi_active', active ? 'true' : 'false');
    } catch {}
  }, []);

  // Google Sheets Model Integration State
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);
  const [activeSheetMeta, setActiveSheetMeta] = useState<{
    title: string;
    count: number;
    sheetName: string;
    spreadsheetId: string;
  } | null>(null);

  // Recommendations Data State (Preloaded immediately with verified Kenyan artisans)
  const [recommendations, setRecommendations] = useState<Fundi[]>(() => {
    try {
      const cached = getCachedArtisans();
      const initialList = cached && cached.length > 0 ? cached : INITIAL_FUNDIS;
      return rankFundis(initialList, {
        userLat: userLocation.lat,
        userLng: userLocation.lng,
        category: 'All',
        maxDistanceKm: 10
      });
    } catch {
      return INITIAL_FUNDIS;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [responseMetadata, setResponseMetadata] = useState<RecommendationResponse | null>(null);
  const [selectedFundi, setSelectedFundi] = useState<Fundi | null>(() => {
    return INITIAL_FUNDIS[0] || null;
  });

  // Modal States
  const [detailFundi, setDetailFundi] = useState<Fundi | null>(null);
  const [bookingFundi, setBookingFundi] = useState<Fundi | null>(null);
  const [isFastApiModalOpen, setIsFastApiModalOpen] = useState<boolean>(false);
  const [isJoinFundiOpen, setIsJoinFundiOpen] = useState<boolean>(false);
  const [isBookingsHistoryOpen, setIsBookingsHistoryOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [isKabambeOpen, setIsKabambeOpen] = useState<boolean>(false);

  // Bookings Store State
  const [bookings, setBookings] = useState<BookingResponse[]>([
    {
      bookingId: 'BK-1082',
      status: 'dispatched',
      estimatedArrivalMinutes: 20,
      createdAt: '2026-09-04 09:15',
      details: {
        fundiId: 'fundi-1',
        fundiName: 'Joseph Mwangi',
        customerName: 'Lenah Mbatha',
        customerPhone: '+254 722 890 123',
        customerAddress: 'Westlands, Rhapta Road, Nairobi',
        scheduledDate: '2026-09-04',
        scheduledTimeSlot: '10:00 AM - 12:00 PM',
        jobDescription: 'Master bathroom PPR pipe burst replacement and pressure test',
        category: 'Plumbing',
        isEmergency: true,
        estimatedCostKes: 3500
      }
    },
    {
      bookingId: 'BK-1081',
      status: 'confirmed',
      estimatedArrivalMinutes: 35,
      createdAt: '2026-09-04 08:30',
      details: {
        fundiId: 'fundi-2',
        fundiName: 'Peter Kamau',
        customerName: 'Brian Otieno',
        customerPhone: '+254 711 445 990',
        customerAddress: 'Kilimani, Denis Pritt Road, Nairobi',
        scheduledDate: '2026-09-04',
        scheduledTimeSlot: '02:00 PM - 04:00 PM',
        jobDescription: 'Three-phase main consumer breaker inspection & rewiring',
        category: 'Electrical',
        isEmergency: false,
        estimatedCostKes: 4800
      }
    }
  ]);

  // Escrow Transactions Store State
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>(INITIAL_ESCROW_TRANSACTIONS);

  // Switch between Client, Artisan, and Admin roles seamlessly
  const handleSwitchRole = (newRole: 'customer' | 'artisan' | 'admin') => {
    let updatedUser: AppUser;
    if (newRole === 'admin') {
      updatedUser = {
        uid: 'admin-1',
        email: 'admin@spana.co.ke',
        displayName: 'System Administrator',
        role: 'admin'
      };
      setIsAdminView(true);
      setIsArtisanView(false);
    } else if (newRole === 'artisan') {
      const activeArtisan = recommendations.find(f => f.id === 'fundi-4') || recommendations[0];
      updatedUser = {
        uid: `artisan-${activeArtisan?.id || 'fundi-4'}`,
        email: `${activeArtisan?.name.toLowerCase().replace(/\s+/g, '.') || 'ezekiel.odhiambo'}@spana.co.ke`,
        displayName: activeArtisan?.name || 'Ezekiel Odhiambo',
        photoURL: activeArtisan?.avatarUrl,
        role: 'artisan',
        fundiId: activeArtisan?.id || 'fundi-4'
      };
      setIsArtisanView(true);
      setIsAdminView(false);
    } else {
      updatedUser = {
        uid: 'client-1',
        email: 'lenahmbatha5@gmail.com',
        displayName: 'Lenah Mbatha (Client)',
        role: 'customer'
      };
      setIsAdminView(false);
      setIsArtisanView(false);
    }

    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('spana_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Storage not available:', e);
    }
  };

  // Open Sign In Modal helper
  const openSignInModal = (role: 'customer' | 'artisan' | 'admin' = 'customer', notice: string | null = null) => {
    setSignInInitialRole(role);
    setSignInPromptNotice(notice);
    setIsSignInModalOpen(true);
  };

  // Resolve human-readable place name from coordinates (nearest known area + Nominatim reverse geocode)
  const resolvePlaceNameForCoords = useCallback(async (lat: number, lng: number) => {
    let nearest = POPULAR_LOCATIONS[0];
    let minDist = Infinity;
    for (const loc of POPULAR_LOCATIONS) {
      const d = calculateDistanceKm(lat, lng, loc.lat, loc.lng);
      if (d < minDist) {
        minDist = d;
        nearest = loc;
      }
    }
    const instantName =
      minDist <= 4
        ? nearest.name
        : minDist <= 15
          ? `Near ${nearest.name}`
          : 'Live GPS Location';

    updateCustomerLocation({
      lat,
      lng,
      neighborhood: instantName,
      address: `${instantName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      city: minDist <= 25 ? nearest.name.split(' - ')[0] : 'Local Area'
    });

    try {
      const revRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { Accept: 'application/json' } }
      );
      if (revRes.ok) {
        const revData = await revRes.json();
        const a = revData?.address || {};
        const rawParts = [
          a.neighbourhood || a.suburb || a.quarter || a.residential || a.village || a.road,
          a.city_district || a.suburb || a.town || a.county,
          a.city || a.state
        ].filter((part): part is string => Boolean(part && typeof part === 'string'));

        const uniqueParts: string[] = [];
        for (const p of rawParts) {
          if (!uniqueParts.some((u) => u.toLowerCase() === p.toLowerCase())) {
            uniqueParts.push(p);
          }
        }

        const resolvedName =
          uniqueParts.slice(0, 3).join(', ') ||
          (typeof revData?.display_name === 'string'
            ? revData.display_name.split(',').slice(0, 2).join(',').trim()
            : '') ||
          instantName;

        const resolvedCity = a.city || a.town || a.county || a.state || 'Local Area';

        updateCustomerLocation({
          lat,
          lng,
          neighborhood: resolvedName,
          address: `${resolvedName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          city: resolvedCity
        });
      }
    } catch {
      // Keep instant nearest-area name if reverse geocode network call fails
    }
  }, [updateCustomerLocation]);

  // Detect GPS location in Customer Dashboard
  const detectUserProximity = useCallback((silent: boolean = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!silent) {
        setGpsStatusNote('Live GPS is not supported in this browser. Select or type your estate/sub-county below (e.g. Njiru, Kasarani).');
      }
      return;
    }
    setIsGpsLocating(true);
    if (!silent) setGpsStatusNote(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLocating(false);
        resolvePlaceNameForCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setIsGpsLocating(false);
        if (!silent) {
          if (err && err.code === 1) {
            setGpsStatusNote('Browser or preview frame blocked live GPS access. Pick your area or type your estate/sub-county below (e.g. Njiru, Kasarani).');
          } else {
            setGpsStatusNote('Could not lock onto GPS signal automatically. Pick your area or type your estate/sub-county below (e.g. Njiru, Kasarani).');
          }
        }
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  }, [resolvePlaceNameForCoords]);

  // Quick lookup for Kenyan estates / sub-counties (instant offline-ready matching + Nominatim fallback)
  const handleAreaSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = areaSearchInput.trim();
    if (!raw) return;

    const q = raw.toLowerCase();
    const KENYA_AREA_COORDS: Array<{ keywords: string[]; name: string; lat: number; lng: number; city: string }> = [
      { keywords: ['njiru', 'kasarani sub', 'saika', 'dandora'], name: 'Nairobi - Njiru (Kasarani Sub-County)', lat: -1.2586, lng: 36.9395, city: 'Nairobi' },
      { keywords: ['chokaa', 'kangundo'], name: 'Nairobi - Chokaa / Kangundo Rd', lat: -1.2690, lng: 36.9420, city: 'Nairobi' },
      { keywords: ['mwiki', 'kasarani'], name: 'Nairobi - Kasarani / Mwiki', lat: -1.2245, lng: 36.9065, city: 'Nairobi' },
      { keywords: ['roysambu', 'zimmerman', 'githurai'], name: 'Nairobi - Roysambu', lat: -1.2215, lng: 36.8860, city: 'Nairobi' },
      { keywords: ['utawala', 'mihango'], name: 'Nairobi - Utawala', lat: -1.2830, lng: 36.9560, city: 'Nairobi' },
      { keywords: ['ruai', 'kamulu'], name: 'Nairobi - Ruai', lat: -1.2580, lng: 36.9930, city: 'Nairobi' },
      { keywords: ['kahawa', 'wendani', 'sukari'], name: 'Nairobi - Kahawa Sukari / Wendani', lat: -1.1980, lng: 36.9310, city: 'Nairobi' },
      { keywords: ['buruburu', 'umoja', 'donholm', 'komarock', 'kayole'], name: 'Nairobi - Buruburu', lat: -1.2900, lng: 36.8750, city: 'Nairobi' },
      { keywords: ['embakasi', 'fedha', 'tassia', 'imara'], name: 'Nairobi - Embakasi', lat: -1.3150, lng: 36.8900, city: 'Nairobi' },
      { keywords: ['ruiru', 'membley'], name: 'Kiambu - Ruiru', lat: -1.1489, lng: 36.9606, city: 'Ruiru' },
      { keywords: ['westlands', 'kangemi'], name: 'Nairobi - Westlands', lat: -1.2685, lng: 36.8045, city: 'Nairobi' },
      { keywords: ['kilimani', 'kileleshwa', 'hurlingham'], name: 'Nairobi - Kilimani', lat: -1.2921, lng: 36.7862, city: 'Nairobi' },
      { keywords: ['cbd', 'town', 'city centre'], name: 'Nairobi - CBD', lat: -1.2833, lng: 36.8167, city: 'Nairobi' },
      { keywords: ['karen', 'langata', 'ngong'], name: 'Nairobi - Karen', lat: -1.3197, lng: 36.7062, city: 'Nairobi' },
      { keywords: ['lavington', 'kawangware'], name: 'Nairobi - Lavington', lat: -1.2750, lng: 36.7600, city: 'Nairobi' },
      { keywords: ['parklands', 'pangani', 'muthaiga'], name: 'Nairobi - Parklands', lat: -1.2580, lng: 36.8250, city: 'Nairobi' },
      { keywords: ['south b', 'south c', 'madaraka', 'nairobi west'], name: 'Nairobi - South B', lat: -1.3050, lng: 36.8350, city: 'Nairobi' },
      { keywords: ['nyali', 'mombasa', 'bamburi'], name: 'Mombasa - Nyali', lat: -4.0350, lng: 39.7020, city: 'Mombasa' },
      { keywords: ['kisumu', 'milimani kisumu'], name: 'Kisumu - Milimani', lat: -0.1022, lng: 34.7556, city: 'Kisumu' },
      { keywords: ['nakuru'], name: 'Nakuru - Milimani', lat: -0.2833, lng: 36.0667, city: 'Nakuru' },
      { keywords: ['kitengela'], name: 'Kajiado - Kitengela', lat: -1.4748, lng: 36.9600, city: 'Kitengela' },
      { keywords: ['syokimau', 'mlolongo'], name: 'Machakos - Syokimau', lat: -1.3635, lng: 36.9278, city: 'Syokimau' },
      { keywords: ['rongai', 'ongata'], name: 'Kajiado - Ongata Rongai', lat: -1.3982, lng: 36.7438, city: 'Ongata Rongai' },
      { keywords: ['thika'], name: 'Kiambu - Thika', lat: -1.0332, lng: 37.0693, city: 'Thika' }
    ];

    const localMatch =
      KENYA_AREA_COORDS.find(item => item.keywords.some(k => q.includes(k))) ||
      POPULAR_LOCATIONS.find(p => p.name.toLowerCase().includes(q));

    if (localMatch) {
      updateCustomerLocation({
        lat: localMatch.lat,
        lng: localMatch.lng,
        neighborhood: localMatch.name,
        address: `${localMatch.name}, Kenya`,
        city: 'city' in localMatch ? localMatch.city : 'Nairobi'
      });
      setAreaSearchInput('');
      return;
    }

    setIsAreaSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ke&limit=1&q=${encodeURIComponent(raw)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (resp.ok) {
        const results = await resp.json();
        if (Array.isArray(results) && results.length > 0) {
          const hit = results[0];
          updateCustomerLocation({
            lat: Number(hit.lat),
            lng: Number(hit.lon),
            neighborhood: raw,
            address: hit.display_name || `${raw}, Kenya`,
            city: 'Kenya'
          });
          setAreaSearchInput('');
          setIsAreaSearching(false);
          return;
        }
      }
      setGpsStatusNote(`Could not match "${raw}". Please select the nearest estate from the dropdown.`);
    } catch {
      setGpsStatusNote(`Could not search "${raw}" right now. Please select the nearest estate from the dropdown.`);
    } finally {
      setIsAreaSearching(false);
    }
  };

  // Upgrade generic 'Current GPS Location' if restored from storage
  useEffect(() => {
    if (userLocation.neighborhood === 'Current GPS Location') {
      resolvePlaceNameForCoords(userLocation.lat, userLocation.lng);
    }
  }, [userLocation.neighborhood, userLocation.lat, userLocation.lng, resolvePlaceNameForCoords]);

  // Automatically attempt silent proximity detection when a customer signs in (only if no saved area yet)
  useEffect(() => {
    if (currentUser && !isAdminView && !isArtisanView && !autoGpsAttemptedRef.current) {
      autoGpsAttemptedRef.current = true;
      let hasSaved = false;
      try {
        hasSaved = Boolean(localStorage.getItem('spana_customer_location'));
      } catch {}
      if (!hasSaved) {
        detectUserProximity(true);
      }
    }
    if (!currentUser) {
      autoGpsAttemptedRef.current = false;
      setGpsStatusNote(null);
    }
  }, [currentUser, isAdminView, isArtisanView, detectUserProximity]);

  // Handle Login
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setIsSignInModalOpen(false);
    setSignInPromptNotice(null);
    try {
      localStorage.setItem('spana_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Storage not available:', e);
    }
    if (user.role === 'admin') {
      setIsAdminView(true);
      setIsArtisanView(false);
      setPendingBookingFundi(null);
    } else if (user.role === 'artisan') {
      setIsArtisanView(true);
      setIsAdminView(false);
      setPendingBookingFundi(null);
    } else {
      setIsAdminView(false);
      setIsArtisanView(false);
      let hasSaved = false;
      try {
        hasSaved = Boolean(localStorage.getItem('spana_customer_location'));
      } catch {}
      if (!hasSaved) {
        detectUserProximity(true);
      }
      if (pendingBookingFundi) {
        setBookingFundi(pendingBookingFundi);
        setPendingBookingFundi(null);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminView(false);
    setIsArtisanView(false);
    setPendingBookingFundi(null);
    setGpsStatusNote(null);
    try {
      localStorage.removeItem('spana_user');
    } catch (e) {
      console.warn('Storage not available:', e);
    }
  };

  // Handle Booking Request (requires customer sign-in or opens booking directly)
  const handleRequestBookFundi = (fundi: Fundi) => {
    if (!currentUser) {
      setPendingBookingFundi(fundi);
      openSignInModal('customer', `Sign in as a Customer to book ${fundi.name} with M-Pesa escrow protection.`);
      return;
    }
    setBookingFundi(fundi);
  };

  const handleDetectGps = () => {
    detectUserProximity(false);
  };

  // Network Connectivity State (PWA / Offline support)
  const { isOnline } = useOnlineStatus();

  // Fetch recommendations from server API, with instant offline cache fallback
  const fetchRecommendations = useCallback(async () => {
    setRecommendations(prev => {
      if (!prev || prev.length === 0) setLoading(true);
      return prev;
    });

    const requestPayload = {
      userLat: userLocation.lat,
      userLng: userLocation.lng,
      category: selectedCategory,
      searchQuery,
      skill: selectedSkill || undefined,
      maxDistanceKm: radiusKm,
      minRating,
      verifiedOnly,
      availableNowOnly,
      emergencyOnly: emergencyMode,
      customFastApiUrl: isFastApiActive ? customFastApiUrl : undefined
    };

    try {
      // If browser indicates offline, immediately resolve from cached artisan profiles
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const offlineData = resolveOfflineRecommendations(requestPayload);
        setRecommendations(offlineData.recommendations);
        setResponseMetadata(offlineData);
        if (offlineData.recommendations.length > 0) {
          setSelectedFundi(prev => prev || offlineData.recommendations[0]);
        }
        return;
      }

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load recommendations`);
      const data: RecommendationResponse = await res.json();
      
      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setResponseMetadata(data);
        saveCachedArtisans(data.recommendations);
        setSelectedFundi(prev => prev || data.recommendations[0]);
      } else {
        // Fallback: If server returned empty array (e.g. strict distance filtered everything),
        // resolve offline recommendations which auto-relaxes distance nationwide
        const offlineData = resolveOfflineRecommendations(requestPayload);
        const resolved = offlineData.recommendations.length > 0 
          ? offlineData.recommendations 
          : rankFundis(INITIAL_FUNDIS, requestPayload);
        setRecommendations(resolved);
        setResponseMetadata(offlineData);
        setSelectedFundi(prev => prev || resolved[0]);
      }
    } catch (err) {
      console.warn('Network issue fetching recommendations. Resolving from cached artisan profiles:', err);
      // Seamless offline fallback: Rank & filter cached artisan profiles with guaranteed INITIAL_FUNDIS fallback
      const offlineData = resolveOfflineRecommendations(requestPayload);
      const fallbackList = offlineData.recommendations.length > 0
        ? offlineData.recommendations
        : rankFundis(INITIAL_FUNDIS, requestPayload);
      setRecommendations(fallbackList);
      setResponseMetadata(offlineData);
      if (fallbackList.length > 0) {
        setSelectedFundi(prev => prev || fallbackList[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [userLocation, selectedCategory, searchQuery, selectedSkill, radiusKm, minRating, verifiedOnly, availableNowOnly, emergencyMode, isFastApiActive, customFastApiUrl]);

  useEffect(() => {
    // Proactively prime offline cache for artisans, categories, and skills
    primeOfflineCache();
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const fetchServerBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBookings(data);
        }
      }
    } catch (err) {
      console.error('Error fetching server bookings:', err);
    }
  };

  useEffect(() => {
    fetchServerBookings();
    
    // Connect to real-time Server-Sent Events (SSE) stream
    const disconnect = connectEventStream((eventType) => {
      if (eventType === 'BOOKING_CREATED' || eventType === 'ESCROW_STATUS_UPDATED') {
        fetchServerBookings();
      }
    }, currentUser?.role || 'client');

    return () => disconnect();
  }, [currentUser?.role]);

  // Handle dataset imported from Google Sheets
  const handleDatasetImported = (importedFundis: Fundi[], meta: { title: string; count: number; sheetName: string; spreadsheetId: string }) => {
    setActiveSheetMeta(meta);
    setRecommendations(importedFundis);
    saveCachedArtisans(importedFundis);
    if (importedFundis.length > 0) {
      setSelectedFundi(importedFundis[0]);
    }
  };

  // Handle clear custom dataset
  const handleClearCustomDataset = () => {
    setActiveSheetMeta(null);
    fetch('/api/fundis/reset-default', { method: 'POST' }).catch(() => {});
    fetchRecommendations();
  };

  // Handle customer booking created
  const handleBookingSuccess = (newBooking: BookingResponse) => {
    setBookings(prev => [newBooking, ...prev]);

    // Automatically create an Escrow transaction protecting this job
    const newEscrowTx: EscrowTransaction = {
      id: `ESC-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingId: newBooking.bookingId,
      customerName: newBooking.details.customerName,
      customerEmail: currentUser?.email || 'customer@gmail.com',
      customerPhone: newBooking.details.customerPhone,
      fundiId: newBooking.details.fundiId,
      fundiName: newBooking.details.fundiName,
      category: newBooking.details.category,
      amountKes: newBooking.details.estimatedCostKes,
      platformFeeKes: Math.round(newBooking.details.estimatedCostKes * 0.05),
      fundiPayoutKes: Math.round(newBooking.details.estimatedCostKes * 0.95),
      status: 'held_in_escrow',
      milestone: 'funds_locked',
      paymentMethod: 'M-Pesa Express',
      mpesaRef: `RK${Math.floor(100 + Math.random() * 900)}X${Math.floor(10 + Math.random() * 90)}K`,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      notes: `Booking: ${newBooking.details.jobDescription}. Funds held in escrow until quality sign-off.`
    };

    setEscrowTransactions(prev => [newEscrowTx, ...prev]);
  };

  // Update Escrow Status
  const handleUpdateEscrowStatus = (transactionId: string, newStatus: EscrowStatus, notes?: string) => {
    setEscrowTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        return {
          ...t,
          status: newStatus,
          milestone: newStatus === 'released_to_fundi' ? 'completed_released' : t.milestone,
          releasedAt: newStatus === 'released_to_fundi' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : t.releasedAt,
          notes: notes || t.notes
        };
      }
      return t;
    }));
  };

  // Fetch customer notifications
  const fetchClientNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?role=customer');
      if (res.ok) {
        const notifs = await res.json();
        if (Array.isArray(notifs)) {
          setUnreadNotificationsCount(notifs.filter((n: any) => !n.read).length);
        }
      }
    } catch (err) {
      // Graceful warmup handler to prevent spamming console errors before dev server is fully booted
      console.warn('Customer notifications endpoint warming up:', err);
    }
  }, []);

  useEffect(() => {
    fetchClientNotifications();
    const interval = setInterval(fetchClientNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchClientNotifications]);

  // Update Booking Status
  const handleUpdateBookingStatus = (bookingId: string, newStatus: BookingResponse['status']) => {
    setBookings(prev => prev.map(b => {
      if (b.bookingId === bookingId) {
        return { ...b, status: newStatus };
      }
      return b;
    }));
  };

  // Client marks artisan as completed with rating & feedback
  const handleMarkBookingAsCompleted = async (bookingId: string, rating: number, feedback?: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/client-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => {
          if (b.bookingId === bookingId) {
            return {
              ...b,
              status: 'client_completed' as const,
              rating,
              feedback,
              clientCompletedAt: new Date().toISOString()
            };
          }
          return b;
        }));
        setEscrowTransactions(prev => prev.map(t => {
          if (t.bookingId === bookingId) {
            return {
              ...t,
              milestone: 'client_signoff_pending',
              notes: `${t.notes} • Client signed off! Admin authorized to dispatch funds.`
            };
          }
          return t;
        }));
        fetchClientNotifications();
      }
    } catch (err) {
      console.error('Failed to mark booking as completed:', err);
    }
  };

  // Admin dispatches cash payout via M-Pesa to artisan
  const handleDispatchCash = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispatch-cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(prev => prev.map(b => {
          if (b.bookingId === bookingId) {
            return {
              ...b,
              status: 'completed' as const,
              mpesaPayoutRef: data.mpesaPayoutRef,
              dispatchedAt: data.dispatchedAt
            };
          }
          return b;
        }));
        setEscrowTransactions(prev => prev.map(t => {
          if (t.bookingId === bookingId) {
            return {
              ...t,
              status: 'released_to_fundi' as const,
              milestone: 'completed_released' as const,
              releasedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
              notes: `${t.notes} • Cash dispatched to artisan via M-Pesa ref ${data.mpesaPayoutRef}`
            };
          }
          return t;
        }));
        fetchClientNotifications();
      }
    } catch (err) {
      console.error('Failed to dispatch cash:', err);
    }
  };

  // Add review to a fundi
  const handleAddReview = (fundiId: string, review: any) => {
    setRecommendations(prev => prev.map(f => {
      if (f.id === fundiId) {
        const newReviews = [review, ...f.reviews];
        const newRating = Number((newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length).toFixed(1));
        return {
          ...f,
          reviews: newReviews,
          reviewCount: f.reviewCount + 1,
          rating: newRating
        };
      }
      return f;
    }));
  };

  // 1. IF ADMIN VIEW ACTIVE: SHOW COMPREHENSIVE ADMIN PORTAL
  if (currentUser && isAdminView) {
    return (
      <>
        <AdminPortal
          fundis={recommendations}
          bookings={bookings}
          escrowTransactions={escrowTransactions}
          onUpdateEscrowStatus={handleUpdateEscrowStatus}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onDispatchCash={handleDispatchCash}
          activeSheetMeta={activeSheetMeta}
          onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
          onClearCustomDataset={handleClearCustomDataset}
          onOpenFastApiModal={() => setIsFastApiModalOpen(true)}
          isFastApiActive={isFastApiActive}
          onExitAdmin={() => setIsAdminView(false)}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
        <FastApiConfigModal
          isOpen={isFastApiModalOpen}
          onClose={() => setIsFastApiModalOpen(false)}
          customFastApiUrl={customFastApiUrl}
          onSaveFastApiUrl={handleSaveFastApiUrl}
          isFastApiActive={isFastApiActive}
          onToggleActive={handleToggleFastApiActive}
        />
      </>
    );
  }

  // 2. IF ARTISAN VIEW ACTIVE: SHOW ARTISAN DASHBOARD
  if (currentUser && isArtisanView) {
    return (
      <ArtisanDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchToMarketplace={() => setIsArtisanView(false)}
        allFundis={recommendations}
        onFundiUpdated={(updatedFundi) => {
          setRecommendations(prev => prev.map(f => f.id === updatedFundi.id ? updatedFundi : f));
          if (selectedFundi?.id === updatedFundi.id) {
            setSelectedFundi(updatedFundi);
          }
        }}
      />
    );
  }

  // 3. NATURAL SPANA LANDING PAGE & CUSTOMER MARKETPLACE
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4ECF3] via-[#F4F2F0] to-[#FFE9DB] text-[#303C43] flex flex-col font-sans">
      
      {/* Clean 3-Zone Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onOpenSignIn={() => openSignInModal('customer')}
        onLogout={handleLogout}
        onOpenBookings={() => {
          if (!currentUser) {
            openSignInModal('customer', 'Sign in to view your bookings and M-Pesa escrow status.');
            return;
          }
          setIsBookingsHistoryOpen(true);
        }}
        activeBookingsCount={bookings.length}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAdminPortal={() => setIsAdminView(true)}
        onOpenArtisanPortal={() => setIsArtisanView(true)}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
        activeSheetMeta={activeSheetMeta}
      />

      {/* Administrator Preview Mode Banner */}
      {currentUser?.role === 'admin' && (
        <div className="bg-[#303C43] border-b border-[#F86828]/40 text-slate-100 px-4 py-2.5 transition-all">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FF9B6B] shrink-0" />
              <span>
                <strong>Administrator Preview:</strong> Viewing public Spana marketplace directory.
              </span>
            </div>
            <button
              onClick={() => setIsAdminView(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#F86828] hover:bg-[#E05618] text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Return to Admin Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Artisan Preview Mode Banner */}
      {currentUser?.role === 'artisan' && (
        <div className="bg-[#303C43] border-b border-[#F86828]/40 text-slate-100 px-4 py-2.5 transition-all">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-[#FF9B6B] shrink-0" />
              <span>
                <strong>Artisan Preview:</strong> Viewing public marketplace profile as <strong>{currentUser.displayName}</strong>.
              </span>
            </div>
            <button
              onClick={() => setIsArtisanView(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#F86828] hover:bg-[#E05618] text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Return to My Artisan Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Active Connected Google Sheet Status Banner - Only for Admin */}
      {activeSheetMeta && currentUser?.role === 'admin' && (
        <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 py-2.5 transition-all">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-950">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Connected Dataset: <strong className="font-bold text-emerald-900">{activeSheetMeta.title}</strong>{' '}
                {activeSheetMeta.sheetName ? `(Tab: ${activeSheetMeta.sheetName})` : ''} ·{' '}
                <strong className="text-emerald-800">{recommendations.length} artisans</strong> active on marketplace and map
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsGoogleSheetsModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] transition cursor-pointer"
              >
                Manage Sheet
              </button>
              <button
                onClick={handleClearCustomDataset}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-semibold text-[11px] transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC LANDING SECTIONS (Shown ONLY before sign-in; removed from signed-in Customer Dashboard) */}
      {!currentUser && (
        <>
          <LandingHero
            userLocation={userLocation}
            onLocationChange={(loc) => {
              updateCustomerLocation(loc);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalArtisansCount={recommendations.length}
            onBrowseArtisans={() => {
              openSignInModal('customer', 'Sign in as a Customer to view and book available verified artisans.');
            }}
            onOpenSignIn={() => openSignInModal('customer')}
            onOpenKabambe={() => setIsKabambeOpen(true)}
            isSignedIn={false}
          />

          <AboutSection
            isSignedIn={false}
            onOpenSignIn={() => openSignInModal('customer', 'Sign in as a Customer to view and book available verified artisans.')}
            onScrollToArtisans={() => {
              openSignInModal('customer', 'Sign in as a Customer to view and book available verified artisans.');
            }}
          />
        </>
      )}

      {/* CUSTOMER PROXIMITY DASHBOARD (Shown immediately when Customer signs in) */}
      {currentUser && (
        <>
          {/* Emergency Alert Banner if Active */}
          {emergencyMode && (
            <div className="bg-rose-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Emergency Dispatch Active: Showing skilled artisans available for immediate arrival (&lt;30 mins)</span>
              <button 
                onClick={() => setEmergencyMode(false)}
                className="ml-2 underline text-white hover:text-rose-100 cursor-pointer"
              >
                Turn Off
              </button>
            </div>
          )}

          <main id="artisans-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9 scroll-mt-20">
            {/* Customer Dashboard Proximity Header */}
            <div className="bg-gradient-to-r from-[#303C43] to-[#232C31] text-white rounded-2xl p-5 sm:p-6 mb-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[#FF9B6B]">
                  <MapPin className="w-3.5 h-3.5 text-[#F86828] shrink-0" />
                  <span>Location: {userLocation.neighborhood || 'Nairobi'}</span>
                  <span className="text-slate-300 font-normal tabular-nums">
                    ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] tracking-tight">
                  Available Artisans Near You
                </h1>
                <p className="text-xs sm:text-sm text-slate-200">
                  Welcome back, <strong className="text-white">{currentUser.displayName}</strong>. Showing{' '}
                  <strong className="text-[#FF9B6B]">{recommendations.length}</strong> verified specialists within{' '}
                  <strong className="text-white">{radiusKm} km</strong> of{' '}
                  <strong className="text-white">{userLocation.neighborhood || 'your location'}</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={isGpsLocating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F86828] hover:bg-[#E05618] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  <Crosshair className={`w-4 h-4 ${isGpsLocating ? 'animate-spin' : ''}`} />
                  <span>{isGpsLocating ? 'Locating...' : 'Use My Live Location'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mapEl = document.getElementById('artisan-map-section');
                    mapEl?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold transition cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-[#FF9B6B]" />
                  <span>Live Map ↓</span>
                </button>
              </div>
            </div>

            {gpsStatusNote && (
              <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#FFF4EE] border border-[#F86828]/25 text-xs text-[#303C43] flex items-center justify-between gap-2">
                <span>{gpsStatusNote}</span>
                <button
                  type="button"
                  onClick={() => setGpsStatusNote(null)}
                  className="text-[#F86828] font-semibold hover:underline cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Proximity Search & Filter Controls Bar */}
            <div className="bg-white rounded-2xl border border-[#303C43]/15 p-3.5 sm:p-4 mb-6 shadow-xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                {/* Search input */}
                <div className="md:col-span-5 relative flex items-center">
                  <Search className="w-4 h-4 text-[#303C43]/40 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search plumber, electrician, burst pipe, appliance..."
                    className="w-full pl-9 pr-3 py-2 bg-[#F7F8FA] focus:bg-white rounded-lg border border-[#303C43]/15 focus:border-[#F86828] text-xs sm:text-sm text-[#303C43] placeholder:text-[#303C43]/45 focus:outline-hidden transition"
                  />
                </div>

                {/* Trade Category Filter */}
                <div className="md:col-span-3">
                  <select
                    aria-label="Filter by trade category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8FA] focus:bg-white rounded-lg border border-[#303C43]/15 focus:border-[#F86828] text-xs sm:text-sm font-medium text-[#303C43] focus:outline-hidden cursor-pointer"
                  >
                    <option value="All">All Trades</option>
                    {Object.keys(CATEGORY_INFO).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Selector */}
                <div className="md:col-span-4 relative flex items-center">
                  <MapPin className="w-4 h-4 text-[#F86828] absolute left-3 pointer-events-none" />
                  <select
                    aria-label="Select your area"
                    value={userLocation.neighborhood || ''}
                    onChange={(e) => {
                      const chosen = POPULAR_LOCATIONS.find((l) => l.name === e.target.value);
                      if (chosen) {
                        updateCustomerLocation({
                          lat: chosen.lat,
                          lng: chosen.lng,
                          neighborhood: chosen.name,
                          address: `${chosen.name}, Nairobi, Kenya`,
                          city: 'Nairobi'
                        });
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-[#F7F8FA] focus:bg-white rounded-lg border border-[#303C43]/15 focus:border-[#F86828] text-xs sm:text-sm font-semibold text-[#303C43] focus:outline-hidden cursor-pointer"
                  >
                    {userLocation.neighborhood &&
                      !POPULAR_LOCATIONS.some((l) => l.name === userLocation.neighborhood) && (
                        <option value={userLocation.neighborhood}>{userLocation.neighborhood}</option>
                      )}
                    {POPULAR_LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Sub-County / Estate Entry + Radius & Emergency Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#303C43]/10">
                <div className="flex flex-wrap items-center gap-2.5">
                  <form onSubmit={handleAreaSearchSubmit} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={areaSearchInput}
                      onChange={(e) => setAreaSearchInput(e.target.value)}
                      placeholder="Type estate or sub-county (e.g. Njiru, Kasarani)"
                      className="w-60 sm:w-64 px-3 py-1.5 bg-[#F7F8FA] focus:bg-white rounded-lg border border-[#303C43]/15 focus:border-[#F86828] text-xs text-[#303C43] placeholder:text-[#303C43]/45 focus:outline-hidden transition"
                    />
                    <button
                      type="submit"
                      disabled={isAreaSearching || !areaSearchInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#303C43] hover:bg-[#F86828] disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                    >
                      {isAreaSearching ? 'Setting...' : 'Set Area'}
                    </button>
                  </form>

                  <div className="flex items-center gap-2 bg-[#F7F8FA] border border-[#303C43]/15 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-[#303C43]/70 font-medium">Proximity Radius:</span>
                    <input
                      type="range"
                      min={2}
                      max={50}
                      step={1}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="w-24 accent-[#F86828] cursor-pointer"
                      aria-label="Search radius in kilometers"
                    />
                    <span className="font-bold text-[#303C43] tabular-nums">{radiusKm} km</span>
                  </div>

                  {(selectedCategory !== 'All' || searchQuery || selectedSkill || verifiedOnly || emergencyMode) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearchQuery('');
                        setSelectedSkill('');
                        setVerifiedOnly(false);
                        setEmergencyMode(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#F86828] hover:bg-[#FFF4EE] transition cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    id="emergency-dispatch-toggle"
                    onClick={() => setEmergencyMode(!emergencyMode)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      emergencyMode
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Emergency Dispatch</span>
                  </button>
                </div>
              </div>
            </div>

        {loading && recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
            <p className="text-slate-600 text-sm font-medium">
              Scanning registered NITA certified artisans in {userLocation.neighborhood || 'Nairobi'}...
            </p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
              <HardHat className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {selectedSkill ? `No artisans with skillset "${selectedSkill}" found nearby` : 'No certified artisans found nearby'}
            </h3>
            <p className="text-sm text-slate-500">
              {selectedSkill 
                ? `No registered technicians specializing in "${selectedSkill}" matched within ${radiusKm}km of your location.`
                : `Try increasing your radius or reset your location to the Nairobi central hub.`}
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {selectedSkill && (
                <button
                  onClick={() => setSelectedSkill('')}
                  className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Clear Skillset Filter
                </button>
              )}
              <button
                onClick={() => {
                  setUserLocation({
                    lat: -1.2685,
                    lng: 36.8045,
                    neighborhood: 'Nairobi - Westlands',
                    address: 'Westlands, Nairobi, Kenya',
                    city: 'Nairobi'
                  });
                  setRadiusKm(50);
                  setSelectedCategory('All');
                  setVerifiedOnly(false);
                  setSelectedSkill('');
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Reset to Nairobi Hub
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Regional Auto-Expansion Notification */}
            {((responseMetadata?.distanceExpanded) || recommendations.some(f => f.isDistanceExpanded)) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-950">Nationwide Verified Artisans Active</p>
                    <p className="text-amber-800 text-[11px]">
                      Showing verified Kenyan craftsmen nearest to your location ({userLocation.neighborhood || 'Local Device'}).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUserLocation({
                      lat: -1.2685,
                      lng: 36.8045,
                      neighborhood: 'Nairobi - Westlands',
                      address: 'Westlands, Nairobi, Kenya',
                      city: 'Nairobi'
                    });
                    setRadiusKm(25);
                    setSelectedCategory('All');
                    setSelectedSkill('');
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 transition text-xs cursor-pointer"
                >
                  Reset to Westlands Hub
                </button>
              </div>
            )}

            {/* ARTISANS FIRST + MAP AT BOTTOM (Default View) */}
            {viewMode === 'split' && (
              <div className="space-y-6">
                
                {/* Available Artisans Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#2C353D] font-['Outfit',sans-serif]">
                      Available Verified Artisans
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{recommendations.length} specialists in {userLocation.neighborhood || 'Nairobi'}</span>
                      <span aria-hidden="true">·</span>
                      <span>Within {radiusKm} km</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        NITA &amp; Escrow Secured
                      </span>
                      {!isOnline && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                            <WifiOff className="w-3.5 h-3.5" />
                            Offline Cache Active
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const mapEl = document.getElementById('artisan-map-section');
                      mapEl?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2C353D] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition self-start sm:self-auto cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span>View Live Map ↓</span>
                  </button>
                </div>

                {/* Available Artisans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((fundi) => (
                    <FundiCard
                      key={fundi.id}
                      fundi={fundi}
                      userLocation={userLocation}
                      isSelected={selectedFundi?.id === fundi.id}
                      onSelect={() => setSelectedFundi(fundi)}
                      onViewDetails={() => setDetailFundi(fundi)}
                      onBookNow={() => handleRequestBookFundi(fundi)}
                      highlightSkill={selectedSkill}
                    />
                  ))}
                </div>

              </div>
            )}

            {/* MAP ONLY VIEW */}
            {viewMode === 'map' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-lg font-bold text-[#2C353D]">Interactive Map View</h2>
                    <p className="text-xs text-slate-500">Showing all {recommendations.length} certified artisans mapped in real time</p>
                  </div>
                  <button
                    onClick={() => setViewMode('split')}
                    className="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition cursor-pointer"
                  >
                    Switch to Artisans &amp; Map View
                  </button>
                </div>
                <div className="w-full h-[640px] rounded-2xl overflow-hidden border border-slate-200">
                  <FundiMap
                    userLocation={userLocation}
                    radiusKm={radiusKm}
                    fundis={recommendations}
                    selectedFundi={selectedFundi}
                    onSelectFundi={(f) => setSelectedFundi(f)}
                    onViewDetails={(f) => setDetailFundi(f)}
                    onBookNow={(f) => handleRequestBookFundi(f)}
                    className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100"
                  />
                </div>
              </div>
            )}

            {/* GRID ONLY VIEW */}
            {viewMode === 'grid' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-lg font-bold text-[#2C353D]">All Available Artisans ({recommendations.length})</h2>
                    <p className="text-xs text-slate-500">Card gallery of verified fundis ready for dispatch</p>
                  </div>
                  <button
                    onClick={() => setViewMode('split')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    <span>Include Map View</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((fundi) => (
                    <FundiCard
                      key={fundi.id}
                      fundi={fundi}
                      userLocation={userLocation}
                      isSelected={selectedFundi?.id === fundi.id}
                      onSelect={() => setSelectedFundi(fundi)}
                      onViewDetails={() => setDetailFundi(fundi)}
                      onBookNow={() => handleRequestBookFundi(fundi)}
                      highlightSkill={selectedSkill}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
        </>
      )}

      {/* LANDING SECTIONS: HOW IT WORKS & ESCROW/USSD (Shown ONLY before sign-in; removed from Customer Dashboard) */}
      {!currentUser && (
        <HowItWorksSection
          isSignedIn={false}
          onOpenSignIn={() => openSignInModal('customer', 'Sign in as a Customer to view and book available verified artisans.')}
          onOpenKabambe={() => setIsKabambeOpen(true)}
          onScrollToArtisans={() => {
            openSignInModal('customer', 'Sign in as a Customer to view and book available verified artisans.');
          }}
        />
      )}

      {/* SECTION 6: INTERACTIVE ARTISAN MAP */}
      {viewMode !== 'map' && recommendations.length > 0 && (
        <section
          id="artisan-map-section"
          className="bg-gradient-to-br from-[#E7EEF4] via-[#F4F4F5] to-[#FFEBE0] border-t border-[#303C43]/12 py-14 sm:py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F86828] mb-2">
                  <span className="w-6 h-0.5 bg-[#F86828]" />
                  <span>Live Network Coverage</span>
                </div>
                <h3 className="text-2xl font-bold text-[#303C43] font-['Outfit',sans-serif] tracking-tight">
                  Artisans Live Map &amp; Geographic Coverage
                </h3>
                <p className="text-xs sm:text-sm text-[#303C43]/70 mt-1">
                  Vetted professionals within {radiusKm}km of {userLocation.neighborhood || 'your location'}. Click any pin to inspect coverage.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {selectedFundi && (
                  <span className="text-xs text-[#303C43]/70 font-medium">
                    Selected: <strong className="text-[#303C43]">{selectedFundi.name}</strong>
                  </span>
                )}
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-3.5 py-2 bg-white/85 hover:bg-[#303C43] text-[#303C43] hover:text-white border border-[#303C43]/15 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Back to Top ↑
                </button>
              </div>
            </div>

            <div className="w-full rounded-2xl overflow-hidden border border-[#303C43]/15 bg-[#F7F8FA] shadow-sm">
              <FundiMap
                userLocation={userLocation}
                radiusKm={radiusKm}
                fundis={recommendations}
                selectedFundi={selectedFundi}
                onSelectFundi={(f) => setSelectedFundi(f)}
                onViewDetails={(f) => setDetailFundi(f)}
                onBookNow={(f) => handleRequestBookFundi(f)}
                className="relative w-full h-[440px] sm:h-[500px] rounded-2xl overflow-hidden bg-[#F7F8FA]"
              />
            </div>
          </div>
        </section>
      )}

      {/* CLEAN QUIET FOOTER */}
      <footer className="bg-gradient-to-r from-[#E2EAF1] via-[#EEF1F4] to-[#FDEADF] border-t border-[#303C43]/15 py-9 px-4 sm:px-6 lg:px-8 text-xs text-[#303C43]/75 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <SpanaLogo size="md" />
            <span className="hidden sm:inline text-[#303C43]/25">|</span>
            <span>Spana Kenya · Verified Trade Professionals</span>
          </div>

          <StoreBadges compact />

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-[#303C43]/80">
            {currentUser ? (
              <>
                <button
                  onClick={() => document.getElementById('artisans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#F86828] cursor-pointer transition-colors"
                >
                  Nearby Artisans
                </button>
                <button
                  onClick={() => setIsBookingsHistoryOpen(true)}
                  className="hover:text-[#F86828] cursor-pointer transition-colors"
                >
                  My Bookings
                </button>
                <button
                  onClick={() => document.getElementById('artisan-map-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#F86828] cursor-pointer transition-colors"
                >
                  Live Map
                </button>
                <button
                  onClick={handleLogout}
                  className="text-[#F86828] hover:text-[#E05618] font-semibold cursor-pointer transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    openSignInModal('admin', 'Sign in as an Administrator to access the Command Center.');
                  }}
                  className="hover:text-[#F86828] underline underline-offset-4 cursor-pointer transition-colors"
                >
                  Admin Portal
                </button>
                <button
                  onClick={() => {
                    openSignInModal('customer', 'Sign in to check your bookings and escrow.');
                  }}
                  className="hover:text-[#F86828] cursor-pointer transition-colors"
                >
                  Escrow &amp; Bookings
                </button>
                <button
                  onClick={() => setIsJoinFundiOpen(true)}
                  className="hover:text-[#F86828] cursor-pointer transition-colors"
                >
                  Join as Artisan
                </button>
                <button
                  onClick={() => openSignInModal('customer')}
                  className="text-[#F86828] hover:text-[#E05618] font-semibold cursor-pointer transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* SIGN IN POPUP MODAL (Customer / Artisan / Admin) */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => {
          setIsSignInModalOpen(false);
          setSignInPromptNotice(null);
          setPendingBookingFundi(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        initialRole={signInInitialRole}
        promptNotice={signInPromptNotice}
      />

      {/* MODALS */}
      
      {/* Fundi Detail Modal */}
      <FundiDetailModal
        fundi={detailFundi}
        onClose={() => setDetailFundi(null)}
        onBookNow={(f) => {
          setDetailFundi(null);
          handleRequestBookFundi(f);
        }}
        onAddReview={handleAddReview}
        highlightSkill={selectedSkill}
      />

      {/* Appointment Booking Modal with Escrow Confirmation */}
      <BookingModal
        fundi={bookingFundi}
        userLocation={userLocation}
        onClose={() => setBookingFundi(null)}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Join as a Fundi Modal */}
      <JoinFundiModal
        isOpen={isJoinFundiOpen}
        onClose={() => setIsJoinFundiOpen(false)}
        onFundiRegistered={() => {
          fetchRecommendations();
        }}
      />

      {/* Bookings History Modal */}
      <BookingsHistoryModal
        isOpen={isBookingsHistoryOpen}
        onClose={() => setIsBookingsHistoryOpen(false)}
        bookings={bookings}
        onMarkAsCompleted={handleMarkBookingAsCompleted}
      />

      {/* Customer / Client Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          fetchClientNotifications();
        }}
        userRole="customer"
        onOpenBookings={() => {
          setIsBookingsHistoryOpen(true);
          setIsNotificationsOpen(false);
        }}
      />

      {/* Offline Feature Phone (Kabambe) USSD & SMS Simulator (*384*45#) */}
      <KabambeSimulatorModal
        isOpen={isKabambeOpen}
        onClose={() => setIsKabambeOpen(false)}
        onBookingCreated={() => {
          fetchServerBookings();
          fetchRecommendations();
          fetchClientNotifications();
        }}
      />

      {/* FastAPI Colab Integration Modal */}
      <FastApiConfigModal
        isOpen={isFastApiModalOpen}
        onClose={() => setIsFastApiModalOpen(false)}
        customFastApiUrl={customFastApiUrl}
        onSaveFastApiUrl={handleSaveFastApiUrl}
        isFastApiActive={isFastApiActive}
        onToggleActive={handleToggleFastApiActive}
      />

      {/* Google Sheets Modal (available to Admin and managed dataset) */}
      <GoogleSheetsDatasetModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        onDatasetImported={handleDatasetImported}
        activeSheetMeta={activeSheetMeta}
        onClearCustomDataset={handleClearCustomDataset}
      />

      {/* Offline Connectivity & Service Worker Caching Status Indicator */}
      <OfflineIndicator onRetrySync={() => {
        fetchRecommendations();
      }} />

    </div>
  );
}
