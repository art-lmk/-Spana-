export type TradeCategory = 
  | 'Plumbing'
  | 'Electrical'
  | 'Carpentry'
  | 'Painting'
  | 'Masonry'
  | 'Appliance Repair'
  | 'Welding'
  | 'Roofing'
  | 'HVAC & AC'
  | 'Landscaping'
  | 'Solar PV & Inverters'
  | 'Electronic Security & CCTV'
  | 'Motor Vehicle Mechanics'
  | 'Interior Fit-Out & Gypsum'
  | (string & {});

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
  neighborhood?: string;
  city?: string;
}

export interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number; // 1 to 5
  date: string;
  comment: string;
  jobType: string;
  verifiedJob: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  completionDate: string;
}

export interface Fundi {
  id: string;
  name: string;
  avatarUrl: string;
  phone: string;
  whatsapp: string;
  primaryCategory: TradeCategory;
  additionalCategories: TradeCategory[];
  skills: string[];
  bio: string;
  experienceYears: number;
  hourlyRateKes: number;
  fixedInspectionFeeKes: number;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  isVerified: boolean;
  idVerified: boolean;
  backgroundChecked: boolean;
  isAvailableNow: boolean;
  responseTimeMinutes: number; // e.g. 15 mins
  location: LocationCoordinates;
  distanceKm?: number; // Calculated dynamically based on user coordinates
  matchScore?: number; // 0 to 100% calculated by recommendation model
  matchReasons?: string[];
  reviews: Review[];
  portfolio: PortfolioItem[];
  toolsEquipment: string[];
  emergencyAvailable: boolean;
  nitaAccredited?: boolean;
  nitaCertificationLevel?: string;
  nitaTradeTestNo?: string;
  artisanId?: string;
  accreditationStatus?: 'nita_accredited' | 'rpl_candidate' | 'apprenticeship' | 'in_review';
  rplEligible?: boolean;
  rplStatus?: 'not_applied' | 'application_submitted' | 'portfolio_review' | 'assessment_scheduled' | 'certified';
  rplApplicationDate?: string;
  rplCenter?: string;
  experienceRoute?: 'informal_apprenticeship' | 'formal_vocational' | 'mixed_experience';
  isDistanceExpanded?: boolean;
}

export interface NlpMatchResult {
  rawPrompt: string;
  problemSummary: string;
  identifiedCategory: TradeCategory;
  extractedSkills: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical_emergency';
  experienceYearsSuggested: number;
  nitaCertificationRecommended: string;
  requiresNitaCertified: boolean;
  requiredEquipmentOrTools: string[];
  estimatedCostRangeKes: {
    min: number;
    max: number;
    explanation: string;
  };
  safetyAdvisory: string[];
  aiAnalysisExplanation: string;
  matchingFundis: Fundi[];
  matchCount: number;
  engineUsed: 'gemini-3.7-flash' | 'semantic_fallback_nlp';
}

export interface RecommendationRequest {
  userLat: number;
  userLng: number;
  category?: string;
  searchQuery?: string;
  skill?: string;
  maxDistanceKm?: number;
  minRating?: number;
  maxHourlyRateKes?: number;
  verifiedOnly?: boolean;
  availableNowOnly?: boolean;
  emergencyOnly?: boolean;
  customFastApiUrl?: string;
}

export interface RecommendationResponse {
  recommendations: Fundi[];
  source: 'fastapi_microservice' | 'internal_engine';
  totalFound: number;
  userLocation: LocationCoordinates;
  executionTimeMs: number;
  distanceExpanded?: boolean;
  expandedMessage?: string;
  modelDetails?: {
    modelType: string;
    weights: {
      proximity: number;
      ratingAndReputation: number;
      skillSemanticMatch: number;
      availabilityAndSpeed: number;
    };
  };
}

export interface ProblemDiagnosis {
  problemSummary: string;
  suggestedCategory: TradeCategory;
  secondaryCategories: TradeCategory[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical_emergency';
  estimatedCostRangeKes: {
    min: number;
    max: number;
    explanation: string;
  };
  recommendedToolsOrParts: string[];
  safetyPrecautions: string[];
  recommendedSkills: string[];
  aiExplanation: string;
}

export interface BookingRequest {
  fundiId: string;
  fundiName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  jobDescription: string;
  category: TradeCategory;
  isEmergency: boolean;
  estimatedCostKes: number;
}

export interface BookingResponse {
  bookingId: string;
  status: 'confirmed' | 'pending_fundi_ack' | 'dispatched' | 'client_completed' | 'completed' | 'cancelled';
  estimatedArrivalMinutes?: number;
  details: BookingRequest;
  createdAt: string;
  clientCompletedAt?: string;
  dispatchedAt?: string;
  mpesaPayoutRef?: string;
}

export interface AppNotification {
  id: string;
  recipientRole: 'admin' | 'artisan' | 'customer';
  recipientId?: string; // fundiId, customer email/phone, or 'admin'
  title: string;
  message: string;
  type: 'booking_created' | 'client_completed' | 'cash_dispatched' | 'system';
  bookingId?: string;
  fundiId?: string;
  fundiName?: string;
  customerName?: string;
  amountKes?: number;
  mpesaRef?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export type EscrowStatus = 'awaiting_payment' | 'held_in_escrow' | 'released_to_fundi' | 'disputed' | 'refunded';
export type EscrowMilestone = 'funds_locked' | 'artisan_dispatched' | 'work_in_progress' | 'client_signoff_pending' | 'completed_released';

export interface EscrowTransaction {
  id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fundiId: string;
  fundiName: string;
  category: TradeCategory;
  amountKes: number;
  platformFeeKes: number;
  fundiPayoutKes: number;
  status: EscrowStatus;
  milestone: EscrowMilestone;
  paymentMethod: 'M-Pesa Express' | 'M-Pesa Paybill' | 'Card';
  mpesaRef: string;
  createdAt: string;
  releasedAt?: string;
  notes?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'customer' | 'admin' | 'artisan';
  fundiId?: string;
}

export interface RplApplication {
  id: string;
  fundiId: string;
  fundiName: string;
  phone: string;
  tradeCategory: TradeCategory;
  targetGrade: 'Grade III (Foundation)' | 'Grade II (Intermediate)' | 'Grade I (Master Technician)';
  preferredCenter: string;
  experienceYears: number;
  apprenticeshipWorkshop: string;
  practicalSkillsSummary: string;
  status: 'submitted' | 'under_review' | 'assessment_scheduled' | 'certified';
  submissionDate: string;
  scheduledAssessmentDate?: string;
  notes?: string;
}

export type LanguageMode = 'auto' | 'sheng' | 'swahili' | 'english';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  detectedLanguage?: 'sheng' | 'swahili' | 'english' | 'mixed';
  recommendedFundis?: Fundi[];
  actionCategory?: TradeCategory;
  costEstimateKes?: { min: number; max: number; explanation?: string };
  safetyTips?: string[];
  suggestedReplies?: string[];
}

export interface ChatApiResponse {
  success: boolean;
  reply: string;
  detectedLanguage: 'sheng' | 'swahili' | 'english';
  categoryDetected?: TradeCategory;
  recommendedFundis: Fundi[];
  costEstimateKes?: { min: number; max: number; explanation?: string };
  safetyTips?: string[];
  suggestedReplies?: string[];
  engineUsed: string;
}

export interface UssdSessionRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}

export interface UssdSessionResponse {
  message: string;
  isTerminal: boolean;
  sessionId: string;
}

export interface SmsMessageItem {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  type: 'incoming' | 'outgoing' | 'mpesa' | 'system_alert';
}

export interface SystemMetricsSummary {
  uptimeSeconds: number;
  totalRequests: number;
  statusCodes: {
    '2xx': number;
    '4xx': number;
    '5xx': number;
  };
  latencies: {
    p50: number;
    p95: number;
    p99: number;
  };
  sli: {
    currentAvailabilityPercentage: number;
    targetSloPercentage: number;
    errorBudgetRemainingPercentage: number;
    isSloMet: boolean;
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  circuitBreakers: {
    gemini: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    fastApi: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    mpesa: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  };
  deadLetterQueueCount: number;
  activeFeatureFlags: number;
}

export interface FeatureFlagItem {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export interface DeadLetterQueueItem {
  id: string;
  source: 'ESCROW_SETTLEMENT' | 'SMS_DISPATCH' | 'WEBHOOK_DARADA' | 'SAGA_COMPENSATION' | 'GEMINI_DIAGNOSTIC';
  payload: any;
  error: string;
  attempts: number;
  firstFailedAt: string;
  lastFailedAt: string;
  status: 'PENDING_RETRY' | 'RESOLVED' | 'DISCARDED';
}

export interface SagaTransactionItem {
  sagaId: string;
  correlationId: string;
  entityId: string;
  status: 'STARTED' | 'COMMITTED' | 'ROLLED_BACK' | 'FAILED';
  steps: Array<{
    name: string;
    status: 'PENDING' | 'SUCCESS' | 'COMPENSATED' | 'FAILED';
    startedAt: string;
    completedAt?: string;
    error?: string;
  }>;
  startedAt: string;
  completedAt?: string;
  rollbackReason?: string;
}

export interface BlueGreenDeploymentState {
  activeSlot: 'BLUE' | 'GREEN';
  blueVersion: string;
  greenVersion: string;
  blueTrafficPercentage: number;
  greenTrafficPercentage: number;
  lastToggledAt: string;
  health: {
    blue: 'HEALTHY' | 'DRAINING';
    green: 'HEALTHY' | 'STANDBY';
  };
}

export interface CronJobItem {
  id: string;
  name: string;
  schedule: string;
  description: string;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  lastRunAt: string;
  nextRunAt: string;
  totalExecutions: number;
  lastExecutionDurationMs: number;
}

export interface BackupSnapshotItem {
  id: string;
  type: 'SCHEDULED' | 'ON_DEMAND';
  status: 'COMPLETED' | 'IN_PROGRESS';
  sizeMb: number;
  createdAt: string;
  checksum: string;
  region: string;
}

export interface InfraTopologySummary {
  multiRegion: {
    primaryRegion: string;
    standbyRegion: string;
    rpoTarget: string;
    rtoTarget: string;
    dnsRouting: string;
  };
  networking: {
    protocols: string[];
    tlsVersion: string;
    wafStatus: string;
    ddosProtection: string;
    cdnHitRatio: string;
  };
  databaseLayer: {
    connectionPooling: {
      engine: string;
      maxConnections: number;
      activeConnections: number;
      idleConnections: number;
      poolUtilizationPercentage: number;
    };
    readReplicas: {
      count: number;
      avgReplicationLagMs: number;
      status: string;
    };
    shardingAndPartitioning: {
      strategy: string;
      countyShards: number;
      monthlyPartitions: number;
    };
    nPlusOnePrevention: string;
    concurrencyControl: string;
  };
  scalingAndCompute: {
    hpaReplicas: { current: number; min: number; max: number };
    cpuTargetPercentage: number;
    vpaRecommendation: string;
    buildCachingHitRate: string;
    iacState: string;
  };
  securityAndZeroTrust: {
    encryptionAtRest: string;
    encryptionInTransit: string;
    secretsManager: string;
    jwtKeyRotationInterval: string;
    currentKeyId: string;
    corsPolicy: string;
    apiVersion: string;
  };
}

