import { Fundi, TradeCategory } from '../types';

export const INITIAL_FUNDIS: Fundi[] = [
  {
    id: 'fundi-1',
    name: 'Joseph Mwangi',
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=400',
    phone: '+254 712 345 678',
    whatsapp: '+254712345678',
    primaryCategory: 'Plumbing',
    additionalCategories: ['Appliance Repair'],
    skills: ['PPR Pipe Welding', 'Water Tank Installation', 'Drainage Unblocking', 'Geyser / Instant Shower Repair', 'Sewer Line Diagnostics'],
    bio: 'Master certified plumber with 9+ years experience resolving residential and commercial leaks, solar water heaters, and booster pump installations.',
    experienceYears: 9,
    hourlyRateKes: 800,
    fixedInspectionFeeKes: 500,
    rating: 4.9,
    reviewCount: 68,
    jobsCompleted: 142,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 15,
    location: {
      lat: -1.2685,
      lng: 36.8045,
      neighborhood: 'Westlands',
      address: 'Mpaka Road, Westlands, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['PPR Welding Machine', 'High-Pressure Jetter', 'Rothenberger Pipe Cutter', 'Thermal Leak Detector'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Plumber Pipe-Fitter)',
    nitaTradeTestNo: 'NITA/PL/2018/4412',
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Grace Wanjiru',
        rating: 5,
        date: '2026-08-28',
        comment: 'Joseph arrived in 18 minutes when our bathroom pipe burst. Fixed it cleanly and checked all water pressures. Lifesaver!',
        jobType: 'Emergency Pipe Leak',
        verifiedJob: true
      },
      {
        id: 'rev-2',
        authorName: 'David Otieno',
        rating: 5,
        date: '2026-08-14',
        comment: 'Installed our instant water heater and replaced copper lines. Fair pricing and transparent invoice.',
        jobType: 'Instant Shower Installation',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-1',
        title: 'Complete PPR Bathroom Re-piping',
        description: 'Overhauled aged galvanized pipes with modern heat-fused PPR system.',
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
        category: 'Plumbing',
        completionDate: '2026-07-20'
      },
      {
        id: 'p-2',
        title: 'Solar Water Heater & Booster Setup',
        description: 'Installed 300L rooftop solar water system with automatic flow switch.',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
        category: 'Plumbing',
        completionDate: '2026-08-02'
      }
    ]
  },
  {
    id: 'fundi-2',
    name: 'Brian Omondi',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    phone: '+254 723 456 789',
    whatsapp: '+254723456789',
    primaryCategory: 'Electrical',
    additionalCategories: ['HVAC & AC', 'Appliance Repair'],
    skills: ['Three-Phase Wiring', 'Circuit Breaker Triage', 'Inverter & Solar Backup', 'Generator Changeover', 'Smart Lighting'],
    bio: 'EPRA Licensed Class B Electrician specializing in residential fault finding, energy efficiency audits, and solar-battery installations.',
    experienceYears: 7,
    hourlyRateKes: 1000,
    fixedInspectionFeeKes: 600,
    rating: 4.8,
    reviewCount: 54,
    jobsCompleted: 118,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 20,
    location: {
      lat: -1.2921,
      lng: 36.7862,
      neighborhood: 'Kilimani',
      address: 'Argwings Kodhek Rd, Kilimani, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Fluke True-RMS Multimeter', 'Insulation Tester (Megger)', 'Conduit Bender', 'Wire Tracer'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Electrical Wireman & Solar)',
    nitaTradeTestNo: 'NITA/EL/2019/7731',
    reviews: [
      {
        id: 'rev-3',
        authorName: 'Amina Hassan',
        rating: 5,
        date: '2026-08-25',
        comment: 'Diagnosed a persistent short circuit that three other technicians could not find. Fixed it under an hour.',
        jobType: 'Short Circuit Tripping',
        verifiedJob: true
      },
      {
        id: 'rev-4',
        authorName: 'Peter Kamau',
        rating: 4,
        date: '2026-08-05',
        comment: 'Great solar inverter setup. Very neat cabling and labeled breaker board.',
        jobType: 'Solar Power Backup Installation',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-3',
        title: 'Modern Consumer Unit & Breaker Upgrade',
        description: 'Replaced hazardous old fuse box with modern RCBO surge-protected distribution board.',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
        category: 'Electrical',
        completionDate: '2026-08-11'
      }
    ]
  },
  {
    id: 'fundi-3',
    name: 'Samuel Kiprop',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    phone: '+254 734 567 890',
    whatsapp: '+254734567890',
    primaryCategory: 'Carpentry',
    additionalCategories: ['Roofing'],
    skills: ['Fitted Kitchen Cabinets', 'Hardwood Door Fitting', 'Wardrobe Customization', 'Decking & Pergolas', 'Furniture Restoration'],
    bio: 'Artisan woodworker with expertise in bespoke mahogany, cedar, and MDF cabinetry, partition doors, and structural timber joints.',
    experienceYears: 12,
    hourlyRateKes: 850,
    fixedInspectionFeeKes: 500,
    rating: 4.9,
    reviewCount: 42,
    jobsCompleted: 95,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: false,
    emergencyAvailable: false,
    responseTimeMinutes: 45,
    location: {
      lat: -1.3197,
      lng: 36.7062,
      neighborhood: 'Karen',
      address: 'Karen Road, Near Shopping Centre, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Makita Plunge Saw', 'DeWalt Router', 'Laser Leveler', 'Pneumatic Brad Nailer'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Carpentry & Joinery)',
    nitaTradeTestNo: 'NITA/CJ/2015/1290',
    reviews: [
      {
        id: 'rev-5',
        authorName: 'Susan Mutua',
        rating: 5,
        date: '2026-08-20',
        comment: 'Samuel built our walk-in closet and fitted solid mahogany entrance doors. Flawless craftsmanship!',
        jobType: 'Custom Wardrobe Build',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-4',
        title: 'Minimalist Modular Kitchen Cabinets',
        description: 'Soft-close acrylic kitchen cabinets with integrated quartz counter supports.',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600',
        category: 'Carpentry',
        completionDate: '2026-07-30'
      }
    ]
  },
  {
    id: 'fundi-4',
    name: 'Ezekiel Odhiambo',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400',
    phone: '+254 745 678 901',
    whatsapp: '+254745678901',
    primaryCategory: 'Appliance Repair',
    additionalCategories: ['Electrical', 'HVAC & AC'],
    skills: ['Washing Machine Diagnostics', 'Refrigeration & Compressor Gas Refill', 'Microwave Magnetron', 'Commercial Oven Repair', 'Dishwashers'],
    bio: 'Specialist technician for Samsung, LG, Bosch, and Ramtons domestic appliances. Fast diagnosis and genuine OEM spare sourcing.',
    experienceYears: 6,
    hourlyRateKes: 750,
    fixedInspectionFeeKes: 500,
    rating: 4.7,
    reviewCount: 39,
    jobsCompleted: 88,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 25,
    location: {
      lat: -1.2833,
      lng: 36.8167,
      neighborhood: 'Nairobi CBD',
      address: 'Moi Avenue, CBD, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['R134a/R600a Gas Charging Gauge', 'Capacitor Tester', 'Digital Thermometer', 'Vacuum Pump'],
    nitaAccredited: false,
    nitaCertificationLevel: 'Apprenticeship Trained (RPL Candidate)',
    accreditationStatus: 'rpl_candidate',
    rplEligible: true,
    rplStatus: 'not_applied',
    experienceRoute: 'informal_apprenticeship',
    reviews: [
      {
        id: 'rev-6',
        authorName: 'Ken Macharia',
        rating: 5,
        date: '2026-08-22',
        comment: 'Washing machine drum was shaking violently and refusing to drain. Ezekiel fixed the suspension rods on the same afternoon.',
        jobType: 'Washing Machine Repair',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-5',
        title: 'Commercial Double-Door Chiller Overhaul',
        description: 'Replaced faulty copper capillary tube and recharged eco-friendly gas.',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
        category: 'Appliance Repair',
        completionDate: '2026-08-01'
      }
    ]
  },
  {
    id: 'fundi-5',
    name: 'Dennis Koech',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    phone: '+254 756 789 012',
    whatsapp: '+254756789012',
    primaryCategory: 'Welding',
    additionalCategories: ['Masonry', 'Roofing'],
    skills: ['Security Grille Fabrication', 'Automatic Gate Motors', 'Structural Steel Trusses', 'Stainless Steel Balustrades', 'Arc & MIG Welding'],
    bio: 'Heavy-duty steel fabricator and ornamental metalworker. Built over 200 security gates, custom burglar proofs, and roof trusses across Nairobi.',
    experienceYears: 10,
    hourlyRateKes: 900,
    fixedInspectionFeeKes: 500,
    rating: 4.8,
    reviewCount: 31,
    jobsCompleted: 73,
    isVerified: true,
    idVerified: true,
    backgroundChecked: false,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 30,
    location: {
      lat: -1.2580,
      lng: 36.8250,
      neighborhood: 'Parklands',
      address: 'Parklands 3rd Avenue, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Inverter MMA Arc Welder', 'Heavy Angle Grinder', 'Magnetic Clamp Rig', 'Drill Press'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Arc & Gas Welding)',
    nitaTradeTestNo: 'NITA/WL/2017/6612',
    reviews: [
      {
        id: 'rev-7',
        authorName: 'Victor Ndung\'u',
        rating: 5,
        date: '2026-08-18',
        comment: 'Fabricated high-security steel window grilles and an sliding compound gate. Very solid welds.',
        jobType: 'Compound Gate Fabrication',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-6',
        title: 'Laser Cut Ornamental Sliding Gate',
        description: 'Installed 5-meter motorized automated gate with heavy guide tracks.',
        imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600',
        category: 'Welding',
        completionDate: '2026-07-15'
      }
    ]
  },
  {
    id: 'fundi-6',
    name: 'Mercy Nyambura',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    phone: '+254 767 890 123',
    whatsapp: '+254767890123',
    primaryCategory: 'Painting',
    additionalCategories: ['Masonry'],
    skills: ['Silk & Matt Wall Finishes', 'Damp Proofing Treatment', 'Texture Painting & Ruff N Tuff', 'Wood Staining & Varnish', 'Epoxy Flooring'],
    bio: 'Interior and exterior decorator specializing in anti-fungal moisture sealants, designer accent walls, and industrial epoxy coating.',
    experienceYears: 8,
    hourlyRateKes: 700,
    fixedInspectionFeeKes: 400,
    rating: 4.9,
    reviewCount: 47,
    jobsCompleted: 110,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 20,
    location: {
      lat: -1.2989,
      lng: 36.7905,
      neighborhood: 'Kilimani / Hurlingham',
      address: 'Argwings Kodhek, Hurlingham, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Airless Paint Sprayer', 'Moisture Meter', 'Orbital Sanding System', 'Telescopic Ladders'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade II (Painting & Decorating)',
    nitaTradeTestNo: 'NITA/PD/2021/3340',
    reviews: [
      {
        id: 'rev-8',
        authorName: 'Christine Awiti',
        rating: 5,
        date: '2026-08-26',
        comment: 'Mercy transformed our 4-bedroom house. Sharp clean edges, zero paint splatter, and properly waterproofed exterior walls.',
        jobType: 'Full House Repaint',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-7',
        title: 'Modern Geometric Textured Accent Wall',
        description: 'Applied Italian stucco plaster and waterproof polyurethane seal.',
        imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600',
        category: 'Painting',
        completionDate: '2026-08-10'
      }
    ]
  },
  {
    id: 'fundi-7',
    name: 'Francis Njoroge',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    phone: '+254 778 901 234',
    whatsapp: '+254778901234',
    primaryCategory: 'Masonry',
    additionalCategories: ['Roofing', 'Plumbing'],
    skills: ['Porcelain & Ceramic Tiling', 'Stone Cladding', 'Concrete Screed Levelling', 'Septic Tank Construction', 'Foundation Crack Repair'],
    bio: 'Experienced master mason with 14 years in structural masonry, precision laser-aligned floor tiling, and waterproof foundation work.',
    experienceYears: 14,
    hourlyRateKes: 850,
    fixedInspectionFeeKes: 500,
    rating: 4.8,
    reviewCount: 35,
    jobsCompleted: 80,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: false,
    emergencyAvailable: false,
    responseTimeMinutes: 40,
    location: {
      lat: -1.3050,
      lng: 36.8350,
      neighborhood: 'South B',
      address: 'Mombasa Road / South B, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Sigma Tile Cutter 120cm', 'Laser Level Transmit System', 'Paddle Mortar Mixer', 'Diamond Core Bits'],
    nitaAccredited: false,
    nitaCertificationLevel: 'Apprenticeship Trained (RPL Eligible)',
    accreditationStatus: 'rpl_candidate',
    rplEligible: true,
    rplStatus: 'not_applied',
    experienceRoute: 'informal_apprenticeship',
    reviews: [
      {
        id: 'rev-9',
        authorName: 'Mark Kilonzo',
        rating: 5,
        date: '2026-07-29',
        comment: 'Tiled 180 sqm of open plan floor with 60x120 tiles. Perfectly flat with seamless grout lines.',
        jobType: 'Floor Tiling',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-8',
        title: 'Luxury Porcelain Bathroom Tiling',
        description: 'Installed floor-to-ceiling 1200x600 porcelain with concealed drainage slope.',
        imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=600',
        category: 'Masonry',
        completionDate: '2026-07-18'
      }
    ]
  },
  {
    id: 'fundi-8',
    name: 'George Otieno',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    phone: '+254 789 012 345',
    whatsapp: '+254789012345',
    primaryCategory: 'HVAC & AC',
    additionalCategories: ['Electrical', 'Appliance Repair'],
    skills: ['Split Unit AC Installation', 'Refrigerant Leak Sealing', 'Duct Cleaning', 'Cold Room Maintenance', 'Ventilation Fans'],
    bio: 'Certified Air Conditioning and Climate Control technician. Reliable maintenance contracts and fast breakdown servicing.',
    experienceYears: 8,
    hourlyRateKes: 1100,
    fixedInspectionFeeKes: 700,
    rating: 4.9,
    reviewCount: 28,
    jobsCompleted: 64,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 25,
    location: {
      lat: -1.2215,
      lng: 36.8860,
      neighborhood: 'Roysambu / Thika Road',
      address: 'TRM Drive, Roysambu, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Digital Manifold Gauges', 'HVAC Vacuum Pump', 'Flaring Kit', 'Anemometer Airflow Meter'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (HVAC & Cold Chains)',
    nitaTradeTestNo: 'NITA/AC/2020/9981',
    reviews: [
      {
        id: 'rev-10',
        authorName: 'Beatrice Wekesa',
        rating: 5,
        date: '2026-08-27',
        comment: 'Serviced 3 office AC units that were blowing warm air. Diagnosed the sensor and recharged gas in 2 hours.',
        jobType: 'AC Diagnostics & Gas Refill',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-9',
        title: 'Inverter Split AC Multi-Room Installation',
        description: 'Installed 3x 18,000 BTU low-noise inverter units with concealed drain piping.',
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=600',
        category: 'HVAC & AC',
        completionDate: '2026-08-04'
      }
    ]
  },
  {
    id: 'fundi-9',
    name: 'Pauline Wanjiku',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    phone: '+254 790 123 456',
    whatsapp: '+254790123456',
    primaryCategory: 'Plumbing',
    additionalCategories: ['Landscaping'],
    skills: ['Automatic Drip Irrigation', 'Borehole Submersible Pumps', 'Greywater Recycling', 'Sanitary Ware Installation', 'High-Rise Booster Pressure'],
    bio: 'Water resources specialist focusing on residential water filtration, booster pressure optimization, and smart lawn drip systems.',
    experienceYears: 7,
    hourlyRateKes: 850,
    fixedInspectionFeeKes: 500,
    rating: 4.85,
    reviewCount: 33,
    jobsCompleted: 79,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 20,
    location: {
      lat: -1.2750,
      lng: 36.7600,
      neighborhood: 'Lavington',
      address: 'James Gichuru Rd, Lavington, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Submersible Pump Pressure Tester', 'HDPE Electrofusion Welder', 'CCTV Pipe Inspection Camera'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Plumbing & Water Systems)',
    nitaTradeTestNo: 'NITA/PL/2019/8814',
    reviews: [
      {
        id: 'rev-11',
        authorName: 'Patrick Ochieng',
        rating: 5,
        date: '2026-08-21',
        comment: 'Installed a rainwater harvesting filtration setup and solar booster pump. Clean work and very knowledgeable.',
        jobType: 'Water Filtration & Pump Setup',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-10',
        title: 'Automated 8-Zone Drip Irrigation System',
        description: 'Installed rain-sensor timer valve and manifold lines for flower garden.',
        imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600',
        category: 'Plumbing',
        completionDate: '2026-07-28'
      }
    ]
  },
  {
    id: 'fundi-10',
    name: 'Collins Barasa',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    phone: '+254 701 234 567',
    whatsapp: '+254701234567',
    primaryCategory: 'Roofing',
    additionalCategories: ['Carpentry', 'Welding'],
    skills: ['Decra & Box Profile Sheet Installation', 'Roof Leak Sealing', 'Rain Gutter Systems', 'Timber Rafter Reinforcement', 'Skylights'],
    bio: 'Certified structural roofing contractor. Specializing in rapid storm leak repairs, gutter drainage redirection, and tile replacements.',
    experienceYears: 11,
    hourlyRateKes: 950,
    fixedInspectionFeeKes: 600,
    rating: 4.9,
    reviewCount: 40,
    jobsCompleted: 86,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 30,
    location: {
      lat: -1.3300,
      lng: 36.7200,
      neighborhood: 'Langata / Hardy',
      address: 'Langata South Road, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Harness Fall Arrest System', 'Gas Torch Bitumen Applier', 'Cordless Metal Shears'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade II (Roofing & Waterproofing)',
    nitaTradeTestNo: 'NITA/RF/2022/8821',
    reviews: [
      {
        id: 'rev-12',
        authorName: 'Mary Njeri',
        rating: 5,
        date: '2026-08-16',
        comment: 'Fixed our leaking valley gutters right before the heavy rains. Absolutely no leaks since then!',
        jobType: 'Roof Leak Repair',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-11',
        title: 'Stone Coated Decra Tile Reroofing',
        description: 'Replaced rusted galvanized iron with premium insulated tile roof.',
        imageUrl: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&q=80&w=600',
        category: 'Roofing',
        completionDate: '2026-08-08'
      }
    ]
  },
  {
    id: 'fundi-11',
    name: 'Faith Wambui Kamau',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    phone: '+254 722 334 455',
    whatsapp: '+254722334455',
    primaryCategory: 'Plumbing',
    additionalCategories: ['Appliance Repair'],
    skills: ['PPR Heat-Fusion Welding', 'Booster Pump Overhaul', 'Solar Geyser Diagnostics', 'Sewer Line Clearing', 'Borehole Automation'],
    bio: 'NITA certified plumbing specialist with 8 years experience in luxury apartments, solar water heaters, and booster pump automation in Kilimani and Kileleshwa.',
    experienceYears: 8,
    hourlyRateKes: 850,
    fixedInspectionFeeKes: 500,
    rating: 4.93,
    reviewCount: 62,
    jobsCompleted: 144,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 18,
    location: {
      lat: -1.2921,
      lng: 36.7822,
      neighborhood: 'Kilimani',
      address: 'Argwings Kodhek Road, Kilimani, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Rothenberger PPR Welder', 'Rigid Pipe Threader', 'Drain Snake Machine', 'Thermal Leak Sensor'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Plumbing & Pipe Fitting)',
    nitaTradeTestNo: 'NITA/PL/2019/5512',
    reviews: [
      {
        id: 'rev-13',
        authorName: 'Evelyn Wairimu',
        rating: 5,
        date: '2026-08-29',
        comment: 'Faith did a flawless job installing our solar geyser and replacing old PVC fittings with PPR. Super punctual and tidy.',
        jobType: 'Solar Geyser Installation',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-12',
        title: 'Kilimani Penthouse PPR Pressure Line',
        description: 'Installed high-pressure fused PPR piping with pressure-relief valves.',
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
        category: 'Plumbing',
        completionDate: '2026-08-11'
      }
    ]
  },
  {
    id: 'fundi-12',
    name: 'Hassan Omar Mwadzaya',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    phone: '+254 733 445 566',
    whatsapp: '+254733445566',
    primaryCategory: 'Carpentry',
    additionalCategories: ['Interior Fit-Out & Gypsum', 'Roofing'],
    skills: ['Custom Hardwood Furniture', 'Kitchen Cabinetry', 'Roof Trusses', 'Locksmithing', 'Hardwood Parquet Flooring'],
    bio: 'Master joiner with 12+ years expertise constructing bespoke mahogany cabinets, heavy security solid doors, and roof truss frameworks in Karen and Langata.',
    experienceYears: 12,
    hourlyRateKes: 800,
    fixedInspectionFeeKes: 500,
    rating: 4.91,
    reviewCount: 78,
    jobsCompleted: 215,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 25,
    location: {
      lat: -1.3197,
      lng: 36.7065,
      neighborhood: 'Karen',
      address: 'Karen Road, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Makita Plunge Saw', 'DeWalt Plunge Router', 'Biscuit Joiner', 'Digital Laser Level'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Carpentry & Joinery)',
    nitaTradeTestNo: 'NITA/CP/2016/3310',
    reviews: [
      {
        id: 'rev-14',
        authorName: 'Arch. Geoffrey Mutiso',
        rating: 5,
        date: '2026-08-25',
        comment: 'Hassan built custom cedar wardrobes and fitted solid hardwood frames for our villa. Impeccable craftsmanship.',
        jobType: 'Bespoke Wardrobes',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-13',
        title: 'Karen Villa Teak Kitchen Island',
        description: 'Designed and assembled soft-closing solid teak cabinetry with marble counter inserts.',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600',
        category: 'Carpentry',
        completionDate: '2026-07-15'
      }
    ]
  },
  {
    id: 'fundi-13',
    name: 'Dennis Muthoni Karani',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    phone: '+254 777 889 900',
    whatsapp: '+254777889900',
    primaryCategory: 'Welding',
    additionalCategories: ['Electronic Security & CCTV'],
    skills: ['TIG/MIG Precision Welding', 'Heavy Laser-Cut Gates', 'Balustrades', 'Security Grilles', 'Structural Steel Fabrication'],
    bio: 'Heavy metal fabricator and certified NITA welder. Built over 130 sliding automated gates, stainless steel balcony railings, and structural steel trusses.',
    experienceYears: 9,
    hourlyRateKes: 900,
    fixedInspectionFeeKes: 500,
    rating: 4.88,
    reviewCount: 52,
    jobsCompleted: 138,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 22,
    location: {
      lat: -1.2400,
      lng: 36.7800,
      neighborhood: 'Parklands',
      address: '3rd Parklands Avenue, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Inverter Arc Welder 250A', 'Plasma Metal Cutter', 'Angle Grinder 9-inch', 'Magnetic Clamp Rig'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Welding & Fabrication)',
    nitaTradeTestNo: 'NITA/WL/2018/1190',
    reviews: [
      {
        id: 'rev-15',
        authorName: 'Pravin Shah',
        rating: 5,
        date: '2026-08-20',
        comment: 'Dennis fabricated custom steel security gates and window grilles. Heavy gauge material and clean joints.',
        jobType: 'Automated Sliding Gate',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-14',
        title: 'Laser Cut Motorized Gate Installation',
        description: 'Built CNC patterned steel security gate integrated with Centurion D5 motor.',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600',
        category: 'Welding',
        completionDate: '2026-08-05'
      }
    ]
  },
  {
    id: 'fundi-14',
    name: 'Moses Kiprop Chebet',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    phone: '+254 766 778 899',
    whatsapp: '+254766778899',
    primaryCategory: 'Masonry',
    additionalCategories: ['Painting'],
    skills: ['Porcelain & Granite Tiling', 'Waterproof Plastering', 'Foundation Reinforcement', 'Screeding', 'Interlocking Paver Laying'],
    bio: 'Precision stone mason and master tiler with 11 years experience in commercial plazas and residences across South B, Nairobi West, and Imara Daima.',
    experienceYears: 11,
    hourlyRateKes: 850,
    fixedInspectionFeeKes: 500,
    rating: 4.90,
    reviewCount: 67,
    jobsCompleted: 182,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 25,
    location: {
      lat: -1.3100,
      lng: 36.8350,
      neighborhood: 'South B',
      address: 'Mombasa Road, South B, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Sigma Laser Tile Cutter', 'Electric Screed Vibrator', 'Heavy-Duty Demolition Hammer', 'Digital Spirit Level'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Masonry & Tiling)',
    nitaTradeTestNo: 'NITA/MS/2017/4401',
    reviews: [
      {
        id: 'rev-16',
        authorName: 'Gladys Mwikali',
        rating: 5,
        date: '2026-08-18',
        comment: 'Moses tiled our entire 4-bedroom house with 60x60 porcelain tiles. Perfectly leveled lines and clean epoxy grouting.',
        jobType: 'Porcelain Tiling',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-15',
        title: 'South B Commercial Center Granite Entryway',
        description: 'Laid non-slip granite steps and flamed exterior entrance slabs.',
        imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=600',
        category: 'Masonry',
        completionDate: '2026-07-22'
      }
    ]
  },
  {
    id: 'fundi-15',
    name: 'Beatrice Adhiambo Onyango',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400',
    phone: '+254 788 990 011',
    whatsapp: '+254788990011',
    primaryCategory: 'HVAC & AC',
    additionalCategories: ['Electrical', 'Appliance Repair'],
    skills: ['Inverter Split AC Servicing', 'Cold Room Maintenance', 'R410A/R32 Gas Recharging', 'PCB Diagnostics', 'Ductless Heat Pumps'],
    bio: 'Refrigeration and air-conditioning technician. NITA accredited specialist servicing commercial chillers, supermarket cold rooms, and residential inverter ACs.',
    experienceYears: 7,
    hourlyRateKes: 1200,
    fixedInspectionFeeKes: 600,
    rating: 4.94,
    reviewCount: 48,
    jobsCompleted: 112,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 20,
    location: {
      lat: -1.2200,
      lng: 36.8900,
      neighborhood: 'Roysambu',
      address: 'Lumumba Drive, Roysambu, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Digital Vacuum Pump 2-Stage', 'Dual Manifold Gauge Set', 'Electronic Refrigerant Scale', 'Infrared Thermometer'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade II (Refrigeration & Air Conditioning)',
    nitaTradeTestNo: 'NITA/RAC/2020/2298',
    reviews: [
      {
        id: 'rev-17',
        authorName: 'Ken Okoth',
        rating: 5,
        date: '2026-08-22',
        comment: 'Beatrice diagnosed why our master bedroom inverter AC was freezing up. Cleared the condensate line and recharged gas. Works like new!',
        jobType: 'AC Diagnostics & Gas Refill',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-16',
        title: 'Office Multi-Split AC Overhaul',
        description: 'Serviced and sanitized 6 indoor wall units and balanced outdoor compressors.',
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=600',
        category: 'HVAC & AC',
        completionDate: '2026-08-01'
      }
    ]
  },
  {
    id: 'fundi-16',
    name: 'Erick Ochieng Odhiambo',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    phone: '+254 744 556 677',
    whatsapp: '+254744556677',
    primaryCategory: 'Appliance Repair',
    additionalCategories: ['Electrical'],
    skills: ['Smart Inverter Refrigerators', 'Automatic Washing Machines', 'Induction Hobs', 'Microwaves', 'Control Board Micro-Soldering'],
    bio: 'Microcontroller technician servicing smart Samsung, LG, Bosch, and Ramtons appliances. Expert in PCB fault finding and inverter motor replacements.',
    experienceYears: 6,
    hourlyRateKes: 1100,
    fixedInspectionFeeKes: 600,
    rating: 4.87,
    reviewCount: 39,
    jobsCompleted: 98,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 25,
    location: {
      lat: -1.2720,
      lng: 36.7650,
      neighborhood: 'Lavington',
      address: 'James Gichuru Road, Lavington, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Digital Oscilloscope', 'SMD Rework Heat Station', 'Capacitor ESR Meter', 'Thermal Diagnostic Imager'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Electronics & Home Appliances)',
    nitaTradeTestNo: 'NITA/EL/2021/6601',
    reviews: [
      {
        id: 'rev-18',
        authorName: 'Cynthia Ndinda',
        rating: 5,
        date: '2026-08-19',
        comment: 'Erick fixed our front-loader Bosch washing machine that was showing error E18. Replaced the drain pump motor on the spot.',
        jobType: 'Washing Machine Repair',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-17',
        title: 'Side-by-Side Refrigerator Inverter Board Repair',
        description: 'Replaced blown IGBT switches on inverter board and verified defrost cycle.',
        imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600',
        category: 'Appliance Repair',
        completionDate: '2026-07-29'
      }
    ]
  },
  {
    id: 'fundi-17',
    name: 'Grace Njeri Mwangi',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    phone: '+254 755 667 788',
    whatsapp: '+254755667788',
    primaryCategory: 'Painting',
    additionalCategories: ['Interior Fit-Out & Gypsum'],
    skills: ['Silk Vinyl Wall Finishes', 'Epoxy Resin Flooring', 'Stucco Italiano', 'Weather-Resistant Priming', 'Damp Proofing Treatment'],
    bio: 'Professional architectural painter and decorative finisher. Specializes in luxury interior wall treatments, damp barrier coatings, and seamless garage epoxy.',
    experienceYears: 6,
    hourlyRateKes: 750,
    fixedInspectionFeeKes: 400,
    rating: 4.85,
    reviewCount: 42,
    jobsCompleted: 94,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 30,
    location: {
      lat: -1.2833,
      lng: 36.8233,
      neighborhood: 'Nairobi CBD',
      address: 'Kenyatta Avenue, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Graco Airless Spray Unit', 'Wall Sanding Vacuum Disc Rig', 'Digital Moisture Meter', 'Laser Alignment Pole'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Painting & Decorating)',
    nitaTradeTestNo: 'NITA/PT/2021/3340',
    reviews: [
      {
        id: 'rev-19',
        authorName: 'Farhan Noor',
        rating: 5,
        date: '2026-08-17',
        comment: 'Grace and her crew painted our law firm offices with silk vinyl finish. No drips, perfect tape edges, and completely dustless sanding.',
        jobType: 'Commercial Office Painting',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-18',
        title: 'Kilimani Apartment Italian Stucco Feature Wall',
        description: 'Hand-troweled Venetian marble plaster with protective wax polish.',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600',
        category: 'Painting',
        completionDate: '2026-07-25'
      }
    ]
  },
  {
    id: 'fundi-18',
    name: 'Samuel Gitau Kariuki',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400',
    phone: '+254 712 998 877',
    whatsapp: '+254712998877',
    primaryCategory: 'Electrical',
    additionalCategories: ['Solar PV & Inverters'],
    skills: ['Lithium Battery Sizing', 'Hybrid Solar Inverters', 'Solar Borehole Pumping', 'Net Metering', 'Three-Phase Industrial Wiring'],
    bio: 'EPRA Licensed Solar PV Master and NITA certified electrical engineer. Installed over 45 residential off-grid solar systems with Felicity & Deye hybrid inverters.',
    experienceYears: 8,
    hourlyRateKes: 1300,
    fixedInspectionFeeKes: 700,
    rating: 4.97,
    reviewCount: 71,
    jobsCompleted: 156,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 20,
    location: {
      lat: -1.2150,
      lng: 36.8150,
      neighborhood: 'Runda',
      address: 'Runda Drive, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Solar Irradiance Meter', 'MC4 Hydraulic Crimpers', 'Solar Array String Tester', 'Megger Earth Clamp'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Solar PV Master Certification',
    nitaTradeTestNo: 'NITA/SL/2019/8802',
    reviews: [
      {
        id: 'rev-20',
        authorName: 'Dr. Arthur Kilonzo',
        rating: 5,
        date: '2026-08-27',
        comment: 'Samuel installed an 8kW Deye hybrid inverter with 15kWh lithium batteries. We now have zero power downtime and our bill dropped 80%.',
        jobType: '8kW Hybrid Solar Setup',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-19',
        title: 'Runda Residence 10kW Rooftop Solar Installation',
        description: 'Installed 22 monocrystalline panels with smart automatic changeover.',
        imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&q=80&w=600',
        category: 'Electrical',
        completionDate: '2026-08-14'
      }
    ]
  },
  {
    id: 'fundi-19',
    name: 'Kennedy Mutua Musyoka',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400',
    phone: '+254 721 887 766',
    whatsapp: '+254721887766',
    primaryCategory: 'Electrical',
    additionalCategories: ['Electronic Security & CCTV'],
    skills: ['IP Camera NVR Setup', 'Biometric Access Controls', 'Electric Fence Energizers', 'Video Intercom Systems', 'Alarm Sensor Wiring'],
    bio: 'Security electronics specialist. NITA accredited engineer designing perimeter electric fencing with Stafix energizers, 4K ColorVu IP CCTV, and video doorbells.',
    experienceYears: 7,
    hourlyRateKes: 1000,
    fixedInspectionFeeKes: 500,
    rating: 4.92,
    reviewCount: 56,
    jobsCompleted: 124,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 20,
    location: {
      lat: -1.2780,
      lng: 36.7910,
      neighborhood: 'Kileleshwa',
      address: 'Mandera Road, Kileleshwa, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Cable Toner & Tracker', 'Fiber Optic Splicer Rig', 'High-Voltage Fence Fault Meter', 'Network Fluke Tester'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Electronics & Security Systems Cert',
    nitaTradeTestNo: 'NITA/SEC/2020/5519',
    reviews: [
      {
        id: 'rev-21',
        authorName: 'Major (Rtd) R. Langat',
        rating: 5,
        date: '2026-08-24',
        comment: 'Kennedy installed 8 Hikvision ColorVu cameras and upgraded our razor wire electric fence. Instant alerts on mobile app.',
        jobType: 'Electric Fence & 4K CCTV',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-20',
        title: 'Kileleshwa Apartment Complex CCTV & Biometrics',
        description: 'Installed 16-channel PoE NVR with facial recognition access control.',
        imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600',
        category: 'Electrical',
        completionDate: '2026-08-04'
      }
    ]
  },
  {
    id: 'fundi-20',
    name: 'Boniface Kimani Njoroge',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    phone: '+254 734 776 655',
    whatsapp: '+254734776655',
    primaryCategory: 'Welding',
    additionalCategories: ['Appliance Repair'],
    skills: ['OBD2 Computer Diagnostics', 'Brake System Overhaul', 'Engine Suspension & Transmission', 'Hydraulic Jack Systems', 'Hybrid Battery Cell Testing'],
    bio: 'Master certified automotive technician and mobile emergency breakdown specialist. 13 years diagnosing Toyota, Nissan, Subaru, and European vehicles in Nairobi.',
    experienceYears: 13,
    hourlyRateKes: 950,
    fixedInspectionFeeKes: 500,
    rating: 4.89,
    reviewCount: 92,
    jobsCompleted: 240,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 15,
    location: {
      lat: -1.3050,
      lng: 36.8450,
      neighborhood: 'Industrial Area',
      address: 'Enterprise Road, Industrial Area, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Autel MaxiSys Diagnostic Computer', 'Heavy Hydraulic Floor Jack 3T', 'Torque Wrench Set', 'Battery Conductance Analyzer'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Motor Vehicle Mechanics Grade I',
    nitaTradeTestNo: 'NITA/MV/2015/1042',
    reviews: [
      {
        id: 'rev-22',
        authorName: 'Alex Maina',
        rating: 5,
        date: '2026-08-26',
        comment: 'Boniface came out within 20 minutes when my car overheated and stalled on Mombasa Road. Replaced a split radiator hose cleanly.',
        jobType: 'Emergency Mobile Breakdown',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-21',
        title: 'Toyota Prado Suspension & Steering Overhaul',
        description: 'Replaced bushings, tie-rod ends, and balanced hydraulic steering rack.',
        imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600',
        category: 'Welding',
        completionDate: '2026-07-30'
      }
    ]
  },
  {
    id: 'fundi-21',
    name: 'Agnes Chepngetich Koech',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    phone: '+254 799 665 544',
    whatsapp: '+254799665544',
    primaryCategory: 'Carpentry',
    additionalCategories: ['Painting'],
    skills: ['Acoustic Gypsum Ceilings', 'LED Cove Lighting Channels', 'Drywall Partitions', 'Cornice Installation', 'Moisture-Resistant Boarding'],
    bio: 'Interior construction specialist focusing on suspended gypsum ceilings, acoustic sound dampening, LED backlight drop channels, and modern studio partitions.',
    experienceYears: 8,
    hourlyRateKes: 850,
    fixedInspectionFeeKes: 500,
    rating: 4.91,
    reviewCount: 58,
    jobsCompleted: 132,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 25,
    location: {
      lat: -1.3200,
      lng: 36.8280,
      neighborhood: 'South C',
      address: 'Muhoho Avenue, South C, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Laser Cross-Line 360 Level', 'Drywall Sheet Lift Crane', 'Speed Drywall Screwgun', 'Plaster Edge Beveler'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Construction & Interior Fit-Out Grade II',
    nitaTradeTestNo: 'NITA/INT/2019/7721',
    reviews: [
      {
        id: 'rev-23',
        authorName: 'Rashid Abdi',
        rating: 5,
        date: '2026-08-23',
        comment: 'Agnes designed and fitted our living room gypsum ceiling with double shadow gaps and concealed warm-white LED strips. Remarkable finish!',
        jobType: 'Suspended Gypsum Ceiling',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-22',
        title: 'Modern Living Room Floating Gypsum Design',
        description: 'Fitted flush perimeter channels with acoustic insulation panels.',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600',
        category: 'Carpentry',
        completionDate: '2026-08-02'
      }
    ]
  },
  {
    id: 'fundi-22',
    name: 'Peter Maina Gichuhi',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    phone: '+254 701 554 433',
    whatsapp: '+254701554433',
    primaryCategory: 'Landscaping',
    additionalCategories: ['Plumbing'],
    skills: ['Drip Irrigation Timers', 'Paspalum & Kikuyu Lawn Establishment', 'Arboriculture & Pruning', 'Rock Gardens', 'Rainwater Harvesting'],
    bio: 'Professional horticulturist and landscape contractor. Experienced in low-water automated drip systems, lawn drainage, and exotic flora across Gigiri and Runda.',
    experienceYears: 9,
    hourlyRateKes: 800,
    fixedInspectionFeeKes: 400,
    rating: 4.86,
    reviewCount: 44,
    jobsCompleted: 108,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 30,
    location: {
      lat: -1.2330,
      lng: 36.8080,
      neighborhood: 'Gigiri',
      address: 'United Nations Avenue, Gigiri, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Stihl Gas Brush Cutter', 'Lawn Aerator Core Machine', 'Soil Moisture & pH Digital Sensor', 'Pruning Pole Saw'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Landscaping & Agriculture Master Cert',
    nitaTradeTestNo: 'NITA/LS/2018/9012',
    reviews: [
      {
        id: 'rev-24',
        authorName: 'Astrid Lindholm',
        rating: 5,
        date: '2026-08-15',
        comment: 'Peter overhauled our diplomatic residence garden with an automatic 6-zone timer and lush Kikuyu grass. Very reliable and neat.',
        jobType: 'Irrigation & Garden Renovation',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-23',
        title: 'Gigiri Residence Automated Drip Irrigation Setup',
        description: 'Installed sub-surface drip tubing with solenoid valves and rain gauge.',
        imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600',
        category: 'Landscaping',
        completionDate: '2026-07-28'
      }
    ]
  },
  {
    id: 'fundi-23',
    name: 'Victor Otieno Oduor',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    phone: '+254 745 443 322',
    whatsapp: '+254745443322',
    primaryCategory: 'Roofing',
    additionalCategories: ['Welding'],
    skills: ['Mabati Sheet Replacement', 'Torch-On Bituminous Membrane Waterproofing', 'Gutter Channel Alignment', 'Roof Parapet Sealing', 'Skylight Installation'],
    bio: 'Heavy roofing contractor and waterproofing specialist. 10 years experience curing persistent flat roof leakages, installing Decra tiles, and seamless rain gutters.',
    experienceYears: 10,
    hourlyRateKes: 900,
    fixedInspectionFeeKes: 500,
    rating: 4.88,
    reviewCount: 64,
    jobsCompleted: 160,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 25,
    location: {
      lat: -1.2750,
      lng: 36.8500,
      neighborhood: 'Eastleigh',
      address: '1st Avenue, Eastleigh, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Gas Blowtorch Roofing Kit', 'Safety Harness & Fall Arresters', 'Sheet Metal Seam Crimper', 'Polyurethane Pressure Injector'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Building Technology & Roofing Cert',
    nitaTradeTestNo: 'NITA/BT/2017/6634',
    reviews: [
      {
        id: 'rev-25',
        authorName: 'Ahmed Yussuf',
        rating: 5,
        date: '2026-08-21',
        comment: 'Victor solved our rooftop slab water pooling problem using 4mm torch-on membrane and waterproof primer. Not a drop of water during heavy downpours.',
        jobType: 'Rooftop Slab Waterproofing',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-24',
        title: 'Commercial Flat Roof Bitumen Membrane Waterproofing',
        description: 'Applied 4mm APP torch-on membrane over 450 sqm concrete roof.',
        imageUrl: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&q=80&w=600',
        category: 'Roofing',
        completionDate: '2026-08-07'
      }
    ]
  },
  {
    id: 'fundi-24',
    name: 'Jackson Wekesa Simiyu',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    phone: '+254 711 776 554',
    whatsapp: '+254711776554',
    primaryCategory: 'Electrical',
    additionalCategories: ['Appliance Repair'],
    skills: ['Underground Cable Fault Locating', 'Automatic Transfer Switches (ATS)', 'Submeter Installation', 'Generator Synchronizing', 'Earthing Pit Resistance Testing'],
    bio: 'Senior electrical technician and EPRA Class B certified wireman. Specializing in generator changeovers, power sub-metering for rental units, and earthing.',
    experienceYears: 11,
    hourlyRateKes: 1050,
    fixedInspectionFeeKes: 600,
    rating: 4.92,
    reviewCount: 75,
    jobsCompleted: 175,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 20,
    location: {
      lat: -1.3000,
      lng: 36.7550,
      neighborhood: 'Ngong Road',
      address: 'Ngong Road, Junction, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Fluke Earth Resistance Ground Tester', 'Digital Cable Fault Locator', 'Hydraulic Cable Lug Crimper', 'Phase Rotation Meter'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Electrical Wireman)',
    nitaTradeTestNo: 'NITA/EW/2016/4431',
    reviews: [
      {
        id: 'rev-26',
        authorName: 'Beatrice Mumbi',
        rating: 5,
        date: '2026-08-28',
        comment: 'Jackson installed individual digital sub-meters for our 6 rental flats. Very clear documentation and safe wiring.',
        jobType: 'Rental Sub-Metering ATS Setup',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-25',
        title: 'Apartment Complex ATS Generator Changeover Panel',
        description: 'Wired automatic 3-phase motorized transfer switch with surge arrestors.',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600',
        category: 'Electrical',
        completionDate: '2026-08-10'
      }
    ]
  },
  {
    id: 'fundi-25',
    name: 'Sharon Akinyi Otieno',
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=400',
    phone: '+254 722 889 001',
    whatsapp: '+254722889001',
    primaryCategory: 'Plumbing',
    additionalCategories: ['Roofing'],
    skills: ['Solar Geyser Heating Elements', 'Shower Mixer Cartridge Replacement', 'Water Pump Pressure Switches', 'Under-Sink Reverse Osmosis', 'Kitchen Trap Unblocking'],
    bio: 'Certified master plumber in Buruburu and Eastlands. 7 years experience servicing instant showers, water filtration units, booster pumps, and sewer drainage traps.',
    experienceYears: 7,
    hourlyRateKes: 800,
    fixedInspectionFeeKes: 500,
    rating: 4.89,
    reviewCount: 50,
    jobsCompleted: 128,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 15,
    location: {
      lat: -1.2900,
      lng: 36.8750,
      neighborhood: 'Buruburu',
      address: 'Mumias South Road, Buruburu, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Electric Plumbers Drain Snake', 'Pipe Threading Die Kit', 'Water Pressure Test Gauge', 'Pipe Inspection Camera'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Plumber Pipe-Fitter)',
    nitaTradeTestNo: 'NITA/PL/2020/7798',
    reviews: [
      {
        id: 'rev-27',
        authorName: 'George Kinuthia',
        rating: 5,
        date: '2026-08-25',
        comment: 'Sharon arrived in 15 minutes when our kitchen main drain was blocked. Cleared the grease trap quickly with no mess left behind.',
        jobType: 'Emergency Drain Unblocking',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-26',
        title: 'Buruburu House Solar Water Heating Setup',
        description: 'Installed 200L non-pressure solar tube collector with digital controller.',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
        category: 'Plumbing',
        completionDate: '2026-07-29'
      }
    ]
  },
  {
    id: 'fundi-26',
    name: 'Anthony Kiarie Gitonga',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400',
    phone: '+254 733 990 112',
    whatsapp: '+254733990112',
    primaryCategory: 'Carpentry',
    additionalCategories: ['Interior Fit-Out & Gypsum'],
    skills: ['Modular Kitchen Cabinets', 'MDF Wardrobe Fabrication', 'Heavy Solid Security Doors', 'Lock Cylinder Replacement', 'Pergolas & Timber Decks'],
    bio: 'Bespoke carpenter and kitchen installer in Ruaka and northern Nairobi suburbs. Specializes in glossy acrylic modular kitchens, soft-close Blum hinges, and wardrobes.',
    experienceYears: 8,
    hourlyRateKes: 850,
    fixedInspectionFeeKes: 500,
    rating: 4.90,
    reviewCount: 54,
    jobsCompleted: 119,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 25,
    location: {
      lat: -1.2050,
      lng: 36.7750,
      neighborhood: 'Ruaka',
      address: 'Limuru Road, Ruaka, Kiambu/Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Festool Track Plunge Saw', 'Edge Banding Machine', 'Pocket Hole Jig System', 'Laser Distance Measurer'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Carpentry & Joinery)',
    nitaTradeTestNo: 'NITA/CP/2019/5502',
    reviews: [
      {
        id: 'rev-28',
        authorName: 'Caroline Chege',
        rating: 5,
        date: '2026-08-16',
        comment: 'Anthony fitted our new apartment modular kitchen in Ruaka. High quality acrylic boards and smooth soft-close runners.',
        jobType: 'Modular Kitchen Fit-Out',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-27',
        title: 'Ruaka Luxury Apartment Custom Wardrobes',
        description: 'Built floor-to-ceiling MDF wardrobes with tinted glass sliding doors.',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600',
        category: 'Carpentry',
        completionDate: '2026-08-03'
      }
    ]
  },
  {
    id: 'fundi-27',
    name: 'Daniel Kipchumba Bett',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    phone: '+254 712 110 998',
    whatsapp: '+254712110998',
    primaryCategory: 'Welding',
    additionalCategories: ['Roofing'],
    skills: ['Wrought Iron Gates', 'Staircase Handrails', 'Perimeter Razor Wire Brackets', 'Carport Canopies', 'Structural I-Beam Welding'],
    bio: 'Architectural metal fabricator on Kiambu Road. Specializing in curved spiral staircases, polycarbonate carports, security anti-burglary grills, and automated gates.',
    experienceYears: 10,
    hourlyRateKes: 950,
    fixedInspectionFeeKes: 500,
    rating: 4.88,
    reviewCount: 60,
    jobsCompleted: 145,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 20,
    location: {
      lat: -1.2200,
      lng: 36.8400,
      neighborhood: 'Kiambu Road',
      address: 'Kiambu Road, Thindigua, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Heavy Industrial MIG Welder', 'Hydraulic Pipe Bending Machine', 'Magnetic Drill Rig', 'Plasma Torch Kit'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Welding & Structural Steel)',
    nitaTradeTestNo: 'NITA/WL/2017/8833',
    reviews: [
      {
        id: 'rev-29',
        authorName: 'Eng. Nicholas Mwaura',
        rating: 5,
        date: '2026-08-22',
        comment: 'Daniel built a custom curved double carport with polycarbonate roof sheets. Extremely strong steel frame and clean welds.',
        jobType: 'Double Carport Canopy',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-28',
        title: 'Thindigua Gated Community Main Gate',
        description: 'Fabricated 6-meter sliding gate with wrought iron ornamental scrolls.',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600',
        category: 'Welding',
        completionDate: '2026-07-27'
      }
    ]
  },
  {
    id: 'fundi-28',
    name: 'Mercy Ndunge Musau',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    phone: '+254 722 001 223',
    whatsapp: '+254722001223',
    primaryCategory: 'Masonry',
    additionalCategories: ['Painting'],
    skills: ['Granite Countertop Polishing', 'Terrazzo Floor Restoration', 'Glass Mosaic Tiling', 'Waterproof Bathroom Tanking', 'Natural Stone Cladding'],
    bio: 'Master stonemason and ceramic tile installer in Kasarani and Thika Road. Over 9 years cutting, beveling, and installing premium granite kitchen countertops.',
    experienceYears: 9,
    hourlyRateKes: 850,
    fixedInspectionFeeKes: 500,
    rating: 4.93,
    reviewCount: 68,
    jobsCompleted: 152,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 25,
    location: {
      lat: -1.2180,
      lng: 36.8980,
      neighborhood: 'Kasarani',
      address: 'Kasarani Sports View Road, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Wet Diamond Polisher', 'Water-Jet Granite Saw', 'Laser Surface Scanners', 'Heavy Suction Stone Lifters'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Masonry & Finishes)',
    nitaTradeTestNo: 'NITA/MS/2018/2219',
    reviews: [
      {
        id: 'rev-30',
        authorName: 'Hellen Mutheu',
        rating: 5,
        date: '2026-08-20',
        comment: 'Mercy installed black galaxy granite countertops and undermount sink cutouts in our kitchen. Seamless joins and mirror polish.',
        jobType: 'Granite Countertop Installation',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-29',
        title: 'Kasarani Residence Black Galaxy Granite Kitchen',
        description: 'Cut, beveled, and installed 12 meters of 30mm polished granite with splashback.',
        imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=600',
        category: 'Masonry',
        completionDate: '2026-08-06'
      }
    ]
  },
  {
    id: 'fundi-29',
    name: 'George Odhiambo Alando',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    phone: '+254 733 112 334',
    whatsapp: '+254733112334',
    primaryCategory: 'Appliance Repair',
    additionalCategories: ['Electrical', 'HVAC & AC'],
    skills: ['Washing Machine Drum Bearing Replacement', 'Commercial Oven Thermostats', 'Dishwasher Drainage Diagnostics', 'Refrigerator Gas Leak Detection', 'Solar Inverter Tripping Fix'],
    bio: 'Certified commercial appliance engineer in Embakasi and Airport environs. Specializes in heavy laundry washers, commercial convection ovens, and ice machines.',
    experienceYears: 10,
    hourlyRateKes: 1000,
    fixedInspectionFeeKes: 500,
    rating: 4.88,
    reviewCount: 57,
    jobsCompleted: 141,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 20,
    location: {
      lat: -1.3150,
      lng: 36.8900,
      neighborhood: 'Embakasi',
      address: 'Airport North Road, Embakasi, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Digital Refrigerant Sniffer', 'Bearing Puller Tool Set', 'Appliance Power Analyzer', 'Multimeter Clamp Probe'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Appliance Electronics)',
    nitaTradeTestNo: 'NITA/AP/2017/3391',
    reviews: [
      {
        id: 'rev-31',
        authorName: 'Julius Musyoki',
        rating: 5,
        date: '2026-08-18',
        comment: 'George replaced the worn drum bearings on our heavy 12kg LG commercial washer. Silent spinning and works perfectly now.',
        jobType: 'Commercial Washer Bearing Overhaul',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-30',
        title: 'Embakasi Hotel Industrial Kitchen Range Repair',
        description: 'Replaced digital control thermostat and recalibrated gas ignition valves.',
        imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600',
        category: 'Appliance Repair',
        completionDate: '2026-07-24'
      }
    ]
  },
  {
    id: 'fundi-30',
    name: 'Lucy Muthoni Nderitu',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    phone: '+254 712 554 332',
    whatsapp: '+254712554332',
    primaryCategory: 'Painting',
    additionalCategories: ['Roofing', 'Masonry'],
    skills: ['Epoxy Floor Coating', 'Rising Damp Chemical Injections', 'Anti-Fungal Wash Treatments', 'Textured Ruff-N-Tuff Exterior', 'High-Pressure Roof Cleaning'],
    bio: 'Specialist coating and damp proofing contractor in Madaraka and Nairobi West. 8 years curing rising wall moisture, peeling paint, and applying 3D epoxy floors.',
    experienceYears: 8,
    hourlyRateKes: 800,
    fixedInspectionFeeKes: 500,
    rating: 4.91,
    reviewCount: 63,
    jobsCompleted: 137,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 25,
    location: {
      lat: -1.3080,
      lng: 36.8180,
      neighborhood: 'Madaraka',
      address: 'Ole Sangale Road, Madaraka, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Concrete Moisture Scanner', 'Chemical Damp Injection Pump', 'Diamond Floor Grinder', 'Heavy Airless Sprayer'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Painting, Finishes & Damp Proofing)',
    nitaTradeTestNo: 'NITA/PT/2019/1108',
    reviews: [
      {
        id: 'rev-32',
        authorName: 'Felix Wanjala',
        rating: 5,
        date: '2026-08-24',
        comment: 'Lucy permanently eradicated the rising damp and peeling paint along our ground floor walls. Injected damp-proof cream and repainted with silk vinyl.',
        jobType: 'Damp Proofing Treatment',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-31',
        title: 'Madaraka Commercial Showroom Epoxy Metallic Floor',
        description: 'Ground concrete substrate and poured 3mm self-leveling metallic epoxy.',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600',
        category: 'Painting',
        completionDate: '2026-08-09'
      }
    ]
  },
  {
    id: 'fundi-31',
    name: 'Kelvin Kamau Mwangi',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    phone: '+254 724 811 902',
    whatsapp: '+254724811902',
    primaryCategory: 'Plumbing',
    additionalCategories: ['Masonry'],
    skills: ['PPR Pipe Installation', 'Water Tank & Booster Setup', 'Blocked Sewer Clearing', 'Instant Shower Wiring', 'Borehole Line Repairs'],
    bio: 'Njiru & Kangundo Road master plumber serving Kasarani Sub-County estates (Njiru, Chokaa, Mwiki, Saika). Fast response for pipe bursts, tank towers, and residential drainage.',
    experienceYears: 9,
    hourlyRateKes: 750,
    fixedInspectionFeeKes: 500,
    rating: 4.92,
    reviewCount: 54,
    jobsCompleted: 134,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 15,
    location: {
      lat: -1.2586,
      lng: 36.9395,
      neighborhood: 'Njiru, Kasarani Sub-County',
      address: 'Kangundo Road, Njiru Junction, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['PPR Thermal Fusion Welder', 'Motorized Drain Snake', 'Pressure Gauge Kit', 'Pipe Threader'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Plumbing & Pipe Fitting)',
    nitaTradeTestNo: 'NITA/PL/2018/6719',
    reviews: [
      {
        id: 'rev-33',
        authorName: 'Miriam Muthoni',
        rating: 5,
        date: '2026-08-29',
        comment: 'Kelvin reached our Njiru court in 15 minutes and replaced a burst main riser valve cleanly.',
        jobType: 'Emergency Pipe Repair',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-32',
        title: 'Njiru 5,000L Elevated Water Tank & Booster Setup',
        description: 'Fabricated steel tank base lines and installed automatic float switch booster pump.',
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
        category: 'Plumbing',
        completionDate: '2026-08-12'
      }
    ]
  },
  {
    id: 'fundi-32',
    name: 'Esther Wambui Njoroge',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    phone: '+254 716 402 518',
    whatsapp: '+254716402518',
    primaryCategory: 'Electrical',
    additionalCategories: ['Appliance Repair'],
    skills: ['Token Meter & Wiring Triage', 'Circuit Breaker Upgrades', 'Inverter Backup Setup', 'Security Floodlights', 'Earthing & Surge Protection'],
    bio: 'EPRA licensed electrician based in Mwiki & Njiru (Kasarani Sub-County). Reliable residential fault finding, meter board rewiring, and solar-inverter backups.',
    experienceYears: 8,
    hourlyRateKes: 850,
    fixedInspectionFeeKes: 500,
    rating: 4.94,
    reviewCount: 49,
    jobsCompleted: 121,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: true,
    responseTimeMinutes: 18,
    location: {
      lat: -1.2360,
      lng: 36.9240,
      neighborhood: 'Mwiki, Kasarani Sub-County',
      address: 'Mwiki - Kasarani Road, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Fluke Digital Multimeter', 'Megger Insulation Tester', 'Earth Resistance Clamp', 'Insulated Conduit Bender'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Electrical Wireman)',
    nitaTradeTestNo: 'NITA/EL/2019/4182',
    reviews: [
      {
        id: 'rev-34',
        authorName: 'John Kariuki',
        rating: 5,
        date: '2026-08-27',
        comment: 'Fixed recurring breaker tripping in our Mwiki apartments and labeled the entire distribution board.',
        jobType: 'Breaker Board Repair',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-33',
        title: 'Kasarani Rental Block Surge-Protected Consumer Boards',
        description: 'Upgraded 12 apartment units with RCBO earth-leakage breakers and voltage protectors.',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
        category: 'Electrical',
        completionDate: '2026-08-10'
      }
    ]
  },
  {
    id: 'fundi-33',
    name: 'Patrick Mutuku Nzioka',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    phone: '+254 735 628 410',
    whatsapp: '+254735628410',
    primaryCategory: 'Carpentry',
    additionalCategories: ['Welding', 'Roofing'],
    skills: ['Kitchen Cabinets & Wardrobes', 'Steel Security Doors & Locks', 'Roof Leak & Gutter Repair', 'Window Burglar Grilles', 'Ceiling & Partition Fit-Out'],
    bio: 'Experienced joiner and metal fabricator in Chokaa & Njiru along Kangundo Road. Handles custom wardrobes, door locks, burglar grilles, and roof repairs.',
    experienceYears: 11,
    hourlyRateKes: 800,
    fixedInspectionFeeKes: 500,
    rating: 4.89,
    reviewCount: 44,
    jobsCompleted: 109,
    isVerified: true,
    idVerified: true,
    backgroundChecked: true,
    isAvailableNow: true,
    emergencyAvailable: false,
    responseTimeMinutes: 20,
    location: {
      lat: -1.2675,
      lng: 36.9420,
      neighborhood: 'Chokaa / Njiru',
      address: 'Kangundo Road, Chokaa Estate, Njiru, Nairobi',
      city: 'Nairobi'
    },
    toolsEquipment: ['Makita Circular Saw', 'Inverter Arc Welder', 'Cordless Hammer Drill', 'Laser Alignment Level'],
    nitaAccredited: true,
    nitaCertificationLevel: 'NITA Trade Test Grade I (Carpentry & Fabrication)',
    nitaTradeTestNo: 'NITA/CJ/2017/2945',
    reviews: [
      {
        id: 'rev-35',
        authorName: 'Beatrice Nduku',
        rating: 5,
        date: '2026-08-23',
        comment: 'Fitted heavy mahogany bedroom doors and reinforced our Chokaa compound gate hinges the same day.',
        jobType: 'Door & Gate Fitting',
        verifiedJob: true
      }
    ],
    portfolio: [
      {
        id: 'p-34',
        title: 'Chokaa Residence Fitted Kitchen & Steel Grilles',
        description: 'Built moisture-resistant kitchen cabinetry and matching powder-coated window grilles.',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600',
        category: 'Carpentry',
        completionDate: '2026-08-03'
      }
    ]
  }
];

export const POPULAR_LOCATIONS = [
  { name: 'Nairobi - Njiru (Kasarani Sub-County)', lat: -1.2586, lng: 36.9395 },
  { name: 'Nairobi - Kasarani / Mwiki', lat: -1.2245, lng: 36.9065 },
  { name: 'Nairobi - Chokaa / Kangundo Rd', lat: -1.2690, lng: 36.9420 },
  { name: 'Nairobi - Roysambu', lat: -1.2215, lng: 36.8860 },
  { name: 'Nairobi - Utawala', lat: -1.2830, lng: 36.9560 },
  { name: 'Nairobi - Ruai', lat: -1.2580, lng: 36.9930 },
  { name: 'Nairobi - Buruburu', lat: -1.2900, lng: 36.8750 },
  { name: 'Nairobi - Embakasi', lat: -1.3150, lng: 36.8900 },
  { name: 'Nairobi - Kahawa Sukari / Wendani', lat: -1.1980, lng: 36.9310 },
  { name: 'Nairobi - Westlands', lat: -1.2685, lng: 36.8045 },
  { name: 'Nairobi - Kilimani', lat: -1.2921, lng: 36.7862 },
  { name: 'Nairobi - CBD', lat: -1.2833, lng: 36.8167 },
  { name: 'Nairobi - Karen', lat: -1.3197, lng: 36.7062 },
  { name: 'Nairobi - Lavington', lat: -1.2750, lng: 36.7600 },
  { name: 'Nairobi - Parklands', lat: -1.2580, lng: 36.8250 },
  { name: 'Nairobi - South B', lat: -1.3050, lng: 36.8350 },
  { name: 'Mombasa - Nyali', lat: -4.0350, lng: 39.7020 },
  { name: 'Kisumu - Milimani', lat: -0.1022, lng: 34.7556 },
  { name: 'Nakuru - Milimani', lat: -0.2833, lng: 36.0667 }
];

export const CATEGORY_INFO: Record<string, { description: string; icon: string; avgRateKes: number; commonJobs: string[] }> = {
  'Plumbing': {
    description: 'Pipe bursts, leaks, taps, instant showers, tanks, and drainage systems.',
    icon: 'Wrench',
    avgRateKes: 850,
    commonJobs: ['Fix Leaking Pipe', 'Instant Shower Installation', 'Unblock Sink & Drainage', 'Water Tank & Booster Setup']
  },
  'Electrical': {
    description: 'Wiring, circuit tripping, fuse boxes, sockets, lighting, and solar backup.',
    icon: 'Zap',
    avgRateKes: 950,
    commonJobs: ['Short Circuit Fault Finding', 'Distribution Board Upgrade', 'Solar Inverter Setup', 'Generator Changeover Switch']
  },
  'Carpentry': {
    description: 'Kitchen cabinets, wardrobes, locks, doors, furniture, and wood partitions.',
    icon: 'Hammer',
    avgRateKes: 850,
    commonJobs: ['Custom Kitchen Cabinets', 'Door Fitting & Lock Replacement', 'Wardrobe Customization', 'Timber Decking']
  },
  'Painting': {
    description: 'Interior and exterior wall painting, damp proofing, and epoxy floors.',
    icon: 'Paintbrush',
    avgRateKes: 750,
    commonJobs: ['Interior Living Room Repaint', 'Exterior Waterproof Painting', 'Damp & Mold Treatment', 'Texture Accent Wall']
  },
  'Masonry': {
    description: 'Tiling, stone work, plastering, foundation cracks, and concrete floors.',
    icon: 'BrickWall',
    avgRateKes: 850,
    commonJobs: ['Floor & Wall Tiling', 'Stone Cladding', 'Concrete Screed & Patching', 'Septic Tank Construction']
  },
  'Appliance Repair': {
    description: 'Washing machines, fridges, microwaves, cookers, and small appliances.',
    icon: 'Cpu',
    avgRateKes: 800,
    commonJobs: ['Washing Machine Drum & Motor Repair', 'Fridge Gas Recharging', 'Microwave Heating Fix', 'Oven Heating Element Replacement']
  },
  'Welding': {
    description: 'Security gates, window grilles, railings, steel structures, and repairs.',
    icon: 'Flame',
    avgRateKes: 900,
    commonJobs: ['Sliding Gate Fabrication', 'Window Burglar Proofing', 'Automatic Gate Installation', 'Steel Roof Trusses']
  },
  'Roofing': {
    description: 'Roof leaks, Decra & iron sheets, gutter systems, and rafter repairs.',
    icon: 'Shield',
    avgRateKes: 950,
    commonJobs: ['Emergency Leak Patching', 'Gutter Cleaning & Installation', 'Decra / Tile Reroofing', 'Skylight Installation']
  },
  'HVAC & AC': {
    description: 'Air conditioners, ventilation fans, chillers, and climate control.',
    icon: 'Wind',
    avgRateKes: 1100,
    commonJobs: ['Split AC Installation', 'AC Servicing & Gas Refill', 'Ventilation Fan Repair', 'Cold Room Maintenance']
  },
  'Landscaping': {
    description: 'Lawn mowing, automated irrigation, tree pruning, and garden design.',
    icon: 'Trees',
    avgRateKes: 700,
    commonJobs: ['Lawn Care & Hedge Trimming', 'Drip Irrigation Setup', 'Compound Beautification', 'Paving & Gravel Walkway']
  }
};
