import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_FUNDIS, CATEGORY_INFO } from './src/data/mockFundis';
import { getRecommendations } from './src/utils/recommender';
import { calculateDistanceKm } from './src/utils/distance';
import { Fundi, ProblemDiagnosis, BookingRequest, BookingResponse, TradeCategory, NlpMatchResult, RplApplication, AppNotification, SmsMessageItem } from './src/types';
import { parseCsvString } from './src/lib/csvParser';
import {
  checkRateLimit,
  getIdempotentResponse,
  saveIdempotentResponse,
  createSaga,
  recordSagaStep,
  finalizeSaga,
  getSagas,
  enqueueDLQ,
  getDLQItems,
  resolveDLQItem,
  circuitBreakers,
  getFeatureFlags,
  setFeatureFlag,
  isFeatureEnabled,
  metricsRegistry,
  registerSseClient,
  unregisterSseClient,
  broadcastSseEvent,
  getActiveSseClientsCount,
  recordAuditLog,
  getAuditLogs,
  getRateLimitStats,
  getBlueGreenState,
  toggleBlueGreenSlot,
  getCronJobs,
  executeCronJob,
  getBackupSnapshots,
  createBackupSnapshot,
  getInfraTopology
} from './src/lib/reliabilityEngine';

dotenv.config();

// In-memory runtime state for fundis, bookings, reviews, RPL applications, notifications, and USSD/SMS
let fundisStore: Fundi[] = [...INITIAL_FUNDIS];

let smsMessagesStore: SmsMessageItem[] = [
  {
    id: 'sms-seed-1',
    from: 'MPESA',
    to: '+254712998877',
    message: 'QMP892014 Confirmed. KES 2,200 deposited to Spana Escrow for Ezekiel Odhiambo. Dial *384*45# once job is completed.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'mpesa'
  },
  {
    id: 'sms-seed-2',
    from: 'Spana',
    to: '+254712998877',
    message: 'Spana: Booking FC-948201 confirmed. Ezekiel Odhiambo (+254 745 678 901) is en route to Riverside Drive (ETA: 30 mins). Dial *384*45# to manage.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'outgoing'
  }
];

let notificationsStore: AppNotification[] = [
  {
    id: 'notif-seed-1',
    recipientRole: 'admin',
    title: 'New Booking Request (FC-948201)',
    message: 'Client Brian Kimani booked artisan Ezekiel Odhiambo for Appliance Repair. KES 2,200 held in M-Pesa escrow.',
    type: 'booking_created',
    bookingId: 'FC-948201',
    fundiId: 'fundi-4',
    fundiName: 'Ezekiel Odhiambo',
    customerName: 'Brian Kimani',
    amountKes: 2200,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false
  },
  {
    id: 'notif-seed-2',
    recipientRole: 'artisan',
    recipientId: 'fundi-4',
    title: '🔨 New Job Request: Appliance Repair',
    message: 'Client Brian Kimani (+254 712 998 877) booked you in Riverside Drive, Westlands. Scheduled: 2026-09-05 (10:00 AM). Escrow: KES 2,200.',
    type: 'booking_created',
    bookingId: 'FC-948201',
    fundiId: 'fundi-4',
    fundiName: 'Ezekiel Odhiambo',
    customerName: 'Brian Kimani',
    amountKes: 2200,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false
  },
  {
    id: 'notif-seed-3',
    recipientRole: 'admin',
    title: 'Job Marked Completed: Action Required',
    message: 'Client Susan Mutua confirmed that Joseph Mwangi completed job FC-665120. Escrow payout of KES 4,500 successfully released.',
    type: 'client_completed',
    bookingId: 'FC-665120',
    fundiId: 'fundi-1',
    fundiName: 'Joseph Mwangi',
    customerName: 'Susan Mutua',
    amountKes: 4500,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true
  },
  {
    id: 'notif-seed-4',
    recipientRole: 'customer',
    recipientId: '+254 722 890 123',
    title: '🔒 M-Pesa Escrow Protection Active',
    message: 'KES 3,500 for Joseph Mwangi (Job BK-1082) is securely locked in escrow. Release only when work is completed to your satisfaction.',
    type: 'booking_created',
    bookingId: 'BK-1082',
    fundiId: 'fundi-1',
    fundiName: 'Joseph Mwangi',
    customerName: 'Lenah Mbatha',
    amountKes: 3500,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false
  },
  {
    id: 'notif-seed-5',
    recipientRole: 'customer',
    recipientId: '+254 722 890 123',
    title: '🚖 Artisan En Route (ETA 20 Mins)',
    message: 'Joseph Mwangi (Plumbing, NITA Certified) is on the way to Rhapta Road, Westlands. Dial *384*45# for feature-phone updates.',
    type: 'booking_created',
    bookingId: 'BK-1082',
    fundiId: 'fundi-1',
    fundiName: 'Joseph Mwangi',
    customerName: 'Lenah Mbatha',
    amountKes: 3500,
    timestamp: new Date(Date.now() - 900000).toISOString(),
    read: false
  }
];
let rplApplicationsStore: RplApplication[] = [
  {
    id: 'RPL-2026-091',
    fundiId: 'fundi-7',
    fundiName: 'Francis Njoroge',
    phone: '+254 778 901 234',
    tradeCategory: 'Masonry',
    targetGrade: 'Grade I (Master Technician)',
    preferredCenter: 'NITA Nairobi Industrial Training Centre (Commercial St)',
    experienceYears: 14,
    apprenticeshipWorkshop: 'South B & Industrial Area Masonry Guild',
    practicalSkillsSummary: 'Porcelain & Ceramic Tiling, Concrete Screed Levelling, Foundation Waterproofing',
    status: 'assessment_scheduled',
    submissionDate: '2026-08-15',
    scheduledAssessmentDate: '2026-09-18',
    notes: 'Prior learning portfolio validated by KNQA assessor. Practical trade test scheduled.'
  }
];

const bookingsStore: BookingResponse[] = [
  {
    bookingId: 'FC-948201',
    status: 'pending_fundi_ack' as any,
    estimatedArrivalMinutes: 30,
    details: {
      fundiId: 'fundi-4',
      fundiName: 'Ezekiel Odhiambo',
      customerName: 'Brian Kimani',
      customerPhone: '+254 712 998 877',
      customerEmail: 'brian.k@gmail.com',
      customerAddress: 'Riverside Drive, Apartment 4B, Westlands, Nairobi',
      category: 'Appliance Repair',
      jobDescription: 'Samsung Double-Door Refrigerator cooling fan not spinning and clicking noise from compressor.',
      scheduledDate: '2026-09-05',
      scheduledTimeSlot: '10:00 AM - 12:00 PM',
      location: {
        address: 'Riverside Drive, Apartment 4B, Westlands, Nairobi',
        neighborhood: 'Westlands',
        lat: -1.2685,
        lng: 36.8045
      },
      isEmergency: false,
      estimatedCostKes: 2200,
      agreedFeeKes: 2200,
      escrowStatus: 'held_in_escrow'
    } as any,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    bookingId: 'FC-883192',
    status: 'dispatched' as any,
    estimatedArrivalMinutes: 15,
    details: {
      fundiId: 'fundi-4',
      fundiName: 'Ezekiel Odhiambo',
      customerName: 'Lillian Wanjiku',
      customerPhone: '+254 722 554 112',
      customerEmail: 'lillian.w@yahoo.com',
      customerAddress: 'Hatheru Road, Lavington, Nairobi',
      category: 'Appliance Repair',
      jobDescription: 'Bosch Front-Load Washing Machine drum error E18 / drainage blockage.',
      scheduledDate: '2026-09-04',
      scheduledTimeSlot: '02:00 PM - 04:00 PM',
      location: {
        address: 'Hatheru Road, Lavington, Nairobi',
        neighborhood: 'Lavington',
        lat: -1.2820,
        lng: 36.7720
      },
      isEmergency: true,
      estimatedCostKes: 3500,
      agreedFeeKes: 3500,
      escrowStatus: 'held_in_escrow'
    } as any,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    bookingId: 'FC-771204',
    status: 'completed' as any,
    details: {
      fundiId: 'fundi-4',
      fundiName: 'Ezekiel Odhiambo',
      customerName: 'George Mwangi',
      customerPhone: '+254 733 112 900',
      customerEmail: 'gmwangi@gmail.com',
      customerAddress: 'Ngong Road, Adams Arcade, Nairobi',
      category: 'Appliance Repair',
      jobDescription: 'Microwave oven magnetron replacement and safety capacitor triage.',
      scheduledDate: '2026-09-02',
      scheduledTimeSlot: '11:30 AM - 01:30 PM',
      location: {
        address: 'Ngong Road, Adams Arcade, Nairobi',
        neighborhood: 'Kilimani',
        lat: -1.2990,
        lng: 36.7840
      },
      isEmergency: false,
      estimatedCostKes: 2800,
      agreedFeeKes: 2800,
      escrowStatus: 'released_to_mpesa',
      mpesaReceiptNo: 'QMK8929104'
    } as any,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    bookingId: 'FC-665120',
    status: 'completed' as any,
    details: {
      fundiId: 'fundi-1',
      fundiName: 'Joseph Mwangi',
      customerName: 'Susan Mutua',
      customerPhone: '+254 720 334 455',
      customerEmail: 'susan.m@gmail.com',
      customerAddress: 'Parklands 4th Avenue, Nairobi',
      category: 'Plumbing',
      jobDescription: 'Solar water heater booster pump installation and pressure valve calibration.',
      scheduledDate: '2026-09-01',
      scheduledTimeSlot: '09:00 AM - 11:00 AM',
      location: {
        address: 'Parklands 4th Avenue, Nairobi',
        neighborhood: 'Parklands',
        lat: -1.2580,
        lng: 36.8250
      },
      isEmergency: false,
      estimatedCostKes: 4500,
      agreedFeeKes: 4500,
      escrowStatus: 'released_to_mpesa',
      mpesaReceiptNo: 'QMN1928472'
    } as any,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// Gemini Client Lazy Initializer
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    try {
      genAIClient = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } catch (err) {
      console.error('Failed to initialize GoogleGenAI client:', err);
    }
  }
  return genAIClient;
}

// Language Detector Helper (English, Kiswahili, Sheng)
function detectLanguage(text: string): 'sheng' | 'swahili' | 'english' {
  const lower = text.toLowerCase();
  const shengKeywords = [
    'niaje', 'rada', 'fiti', 'msee', 'chapaa', 'ganji', 'keja', 'janta', 'chapchap', 
    'noma', 'risto', 'form', 'waka', 'zima', 'mangoma', 'manze', 'maze', 'baze', 
    'stima', 'shida', 'mbio', 'kuhata', 'cheki', 'blunder', 'beshte', 'choreo',
    'inashoot', 'inaburn', 'imeblow', 'imekwama', 'imeleak', 'chura', 'githurai',
    'rongai', 'kanjo', 'mzinga', 'sasa', 'wasee', 'niko na', 'kujengewa', 'fundi',
    'kubook', 'kushow', 'mulla', 'ngiri', 'soo', 'buda', 'wazi', 'shughuli'
  ];
  const swahiliKeywords = [
    'hujambo', 'habari', 'shikamoo', 'tafadhali', 'asante', 'kazi', 'nyumba', 'maji', 
    'umeme', 'chumba', 'bomba', 'mabomba', 'seremala', 'chuma', 'ukuta', 'dari', 
    'mabati', 'jiko', 'sakafu', 'mlango', 'milango', 'kurekebisha', 'gharama',
    'shilingi', 'pesa', 'tatizo', 'kuharibika', 'ninahitaji', 'kuna', 'wapi', 'lini',
    'haraka', 'dharura', 'usalama', 'fungua', 'funga', 'angalia', 'je', 'maswali'
  ];

  let shengScore = 0;
  let swahiliScore = 0;

  for (const w of shengKeywords) {
    if (lower.includes(w)) shengScore += 2;
  }
  for (const w of swahiliKeywords) {
    if (lower.includes(w)) swahiliScore += 2;
  }

  if (shengScore >= 2 && shengScore >= swahiliScore) return 'sheng';
  if (swahiliScore >= 2) return 'swahili';
  return 'english';
}

// Comprehensive Semantic NLP Fallback Helper (with Swahili & Sheng Vocabulary)
function extractSemanticNlpFallback(prompt: string) {
  const lower = prompt.toLowerCase();
  
  // Electrical / Stima / Umeme
  if (
    lower.includes('electric') || lower.includes('wire') || lower.includes('shock') || 
    lower.includes('breaker') || lower.includes('spark') || lower.includes('socket') || 
    lower.includes('light') || lower.includes('solar') || lower.includes('inverter') || 
    lower.includes('surge') || lower.includes('stima') || lower.includes('umeme') || 
    lower.includes('switch') || lower.includes('kuchoma') || lower.includes('fuse') || 
    lower.includes('moto') || lower.includes('cheche') || lower.includes('waya') || 
    lower.includes('soketi') || lower.includes('inashoot') || lower.includes('inaburn') ||
    lower.includes('power') || lower.includes('blackout')
  ) {
    const isEmergency = lower.includes('spark') || lower.includes('smoke') || lower.includes('shock') || lower.includes('burn') || lower.includes('moto') || lower.includes('cheche') || lower.includes('inashoot');
    return {
      problemSummary: `Electrical circuitry triage: ${isEmergency ? 'Hazardous electrical fault or surge / Shida hatari ya stima' : 'Power wiring & component maintenance required'}.`,
      identifiedCategory: 'Electrical' as TradeCategory,
      extractedSkills: ['Circuit Breaker Triage', 'Insulation Resistance Testing', 'Three-Phase Wiring', 'Surge Protection & Earthing', 'Consumer Unit Wiring'],
      urgencyLevel: (isEmergency ? 'critical_emergency' : 'high') as 'critical_emergency' | 'high',
      experienceYearsSuggested: 7,
      nitaCertificationRecommended: 'NITA Trade Test Grade I (Electrical Wireman & Solar)',
      requiresNitaCertified: true,
      requiredEquipmentOrTools: ['Fluke Insulation Tester (Megger)', 'Digital True-RMS Multimeter', 'Conduit Benders', 'Circuit Tracer'],
      estimatedCostRangeKes: {
        min: 1000,
        max: 4500,
        explanation: 'Estimated certified electrician diagnostic inspection & circuit repair fee in KES'
      },
      safetyAdvisory: [
        'Turn off the main distribution switch immediately at the consumer unit (Zima main switch mara moja).',
        'Do not touch exposed copper conductors or wet sockets with bare hands (Usiguse nyaya wazi).',
        'Keep flammable items away from tripping breaker panels.'
      ],
      aiAnalysisExplanation: 'Identified high-voltage or circuitry issues requiring certified EPRA / NITA Grade I wireman credentials for safety compliance and risk mitigation.'
    };
  }

  // Plumbing / Mabomba / Maji / Sinki / Choo
  if (
    lower.includes('leak') || lower.includes('pipe') || lower.includes('drain') || 
    lower.includes('plumb') || lower.includes('tank') || lower.includes('tap') || 
    lower.includes('shower') || lower.includes('geyser') || lower.includes('water') || 
    lower.includes('toilet') || lower.includes('sewer') || lower.includes('bomba') || 
    lower.includes('mabomba') || lower.includes('plamba') || lower.includes('maji') || 
    lower.includes('kuvuja') || lower.includes('kupasuka') || lower.includes('kuziba') || 
    lower.includes('sinki') || lower.includes('sink') || lower.includes('choo') || 
    lower.includes('chooni') || lower.includes('tanki') || lower.includes('mfereji') ||
    lower.includes('kufurika') || lower.includes('inadrip') || lower.includes('inavuja')
  ) {
    const isEmergency = lower.includes('burst') || lower.includes('flood') || lower.includes('gushing') || lower.includes('overflow') || lower.includes('kupasuka') || lower.includes('kufurika');
    return {
      problemSummary: `Plumbing hydraulics triage: ${isEmergency ? 'Severe pressurized pipe leak or burst / Bomba lililopasuka' : 'Sanitary piping / water fixture maintenance'}.`,
      identifiedCategory: 'Plumbing' as TradeCategory,
      extractedSkills: ['PPR Pipe Welding', 'Drainage Unblocking', 'Water Tank Installation', 'Instant Shower / Geyser Repair', 'Sewer Line Diagnostics'],
      urgencyLevel: (isEmergency ? 'critical_emergency' : 'medium') as 'critical_emergency' | 'medium',
      experienceYearsSuggested: 6,
      nitaCertificationRecommended: 'NITA Trade Test Grade I (Plumber Pipe-Fitter)',
      requiresNitaCertified: true,
      requiredEquipmentOrTools: ['PPR Heat Fusion Welding Machine', 'High Pressure Jetter', 'Pipe Threader & Cutter', 'Leak Detector'],
      estimatedCostRangeKes: {
        min: 800,
        max: 3500,
        explanation: 'Estimated certified plumber inspection, PPR fittings, and labor fee in KES'
      },
      safetyAdvisory: [
        'Isolate the main gate valve / water supply inlet to prevent water damage (Funga vali kuu ya maji).',
        'If water is near electrical points, shut off the master electricity breaker first.',
        'Place temporary collection buckets under active drips.'
      ],
      aiAnalysisExplanation: 'Identified potable water or drainage issues requiring NITA Grade I plumbing expertise with thermo-fusion PPR and pressure balancing skills.'
    };
  }

  // Carpentry / Mbao / Seremala / Kabati / Milango
  if (
    lower.includes('wood') || lower.includes('door') || lower.includes('cabinet') || 
    lower.includes('kitchen') || lower.includes('wardrobe') || lower.includes('table') || 
    lower.includes('furniture') || lower.includes('hinge') || lower.includes('lock') || 
    lower.includes('timber') || lower.includes('mbao') || lower.includes('seremala') || 
    lower.includes('kabati') || lower.includes('mlango') || lower.includes('milango') || 
    lower.includes('kitanda') || lower.includes('meza') || lower.includes('kufuli') || 
    lower.includes('vifuli') || lower.includes('droo')
  ) {
    return {
      problemSummary: 'Carpentry & Joinery triage: Bespoke cabinetry, structural timber or door fitting required (Kazi ya seremala na mbao).',
      identifiedCategory: 'Carpentry' as TradeCategory,
      extractedSkills: ['Fitted Kitchen Cabinets', 'Hardwood Door Fitting', 'Wardrobe Customization', 'Furniture Restoration', 'Precision Lockset Mortising'],
      urgencyLevel: 'low' as 'low',
      experienceYearsSuggested: 5,
      nitaCertificationRecommended: 'NITA Trade Test Grade I (Carpentry & Joinery)',
      requiresNitaCertified: true,
      requiredEquipmentOrTools: ['Plunge Saw with Guide Rail', 'Wood Router & Profiler', 'Laser Level', 'Pneumatic Brad Nailer'],
      estimatedCostRangeKes: {
        min: 1000,
        max: 5500,
        explanation: 'Estimated bespoke woodwork labor, joinery fitting, and hardware adjustment fee in KES'
      },
      safetyAdvisory: [
        'Secure unhinged heavy hardwood doors from tipping over.',
        'Keep work areas clear of children and pets during power tool cutting.'
      ],
      aiAnalysisExplanation: 'Wood joinery and cabinetry work requires master craftsmen with precision measurement, moisture resistance, and solid timber handling skills.'
    };
  }

  // Appliances / Mashine / Friji / Fridge / Oven
  if (
    lower.includes('fridge') || lower.includes('refrigerat') || lower.includes('washing machine') || 
    lower.includes('dryer') || lower.includes('microwave') || lower.includes('oven') || 
    lower.includes('cooker') || lower.includes('appliance') || lower.includes('mashine') || 
    lower.includes('friji') || lower.includes('jiko la gesi') || lower.includes('gas cooker') || 
    lower.includes('feni') || lower.includes('blender')
  ) {
    return {
      problemSummary: 'Domestic appliance mechanics: Electrical / electromechanical component diagnosis needed (Ukarabati wa mashine na vifaa vya nyumbani).',
      identifiedCategory: 'Appliance Repair' as TradeCategory,
      extractedSkills: ['Washing Machine Diagnostics', 'Refrigeration Gas Charging', 'Microwave Magnetron Triage', 'Motor Capacitor Replacement', 'PCB Component Testing'],
      urgencyLevel: 'medium' as 'medium',
      experienceYearsSuggested: 5,
      nitaCertificationRecommended: 'NITA Trade Test Grade I (Refrigeration & Domestic Appliances)',
      requiresNitaCertified: true,
      requiredEquipmentOrTools: ['R134a/R600a Gas Charging Manifold', 'Capacitor Meter', 'Digital Temperature Logger', 'Vacuum Pump'],
      estimatedCostRangeKes: {
        min: 900,
        max: 4200,
        explanation: 'Appliance diagnostic inspection and labor fee (parts billed separately at OEM pricing) in KES'
      },
      safetyAdvisory: [
        'Unplug appliance from the wall power socket immediately (Chomoa plagi ya umeme).',
        'Do not open sealed compressor lines or high-voltage microwave capacitors yourself.'
      ],
      aiAnalysisExplanation: 'Appliance repair requires specialized certification in safe refrigerant handling, brushless motor diagnostics, and microcontroller board triage.'
    };
  }

  // Roofing / Mabati / Dari / Paa / Gutter
  if (
    lower.includes('roof') || lower.includes('gutter') || lower.includes('ceiling') || 
    lower.includes('iron sheet') || lower.includes('decra') || lower.includes('mabati') || 
    lower.includes('dari') || lower.includes('paa') || lower.includes('kuezeka')
  ) {
    return {
      problemSummary: 'Roofing and waterproofing triage: Structural roof integrity and rainwater drainage required (Kuezeka na kurekebisha dari au mabati).',
      identifiedCategory: 'Roofing' as TradeCategory,
      extractedSkills: ['Decra & Box Profile Sheet Installation', 'Roof Leak Sealing', 'Rain Gutter Redirection', 'Timber Rafter Reinforcement', 'Bitumen Membrane Waterproofing'],
      urgencyLevel: 'high' as 'high',
      experienceYearsSuggested: 6,
      nitaCertificationRecommended: 'NITA Trade Test Grade II (Roofing & Waterproofing)',
      requiresNitaCertified: true,
      requiredEquipmentOrTools: ['Full Body Fall Arrest Safety Harness', 'Gas Bitumen Torch', 'Sheet Metal Nibbler', 'Polyurethane Sealant Gun'],
      estimatedCostRangeKes: {
        min: 1200,
        max: 6000,
        explanation: 'Structural roof leak inspection, valley gutter repair, and sealing labor in KES'
      },
      safetyAdvisory: [
        'Do not attempt to climb onto wet, sloped, or weathered metal roofs without safety ropes (Usipande juu ya paa linaponyesha).',
        'Place protective waterproof tarps or buckets beneath interior ceiling drips.'
      ],
      aiAnalysisExplanation: 'Roofing works carry working-at-heights risks and require verified NITA certified roofers with proper fall-arrest certification and weather sealing standards.'
    };
  }

  // Painting / Rangi / Wall / Ukuta
  if (
    lower.includes('paint') || lower.includes('damp') || lower.includes('peel') || 
    lower.includes('wall finish') || lower.includes('texture') || lower.includes('plaster') || 
    lower.includes('epoxy') || lower.includes('rangi') || lower.includes('kupaka') || 
    lower.includes('ukuta') || lower.includes('ukutani') || lower.includes('kubanduka')
  ) {
    return {
      problemSummary: 'Surface decoration & damp proofing triage: Moisture barrier and architectural painting needed (Upakaji rangi na kuzuia unyevu ukutani).',
      identifiedCategory: 'Painting' as TradeCategory,
      extractedSkills: ['Damp Proofing Treatment', 'Silk & Matt Wall Finishes', 'Ruff N Tuff Texture Coating', 'Epoxy Floor Sealing', 'Anti-Fungal Primer Application'],
      urgencyLevel: 'low' as 'low',
      experienceYearsSuggested: 5,
      nitaCertificationRecommended: 'NITA Trade Test Grade II (Painting & Decorating)',
      requiresNitaCertified: true,
      requiredEquipmentOrTools: ['Digital Moisture Reader', 'Airless Spray System', 'Orbital Dustless Sander', 'Laser Alignment Guides'],
      estimatedCostRangeKes: {
        min: 1000,
        max: 6500,
        explanation: 'Surface preparation, moisture sealing, and finish coating labor estimate in KES'
      },
      safetyAdvisory: [
        'Keep windows open to ensure natural ventilation while primers and paints are being applied (Fungua madirisha kupata hewa safi).',
        'Cover and isolate furniture to protect from fine dust.'
      ],
      aiAnalysisExplanation: 'Persistent wall peeling and dampness require technicians skilled in moisture barrier diagnosis and elastomeric membrane waterproofing.'
    };
  }

  // Welding / Metal / Chuma / Gate / Geti
  if (
    lower.includes('weld') || lower.includes('gate') || lower.includes('grille') || 
    lower.includes('burglar') || lower.includes('metal') || lower.includes('steel') || 
    lower.includes('iron') || lower.includes('chuma') || lower.includes('kuweld') || 
    lower.includes('geti') || lower.includes('mageti') || lower.includes('grill') || 
    lower.includes('madirisha ya chuma')
  ) {
    return {
      problemSummary: 'Metal fabrication & security welding triage: Structural steel assembly or gate repair required (Uchomeleaji vyuma na mageti).',
      identifiedCategory: 'Welding' as TradeCategory,
      extractedSkills: ['Security Grille Fabrication', 'Motorized Sliding Gate Repair', 'Structural Steel Trusses', 'Arc & MIG Welding', 'Heavy Angle Grinding'],
      urgencyLevel: 'medium' as 'medium',
      experienceYearsSuggested: 6,
      nitaCertificationRecommended: 'NITA Trade Test Grade I (Arc & Gas Welding)',
      requiresNitaCertified: true,
      requiredEquipmentOrTools: ['Inverter MMA Arc Welder', 'Heavy Angle Grinder', 'Magnetic Welding Clamps', 'Auto-Darkening Helmet'],
      estimatedCostRangeKes: {
        min: 1200,
        max: 5000,
        explanation: 'On-site mobile welding, track realignment, and reinforcement labor in KES'
      },
      safetyAdvisory: [
        'Ensure a 5-meter clearance around welding sparks free from dry grass, fuels, or plastic.',
        'Wear shade 11 eye protection to avoid arc eye radiation flash.'
      ],
      aiAnalysisExplanation: 'High-tensile steel gate welds and security fabrications require NITA certified welders to ensure structural durability and theft resistance.'
    };
  }

  // HVAC / AC / Kiyoyozi
  if (
    lower.includes('ac') || lower.includes('air cond') || lower.includes('hvac') || 
    lower.includes('chiller') || lower.includes('cool') || lower.includes('ventilat') || 
    lower.includes('kiyoyozi') || lower.includes('baridi')
  ) {
    return {
      problemSummary: 'Climate control triage: HVAC refrigerant cycling, compressor or thermostat diagnostics required (Kiyoyozi na mifumo ya baridi).',
      identifiedCategory: 'HVAC & AC' as TradeCategory,
      extractedSkills: ['Split Unit AC Installation', 'Refrigerant Leak Sealing', 'Duct Cleaning & Sanitization', 'Cold Room Maintenance', 'Inverter PCB Triage'],
      urgencyLevel: 'medium' as 'medium',
      experienceYearsSuggested: 6,
      nitaCertificationRecommended: 'NITA Trade Test Grade I (Refrigeration & HVAC Systems)',
      requiresNitaCertified: true,
      requiredEquipmentOrTools: ['Digital Manifold Gauges', 'HVAC Vacuum Pump', 'Electronic Halogen Leak Detector', 'Anemometer'],
      estimatedCostRangeKes: {
        min: 1500,
        max: 6500,
        explanation: 'Comprehensive AC diagnostic inspection, chemical coil washing, and gas refill labor in KES'
      },
      safetyAdvisory: [
        'Turn off breaker to condensing unit if abnormal grinding noise or burning odor is present.',
        'Keep filters clear to prevent ice formation on internal evaporator coils.'
      ],
      aiAnalysisExplanation: 'Modern inverter climate systems require technicians trained in high-pressure R410a/R32 systems and EPA/NITA refrigerant recovery guidelines.'
    };
  }

  // Masonry / Tiles / Sakafu / Simiti / Mawe
  if (
    lower.includes('tile') || lower.includes('mason') || lower.includes('stone') || 
    lower.includes('concrete') || lower.includes('foundation') || lower.includes('brick') || 
    lower.includes('crack') || lower.includes('sakafu') || lower.includes('simiti') || 
    lower.includes('mawe') || lower.includes('kujenga') || lower.includes('nyufa')
  ) {
    return {
      problemSummary: 'Structural masonry & tiling triage: Floor level screed, porcelain tiling, or masonry reinforcement required (Uashi, mawe na uwekaji wa marumaru/tiles).',
      identifiedCategory: 'Masonry' as TradeCategory,
      extractedSkills: ['Porcelain & Ceramic Tiling', 'Stone Cladding', 'Concrete Screed Levelling', 'Septic Tank Construction', 'Structural Crack Epoxy Stitching'],
      urgencyLevel: 'medium' as 'medium',
      experienceYearsSuggested: 8,
      nitaCertificationRecommended: 'NITA Trade Test Grade I (Masonry & Stone Construction)',
      requiresNitaCertified: true,
      requiredEquipmentOrTools: ['1200mm Professional Tile Cutter', 'Multi-Axis Laser Level', 'Heavy Mortar Mixer', 'Diamond Core Bit Rig'],
      estimatedCostRangeKes: {
        min: 1100,
        max: 5500,
        explanation: 'Masonry inspection, laser level floor preparation, and square meter labor rate in KES'
      },
      safetyAdvisory: [
        'Keep off newly laid screed or wet tile adhesive for minimum 24 hours.',
        'Wear reinforced steel-toe boots around loose stone blocks.'
      ],
      aiAnalysisExplanation: 'Large format tiles and structural masonry require seasoned masons to prevent hollow spots, uneven lippage, and structural settling cracks.'
    };
  }

  // Default General Trade Triage
  return {
    problemSummary: `General maintenance triage: Assessment and artisan dispatch for "${prompt.slice(0, 45)}..."`,
    identifiedCategory: 'Plumbing' as TradeCategory,
    extractedSkills: ['Diagnostic Troubleshooting', 'Component Replacement', 'Safety Inspection', 'Preventative Maintenance'],
    urgencyLevel: 'medium' as 'medium',
    experienceYearsSuggested: 5,
    nitaCertificationRecommended: 'NITA Trade Test Grade I (Master Certified)',
    requiresNitaCertified: true,
    requiredEquipmentOrTools: ['Standard Diagnostic Toolkit', 'Digital Multimeter', 'Pressure Gauges'],
    estimatedCostRangeKes: {
      min: 800,
      max: 3000,
      explanation: 'Standard diagnostic site visit and initial labor estimate in KES'
    },
    safetyAdvisory: [
      'Take photos of the issue for the arriving technician.',
      'Ensure clear access to utility shutoff valves and breaker panels.'
    ],
    aiAnalysisExplanation: 'Your request was processed through Spana NLP engine and matched against certified Kenyan artisans with verified track records.'
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 1. Correlation ID & Security Headers Middleware
  app.use((req, res, next) => {
    const correlationId = (req.headers['x-correlation-id'] as string) || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // 2. Metrics & Latency Observability Middleware
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      metricsRegistry.recordRequest(res.statusCode, duration);
    });
    next();
  });

  // 3. Sliding Window Rate Limiter & WAF Guard Middleware
  app.use('/api', (req, res, next) => {
    // Exempt metrics and health checks from strict throttling
    if (req.path.startsWith('/health') || req.path.startsWith('/metrics') || req.path.startsWith('/events/stream')) {
      return next();
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const isStrict = req.path.startsWith('/nlp') || req.path.startsWith('/recommendations') || req.path.startsWith('/bookings');
    const rateLimit = checkRateLimit(clientIp, isStrict);

    res.setHeader('X-RateLimit-Limit', rateLimit.limit.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimit.resetSeconds.toString());

    if (!rateLimit.allowed && isFeatureEnabled('enableStrictRateLimiting')) {
      res.setHeader('Retry-After', rateLimit.resetSeconds.toString());
      recordAuditLog({
        correlationId: (req as any).correlationId,
        action: 'RATE_LIMIT_EXCEEDED',
        actor: clientIp,
        status: 'FAILED',
        details: { path: req.path, method: req.method, limit: rateLimit.limit }
      });
      res.status(429).json({
        error: 'Too Many Requests',
        message: `API rate limit exceeded. Please retry after ${rateLimit.resetSeconds} seconds.`,
        retryAfter: rateLimit.resetSeconds
      });
      return;
    }
    next();
  });

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Spana Core Server',
      fundisCount: fundisStore.length,
      bookingsCount: bookingsStore.length,
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      fastApiRecommenderUrl: process.env.FASTAPI_RECOMMENDER_URL || 'http://localhost:8000/recommend'
    });
  });

  // 1. Deep Health Check (Subsystems & Dependencies)
  app.get('/api/health/deep', (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status: 'healthy',
      subsystems: {
        databaseStore: { status: 'up', itemsCount: fundisStore.length + bookingsStore.length },
        circuitBreakers: {
          gemini: circuitBreakers.gemini.state,
          fastApi: circuitBreakers.fastApi.state,
          mpesa: circuitBreakers.mpesa.state
        },
        deadLetterQueue: { status: 'healthy', pendingCount: getDLQItems().filter(i => i.status === 'PENDING_RETRY').length },
        rateLimiter: { status: 'active', trackedIps: getRateLimitStats().totalTrackedIps },
        realtimeSse: { status: 'active', connectedClients: getActiveSseClientsCount() }
      },
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024)
      },
      timestamp: new Date().toISOString()
    });
  });

  // 2. Metrics (Prometheus standard text format)
  app.get('/api/metrics', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metricsRegistry.toPrometheusFormat());
  });

  // 3. Metrics JSON & SLO Status
  app.get('/api/system/metrics', (_req, res) => {
    res.json(metricsRegistry.getMetricsSummary());
  });

  // 4. Feature Flags API
  app.get('/api/system/feature-flags', (_req, res) => {
    res.json(getFeatureFlags());
  });

  app.post('/api/system/feature-flags', (req, res) => {
    const { key, enabled } = req.body;
    if (typeof key !== 'string' || typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'key (string) and enabled (boolean) are required' });
      return;
    }
    const success = setFeatureFlag(key, enabled);
    if (!success) {
      res.status(404).json({ error: 'Feature flag not found' });
      return;
    }
    recordAuditLog({
      correlationId: (req as any).correlationId,
      action: 'FEATURE_FLAG_TOGGLED',
      actor: 'Admin',
      status: 'SUCCESS',
      details: { key, enabled }
    });
    broadcastSseEvent('FEATURE_FLAG_CHANGED', { key, enabled });
    res.json({ success: true, flags: getFeatureFlags() });
  });

  // 5. Distributed Sagas API
  app.get('/api/system/sagas', (_req, res) => {
    res.json(getSagas());
  });

  // 6. Dead Letter Queue (DLQ) API & Replay
  app.get('/api/system/dlq', (_req, res) => {
    res.json(getDLQItems());
  });

  app.post('/api/system/dlq/:id/retry', (req, res) => {
    const id = req.params.id;
    const ok = resolveDLQItem(id);
    if (!ok) {
      res.status(404).json({ error: 'DLQ item not found' });
      return;
    }
    recordAuditLog({
      correlationId: (req as any).correlationId,
      action: 'DLQ_ITEM_REPLAYED',
      actor: 'Admin',
      resourceId: id,
      status: 'SUCCESS'
    });
    broadcastSseEvent('DLQ_RESOLVED', { id });
    res.json({ success: true, message: `DLQ Item ${id} successfully replayed and resolved.` });
  });

  // 7. Circuit Breaker Inspection & Chaos Testing (Trip/Reset)
  app.get('/api/system/circuit-breakers', (_req, res) => {
    res.json({
      gemini: { state: circuitBreakers.gemini.state, failures: circuitBreakers.gemini.failureCount },
      fastApi: { state: circuitBreakers.fastApi.state, failures: circuitBreakers.fastApi.failureCount },
      mpesa: { state: circuitBreakers.mpesa.state, failures: circuitBreakers.mpesa.failureCount }
    });
  });

  app.post('/api/system/circuit-breakers/:name/trip', (req, res) => {
    const name = req.params.name as keyof typeof circuitBreakers;
    if (circuitBreakers[name]) {
      circuitBreakers[name].trip();
      recordAuditLog({
        correlationId: (req as any).correlationId,
        action: 'CIRCUIT_BREAKER_TRIPPED',
        actor: 'ChaosEngineer',
        status: 'SUCCESS',
        details: { breaker: name }
      });
      broadcastSseEvent('CIRCUIT_BREAKER_UPDATED', { name, state: 'OPEN' });
      res.json({ success: true, name, state: 'OPEN' });
    } else {
      res.status(404).json({ error: 'Unknown circuit breaker' });
    }
  });

  app.post('/api/system/circuit-breakers/:name/reset', (req, res) => {
    const name = req.params.name as keyof typeof circuitBreakers;
    if (circuitBreakers[name]) {
      circuitBreakers[name].reset();
      recordAuditLog({
        correlationId: (req as any).correlationId,
        action: 'CIRCUIT_BREAKER_RESET',
        actor: 'Admin',
        status: 'SUCCESS',
        details: { breaker: name }
      });
      broadcastSseEvent('CIRCUIT_BREAKER_UPDATED', { name, state: 'CLOSED' });
      res.json({ success: true, name, state: 'CLOSED' });
    } else {
      res.status(404).json({ error: 'Unknown circuit breaker' });
    }
  });

  // 8. Audit Logs API
  app.get('/api/system/audit-logs', (_req, res) => {
    res.json(getAuditLogs());
  });

  // 9. Real-Time Server-Sent Events (SSE) Stream
  app.get('/api/events/stream', (req, res) => {
    const role = (req.query.role as string) || 'client';
    const clientId = registerSseClient(res, role);

    req.on('close', () => {
      unregisterSseClient(clientId);
    });
  });

  // 10. Real-Time Long Polling Fallback
  app.get('/api/events/poll', (_req, res) => {
    res.json({
      events: notificationsStore.slice(0, 10),
      timestamp: new Date().toISOString()
    });
  });

  // 11. Broadcast Custom Event (Admin / System)
  app.post('/api/events/broadcast', (req, res) => {
    const { eventType, data } = req.body;
    broadcastSseEvent(eventType || 'SYSTEM_BROADCAST', data || {});
    res.json({ success: true, broadcastedTo: getActiveSseClientsCount() });
  });

  // 12. Blue-Green Deployment Controller API
  app.get('/api/system/deployments', (_req, res) => {
    res.json(getBlueGreenState());
  });

  app.post('/api/system/deployments/toggle', (req, res) => {
    const updated = toggleBlueGreenSlot();
    recordAuditLog({
      correlationId: (req as any).correlationId,
      action: 'DEPLOYMENT_SLOT_TOGGLED',
      actor: 'ReleaseManager',
      status: 'SUCCESS',
      details: { activeSlot: updated.activeSlot, blueVersion: updated.blueVersion, greenVersion: updated.greenVersion }
    });
    res.json(updated);
  });

  // 13. Automated Cron Jobs API
  app.get('/api/system/cron', (_req, res) => {
    res.json(getCronJobs());
  });

  app.post('/api/system/cron/:id/run', (req, res) => {
    const result = executeCronJob(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Cron job not found' });
    }
    recordAuditLog({
      correlationId: (req as any).correlationId,
      action: 'CRON_JOB_TRIGGERED_MANUALLY',
      actor: 'Admin',
      status: 'SUCCESS',
      details: { jobId: req.params.id, durationMs: result.lastExecutionDurationMs }
    });
    res.json(result);
  });

  // 14. Disaster Recovery & Backup Snapshots API
  app.get('/api/system/backups', (_req, res) => {
    res.json(getBackupSnapshots());
  });

  app.post('/api/system/backups/create', (req, res) => {
    const snap = createBackupSnapshot('ON_DEMAND');
    recordAuditLog({
      correlationId: (req as any).correlationId,
      action: 'DISASTER_RECOVERY_SNAPSHOT_CREATED',
      actor: 'Admin',
      status: 'SUCCESS',
      details: { id: snap.id, sizeMb: snap.sizeMb, region: snap.region }
    });
    res.json(snap);
  });

  // 15. Infrastructure Topology & Observability API
  app.get('/api/system/infra-topology', (_req, res) => {
    res.json(getInfraTopology());
  });

  // 16. Distributed Saga Simulation API
  app.post('/api/system/sagas/simulate', (req, res) => {
    const correlationId = (req as any).correlationId || `corr-sim-${Date.now()}`;
    const simBookingId = `SIM-${Math.floor(1000 + Math.random() * 9000)}`;
    const shouldFail = req.body?.simulateFailure === true;

    const saga = createSaga(simBookingId, correlationId);
    recordSagaStep(saga.sagaId, '1. Reserve Artisan Timeslot', 'SUCCESS');
    recordSagaStep(saga.sagaId, '2. Hold M-Pesa Escrow Funds', 'SUCCESS');

    if (shouldFail) {
      recordSagaStep(saga.sagaId, '3. Send Cellular SMS Notification', 'FAILED', 'Cellular gateway timeout (simulated)');
      recordSagaStep(saga.sagaId, '4. Compensating Transaction: Refund Escrow', 'COMPENSATED');
      recordSagaStep(saga.sagaId, '5. Compensating Transaction: Release Timeslot', 'COMPENSATED');
      finalizeSaga(saga.sagaId, 'ROLLED_BACK', 'Cellular gateway timeout triggered 2-phase compensating rollback');
      enqueueDLQ('SMS_DISPATCH', { bookingId: simBookingId, reason: 'SIMULATED_CHAOS_FAILURE' }, 'Simulated cellular timeout');
    } else {
      recordSagaStep(saga.sagaId, '3. Send Cellular SMS Notification', 'SUCCESS');
      recordSagaStep(saga.sagaId, '4. Dispatch Real-Time Webhook', 'SUCCESS');
      finalizeSaga(saga.sagaId, 'COMMITTED');
    }

    res.json({
      success: true,
      saga,
      message: shouldFail
        ? 'Saga failed at step 3 and successfully executed compensating rollback transactions.'
        : 'Distributed saga completed all 4 transactional phases with two-phase commit.'
    });
  });

  // 12. Daraja M-Pesa Webhook Simulator (with Idempotency & DLQ fallback)
  app.post('/api/webhooks/daraja', (req, res) => {
    try {
      const { Body } = req.body;
      const correlationId = (req as any).correlationId;
      const resultCode = Body?.stkCallback?.ResultCode ?? 0;
      const checkoutReqId = Body?.stkCallback?.CheckoutRequestID || 'sim-checkout';

      if (resultCode === 0) {
        recordAuditLog({
          correlationId,
          action: 'DARAJA_WEBHOOK_RECEIVED',
          actor: 'SafaricomDaraja',
          status: 'SUCCESS',
          details: { checkoutReqId, resultCode }
        });
        broadcastSseEvent('MPESA_PAYMENT_CONFIRMED', { checkoutReqId });
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      } else {
        // Enqueue to Dead Letter Queue for operational review
        enqueueDLQ('WEBHOOK_DARADA', req.body, `Daraja STK callback failed with code ${resultCode}`);
        res.json({ ResultCode: 0, ResultDesc: 'Logged in DLQ' });
      }
    } catch (err: any) {
      enqueueDLQ('WEBHOOK_DARADA', req.body, err.message);
      res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal error' });
    }
  });

  // Get categories and stats dynamically
  app.get('/api/categories', (_req, res) => {
    const categoryCounts: Record<string, number> = {};
    fundisStore.forEach(f => {
      if (f.primaryCategory) {
        categoryCounts[f.primaryCategory] = (categoryCounts[f.primaryCategory] || 0) + 1;
      }
      if (Array.isArray(f.additionalCategories)) {
        f.additionalCategories.forEach(c => {
          if (c) categoryCounts[c] = (categoryCounts[c] || 0) + 1;
        });
      }
    });

    const allCatNames = Array.from(new Set([...Object.keys(CATEGORY_INFO), ...Object.keys(categoryCounts)]));

    const result = allCatNames
      .map(cat => {
        const info = (CATEGORY_INFO as Record<string, any>)[cat];
        return {
          name: cat,
          displayName: cat,
          description: info?.description || `Certified & verified ${cat} specialists`,
          icon: info?.icon || 'Wrench',
          color: 'from-orange-600 to-amber-700',
          availableFundis: categoryCounts[cat] || 0
        };
      })
      .filter(c => c.availableFundis > 0 || Boolean((CATEGORY_INFO as Record<string, any>)[c.name]));

    res.json(result);
  });

  // Get distinct verified skillsets and counts dynamically
  app.get('/api/skills', (_req, res) => {
    const skillMap: Record<string, { name: string; count: number; category: string }> = {};

    fundisStore.forEach(f => {
      if (Array.isArray(f.skills)) {
        f.skills.forEach(s => {
          const trimmed = s.trim();
          if (trimmed) {
            const key = trimmed.toLowerCase();
            if (!skillMap[key]) {
              skillMap[key] = {
                name: trimmed,
                count: 1,
                category: f.primaryCategory
              };
            } else {
              skillMap[key].count += 1;
            }
          }
        });
      }
    });

    const sortedSkills = Object.values(skillMap).sort((a, b) => b.count - a.count);
    res.json(sortedSkills);
  });

  // Location-based recommendation endpoint
  app.post('/api/recommendations', async (req, res) => {
    try {
      const {
        userLat = -1.286389,
        userLng = 36.817223,
        category,
        searchQuery,
        skill,
        maxDistanceKm = 30,
        minRating = 0,
        maxHourlyRateKes,
        verifiedOnly = false,
        availableNowOnly = false,
        emergencyOnly = false,
        customFastApiUrl
      } = req.body;

      const recommendations = await getRecommendations(fundisStore, {
        userLat: Number(userLat),
        userLng: Number(userLng),
        category,
        searchQuery,
        skill,
        maxDistanceKm: Number(maxDistanceKm),
        minRating: Number(minRating),
        maxHourlyRateKes: maxHourlyRateKes ? Number(maxHourlyRateKes) : undefined,
        verifiedOnly: Boolean(verifiedOnly),
        availableNowOnly: Boolean(availableNowOnly),
        emergencyOnly: Boolean(emergencyOnly),
        customFastApiUrl
      });

      res.json(recommendations);
    } catch (err: any) {
      console.error('Error generating recommendations:', err);
      res.status(500).json({ error: 'Failed to compute recommendations', details: err.message });
    }
  });

  // List all Fundis
  app.get('/api/fundis', (req, res) => {
    const { category, search } = req.query;
    let list = [...fundisStore];
    if (category && category !== 'All') {
      list = list.filter(f => f.primaryCategory === category || f.additionalCategories.includes(category as TradeCategory));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) ||
        f.skills.some(s => s.toLowerCase().includes(q)) ||
        f.location.neighborhood?.toLowerCase().includes(q)
      );
    }
    res.json(list);
  });

  // Get specific Fundi by ID
  app.get('/api/fundis/:id', (req, res) => {
    const fundi = fundisStore.find(f => f.id === req.params.id);
    if (!fundi) {
      res.status(404).json({ error: 'Fundi not found' });
      return;
    }
    res.json(fundi);
  });

  // Register a new Fundi (Accredited or Non-Accredited / RPL Candidate)
  app.post('/api/fundis', (req, res) => {
    try {
      const body = req.body;
      const isNita = Boolean(body.nitaAccredited);
      const newFundi: Fundi = {
        id: `fundi-${Date.now()}`,
        name: body.name || 'New Skilled Artisan',
        avatarUrl: body.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400',
        phone: body.phone || '+254 700 000 000',
        whatsapp: body.whatsapp || '+254700000000',
        primaryCategory: body.primaryCategory || 'Plumbing',
        additionalCategories: body.additionalCategories || [],
        skills: Array.isArray(body.skills) ? body.skills : (body.skills ? String(body.skills).split(',').map(s => s.trim()) : ['General Trade Craft']),
        bio: body.bio || (isNita 
          ? `Certified ${body.primaryCategory || 'artisan'} with ${body.experienceYears || 3}+ years field experience.`
          : `Apprenticeship-trained ${body.primaryCategory || 'artisan'} with ${body.experienceYears || 3}+ years practical experience. Eligible for NITA Recognition of Prior Learning (RPL).`),
        experienceYears: Number(body.experienceYears) || 3,
        hourlyRateKes: Number(body.hourlyRateKes) || 750,
        fixedInspectionFeeKes: Number(body.fixedInspectionFeeKes) || 500,
        rating: 5.0,
        reviewCount: 0,
        jobsCompleted: 0,
        isVerified: true,
        idVerified: true,
        backgroundChecked: false,
        isAvailableNow: true,
        emergencyAvailable: Boolean(body.emergencyAvailable),
        responseTimeMinutes: Number(body.responseTimeMinutes) || 25,
        location: {
          lat: Number(body.lat) || -1.286389,
          lng: Number(body.lng) || 36.817223,
          neighborhood: body.neighborhood || 'Nairobi',
          address: body.address || `${body.neighborhood || 'Nairobi'}, Kenya`,
          city: body.city || 'Nairobi'
        },
        toolsEquipment: Array.isArray(body.toolsEquipment) ? body.toolsEquipment : (body.toolsEquipment ? String(body.toolsEquipment).split(',').map(t => t.trim()) : ['Standard Toolset']),
        nitaAccredited: isNita,
        nitaCertificationLevel: isNita ? (body.nitaCertificationLevel || 'NITA Trade Test Certified') : 'Apprenticeship Trained (RPL Eligible)',
        nitaTradeTestNo: isNita ? (body.nitaTradeTestNo || `NITA/TT/2026/${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
        accreditationStatus: isNita ? 'nita_accredited' : 'rpl_candidate',
        rplEligible: !isNita,
        rplStatus: !isNita ? 'not_applied' : undefined,
        experienceRoute: isNita ? 'formal_vocational' : 'informal_apprenticeship',
        reviews: [],
        portfolio: body.portfolio || []
      };

      fundisStore.unshift(newFundi);
      res.status(201).json({ success: true, fundi: newFundi });
    } catch (err: any) {
      res.status(400).json({ error: 'Invalid fundi registration payload', details: err.message });
    }
  });

  // Update existing Fundi profile (Artisan self-service profile editor)
  app.put('/api/fundis/:id', (req, res) => {
    try {
      const fundiId = req.params.id;
      const index = fundisStore.findIndex(f => f.id === fundiId);
      if (index === -1) {
        res.status(404).json({ error: 'Fundi not found' });
        return;
      }

      const existing = fundisStore[index];
      const body = req.body;

      const updatedFundi: Fundi = {
        ...existing,
        name: body.name !== undefined ? body.name : existing.name,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        whatsapp: body.whatsapp !== undefined ? body.whatsapp : existing.whatsapp,
        bio: body.bio !== undefined ? body.bio : existing.bio,
        primaryCategory: body.primaryCategory || existing.primaryCategory,
        additionalCategories: body.additionalCategories || existing.additionalCategories,
        skills: body.skills || existing.skills,
        toolsEquipment: body.toolsEquipment || existing.toolsEquipment,
        hourlyRateKes: body.hourlyRateKes !== undefined ? Number(body.hourlyRateKes) : existing.hourlyRateKes,
        fixedInspectionFeeKes: body.fixedInspectionFeeKes !== undefined ? Number(body.fixedInspectionFeeKes) : existing.fixedInspectionFeeKes,
        experienceYears: body.experienceYears !== undefined ? Number(body.experienceYears) : existing.experienceYears,
        emergencyAvailable: body.emergencyAvailable !== undefined ? Boolean(body.emergencyAvailable) : existing.emergencyAvailable,
        isAvailableNow: body.isAvailableNow !== undefined ? Boolean(body.isAvailableNow) : existing.isAvailableNow,
        location: {
          ...existing.location,
          neighborhood: body.neighborhood || existing.location.neighborhood,
          address: body.address || existing.location.address,
          city: body.city || existing.location.city,
          lat: body.lat !== undefined ? Number(body.lat) : existing.location.lat,
          lng: body.lng !== undefined ? Number(body.lng) : existing.location.lng
        }
      };

      fundisStore[index] = updatedFundi;
      res.json({ success: true, fundi: updatedFundi });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update profile', details: err.message });
    }
  });

  // Apply for Recognition of Prior Learning (RPL) under KNQA / NITA
  app.post('/api/rpl/apply', (req, res) => {
    try {
      const { fundiId, targetGrade, preferredCenter, practicalSkillsSummary, apprenticeshipWorkshop, notes } = req.body;
      const fundi = fundisStore.find(f => f.id === fundiId);
      if (!fundi) {
        res.status(404).json({ error: 'Artisan profile not found' });
        return;
      }

      const application: RplApplication = {
        id: `RPL-2026-${Math.floor(100 + Math.random() * 900)}`,
        fundiId: fundi.id,
        fundiName: fundi.name,
        phone: fundi.phone,
        tradeCategory: fundi.primaryCategory,
        targetGrade: targetGrade || 'Grade II (Intermediate)',
        preferredCenter: preferredCenter || 'NITA Nairobi Industrial Training Centre (Commercial St)',
        experienceYears: fundi.experienceYears,
        apprenticeshipWorkshop: apprenticeshipWorkshop || 'Independent / Guild Apprenticeship Workshop',
        practicalSkillsSummary: practicalSkillsSummary || fundi.skills.join(', '),
        status: 'submitted',
        submissionDate: new Date().toISOString().split('T')[0],
        scheduledAssessmentDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
        notes: notes || 'Application received by Kenya National Qualifications Authority & NITA assessment desk.'
      };

      rplApplicationsStore.unshift(application);

      // Update fundi profile state
      fundi.rplStatus = 'application_submitted';
      fundi.rplApplicationDate = application.submissionDate;
      fundi.rplCenter = application.preferredCenter;

      res.status(201).json({ success: true, application, fundi });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to process RPL application', details: err.message });
    }
  });

  // Get RPL Applications for an Artisan
  app.get('/api/rpl/applications/:fundiId', (req, res) => {
    const apps = rplApplicationsStore.filter(a => a.fundiId === req.params.fundiId);
    res.json(apps);
  });

  // Get all RPL Applications (Admin/Auditor view)
  app.get('/api/rpl/applications', (_req, res) => {
    res.json(rplApplicationsStore);
  });

  // Bulk import from Google Sheets trained model dataset
  app.post('/api/fundis/bulk-import', (req, res) => {
    try {
      const { fundis, meta, replaceAll = false } = req.body;
      if (!Array.isArray(fundis) || fundis.length === 0) {
        res.status(400).json({ error: 'Valid fundis array required' });
        return;
      }

      if (replaceAll) {
        fundisStore = [...fundis];
      } else {
        // Prepend imported trained fundis
        const existingIds = new Set(fundis.map(f => f.id));
        const kept = fundisStore.filter(f => !existingIds.has(f.id));
        fundisStore = [...fundis, ...kept];
      }

      res.json({
        success: true,
        importedCount: fundis.length,
        totalActiveFundis: fundisStore.length,
        meta: meta || { title: 'Google Sheet Model' }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to bulk import fundis', details: err.message });
    }
  });

  // Fetch Google Sheet data (supports both public sheets via Google's CSV export/gviz and private sheets via OAuth)
  app.post('/api/sheets/fetch', async (req, res) => {
    try {
      const { url, spreadsheetId, sheetName, accessToken } = req.body;
      const rawInput = (url || spreadsheetId || '').trim();

      if (!rawInput) {
        res.status(400).json({ error: 'Google Sheet URL or Spreadsheet ID is required' });
        return;
      }

      // Extract ID from URL
      let cleanId = rawInput;
      const match = rawInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanId = match[1];
      }

      // Check if URL specifies a gid
      let gid = '';
      const gidMatch = rawInput.match(/[#&?]gid=([0-9]+)/);
      if (gidMatch && gidMatch[1]) {
        gid = gidMatch[1];
      }

      let detectedTitle = 'Artisan Google Sheet Dataset';
      let sheetTabs: { title: string; sheetId: number }[] = [];

      // 1. If accessToken is provided, try official Google Sheets API v4
      if (accessToken) {
        try {
          const metaRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,sheets.properties(sheetId,title,gridProperties)`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (metaRes.ok) {
            const metaData = await metaRes.json();
            detectedTitle = metaData.properties?.title || detectedTitle;
            sheetTabs = (metaData.sheets || []).map((s: any) => ({
              title: s.properties?.title || 'Sheet1',
              sheetId: s.properties?.sheetId || 0
            }));

            const targetTab = sheetName || (sheetTabs[0]?.title) || 'Sheet1';
            const valuesRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(targetTab)}!A1:ZZ5000`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (valuesRes.ok) {
              const valData = await valuesRes.json();
              const values: (string | number)[][] = valData.values || [];
              if (values.length > 0) {
                const headers = values[0].map(h => String(h || '').trim());
                const rows = values.slice(1);
                res.json({
                  success: true,
                  spreadsheetId: cleanId,
                  title: detectedTitle,
                  sheetName: targetTab,
                  sheetTabs,
                  headers,
                  rows,
                  totalRows: rows.length
                });
                return;
              }
            }
          }
        } catch (authErr) {
          console.warn('Google Sheets OAuth fetch failed, falling back to public export:', authErr);
        }
      }

      // 2. Public Google Sheet fetch via Google's CSV export / gviz endpoints
      // Works when sheet has "Anyone with the link can view" access without requiring sign-in
      const targetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : (gid ? `&gid=${gid}` : '');
      const exportUrls = [
        `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv${targetParam}`,
        `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv${targetParam}`,
        `https://docs.google.com/spreadsheets/d/${cleanId}/pub?output=csv${targetParam}`
      ];

      let csvText = '';
      let fetchSuccess = false;

      for (const exportUrl of exportUrls) {
        try {
          const fetchRes = await fetch(exportUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
          });

          if (fetchRes.ok) {
            const text = await fetchRes.text();
            // Verify response is not an HTML login redirect page
            if (!text.includes('<!DOCTYPE html>') && !text.includes('id="login-form"') && text.trim().length > 0) {
              csvText = text;
              fetchSuccess = true;
              break;
            }
          }
        } catch (fetchErr) {
          console.warn(`Export fetch attempt error (${exportUrl}):`, fetchErr);
        }
      }

      if (!fetchSuccess || !csvText.trim()) {
        res.status(403).json({
          error: 'Could not access Google Sheet',
          message: 'Unable to read this Google Sheet. Please ensure:\n1. Click "Share" (top-right of your Google Sheet)\n2. Change General Access to "Anyone with the link can view"\n3. Or click File > Download > Comma Separated Values (.csv) and upload the CSV file directly.',
          isPermissionError: true
        });
        return;
      }

      // Parse CSV text with robust state machine parser
      const parsed = parseCsvString(csvText);

      res.json({
        success: true,
        spreadsheetId: cleanId,
        title: detectedTitle,
        sheetName: sheetName || (gid ? `Tab_${gid}` : 'Sheet1'),
        sheetTabs: sheetTabs.length > 0 ? sheetTabs : [{ title: sheetName || 'Sheet1', sheetId: 0 }],
        headers: parsed.headers,
        rows: parsed.rows,
        totalRows: parsed.rows.length
      });

    } catch (err: any) {
      console.error('Error in /api/sheets/fetch:', err);
      res.status(500).json({ error: 'Server error processing Google Sheet', details: err.message });
    }
  });

  // Reset fundis dataset back to baseline
  app.post('/api/fundis/reset-default', (_req, res) => {
    fundisStore = [...INITIAL_FUNDIS];
    res.json({ success: true, totalFundis: fundisStore.length, message: 'Reset to default fundis catalogue' });
  });

  // Add review for a fundi
  app.post('/api/fundis/:id/reviews', (req, res) => {
    const fundi = fundisStore.find(f => f.id === req.params.id);
    if (!fundi) {
      res.status(404).json({ error: 'Fundi not found' });
      return;
    }

    const { authorName, rating, comment, jobType } = req.body;
    const newRev = {
      id: `rev-${Date.now()}`,
      authorName: authorName || 'Verified Homeowner',
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      date: new Date().toISOString().split('T')[0],
      comment: comment || 'Very professional service and arrived on time.',
      jobType: jobType || 'Home Repair',
      verifiedJob: true
    };

    fundi.reviews.unshift(newRev);
    fundi.reviewCount += 1;
    fundi.jobsCompleted += 1;
    // Update moving average rating
    const sumRatings = fundi.reviews.reduce((acc, r) => acc + r.rating, 0);
    fundi.rating = Number((sumRatings / fundi.reviews.length).toFixed(1));

    res.json({ success: true, fundi });
  });

  // Smart Problem Diagnosis (using Gemini or heuristic logic)
  app.post('/api/diagnose', async (req, res) => {
    const { problemDescription } = req.body;

    if (!problemDescription || typeof problemDescription !== 'string') {
      res.status(400).json({ error: 'problemDescription is required' });
      return;
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `You are the lead engineering diagnostic triage system for "Spana", a location-based skilled trade artisan service in Kenya and East Africa.
Analyze this user home repair or maintenance issue:
"${problemDescription}"

Return a pure valid JSON object (no markdown, no backticks) with this structure:
{
  "problemSummary": "Concise 1-sentence technical diagnosis",
  "suggestedCategory": "Plumbing" | "Electrical" | "Carpentry" | "Painting" | "Masonry" | "Appliance Repair" | "Welding" | "Roofing" | "HVAC & AC" | "Landscaping",
  "secondaryCategories": ["Optional related trade categories"],
  "urgencyLevel": "low" | "medium" | "high" | "critical_emergency",
  "estimatedCostRangeKes": {
    "min": 500,
    "max": 4500,
    "explanation": "Cost estimate breakdown for labor and typical parts in Kenyan Shillings (KES)"
  },
  "recommendedToolsOrParts": ["Item 1", "Item 2"],
  "safetyPrecautions": ["Immediate safety action or precaution for the homeowner"],
  "recommendedSkills": ["Specific skill keywords needed"],
  "aiExplanation": "Clear, friendly explanation of why this trade is required and what the fundi will inspect"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const diagnosis: ProblemDiagnosis = JSON.parse(cleanJson);
        res.json(diagnosis);
        return;
      } catch (err) {
        console.warn('Gemini diagnosis fallback triggered:', err);
      }
    }

    // Heuristic fallback diagnosis if Gemini key isn't provided or fails
    const fallbackNlp = extractSemanticNlpFallback(problemDescription);
    const fallbackDiagnosis: ProblemDiagnosis = {
      problemSummary: fallbackNlp.problemSummary,
      suggestedCategory: fallbackNlp.identifiedCategory,
      secondaryCategories: [],
      urgencyLevel: fallbackNlp.urgencyLevel,
      estimatedCostRangeKes: fallbackNlp.estimatedCostRangeKes,
      recommendedToolsOrParts: fallbackNlp.requiredEquipmentOrTools,
      safetyPrecautions: fallbackNlp.safetyAdvisory,
      recommendedSkills: fallbackNlp.extractedSkills,
      aiExplanation: fallbackNlp.aiAnalysisExplanation
    };

    res.json(fallbackDiagnosis);
  });

  // NLP Request Analysis & Certified Artisan Matcher Endpoint
  app.post('/api/nlp-match', async (req, res) => {
    try {
      const { 
        prompt, 
        userLat = -1.286389, 
        userLng = 36.817223, 
        maxDistanceKm = 50, 
        nitaOnly = false 
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'A detailed request description is required' });
        return;
      }

      const ai = getGeminiClient();
      let nlpData: any = null;
      let engineUsed: 'gemini-3.7-flash' | 'semantic_fallback_nlp' = 'gemini-3.7-flash';

      if (ai) {
        try {
          const systemInstruction = `You are the lead National Industrial Training Authority (NITA) and Spana AI technical triage engine for Kenya and East Africa.
Your mission is to perform deep Natural Language Processing (NLP) on a user's freeform home, office, or industrial repair/maintenance request.
Extract the technical trade discipline, specific specialized skills, recommended NITA qualification grade level, urgency level, typical Kenyan Shilling (KES) labor and materials budget, immediate safety advisory, and required tools.`;

          const promptText = `Analyze this user request in detail:
"${prompt.trim()}"

Return a pure valid JSON object conforming strictly to this format (no markdown fences, no backticks):
{
  "problemSummary": "Precise, professional 1-sentence technical diagnosis of the issue or project",
  "identifiedCategory": "Plumbing" | "Electrical" | "Carpentry" | "Painting" | "Masonry" | "Appliance Repair" | "Welding" | "Roofing" | "HVAC & AC" | "Landscaping",
  "extractedSkills": ["3 to 6 specific trade skills needed, e.g. PPR Pipe Welding, Water Tank Installation, Circuit Breaker Triage"],
  "urgencyLevel": "low" | "medium" | "high" | "critical_emergency",
  "experienceYearsSuggested": 5,
  "nitaCertificationRecommended": "NITA Trade Test Grade I (Master Certified)" | "NITA Trade Test Grade II" | "NITA Trade Test Grade III" | "NITA Certified Apprentice",
  "requiresNitaCertified": true,
  "requiredEquipmentOrTools": ["2 to 5 diagnostic and specialized repair tools"],
  "estimatedCostRangeKes": {
    "min": 800,
    "max": 3500,
    "explanation": "Cost estimate breakdown for labor and typical parts in Kenyan Shillings (KES)"
  },
  "safetyAdvisory": ["Immediate safety steps or precautions for the homeowner"],
  "aiAnalysisExplanation": "Detailed reasoning explaining the diagnostic assessment, required technician expertise, and NITA compliance relevance."
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: promptText,
            config: {
              systemInstruction,
              responseMimeType: 'application/json'
            }
          });

          const responseText = response.text || '';
          const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          nlpData = JSON.parse(cleanJson);
        } catch (err) {
          console.warn('Gemini NLP match failed, switching to semantic NLP engine:', err);
        }
      }

      if (!nlpData) {
        engineUsed = 'semantic_fallback_nlp';
        nlpData = extractSemanticNlpFallback(prompt);
      }

      // Calculate matching scores for each fundi in active dataset
      const matchedFundis: Fundi[] = [];
      const targetCategory = (nlpData.identifiedCategory || 'Plumbing').toLowerCase();
      const targetSkills: string[] = (nlpData.extractedSkills || []).map((s: string) => s.toLowerCase());

      for (const f of fundisStore) {
        const dist = calculateDistanceKm(userLat, userLng, f.location.lat, f.location.lng);
        if (dist > maxDistanceKm) continue;
        if (nitaOnly && !f.nitaAccredited) continue;

        let score = 50; // baseline
        const matchReasons: string[] = [];

        // Category matching
        const isPrimaryCat = f.primaryCategory.toLowerCase() === targetCategory;
        const isSecCat = f.additionalCategories?.some(c => c.toLowerCase() === targetCategory);

        if (isPrimaryCat) {
          score += 25;
        } else if (isSecCat) {
          score += 15;
          matchReasons.push(`Secondary specialty in ${f.primaryCategory}`);
        } else {
          score -= 20;
        }

        // Skills match
        const matchedSkillsList: string[] = [];
        for (const skill of f.skills) {
          const skillLower = skill.toLowerCase();
          const hasDirect = targetSkills.some(ts => ts.includes(skillLower) || skillLower.includes(ts));
          const hasWord = targetSkills.some(ts => {
            const words = ts.split(' ').filter(w => w.length > 3);
            return words.some(w => skillLower.includes(w));
          });
          if (hasDirect || hasWord) {
            matchedSkillsList.push(skill);
          }
        }

        if (matchedSkillsList.length > 0) {
          score += Math.min(20, matchedSkillsList.length * 8);
          matchReasons.push(`Matched skills: ${matchedSkillsList.slice(0, 2).join(', ')}`);
        }

        // Experience match
        if (f.experienceYears >= (nlpData.experienceYearsSuggested || 3)) {
          score += 5;
          matchReasons.push(`${f.experienceYears}+ years vetted experience`);
        }

        // Accreditation & Mastery Recognition (Unbiased towards practical apprenticeship mastery)
        if (f.nitaAccredited) {
          score += 12;
          matchReasons.push(`${f.nitaCertificationLevel || 'NITA Certified'} accredited`);
        } else {
          score += 10;
          matchReasons.push(`Apprenticeship Master (${f.experienceYears}+ yrs) • RPL Candidate`);
        }

        // Proximity factor
        if (dist <= 5) {
          score += 10;
          matchReasons.push(`Close proximity: ~${dist.toFixed(1)} km away`);
        } else if (dist <= 15) {
          score += 5;
        }

        // Rating factor
        if (f.rating >= 4.8) {
          score += 5;
        }

        const finalScore = Math.max(25, Math.min(99, Math.round(score)));

        matchedFundis.push({
          ...f,
          distanceKm: Number(dist.toFixed(1)),
          matchScore: finalScore,
          matchReasons: matchReasons.length > 0 ? matchReasons : [`Matches ${f.primaryCategory} specifications`]
        });
      }

      // Sort descending by match score
      matchedFundis.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

      const result: NlpMatchResult = {
        rawPrompt: prompt,
        problemSummary: nlpData.problemSummary || `NLP triage identified ${nlpData.identifiedCategory} requirements.`,
        identifiedCategory: nlpData.identifiedCategory || 'Plumbing',
        extractedSkills: nlpData.extractedSkills || [],
        urgencyLevel: nlpData.urgencyLevel || 'medium',
        experienceYearsSuggested: nlpData.experienceYearsSuggested || 4,
        nitaCertificationRecommended: nlpData.nitaCertificationRecommended || 'NITA Trade Test Grade I (Master Certified)',
        requiresNitaCertified: Boolean(nlpData.requiresNitaCertified ?? true),
        requiredEquipmentOrTools: nlpData.requiredEquipmentOrTools || [],
        estimatedCostRangeKes: nlpData.estimatedCostRangeKes || { min: 800, max: 3000, explanation: 'Standard labor range' },
        safetyAdvisory: nlpData.safetyAdvisory || [],
        aiAnalysisExplanation: nlpData.aiAnalysisExplanation || `NLP analysis matched your request to verified ${nlpData.identifiedCategory} artisans with relevant skill endorsements.`,
        matchingFundis: matchedFundis,
        matchCount: matchedFundis.length,
        engineUsed
      };

      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to process NLP request', details: err.message });
    }
  });

  // Interactive Fundi AI Chatbot Assistant (Supporting Sheng, Swahili, and English)
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        messages = [],
        userLat = -1.286389,
        userLng = 36.817223,
        languageMode = 'auto',
        maxDistanceKm = 50
      } = req.body;

      const latestUserMessage = messages
        .filter((m: any) => m.role === 'user')
        .slice(-1)[0]?.content || '';

      if (!latestUserMessage.trim()) {
        res.status(400).json({ error: 'A message content is required' });
        return;
      }

      // Determine active language
      const detectedLang = languageMode === 'auto' 
        ? detectLanguage(latestUserMessage) 
        : (languageMode as 'sheng' | 'swahili' | 'english');

      const fallbackTriage = extractSemanticNlpFallback(latestUserMessage);
      const targetCat = (fallbackTriage.identifiedCategory || 'Plumbing').toLowerCase();

      // Find top matching fundis from memory store
      const candidateFundis: Fundi[] = fundisStore
        .map(f => {
          const dist = calculateDistanceKm(userLat, userLng, f.location.lat, f.location.lng);
          return {
            ...f,
            distanceKm: Number(dist.toFixed(1))
          };
        })
        .filter(f => (f.distanceKm ?? 99) <= maxDistanceKm)
        .sort((a, b) => {
          const aMatch = a.primaryCategory.toLowerCase() === targetCat ? 1 : 0;
          const bMatch = b.primaryCategory.toLowerCase() === targetCat ? 1 : 0;
          if (bMatch !== aMatch) return bMatch - aMatch;
          return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
        })
        .slice(0, 3);

      const ai = getGeminiClient();
      let replyText = '';
      let suggestedReplies: string[] = [];
      let categoryDetected: TradeCategory = fallbackTriage.identifiedCategory;
      let costEstimateKes = fallbackTriage.estimatedCostRangeKes;
      let safetyTips: string[] = fallbackTriage.safetyAdvisory;
      let engineUsed = 'gemini-3.7-flash';

      if (ai) {
        try {
          const systemInstruction = `You are "Spana AI" (Ongea na Spana AI), Kenya's most intelligent, friendly, and culturally authentic artisan assistant and triage expert.
You have native mastery over three language styles:
1. "sheng": Vibrant Nairobi Sheng street dialect / slang (e.g., uses terms like "Niaje", "Rada gani", "Keja", "Janta", "Chapaa/Ganji", "Stima", "Plamba", "Mbao", "Chuma", "Kuzima", "Fiti", "Noma", "Baze", "Chapchap", "Beshte", "Mambo safi"). Use energetic, respectful Kenyan urban tone!
2. "swahili": Standard Kiswahili Sanifu used across Kenya and Tanzania (e.g., "Hujambo", "Habari yako", "Tatizo la umeme/mabomba", "Usalama kwanza", "Mafundi walioidhinishwa na NITA", "Gharama ya shilingi"). Polite, professional, and clear!
3. "english": Professional Kenyan English with local context (Nairobi estates, KES currency, NITA standards, EPRA licensing).

LANGUAGE SELECTION MANDATE:
The user wants you to reply in: "${detectedLang}".
You MUST strictly respond in "${detectedLang}" language style!

Always provide:
1. A warm, culturally authentic greeting and acknowledgement in the target language.
2. A direct technical diagnosis of what might be broken or required.
3. Immediate safety actions (e.g. turning off the main water valve / zima main breaker).
4. Estimated fair labor price range in Kenyan Shillings (KES / chapaa / ganji).
5. Encouragement to inspect the recommended NITA-certified fundis nearby and reach out via WhatsApp or direct call.

Format your output as a pure JSON object (no markdown fences, no backticks):
{
  "reply": "Markdown formatted rich conversational answer in ${detectedLang}",
  "categoryDetected": "Plumbing" | "Electrical" | "Carpentry" | "Painting" | "Masonry" | "Appliance Repair" | "Welding" | "Roofing" | "HVAC & AC" | "Landscaping",
  "costEstimateKes": {
    "min": 1000,
    "max": 3500,
    "explanation": "Brief cost breakdown in KES"
  },
  "safetyTips": ["Actionable step 1", "Actionable step 2"],
  "suggestedReplies": ["3 short, authentic follow-up user prompt options in ${detectedLang}"]
}`;

          // Format conversation history
          const contents = messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: contents as any,
            config: {
              systemInstruction,
              responseMimeType: 'application/json'
            }
          });

          const resText = response.text || '';
          const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          replyText = parsed.reply || '';
          if (parsed.suggestedReplies && Array.isArray(parsed.suggestedReplies)) {
            suggestedReplies = parsed.suggestedReplies;
          }
          if (parsed.categoryDetected) categoryDetected = parsed.categoryDetected;
          if (parsed.costEstimateKes) costEstimateKes = parsed.costEstimateKes;
          if (parsed.safetyTips) safetyTips = parsed.safetyTips;
        } catch (err) {
          console.warn('Gemini chat failed, using fallback conversational response:', err);
        }
      }

      // Offline / Fallback Conversational Engine for Sheng, Swahili, and English
      if (!replyText) {
        engineUsed = 'semantic_fallback_nlp';
        const fundiNames = candidateFundis.map(f => f.name).join(', ') || 'verified local artisans';

        if (detectedLang === 'sheng') {
          replyText = `**Niaje msee! Rada yako nimeipata.** 👋🇰🇪\n\nHiyo risto ya **${fallbackTriage.identifiedCategory}** inaonekana inahitaji fundi mwenye cheti cha NITA Grade I aingie keja aikague chapchap.\n\n⚠️ **Rada ya Usalama:**\n${fallbackTriage.safetyAdvisory.map(s => `- ${s}`).join('\n')}\n\n💰 **Makadirio ya Ganji (Budget):**\nKazi kama hii kawaida inachukua kati ya **KES ${fallbackTriage.estimatedCostRangeKes.min.toLocaleString()} - ${fallbackTriage.estimatedCostRangeKes.max.toLocaleString()}** kulingana na vifaa na ubora wa kazi.\n\nNimekucheckia mafundi wako karibu nawe (${fundiNames}). Unaweza kuwa-WhatsApp, kuwapigia simu direct, au kubook appointment hapa hapa!`;
          suggestedReplies = [
            'Nipe fundi wa stima aliye karibu zaidi sasa hivi',
            'Gharama ya vifaa na spare parts itakuwa ngapi?',
            'Je, hawa mafundi wote wako na cheti cha NITA?'
          ];
        } else if (detectedLang === 'swahili') {
          replyText = `**Habari yako! Nimepokea ujumbe wako kwa ukamilifu.** 👋🇹🇿🇰🇪\n\nTatizo hili linahusiana na **${fallbackTriage.identifiedCategory}**. Ni muhimu kushughulikiwa na fundi aliyehitimu na kuthibitishwa na Mamlaka ya Mafunzo ya Viwanda ya Kitaifa (NITA).\n\n⚠️ **Tahadhari Muhimu ya Usalama:**\n${fallbackTriage.safetyAdvisory.map(s => `- ${s}`).join('\n')}\n\n💰 **Makadirio ya Gharama:**\nUkarabati na ukaguzi wa aina hii unakadiriwa kugharimu kati ya **KES ${fallbackTriage.estimatedCostRangeKes.min.toLocaleString()} hadi ${fallbackTriage.estimatedCostRangeKes.max.toLocaleString()}** (Shilingi za Kenya).\n\nTayari nimekuorodheshea mafundi bora walio karibu nawe (${fundiNames}). Unaweza kuwasiliana nao moja kwa moja kwa WhatsApp, simu, au kuweka miadi ya dharura.`;
          suggestedReplies = [
            'Nahitaji fundi anayeweza kufika ndani ya dakika 30',
            'Nielezee jinsi ya kujikinga na hatari zaidi kabla fundi hajafika',
            'Je, kuna dhamana au warranty ya kazi itakayofanywa?'
          ];
        } else {
          replyText = `**Hello there! I've analyzed your maintenance request.** 👋\n\nThis issue falls under **${fallbackTriage.identifiedCategory}** and requires a qualified technician with NITA certification.\n\n⚠️ **Immediate Safety Precautions:**\n${fallbackTriage.safetyAdvisory.map(s => `- ${s}`).join('\n')}\n\n💰 **Estimated Fair Pricing:**\nTypical labor & inspection in Nairobi ranges between **KES ${fallbackTriage.estimatedCostRangeKes.min.toLocaleString()} - ${fallbackTriage.estimatedCostRangeKes.max.toLocaleString()}**.\n\nI have matched top-rated artisans near you (${fundiNames}). You can message them instantly on WhatsApp, call, or book a direct dispatch below.`;
          suggestedReplies = [
            'Show me available fundis within 5km',
            'What safety precautions should I take right now?',
            'How is NITA certification verified on Spana?'
          ];
        }
      }

      res.json({
        success: true,
        reply: replyText,
        detectedLanguage: detectedLang,
        categoryDetected,
        recommendedFundis: candidateFundis,
        costEstimateKes,
        safetyTips,
        suggestedReplies,
        engineUsed
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Chat processing failed', details: err.message });
    }
  });

  // Bookings API (with Idempotency Key & Distributed Saga Orchestration)
  app.post('/api/bookings', (req, res) => {
    const correlationId = (req as any).correlationId;
    const idempotencyKey = (req.headers['idempotency-key'] as string) || (req.headers['x-idempotency-key'] as string);

    // 1. Idempotency Check
    if (idempotencyKey && isFeatureEnabled('enableIdempotencyGuards')) {
      const cached = getIdempotentResponse(idempotencyKey);
      if (cached) {
        res.setHeader('X-Cache-Lookup', 'HIT (Idempotent replay)');
        res.status(cached.statusCode).json(cached.body);
        return;
      }
    }

    const details: BookingRequest = req.body;
    if (!details.fundiId || !details.customerName || !details.customerPhone) {
      res.status(400).json({ error: 'fundiId, customerName, and customerPhone are required' });
      return;
    }

    const bookingId = `FC-${Math.floor(100000 + Math.random() * 900000)}`;
    const saga = createSaga(correlationId, bookingId);

    try {
      // SAGA STEP 1: Validate Artisan Availability
      recordSagaStep(saga.sagaId, 'VALIDATE_ARTISAN', 'PENDING');
      const fundi = fundisStore.find(f => f.id === details.fundiId);
      if (!fundi) {
        recordSagaStep(saga.sagaId, 'VALIDATE_ARTISAN', 'FAILED', 'Artisan does not exist');
        finalizeSaga(saga.sagaId, 'FAILED', 'Artisan does not exist');
        res.status(404).json({ error: 'Artisan not found' });
        return;
      }
      recordSagaStep(saga.sagaId, 'VALIDATE_ARTISAN', 'SUCCESS');

      // SAGA STEP 2: Calculate & Lock Escrow
      recordSagaStep(saga.sagaId, 'ESCROW_RESERVE', 'PENDING');
      const cost = Number(details.estimatedCostKes ?? (details as any).agreedFeeKes ?? 1500);
      details.estimatedCostKes = cost;
      recordSagaStep(saga.sagaId, 'ESCROW_RESERVE', 'SUCCESS');

      // SAGA STEP 3: Persist Booking
      recordSagaStep(saga.sagaId, 'BOOKING_CREATE', 'PENDING');
      const booking: BookingResponse = {
        bookingId,
        status: details.isEmergency ? 'dispatched' : 'confirmed',
        estimatedArrivalMinutes: details.isEmergency ? 25 : undefined,
        details,
        createdAt: new Date().toISOString()
      };
      bookingsStore.unshift(booking);
      recordSagaStep(saga.sagaId, 'BOOKING_CREATE', 'SUCCESS');

      // SAGA STEP 4: Notifications & SMS Dispatch
      recordSagaStep(saga.sagaId, 'DISPATCH_SMS', 'PENDING');
      const adminNotif: AppNotification = {
        id: `notif-${Date.now()}-adm`,
        recipientRole: 'admin',
        title: `📋 New Booking Request (${booking.bookingId})`,
        message: `Client ${details.customerName} booked ${details.fundiName} for ${details.category}. Escrow amount: KES ${cost.toLocaleString()} secured.`,
        type: 'booking_created',
        bookingId: booking.bookingId,
        fundiId: details.fundiId,
        fundiName: details.fundiName,
        customerName: details.customerName,
        amountKes: cost,
        timestamp: new Date().toISOString(),
        read: false
      };
      notificationsStore.unshift(adminNotif);

      const artisanNotif: AppNotification = {
        id: `notif-${Date.now()}-art`,
        recipientRole: 'artisan',
        recipientId: details.fundiId,
        title: `🔨 New Job Request from ${details.customerName}`,
        message: `You have a new request in ${details.customerAddress || 'Nairobi'}: "${details.jobDescription}". Scheduled: ${details.scheduledDate} (${details.scheduledTimeSlot}). Escrow locked: KES ${cost.toLocaleString()}.`,
        type: 'booking_created',
        bookingId: booking.bookingId,
        fundiId: details.fundiId,
        fundiName: details.fundiName,
        customerName: details.customerName,
        amountKes: cost,
        timestamp: new Date().toISOString(),
        read: false
      };
      notificationsStore.unshift(artisanNotif);
      recordSagaStep(saga.sagaId, 'DISPATCH_SMS', 'SUCCESS');

      finalizeSaga(saga.sagaId, 'COMMITTED');

      // Audit Log entry
      recordAuditLog({
        correlationId,
        action: 'BOOKING_CREATED_SAGA',
        actor: details.customerName,
        resourceId: bookingId,
        status: 'SUCCESS',
        details: { cost, isEmergency: details.isEmergency }
      });

      // Real-time Server-Sent Event broadcast to active sessions
      broadcastSseEvent('BOOKING_CREATED', booking);

      // Save Idempotency response cache
      if (idempotencyKey && isFeatureEnabled('enableIdempotencyGuards')) {
        saveIdempotentResponse(idempotencyKey, 201, booking);
      }

      res.status(201).json(booking);
    } catch (err: any) {
      finalizeSaga(saga.sagaId, 'ROLLED_BACK', err.message);
      enqueueDLQ('SAGA_COMPENSATION', { details }, err.message);
      recordAuditLog({
        correlationId,
        action: 'BOOKING_CREATED_SAGA',
        actor: details.customerName,
        resourceId: bookingId,
        status: 'ROLLED_BACK',
        details: { error: err.message }
      });
      res.status(500).json({ error: 'Failed to create booking through distributed saga', details: err.message });
    }
  });

  app.get('/api/bookings', (_req, res) => {
    res.json(bookingsStore);
  });

  // Trigger M-Pesa STK Push simulation for booking escrow
  app.post('/api/bookings/:id/stk-push', (req, res) => {
    try {
      const bookingId = req.params.id;
      const { phoneNumber, amountKes } = req.body;
      const booking = bookingsStore.find(b => b.bookingId === bookingId);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      const phone = phoneNumber || booking.details?.customerPhone || '+254700000000';
      const amount = amountKes || booking.details?.estimatedCostKes || 1500;
      const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      // Update escrow transaction status to 'awaiting_payment'
      (booking.details as any).escrowStatus = 'awaiting_payment';
      (booking.details as any).mpesaCheckoutRequestId = checkoutRequestId;
      (booking.details as any).escrowAmountKes = amount;

      // Log STK Push SMS for customer phone simulator
      smsMessagesStore.unshift({
        id: `sms-${Date.now()}-stk`,
        from: 'MPESA',
        to: phone,
        message: `M-PESA Express: Do you want to pay KES ${amount.toLocaleString()} to Spana Escrow for ${booking.details?.fundiName || 'Artisan'}? Enter M-Pesa PIN on prompt.`,
        timestamp: new Date().toISOString(),
        type: 'mpesa'
      });

      // Customer notification
      notificationsStore.unshift({
        id: `notif-${Date.now()}-stk`,
        recipientRole: 'customer',
        recipientId: phone,
        title: `📲 M-Pesa STK Push Initiated`,
        message: `STK push of KES ${amount.toLocaleString()} sent to ${phone} for booking ${bookingId}. Escrow status updated to awaiting payment.`,
        type: 'booking_created',
        bookingId: booking.bookingId,
        fundiId: booking.details?.fundiId,
        fundiName: booking.details?.fundiName,
        customerName: booking.details?.customerName,
        amountKes: amount,
        timestamp: new Date().toISOString(),
        read: false
      });

      res.json({
        success: true,
        checkoutRequestId,
        bookingId,
        escrowStatus: 'awaiting_payment',
        amountKes: amount,
        phoneNumber: phone,
        message: `STK Push initiated. Prompt sent to ${phone}. Escrow status is awaiting_payment.`
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to initiate STK push', details: err.message });
    }
  });

  // Complete simulated M-Pesa STK push payment (Customer entered PIN)
  app.post('/api/bookings/:id/confirm-payment', (req, res) => {
    try {
      const bookingId = req.params.id;
      const { mpesaReceiptNo } = req.body;
      const booking = bookingsStore.find(b => b.bookingId === bookingId);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      const receipt = mpesaReceiptNo || `QMP${Math.floor(10000000 + Math.random() * 90000000)}`;
      const amount = (booking.details as any).escrowAmountKes || booking.details?.estimatedCostKes || 1500;

      // Update escrow status to 'held_in_escrow'
      (booking.details as any).escrowStatus = 'held_in_escrow';
      (booking.details as any).mpesaReceiptNo = receipt;

      // Add success confirmation SMS
      smsMessagesStore.unshift({
        id: `sms-${Date.now()}-paid`,
        from: 'MPESA',
        to: booking.details?.customerPhone || '+254712345678',
        message: `${receipt} Confirmed. KES ${amount.toLocaleString()} deposited to Spana Escrow for ${booking.details?.fundiName}. Funds protected until work sign-off.`,
        timestamp: new Date().toISOString(),
        type: 'mpesa'
      });

      // Add notification for artisan
      notificationsStore.unshift({
        id: `notif-${Date.now()}-escrow-locked`,
        recipientRole: 'artisan',
        recipientId: booking.details?.fundiId,
        title: `🔒 Escrow Deposit Locked (KES ${amount.toLocaleString()})`,
        message: `Client ${booking.details?.customerName} completed M-Pesa deposit (${receipt}). Funds are safely locked in escrow. You are cleared to proceed with the job.`,
        type: 'booking_created',
        bookingId: booking.bookingId,
        fundiId: booking.details?.fundiId,
        fundiName: booking.details?.fundiName,
        customerName: booking.details?.customerName,
        amountKes: amount,
        timestamp: new Date().toISOString(),
        read: false
      });

      res.json({
        success: true,
        booking,
        escrowStatus: 'held_in_escrow',
        mpesaReceiptNo: receipt,
        message: `Payment confirmed. KES ${amount.toLocaleString()} held in escrow.`
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to confirm payment', details: err.message });
    }
  });

  // Client marks the artisan as having completed the work
  app.post('/api/bookings/:id/client-complete', (req, res) => {
    try {
      const bookingId = req.params.id;
      const { rating = 5, feedback } = req.body;
      const booking = bookingsStore.find(b => b.bookingId === bookingId);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      booking.status = 'client_completed';
      booking.clientCompletedAt = new Date().toISOString();
      (booking.details as any).clientRating = rating;
      (booking.details as any).clientFeedback = feedback;

      const jobAmount = booking.details?.estimatedCostKes ?? (booking.details as any)?.agreedFeeKes ?? 1500;
      const fundiName = booking.details?.fundiName || 'Artisan';
      const custName = booking.details?.customerName || 'Client';

      // 1. Send urgent Action Required notification to ADMIN to dispatch the cash
      const adminNotif: AppNotification = {
        id: `notif-${Date.now()}-adm`,
        recipientRole: 'admin',
        title: `🚨 Client Confirmed Completion: Ready to Dispatch Cash!`,
        message: `Client ${custName} marked job ${booking.bookingId} as COMPLETED! Artisan ${fundiName} is awaiting cash payout of KES ${jobAmount.toLocaleString()} via M-Pesa.`,
        type: 'client_completed',
        bookingId: booking.bookingId,
        fundiId: booking.details?.fundiId,
        fundiName: fundiName,
        customerName: custName,
        amountKes: jobAmount,
        timestamp: new Date().toISOString(),
        read: false
      };
      notificationsStore.unshift(adminNotif);

      // 2. Send notification to ARTISAN letting them know the client signed off
      const artisanNotif: AppNotification = {
        id: `notif-${Date.now()}-art`,
        recipientRole: 'artisan',
        recipientId: booking.details?.fundiId,
        title: `🎉 Client Confirmed Work Completed!`,
        message: `Client ${custName} confirmed completion for job ${booking.bookingId}. The Admin has received a notification and is ready to dispatch your cash (KES ${jobAmount.toLocaleString()}) via M-Pesa.`,
        type: 'client_completed',
        bookingId: booking.bookingId,
        fundiId: booking.details?.fundiId,
        fundiName: fundiName,
        customerName: custName,
        amountKes: jobAmount,
        timestamp: new Date().toISOString(),
        read: false
      };
      notificationsStore.unshift(artisanNotif);

      res.json({
        success: true,
        booking,
        message: 'Work marked as completed by client. Admin notified to dispatch cash payout.'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to process client completion', details: err.message });
    }
  });

  // Admin dispatches cash to the artisan via M-Pesa
  app.post('/api/bookings/:id/dispatch-cash', (req, res) => {
    try {
      const bookingId = req.params.id;
      const { customAmountKes, payoutNotes } = req.body;
      const booking = bookingsStore.find(b => b.bookingId === bookingId);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      const mpesaRef = `QMP${Math.floor(10000000 + Math.random() * 90000000)}`;
      const payoutAmount = customAmountKes || booking.details?.estimatedCostKes || (booking.details as any)?.agreedFeeKes || 1500;
      const fundiName = booking.details?.fundiName || 'Artisan';
      const custName = booking.details?.customerName || 'Client';

      booking.status = 'completed';
      booking.dispatchedAt = new Date().toISOString();
      booking.mpesaPayoutRef = mpesaRef;
      (booking.details as any).escrowStatus = 'released_to_mpesa';
      (booking.details as any).mpesaReceiptNo = mpesaRef;
      (booking.details as any).payoutNotes = payoutNotes;

      // 1. Send notification to ARTISAN that cash has been dispatched to M-Pesa
      const artisanNotif: AppNotification = {
        id: `notif-${Date.now()}-art`,
        recipientRole: 'artisan',
        recipientId: booking.details?.fundiId,
        title: `💰 M-Pesa Cash Dispatched (KES ${payoutAmount.toLocaleString()})`,
        message: `Spana Admin has dispatched KES ${payoutAmount.toLocaleString()} to your M-Pesa account. Transaction Reference: ${mpesaRef}. Thank you for your quality craftsmanship!`,
        type: 'cash_dispatched',
        bookingId: booking.bookingId,
        fundiId: booking.details?.fundiId,
        fundiName: fundiName,
        customerName: custName,
        amountKes: payoutAmount,
        mpesaRef,
        timestamp: new Date().toISOString(),
        read: false
      };
      notificationsStore.unshift(artisanNotif);

      // 2. Send notification to CUSTOMER
      const customerNotif: AppNotification = {
        id: `notif-${Date.now()}-cli`,
        recipientRole: 'customer',
        recipientId: booking.details?.customerPhone,
        title: `✅ Payment Dispatched & Job Closed`,
        message: `Admin has safely released KES ${payoutAmount.toLocaleString()} from escrow to ${fundiName} for job ${booking.bookingId} (M-Pesa Ref: ${mpesaRef}). Thank you for using Spana Kenya!`,
        type: 'cash_dispatched',
        bookingId: booking.bookingId,
        fundiId: booking.details?.fundiId,
        fundiName: fundiName,
        customerName: custName,
        amountKes: payoutAmount,
        mpesaRef,
        timestamp: new Date().toISOString(),
        read: false
      };
      notificationsStore.unshift(customerNotif);

      res.json({
        success: true,
        booking,
        mpesaRef,
        amountKes: payoutAmount,
        message: `Cash of KES ${payoutAmount.toLocaleString()} successfully dispatched to artisan ${fundiName} (M-Pesa Ref: ${mpesaRef}).`
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to dispatch cash', details: err.message });
    }
  });

  // Notifications API
  app.get('/api/notifications', (req, res) => {
    const { role, recipientId } = req.query;
    let list = [...notificationsStore];
    if (role) {
      list = list.filter(n => {
        if (role === 'admin') return n.recipientRole === 'admin';
        if (role === 'artisan') {
          return n.recipientRole === 'artisan' && (!recipientId || n.recipientId === recipientId);
        }
        if (role === 'customer') {
          return n.recipientRole === 'customer';
        }
        return true;
      });
    }
    res.json(list);
  });

  app.put('/api/notifications/:id/read', (req, res) => {
    const notif = notificationsStore.find(n => n.id === req.params.id);
    if (notif) {
      notif.read = true;
    }
    res.json({ success: true, notification: notif });
  });

  app.put('/api/notifications/mark-all-read', (req, res) => {
    const { role, recipientId } = req.body;
    notificationsStore.forEach(n => {
      if (!role || n.recipientRole === role) {
        if (!recipientId || n.recipientId === recipientId) {
          n.read = true;
        }
      }
    });
    res.json({ success: true });
  });

  // Update booking status or escrow payout (Accept, Dispatch, Complete & Release Escrow)
  app.put('/api/bookings/:id', (req, res) => {
    const bookingId = req.params.id;
    const { status, estimatedArrivalMinutes, escrowStatus, mpesaReceiptNo } = req.body;
    const booking = bookingsStore.find(b => b.bookingId === bookingId);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (status) booking.status = status;
    if (estimatedArrivalMinutes !== undefined) booking.estimatedArrivalMinutes = estimatedArrivalMinutes;
    if (escrowStatus) (booking.details as any).escrowStatus = escrowStatus;
    if (mpesaReceiptNo) (booking.details as any).mpesaReceiptNo = mpesaReceiptNo;

    // If completed and escrow released, simulate M-Pesa receipt if none exists
    if (status === 'completed' && !(booking.details as any).mpesaReceiptNo) {
      (booking.details as any).escrowStatus = 'released_to_mpesa';
      (booking.details as any).mpesaReceiptNo = `QMP${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    res.json({ success: true, booking });
  });

  // --- USSD & FEATURE PHONE (*384*45#) GATEWAY ---
  // Fully compliant with Africa's Talking USSD protocol & Web Kabambe Simulator
  app.post('/api/ussd', (req, res) => {
    try {
      const sessionId = req.body?.sessionId || req.query?.sessionId || `sess_${Date.now()}`;
      const phoneNumber = req.body?.phoneNumber || req.query?.phoneNumber || '+254712345678';
      const rawText = (req.body?.text ?? req.query?.text ?? '').toString().trim();
      
      const inputs = rawText ? rawText.split('*').map(s => s.trim()) : [];
      let responseMessage = '';
      let isTerminal = false;

      const wantsJson = Boolean(req.headers['accept']?.includes('application/json') || req.body?.asJson || req.query?.format === 'json');

      // Multi-step USSD state machine
      if (inputs.length === 0) {
        // Root Menu
        responseMessage = `CON Karibu Spana Kenya 🇰🇪
Huduma ya Mafundi na M-Pesa Escrow
1. Tafuta Fundi (Find Artisan)
2. Kazi Zangu (My Bookings & Escrow)
3. Portal ya Fundi (Artisan Hub)
4. Dharura ya Haraka (Emergency 🚨)
5. Badilisha Lugha / Language`;
      } 
      // OPTION 1: FIND A FUNDI
      else if (inputs[0] === '1') {
        if (inputs.length === 1) {
          responseMessage = `CON Chagua Huduma / Select Trade:
1. Mabomba (Plumber)
2. Stima (Electrician)
3. Seremala (Carpenter)
4. Uashi (Masonry)
5. Appliance Repair
6. Rangi (Painter)
7. Chuma (Welder)`;
        } else if (inputs.length === 2) {
          responseMessage = `CON Chagua Eneo / Select Location:
1. Nairobi CBD
2. Westlands / Parklands
3. Kilimani / Ngong Rd
4. Embakasi / Eastlands
5. Kasarani / Roysambu
6. Rongai / Karen`;
        } else if (inputs.length === 3) {
          const tradeMap: Record<string, TradeCategory> = {
            '1': 'Plumbing',
            '2': 'Electrical',
            '3': 'Carpentry',
            '4': 'Masonry',
            '5': 'Appliance Repair',
            '6': 'Painting',
            '7': 'Welding'
          };
          const locMap: Record<string, string> = {
            '1': 'Nairobi CBD',
            '2': 'Westlands',
            '3': 'Kilimani',
            '4': 'Embakasi',
            '5': 'Kasarani',
            '6': 'Rongai'
          };
          const chosenCategory = tradeMap[inputs[1]] || 'Plumbing';
          const chosenLocation = locMap[inputs[2]] || 'Westlands';

          const matchingFundis = fundisStore
            .filter(f => f.primaryCategory === chosenCategory || (f.additionalCategories && f.additionalCategories.includes(chosenCategory)))
            .slice(0, 2);

          const f1 = matchingFundis[0] || fundisStore[0];
          const f2 = matchingFundis[1] || fundisStore[1];

          responseMessage = `CON Mafundi Walioidhinishwa (${chosenLocation}):
1. ${f1.name} (★${f1.rating}, KES ${f1.hourlyRateKes || 1500})
2. ${f2.name} (★${f2.rating}, KES ${f2.hourlyRateKes || 1800})
Chagua 1 au 2 kuweka oda:`;
        } else if (inputs.length === 4) {
          const tradeMap: Record<string, TradeCategory> = {
            '1': 'Plumbing',
            '2': 'Electrical',
            '3': 'Carpentry',
            '4': 'Masonry',
            '5': 'Appliance Repair',
            '6': 'Painting',
            '7': 'Welding'
          };
          const locMap: Record<string, string> = {
            '1': 'Nairobi CBD',
            '2': 'Westlands',
            '3': 'Kilimani',
            '4': 'Embakasi',
            '5': 'Kasarani',
            '6': 'Rongai'
          };
          const chosenCategory = tradeMap[inputs[1]] || 'Plumbing';
          const chosenLocation = locMap[inputs[2]] || 'Westlands';

          const matchingFundis = fundisStore
            .filter(f => f.primaryCategory === chosenCategory || (f.additionalCategories && f.additionalCategories.includes(chosenCategory)))
            .slice(0, 2);
          const chosenFundi = inputs[3] === '2' && matchingFundis[1] ? matchingFundis[1] : (matchingFundis[0] || fundisStore[0]);
          const fee = chosenFundi.hourlyRateKes || 1500;

          responseMessage = `CON Thibitisha Ombi la Kazi:
Fundi: ${chosenFundi.name} (${chosenCategory})
Eneo: ${chosenLocation}
Gharama: KES ${fee.toLocaleString()} (Held in Safe M-Pesa Escrow)
1. Kubali & Tuma M-Pesa STK Push
2. Ghairi / Cancel`;
        } else if (inputs.length >= 5) {
          if (inputs[4] === '1') {
            isTerminal = true;
            const tradeMap: Record<string, TradeCategory> = {
              '1': 'Plumbing',
              '2': 'Electrical',
              '3': 'Carpentry',
              '4': 'Masonry',
              '5': 'Appliance Repair',
              '6': 'Painting',
              '7': 'Welding'
            };
            const locMap: Record<string, string> = {
              '1': 'Nairobi CBD',
              '2': 'Westlands',
              '3': 'Kilimani',
              '4': 'Embakasi',
              '5': 'Kasarani',
              '6': 'Rongai'
            };
            const chosenCategory = tradeMap[inputs[1]] || 'Plumbing';
            const chosenLocation = locMap[inputs[2]] || 'Westlands';
            const matchingFundis = fundisStore
              .filter(f => f.primaryCategory === chosenCategory || (f.additionalCategories && f.additionalCategories.includes(chosenCategory)))
              .slice(0, 2);
            const chosenFundi = inputs[3] === '2' && matchingFundis[1] ? matchingFundis[1] : (matchingFundis[0] || fundisStore[0]);
            const fee = chosenFundi.hourlyRateKes || 1500;

            const newBookingId = `FC-${Math.floor(100000 + Math.random() * 900000)}`;
            const mpesaRef = `QMP${Math.floor(10000000 + Math.random() * 90000000)}`;

            const newBooking: BookingResponse = {
              bookingId: newBookingId,
              status: 'confirmed',
              estimatedArrivalMinutes: 25,
              details: {
                fundiId: chosenFundi.id,
                fundiName: chosenFundi.name,
                fundiPhone: chosenFundi.phone,
                customerName: `USSD Mteja (${phoneNumber.slice(-4)})`,
                customerPhone: phoneNumber,
                customerEmail: `ussd.${phoneNumber.replace('+', '')}@spana.co.ke`,
                category: chosenCategory,
                serviceCategory: chosenCategory,
                jobDescription: `USSD Request (*384*45#): ${chosenCategory} service in ${chosenLocation}.`,
                scheduledDate: new Date().toISOString().split('T')[0],
                scheduledTime: 'Immediate Dispatch (USSD)',
                scheduledTimeSlot: 'Immediate Dispatch (USSD)',
                location: {
                  address: chosenLocation,
                  neighborhood: chosenLocation,
                  city: 'Nairobi',
                  lat: -1.286389,
                  lng: 36.817223
                },
                isEmergency: false,
                agreedFeeKes: fee,
                estimatedCostKes: fee,
                escrowStatus: 'held_in_escrow',
                mpesaReceiptNo: mpesaRef
              } as any,
              createdAt: new Date().toISOString()
            };
            bookingsStore.unshift(newBooking);
            broadcastSseEvent('BOOKING_CREATED', newBooking);

            // Notify artisan
            notificationsStore.unshift({
              id: `notif-${Date.now()}-art`,
              recipientRole: 'artisan',
              recipientId: chosenFundi.id,
              title: `📱 New USSD Booking (${newBookingId})`,
              message: `Customer ${phoneNumber} booked you via USSD (*384*45#) in ${chosenLocation}. Escrow of KES ${fee.toLocaleString()} locked (Ref: ${mpesaRef}).`,
              type: 'booking_created',
              bookingId: newBookingId,
              fundiId: chosenFundi.id,
              fundiName: chosenFundi.name,
              customerName: phoneNumber,
              amountKes: fee,
              timestamp: new Date().toISOString(),
              read: false
            });

            // Notify Admin
            notificationsStore.unshift({
              id: `notif-${Date.now()}-adm`,
              recipientRole: 'admin',
              title: `USSD Booking: ${newBookingId}`,
              message: `Customer ${phoneNumber} booked ${chosenFundi.name} via USSD (*384*45#). KES ${fee.toLocaleString()} locked in M-Pesa escrow.`,
              type: 'booking_created',
              bookingId: newBookingId,
              fundiId: chosenFundi.id,
              fundiName: chosenFundi.name,
              customerName: phoneNumber,
              amountKes: fee,
              timestamp: new Date().toISOString(),
              read: false
            });

            // Add SMS messages to phone inbox
            smsMessagesStore.unshift({
              id: `sms-${Date.now()}-mpesa`,
              from: 'MPESA',
              to: phoneNumber,
              message: `${mpesaRef} Confirmed. KES ${fee.toLocaleString()} locked in Spana Escrow for ${chosenFundi.name}. Funds only released when you sign off work.`,
              timestamp: new Date().toISOString(),
              type: 'mpesa'
            });

            smsMessagesStore.unshift({
              id: `sms-${Date.now()}-fc`,
              from: 'Spana',
              to: phoneNumber,
              message: `Spana: Booking ${newBookingId} confirmed! ${chosenFundi.name} (${chosenFundi.phone}) is en route to ${chosenLocation} (ETA: 25 mins). Dial *384*45# when done.`,
              timestamp: new Date().toISOString(),
              type: 'outgoing'
            });

            responseMessage = `END Asante! Booking ${newBookingId} imethibitishwa.
M-Pesa STK Prompt ya KES ${fee.toLocaleString()} imetumwa kwa nambari yako.
${chosenFundi.name} (${chosenFundi.phone}) amearifiwa na yuko njiani!
Kazi ikikamilika, piga *384*45# kuachilia malipo.`;
          } else {
            isTerminal = true;
            responseMessage = `END Ombi limeghairiwa. Piga *384*45# wakati wowote kupata fundi stadi wa NITA.`;
          }
        }
      }
      // OPTION 2: MY BOOKINGS & ESCROW
      else if (inputs[0] === '2') {
        const cleanPhone = phoneNumber.replace(/\s+/g, '');
        const prioritizedBookings = [...bookingsStore].sort((a, b) => {
          const aIsPhone = (a.details?.customerPhone || '').replace(/\s+/g, '') === cleanPhone ? 1 : 0;
          const bIsPhone = (b.details?.customerPhone || '').replace(/\s+/g, '') === cleanPhone ? 1 : 0;
          if (bIsPhone !== aIsPhone) return bIsPhone - aIsPhone;
          const aOpen = a.status !== 'completed' ? 1 : 0;
          const bOpen = b.status !== 'completed' ? 1 : 0;
          return bOpen - aOpen;
        });
        const activeBookings = prioritizedBookings.slice(0, 3);
        if (inputs.length === 1) {
          if (activeBookings.length === 0) {
            isTerminal = true;
            responseMessage = `END Huna kazi yoyote inayoendelea kwa sasa. Piga *384*45# kuchagua '1' kutafuta fundi.`;
          } else {
            const listStr = activeBookings
              .map((b, i) => `${i + 1}. ${b.bookingId}: ${(b.details as any).fundiName} (${(b.details as any).agreedFeeKes ? 'KES ' + (b.details as any).agreedFeeKes : 'KES ' + (b.details?.estimatedCostKes || 2000)})`)
              .join('\n');
            responseMessage = `CON Kazi Zako / Active Bookings:\n${listStr}\nChagua nambari ya kazi:`;
          }
        } else if (inputs.length === 2) {
          const idx = parseInt(inputs[1], 10) - 1;
          const b = activeBookings[idx] || activeBookings[0];
          const fee = (b.details as any).agreedFeeKes || b.details?.estimatedCostKes || 2000;
          const fundiRecord = fundisStore.find(f => f.id === b.details?.fundiId);
          const fundiPhone = (b.details as any).fundiPhone || fundiRecord?.phone || '+254 745 678 901';
          responseMessage = `CON Kazi ${b.bookingId} (${(b.details as any).fundiName}):
Hali: ${b.status === 'client_completed' ? 'Kazi Imeisha (Inasubiri Malipo)' : b.status === 'completed' ? 'Malipo Yametolewa' : 'Inaendelea'}
Escrow: KES ${fee.toLocaleString()}
1. Kazi Imeisha (Ruhusu Malipo ya M-Pesa)
2. Piga Simu Fundi (${fundiPhone})
3. Ripoti Mgogoro / Help`;
        } else if (inputs.length === 3) {
          const idx = parseInt(inputs[1], 10) - 1;
          const b = activeBookings[idx] || activeBookings[0];
          const fundiRecord = fundisStore.find(f => f.id === b.details?.fundiId);
          const fundiPhone = (b.details as any).fundiPhone || fundiRecord?.phone || '+254 745 678 901';
          if (inputs[2] === '1') {
            responseMessage = `CON Mpe Fundi Alama (Rating):
1. ★★★★★ (5 - Bora Sana)
2. ★★★★☆ (4 - Nzuri)
3. ★★★☆☆ (3 - Wastani)
4. ★★☆☆☆ (2 - Chini ya Matarajio)`;
          } else if (inputs[2] === '2') {
            isTerminal = true;
            responseMessage = `END Nambari ya fundi (${b.details?.fundiName || 'Fundi'}) ni ${fundiPhone}.
Kumbuka: Usilipe pesa taslimu mkononi! Pesa yako imelindwa kwa M-Pesa Escrow.`;
          } else {
            isTerminal = true;
            responseMessage = `END Mgogoro umesajiliwa kwa ${b.bookingId}. Msimamizi wa Spana atawasiliana nawe ndani ya dakika 15. Pesa ya escrow haitaachiliwa bila idhini yako.`;
          }
        } else if (inputs.length >= 4) {
          isTerminal = true;
          const idx = parseInt(inputs[1], 10) - 1;
          const b = activeBookings[idx] || activeBookings[0];
          const ratingMap: Record<string, number> = { '1': 5, '2': 4, '3': 3, '4': 2 };
          const stars = ratingMap[inputs[3]] || 5;
          const jobAmount = (b.details as any).agreedFeeKes || b.details?.estimatedCostKes || 2000;

          b.status = 'client_completed' as any;
          (b as any).rating = stars;
          b.clientCompletedAt = new Date().toISOString();
          (b.details as any).clientRating = stars;

          // Notify Admin to dispatch M-Pesa cash
          notificationsStore.unshift({
            id: `notif-${Date.now()}-complete`,
            recipientRole: 'admin',
            title: `🚨 Job ${b.bookingId} Signed Off (USSD)`,
            message: `Customer (${phoneNumber}) confirmed completion via USSD (*384*45#) with ${stars}-star rating. Admin authorized to dispatch KES ${jobAmount.toLocaleString()} to ${(b.details as any).fundiName}.`,
            type: 'client_completed',
            bookingId: b.bookingId,
            fundiId: (b.details as any).fundiId,
            fundiName: (b.details as any).fundiName,
            customerName: b.details?.customerName || phoneNumber,
            amountKes: jobAmount,
            timestamp: new Date().toISOString(),
            read: false
          });

          // Notify Artisan
          notificationsStore.unshift({
            id: `notif-${Date.now()}-art-complete`,
            recipientRole: 'artisan',
            recipientId: (b.details as any).fundiId,
            title: `🎉 Customer Confirmed Completion (USSD)`,
            message: `Customer confirmed job ${b.bookingId} via USSD (*384*45#) with ${stars}★. Admin is notified to dispatch KES ${jobAmount.toLocaleString()} to your M-Pesa.`,
            type: 'client_completed',
            bookingId: b.bookingId,
            fundiId: (b.details as any).fundiId,
            fundiName: (b.details as any).fundiName,
            customerName: b.details?.customerName || phoneNumber,
            amountKes: jobAmount,
            timestamp: new Date().toISOString(),
            read: false
          });

          broadcastSseEvent('ESCROW_STATUS_UPDATED', { bookingId: b.bookingId, status: 'client_completed', via: 'ussd' });

          // SMS notification
          smsMessagesStore.unshift({
            id: `sms-${Date.now()}-done`,
            from: 'Spana',
            to: phoneNumber,
            message: `Spana: Asante! Umethibitisha kukamilika kwa kazi ${b.bookingId}. Usimamizi umeidhinishwa kutoa malipo kwa ${(b.details as any).fundiName} via M-Pesa.`,
            timestamp: new Date().toISOString(),
            type: 'outgoing'
          });

          responseMessage = `END Asante! Umethibitisha kazi ${b.bookingId} imekamilika (Alama: ${stars} Stars).
Usimamizi wa Spana umeidhinishwa kuachilia KES ${jobAmount.toLocaleString()} kwa ${(b.details as any).fundiName} kupitia M-Pesa.`;
        }
      }
      // OPTION 3: ARTISAN QUICK HUB
      else if (inputs[0] === '3') {
        if (inputs.length === 1) {
          responseMessage = `CON Portal ya Fundi (Artisan Hub):
1. Angalia Kazi Mpya Uliyopewa
2. Salio la Escrow / Wallet
3. Washa/Zima Hali ya Dharura`;
        } else if (inputs.length === 2) {
          if (inputs[1] === '1') {
            const b = bookingsStore[0];
            responseMessage = `CON Kazi Mpya: ${b ? b.bookingId : 'FC-948201'}
Mteja: ${b ? (b.details as any).customerName : 'Brian Kimani'}
Kazi: ${b ? (b.details as any).serviceCategory : 'Appliance Repair'} (KES ${b ? (b.details as any).agreedFeeKes : 2200})
1. Kubali Kazi & Anza Safari
2. Kataa Kazi`;
          } else if (inputs[1] === '2') {
            isTerminal = true;
            responseMessage = `END Salio la Wallet ya Spana:
Escrow Inayosubiri: KES 4,400
Kazi Zilizokamilika Mwezi Huu: 9 (Jumla: KES 24,500)
Malipo hutumwa mara moja kwa M-Pesa yako pindi mteja anapoidhinisha.`;
          } else {
            isTerminal = true;
            responseMessage = `END Hali ya Dharura: IMESAJILIWA TAYARI (ACTIVE). Utapokea SMS pindi mteja aliye karibu nawe akiwa na shida ya dharura.`;
          }
        } else if (inputs.length >= 3) {
          isTerminal = true;
          if (inputs[2] === '1') {
            responseMessage = `END Umekubali kazi! Mteja amearifiwa kuwa uko njiani. Piga simu kwa mteja kuthibitisha eneo lake kamili. Kazi njema!`;
          } else {
            responseMessage = `END Kazi imekataliwa. Kazi itapelekwa kwa fundi mwingine wa NITA aliye karibu.`;
          }
        }
      }
      // OPTION 4: EMERGENCY DISPATCH
      else if (inputs[0] === '4') {
        if (inputs.length === 1) {
          responseMessage = `CON DHARURA YA HARAKA (Emergency 🚨):
Fundi atafika ndani ya dakika 15-30:
1. Maji Kufurika / Bomba Kupasuka
2. Hitilafu ya Stima / Cheche & Moshi
3. Kufuli / Mlango Umekwama`;
        } else {
          isTerminal = true;
          smsMessagesStore.unshift({
            id: `sms-${Date.now()}-emerg`,
            from: 'Spana',
            to: phoneNumber,
            message: `Spana DHARURA: Ombi lako limepokelewa! Fundi wa dharura aliyekaribu zaidi anakupigia simu sasa hivi. Simu yako: ${phoneNumber}.`,
            timestamp: new Date().toISOString(),
            type: 'system_alert'
          });
          responseMessage = `END DHARURA IMETUMWA!
Fundi wa dharura aliyekaribu zaidi amearifiwa na atakupigia simu ndani ya dakika 2.
Tumetuma pia ujumbe mfupi (SMS) kwa nambari yako.`;
        }
      }
      // OPTION 5: LANGUAGE PREFERENCE
      else if (inputs[0] === '5') {
        isTerminal = true;
        responseMessage = `END Lugha imebadilishwa kuwa Kiswahili / Language changed to English. Piga *384*45# kuendelea.`;
      } else {
        isTerminal = true;
        responseMessage = `END Chaguo halitambuliki. Piga *384*45# kupata menyu kuu ya Spana.`;
      }

      if (wantsJson) {
        res.json({
          message: responseMessage,
          isTerminal: isTerminal || responseMessage.startsWith('END'),
          sessionId
        });
      } else {
        res.set('Content-Type', 'text/plain');
        res.send(responseMessage);
      }
    } catch (err: any) {
      console.error('USSD Gateway Error:', err);
      res.set('Content-Type', 'text/plain');
      res.send(`END Hitilafu ya kiufundi. Tafadhali jaribu tena baada ya muda mfupi.`);
    }
  });

  // --- TWO-WAY SMS GATEWAY (/api/sms) ---
  app.post('/api/sms', (req, res) => {
    try {
      const from = req.body?.from || req.body?.phoneNumber || '+254712345678';
      const to = req.body?.to || '22450';
      const text = (req.body?.text || req.body?.message || '').toString().trim();
      const lower = text.toLowerCase();

      // Log incoming SMS
      smsMessagesStore.unshift({
        id: `sms-${Date.now()}-in`,
        from,
        to,
        message: text,
        timestamp: new Date().toISOString(),
        type: 'incoming'
      });

      let replyMessage = '';

      if (lower.startsWith('fundi') || lower.includes('tafuta') || lower.includes('need')) {
        let category: TradeCategory = 'Plumbing';
        if (lower.includes('stima') || lower.includes('electric')) category = 'Electrical';
        else if (lower.includes('seremala') || lower.includes('carpent')) category = 'Carpentry';
        else if (lower.includes('uashi') || lower.includes('mason')) category = 'Masonry';
        else if (lower.includes('rangi') || lower.includes('paint')) category = 'Painting';

        const matching = fundisStore.find(f => f.primaryCategory === category) || fundisStore[0];
        replyMessage = `Spana: Tumempata ${matching.name} (${category}, ★${matching.rating}, NITA Accredited). Fee KES ${matching.hourlyRateKes || 1500}. Jibu SP YES kuthibitisha au piga *384*45#.`;
      } else if (lower.includes('status') || lower.includes('hali')) {
        const b = bookingsStore[0];
        replyMessage = `Spana: Una kazi 1 inayoendelea (${b.bookingId} na ${(b.details as any).fundiName}, KES ${(b.details as any).agreedFeeKes || 2000} held in escrow). Jibu DONE ${b.bookingId} kazi ikiisha.`;
      } else if (lower.includes('done') || lower.includes('isha')) {
        const idMatch = text.match(/FC-\d+/i);
        const targetBooking = idMatch
          ? bookingsStore.find(b => b.bookingId.toLowerCase() === idMatch[0].toLowerCase())
          : bookingsStore.find(b => (b.details?.customerPhone || '').replace(/\s+/g, '') === from.replace(/\s+/g, '') && b.status !== 'completed') || bookingsStore.find(b => b.status !== 'completed') || bookingsStore[0];

        if (targetBooking) {
          const jobAmount = (targetBooking.details as any)?.agreedFeeKes || targetBooking.details?.estimatedCostKes || 2000;
          targetBooking.status = 'client_completed';
          targetBooking.clientCompletedAt = new Date().toISOString();

          notificationsStore.unshift({
            id: `notif-${Date.now()}-sms-complete`,
            recipientRole: 'admin',
            title: `🚨 Job ${targetBooking.bookingId} Signed Off (SMS)`,
            message: `Customer (${from}) replied DONE via SMS (22450). Admin authorized to dispatch KES ${jobAmount.toLocaleString()} to ${targetBooking.details?.fundiName || 'Artisan'}.`,
            type: 'client_completed',
            bookingId: targetBooking.bookingId,
            fundiId: targetBooking.details?.fundiId,
            fundiName: targetBooking.details?.fundiName,
            customerName: targetBooking.details?.customerName || from,
            amountKes: jobAmount,
            timestamp: new Date().toISOString(),
            read: false
          });

          broadcastSseEvent('ESCROW_STATUS_UPDATED', { bookingId: targetBooking.bookingId, status: 'client_completed', via: 'sms' });

          replyMessage = `Spana: Asante! Kazi ${targetBooking.bookingId} imethibitishwa kukamilika. Usimamizi umearifiwa kutuma KES ${jobAmount.toLocaleString()} kwa ${targetBooking.details?.fundiName || 'Fundi'} via M-Pesa.`;
        } else {
          replyMessage = `Spana: Asante! Ombi la kukamilisha kazi limepokelewa. Piga *384*45# kuchagua Kazi Zangu na kuweka alama ya nyota.`;
        }
      } else {
        replyMessage = `Spana SMS: Tuma 'FUNDI <KAZI> <MTAA>' (mfano: FUNDI PLUMBER WESTLANDS), 'STATUS' kuangalia kazi, au piga bure *384*45# kwenye simu yoyote.`;
      }

      // Log outgoing reply
      const replyItem: SmsMessageItem = {
        id: `sms-${Date.now()}-out`,
        from: 'Spana',
        to: from,
        message: replyMessage,
        timestamp: new Date().toISOString(),
        type: 'outgoing'
      };
      smsMessagesStore.unshift(replyItem);

      res.json({
        success: true,
        reply: replyMessage,
        smsItem: replyItem
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get SMS inbox for simulator
  app.get('/api/sms/inbox', (req, res) => {
    const { phoneNumber } = req.query;
    let list = [...smsMessagesStore];
    if (phoneNumber && typeof phoneNumber === 'string') {
      list = list.filter(s => s.to === phoneNumber || s.from === phoneNumber || s.type === 'mpesa' || s.to === '+254712345678');
    }
    res.json(list);
  });

  // Clear or reset SMS inbox
  app.post('/api/sms/clear', (_req, res) => {
    smsMessagesStore = [];
    res.json({ success: true, message: 'SMS inbox cleared' });
  });

  // Test custom FastAPI Microservice URL
  app.post('/api/fastapi/test-connection', async (req, res) => {
    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
      res.status(400).json({ success: false, error: 'Valid HTTP/HTTPS URL required' });
      return;
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Probe endpoint
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_lat: -1.286389,
          user_lng: 36.817223,
          category: 'Plumbing',
          candidates: fundisStore.slice(0, 3).map(f => ({
            id: f.id,
            lat: f.location.lat,
            lng: f.location.lng,
            category: f.primaryCategory,
            rating: f.rating
          }))
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      if (response.ok) {
        const body = await response.json();
        res.json({
          success: true,
          status: response.status,
          latencyMs,
          message: 'FastAPI Microservice reachable and returned HTTP 200',
          sampleOutput: body
        });
      } else {
        res.json({
          success: false,
          status: response.status,
          latencyMs,
          message: `FastAPI responded with HTTP ${response.status}`,
          statusText: response.statusText
        });
      }
    } catch (err: any) {
      res.json({
        success: false,
        latencyMs: Date.now() - start,
        error: err.name === 'AbortError' ? 'Connection timed out after 3.5s' : err.message,
        message: 'Could not connect to the specified FastAPI microservice. Using intelligent internal recommendation engine as fallback.'
      });
    }
  });

  // Google Play Trusted Web Activity (TWA) Digital Asset Links endpoint
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    const assetLinksPath = path.join(process.cwd(), 'public', '.well-known', 'assetlinks.json');
    if (fs.existsSync(assetLinksPath)) {
      res.setHeader('Content-Type', 'application/json');
      res.sendFile(assetLinksPath);
      return;
    }
    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'ke.co.spana.app',
          sha256_cert_fingerprints: ['REPLACE_WITH_GOOGLE_PLAY_APP_SIGNING_SHA256_FINGERPRINT']
        }
      }
    ]);
  });

  // Vite middleware for development vs static dist for production
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res, next) => {
      if (_req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      if (hasDist) {
        app.use(express.static(distPath));
        app.get('*', (_req, res, next) => {
          if (_req.path.startsWith('/api')) return next();
          res.sendFile(path.join(distPath, 'index.html'));
        });
      } else {
        console.warn('Vite middleware could not be loaded and no dist/ found:', err);
      }
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spana server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
