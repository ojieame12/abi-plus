// Expert Marketplace Service
// Mock data and helper functions for the expert marketplace

import type {
  ExpertProfile,
  ExpertReview,
  ExpertMatch,
  EngagementSlot,
  ExpertFilters,
  ExpertSpecialty,
} from '../types/expertMarketplace';

// Mock Expert Data
export const MOCK_EXPERTS: ExpertProfile[] = [
  {
    id: 'expert-001',
    name: 'Sarah Chen',
    title: 'Metals & Mining Specialist',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 12,
    formerCompany: 'Rio Tinto',
    formerTitle: 'Senior Commodity Analyst',
    bio: 'Former commodity analyst at Rio Tinto with deep expertise in steel, aluminum, and copper markets. I help procurement teams navigate volatile metal markets with data-driven insights and supplier negotiations.',
    specialties: ['metals'],
    categories: ['Carbon Steel', 'Stainless Steel', 'Aluminum', 'Copper'],
    regions: ['NA', 'EMEA', 'APAC'],
    questionsAnswered: 487,
    rating: 4.9,
    reviewCount: 156,
    responseTime: '~4 hours',
    rates: {
      quickQuestion: 0, // Free for managed
      deepDive: 150,
      consultation: 300,
    },
    isTopVoice: true,
    badges: ['Top Contributor', 'Metal Markets Expert', '500+ Answers'],
    recentActivity: [
      { type: 'question', title: 'Steel price forecast Q2 2025', date: '2 days ago' },
      { type: 'report', title: 'Aluminum Market Brief', date: '1 week ago' },
      { type: 'insight', title: 'Impact of China tariffs on copper', date: '2 weeks ago' },
    ],
  },
  {
    id: 'expert-002',
    name: 'James Wilson',
    title: 'Packaging Industry Expert',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 15,
    formerCompany: 'International Paper',
    formerTitle: 'VP Strategic Sourcing',
    bio: 'Led strategic sourcing at International Paper for 8 years. Now helping companies optimize their packaging spend through market intelligence and supplier development strategies.',
    specialties: ['packaging'],
    categories: ['Corrugated Packaging', 'Flexible Packaging', 'Paper Products', 'Sustainable Packaging'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 312,
    rating: 4.8,
    reviewCount: 98,
    responseTime: '< 24 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    isTopVoice: false,
    badges: ['Industry Veteran', 'Sustainability Champion'],
    recentActivity: [
      { type: 'question', title: 'Cardboard price trends 2025', date: '3 days ago' },
      { type: 'insight', title: 'Sustainable packaging ROI', date: '1 week ago' },
    ],
  },
  {
    id: 'expert-003',
    name: 'Maria Rodriguez',
    title: 'Logistics & Supply Chain Expert',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    availability: 'busy',
    yearsExperience: 18,
    formerCompany: 'Maersk',
    formerTitle: 'Global Head of Procurement',
    bio: 'Two decades of experience in global logistics and freight. I specialize in ocean freight, air cargo, and last-mile delivery optimization. Former Maersk executive with deep carrier relationships.',
    specialties: ['logistics'],
    categories: ['Ocean Freight', 'Air Cargo', 'Trucking', 'Last Mile Delivery'],
    regions: ['NA', 'EMEA', 'APAC', 'LATAM'],
    questionsAnswered: 623,
    rating: 4.95,
    reviewCount: 201,
    responseTime: '~8 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 200,
      consultation: 400,
    },
    isTopVoice: true,
    badges: ['Supply Chain Expert', 'Global Perspective', '600+ Answers'],
    recentActivity: [
      { type: 'report', title: 'Red Sea disruption impact analysis', date: '1 day ago' },
      { type: 'question', title: 'Container rate negotiations', date: '4 days ago' },
    ],
  },
  {
    id: 'expert-004',
    name: 'David Kim',
    title: 'Chemicals & Raw Materials Specialist',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 10,
    formerCompany: 'BASF',
    formerTitle: 'Market Intelligence Manager',
    bio: 'Chemical industry expert with focus on specialty chemicals, polymers, and industrial gases. I help procurement teams understand complex chemical markets and identify cost-saving opportunities.',
    specialties: ['chemicals'],
    categories: ['Specialty Chemicals', 'Polymers', 'Industrial Gases', 'Adhesives'],
    regions: ['NA', 'EMEA', 'APAC'],
    questionsAnswered: 245,
    rating: 4.7,
    reviewCount: 67,
    responseTime: '< 12 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    badges: ['Chemical Markets Expert'],
    recentActivity: [
      { type: 'question', title: 'Polymer pricing outlook H2 2025', date: '5 days ago' },
      { type: 'insight', title: 'China chemical capacity expansion', date: '2 weeks ago' },
    ],
  },
  {
    id: 'expert-005',
    name: 'Emily Thompson',
    title: 'Energy & Utilities Specialist',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 14,
    formerCompany: 'Shell',
    formerTitle: 'Commercial Trading Analyst',
    bio: 'Former Shell trading analyst specializing in natural gas, power markets, and renewable energy procurement. I help companies navigate the energy transition while optimizing costs.',
    specialties: ['energy'],
    categories: ['Natural Gas', 'Power Markets', 'Renewable Energy', 'Carbon Credits'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 178,
    rating: 4.85,
    reviewCount: 52,
    responseTime: '~6 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 175,
      consultation: 350,
    },
    isTopVoice: true,
    badges: ['Energy Transition Expert', 'Top Contributor'],
    recentActivity: [
      { type: 'report', title: '2025 Natural Gas Price Forecast', date: '3 days ago' },
      { type: 'question', title: 'PPA negotiation strategies', date: '1 week ago' },
    ],
  },
  {
    id: 'expert-006',
    name: 'Michael Brown',
    title: 'IT Services & Software Specialist',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    availability: 'offline',
    yearsExperience: 16,
    formerCompany: 'Accenture',
    formerTitle: 'IT Procurement Director',
    bio: 'Led IT procurement for Fortune 500 clients at Accenture. Expert in software licensing, cloud services, and IT outsourcing negotiations. I help companies optimize their technology spend.',
    specialties: ['it_services'],
    categories: ['Software Licensing', 'Cloud Services', 'IT Outsourcing', 'Cybersecurity'],
    regions: ['NA', 'EMEA', 'APAC'],
    questionsAnswered: 389,
    rating: 4.75,
    reviewCount: 112,
    responseTime: '< 24 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 175,
      consultation: 350,
    },
    badges: ['IT Expert', 'License Negotiator'],
    recentActivity: [
      { type: 'question', title: 'Microsoft EA negotiation tips', date: '1 week ago' },
      { type: 'insight', title: 'Cloud cost optimization trends', date: '2 weeks ago' },
    ],
  },
  {
    id: 'expert-007',
    name: 'Jennifer Martinez',
    title: 'MRO & Industrial Products Expert',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 11,
    formerCompany: 'Grainger',
    formerTitle: 'Category Manager',
    bio: 'Former Grainger category manager with expertise in industrial supplies, safety equipment, and facility maintenance. I help companies streamline MRO procurement and reduce tail spend.',
    specialties: ['mro'],
    categories: ['Industrial Supplies', 'Safety Equipment', 'Tools & Fasteners', 'Facility Maintenance'],
    regions: ['NA', 'LATAM'],
    questionsAnswered: 156,
    rating: 4.65,
    reviewCount: 43,
    responseTime: '~8 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 125,
      consultation: 250,
    },
    badges: ['MRO Specialist'],
    recentActivity: [
      { type: 'question', title: 'Tail spend reduction strategies', date: '4 days ago' },
    ],
  },
  {
    id: 'expert-008',
    name: 'Robert Anderson',
    title: 'HR & Staffing Services Expert',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 20,
    formerCompany: 'Randstad',
    formerTitle: 'VP Enterprise Solutions',
    bio: 'Two decades in HR services and contingent workforce management. I help companies optimize their staffing programs, negotiate with MSPs, and implement workforce analytics.',
    specialties: ['hr_services'],
    categories: ['Contingent Workforce', 'RPO', 'Executive Search', 'Payroll Services'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 234,
    rating: 4.8,
    reviewCount: 78,
    responseTime: '< 12 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    badges: ['Workforce Expert', 'Industry Veteran'],
    recentActivity: [
      { type: 'insight', title: 'MSP market consolidation trends', date: '5 days ago' },
      { type: 'question', title: 'VMS implementation best practices', date: '2 weeks ago' },
    ],
  },
  {
    id: 'expert-009',
    name: 'Lisa Park',
    title: 'Marketing Services Specialist',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    availability: 'busy',
    yearsExperience: 13,
    formerCompany: 'WPP',
    formerTitle: 'Procurement Lead',
    bio: 'Former WPP procurement lead specializing in agency services, media buying, and marketing technology. I help companies get more value from their marketing investments.',
    specialties: ['marketing'],
    categories: ['Agency Services', 'Media Buying', 'MarTech', 'Production'],
    regions: ['NA', 'EMEA', 'APAC'],
    questionsAnswered: 189,
    rating: 4.7,
    reviewCount: 56,
    responseTime: '~6 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 175,
      consultation: 350,
    },
    badges: ['Marketing Expert'],
    recentActivity: [
      { type: 'report', title: 'Agency fee benchmarking 2025', date: '1 week ago' },
    ],
  },
  {
    id: 'expert-010',
    name: 'Thomas Wright',
    title: 'Facilities & Real Estate Expert',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 17,
    formerCompany: 'CBRE',
    formerTitle: 'Director of Procurement',
    bio: 'Former CBRE director with expertise in facilities management, commercial real estate, and workplace services. I help companies optimize their real estate portfolio and FM contracts.',
    specialties: ['facilities'],
    categories: ['Facilities Management', 'Commercial Real Estate', 'Workplace Services', 'Security'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 267,
    rating: 4.85,
    reviewCount: 89,
    responseTime: '< 24 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    badges: ['Real Estate Expert', 'FM Specialist'],
    recentActivity: [
      { type: 'question', title: 'Workplace strategy post-COVID', date: '3 days ago' },
      { type: 'insight', title: 'FM contract restructuring', date: '1 week ago' },
    ],
  },
  // Additional experts for more coverage
  {
    id: 'expert-011',
    name: 'Alexandra Foster',
    title: 'Strategic Metals Analyst',
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 9,
    formerCompany: 'ArcelorMittal',
    formerTitle: 'Market Research Lead',
    bio: 'Former market research lead at ArcelorMittal with deep expertise in steel market dynamics and price forecasting. I help procurement teams make data-driven decisions on metal purchases.',
    specialties: ['metals'],
    categories: ['Carbon Steel', 'Hot Rolled Coil', 'Cold Rolled Steel', 'Galvanized Steel'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 234,
    rating: 4.75,
    reviewCount: 67,
    responseTime: '~6 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    badges: ['Steel Expert', 'Price Forecasting'],
    recentActivity: [
      { type: 'report', title: 'Steel Market Monthly Review', date: '1 day ago' },
      { type: 'question', title: 'HRC pricing outlook', date: '5 days ago' },
    ],
  },
  {
    id: 'expert-012',
    name: 'Marcus Chen',
    title: 'Rare Earth & Specialty Metals',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    availability: 'busy',
    yearsExperience: 14,
    formerCompany: 'Umicore',
    formerTitle: 'Global Sourcing Director',
    bio: 'Expert in rare earth elements, precious metals, and battery materials. I help companies navigate supply chain risks in critical minerals and develop alternative sourcing strategies.',
    specialties: ['metals'],
    categories: ['Rare Earth Elements', 'Lithium', 'Cobalt', 'Precious Metals'],
    regions: ['APAC', 'NA', 'EMEA'],
    questionsAnswered: 412,
    rating: 4.9,
    reviewCount: 134,
    responseTime: '< 24 hours',
    rates: {
      quickQuestion: 75,
      deepDive: 200,
      consultation: 400,
    },
    isTopVoice: true,
    badges: ['Critical Minerals Expert', 'Supply Chain Risk'],
    recentActivity: [
      { type: 'insight', title: 'China rare earth export controls', date: '2 days ago' },
      { type: 'report', title: 'Battery Materials Outlook 2025', date: '1 week ago' },
    ],
  },
  {
    id: 'expert-013',
    name: 'Rachel Summers',
    title: 'Sustainable Packaging Expert',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 8,
    formerCompany: 'Amcor',
    formerTitle: 'Sustainability Lead',
    bio: 'Led sustainability initiatives at Amcor driving the transition to recyclable and compostable packaging. I help companies meet ESG goals while managing packaging costs.',
    specialties: ['packaging'],
    categories: ['Sustainable Packaging', 'Recyclable Films', 'Compostable Materials', 'Bio-plastics'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 167,
    rating: 4.8,
    reviewCount: 52,
    responseTime: '~4 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    badges: ['Sustainability Expert', 'Circular Economy'],
    recentActivity: [
      { type: 'question', title: 'EPR regulations impact', date: '3 days ago' },
      { type: 'insight', title: 'Compostable packaging ROI', date: '2 weeks ago' },
    ],
  },
  {
    id: 'expert-014',
    name: 'Daniel Brooks',
    title: 'Corrugated & Fiber Packaging',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 22,
    formerCompany: 'WestRock',
    formerTitle: 'VP Commercial',
    bio: 'Two decades in corrugated packaging with expertise in containerboard, box design, and supplier negotiations. I help companies optimize their corrugated spend.',
    specialties: ['packaging'],
    categories: ['Corrugated Boxes', 'Containerboard', 'Folding Cartons', 'Specialty Papers'],
    regions: ['NA', 'LATAM'],
    questionsAnswered: 389,
    rating: 4.85,
    reviewCount: 121,
    responseTime: '< 12 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    isTopVoice: true,
    badges: ['Industry Veteran', 'Corrugated Expert'],
    recentActivity: [
      { type: 'report', title: 'Containerboard Price Trends', date: '4 days ago' },
    ],
  },
  {
    id: 'expert-015',
    name: 'Samantha Lee',
    title: 'Air Cargo & Express Logistics',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 11,
    formerCompany: 'DHL Express',
    formerTitle: 'Regional Procurement Head',
    bio: 'Former DHL procurement head with expertise in air cargo, express services, and cross-border logistics. I help companies optimize their premium freight spend.',
    specialties: ['logistics'],
    categories: ['Air Cargo', 'Express Services', 'Cross-border', 'E-commerce Logistics'],
    regions: ['APAC', 'NA', 'EMEA'],
    questionsAnswered: 278,
    rating: 4.7,
    reviewCount: 87,
    responseTime: '~8 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    badges: ['Air Cargo Expert', 'E-commerce Logistics'],
    recentActivity: [
      { type: 'question', title: 'Peak season surcharge negotiations', date: '2 days ago' },
      { type: 'insight', title: 'Air cargo capacity outlook', date: '1 week ago' },
    ],
  },
  {
    id: 'expert-016',
    name: 'Kevin O\'Brien',
    title: 'Warehousing & Fulfillment Expert',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    availability: 'offline',
    yearsExperience: 16,
    formerCompany: 'Prologis',
    formerTitle: 'Director of Operations',
    bio: 'Former Prologis operations director with deep expertise in warehouse design, 3PL selection, and fulfillment optimization. I help companies build efficient distribution networks.',
    specialties: ['logistics'],
    categories: ['Warehousing', '3PL', 'Fulfillment', 'Distribution'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 345,
    rating: 4.8,
    reviewCount: 98,
    responseTime: '< 24 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 175,
      consultation: 350,
    },
    badges: ['Warehousing Expert', 'Network Design'],
    recentActivity: [
      { type: 'report', title: 'Warehouse Labor Cost Analysis', date: '5 days ago' },
    ],
  },
  {
    id: 'expert-017',
    name: 'Priya Sharma',
    title: 'Specialty Chemicals & Pharma',
    photo: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 13,
    formerCompany: 'Dow Chemical',
    formerTitle: 'Senior Buyer',
    bio: 'Former Dow senior buyer specializing in pharmaceutical intermediates, fine chemicals, and API sourcing. I help companies navigate complex chemical supply chains.',
    specialties: ['chemicals'],
    categories: ['Pharmaceutical Intermediates', 'Fine Chemicals', 'APIs', 'Solvents'],
    regions: ['NA', 'APAC', 'EMEA'],
    questionsAnswered: 198,
    rating: 4.75,
    reviewCount: 61,
    responseTime: '~6 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 175,
      consultation: 350,
    },
    badges: ['Pharma Chemicals Expert'],
    recentActivity: [
      { type: 'question', title: 'API supplier qualification', date: '4 days ago' },
    ],
  },
  {
    id: 'expert-018',
    name: 'Andrew Mitchell',
    title: 'Plastics & Polymers Specialist',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 15,
    formerCompany: 'LyondellBasell',
    formerTitle: 'Commercial Manager',
    bio: 'Deep expertise in polyethylene, polypropylene, and engineering plastics. I help companies optimize their polymer procurement and navigate volatile resin markets.',
    specialties: ['chemicals'],
    categories: ['Polyethylene', 'Polypropylene', 'Engineering Plastics', 'Resins'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 312,
    rating: 4.85,
    reviewCount: 94,
    responseTime: '< 12 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    isTopVoice: true,
    badges: ['Polymers Expert', 'Price Forecasting'],
    recentActivity: [
      { type: 'report', title: 'PE/PP Market Weekly', date: '1 day ago' },
      { type: 'insight', title: 'Resin price drivers Q2', date: '1 week ago' },
    ],
  },
  {
    id: 'expert-019',
    name: 'Jessica Turner',
    title: 'Renewable Energy Procurement',
    photo: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 10,
    formerCompany: 'NextEra Energy',
    formerTitle: 'PPA Origination Manager',
    bio: 'Former NextEra PPA origination manager with deep expertise in solar, wind, and battery storage procurement. I help companies achieve their clean energy goals cost-effectively.',
    specialties: ['energy'],
    categories: ['Solar PPA', 'Wind PPA', 'Battery Storage', 'Green Certificates'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 156,
    rating: 4.9,
    reviewCount: 48,
    responseTime: '~4 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 175,
      consultation: 350,
    },
    badges: ['Renewable Energy Expert', 'PPA Specialist'],
    recentActivity: [
      { type: 'question', title: 'Virtual PPA structuring', date: '2 days ago' },
      { type: 'report', title: 'Solar PPA Benchmark 2025', date: '2 weeks ago' },
    ],
  },
  {
    id: 'expert-020',
    name: 'William Garcia',
    title: 'Cloud & SaaS Procurement',
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face',
    availability: 'busy',
    yearsExperience: 12,
    formerCompany: 'Salesforce',
    formerTitle: 'Enterprise Licensing Director',
    bio: 'Former Salesforce licensing director with deep knowledge of enterprise software negotiations. I help companies optimize their cloud spend and negotiate better SaaS contracts.',
    specialties: ['it_services'],
    categories: ['SaaS Licensing', 'Cloud Infrastructure', 'Enterprise Software', 'IT Consulting'],
    regions: ['NA', 'EMEA', 'APAC'],
    questionsAnswered: 287,
    rating: 4.8,
    reviewCount: 89,
    responseTime: '~8 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 175,
      consultation: 350,
    },
    badges: ['SaaS Expert', 'Contract Negotiation'],
    recentActivity: [
      { type: 'insight', title: 'Salesforce renewal tactics', date: '3 days ago' },
      { type: 'question', title: 'AWS cost optimization', date: '1 week ago' },
    ],
  },
  {
    id: 'expert-021',
    name: 'Nicole Adams',
    title: 'Industrial Equipment & MRO',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 14,
    formerCompany: 'Caterpillar',
    formerTitle: 'Global Category Manager',
    bio: 'Former Caterpillar category manager with expertise in heavy equipment, industrial tools, and plant maintenance. I help companies reduce MRO costs and improve equipment uptime.',
    specialties: ['mro'],
    categories: ['Heavy Equipment', 'Power Tools', 'Plant Maintenance', 'Spare Parts'],
    regions: ['NA', 'LATAM'],
    questionsAnswered: 223,
    rating: 4.7,
    reviewCount: 71,
    responseTime: '< 12 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    badges: ['Equipment Expert', 'Cost Reduction'],
    recentActivity: [
      { type: 'question', title: 'OEM vs aftermarket parts', date: '4 days ago' },
    ],
  },
  {
    id: 'expert-022',
    name: 'Christopher Lee',
    title: 'Contingent Workforce Expert',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 18,
    formerCompany: 'Kelly Services',
    formerTitle: 'VP Strategic Accounts',
    bio: 'Two decades in staffing and contingent workforce management. I help companies build efficient workforce programs and negotiate better rates with staffing suppliers.',
    specialties: ['hr_services'],
    categories: ['Temporary Staffing', 'SOW', 'Direct Sourcing', 'Workforce Analytics'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 312,
    rating: 4.85,
    reviewCount: 103,
    responseTime: '~6 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    isTopVoice: true,
    badges: ['Staffing Expert', 'MSP Specialist'],
    recentActivity: [
      { type: 'report', title: 'Staffing Rate Benchmarks 2025', date: '2 days ago' },
      { type: 'insight', title: 'Direct sourcing trends', date: '1 week ago' },
    ],
  },
  {
    id: 'expert-023',
    name: 'Amanda Roberts',
    title: 'Digital Marketing Procurement',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 9,
    formerCompany: 'Omnicom',
    formerTitle: 'Procurement Manager',
    bio: 'Former Omnicom procurement manager specializing in digital media, programmatic advertising, and marketing technology. I help companies optimize their digital marketing spend.',
    specialties: ['marketing'],
    categories: ['Digital Media', 'Programmatic', 'MarTech', 'Social Media'],
    regions: ['NA', 'EMEA'],
    questionsAnswered: 145,
    rating: 4.65,
    reviewCount: 42,
    responseTime: '~4 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 150,
      consultation: 300,
    },
    badges: ['Digital Marketing Expert'],
    recentActivity: [
      { type: 'question', title: 'Programmatic fee transparency', date: '3 days ago' },
    ],
  },
  {
    id: 'expert-024',
    name: 'Steven Park',
    title: 'Corporate Real Estate Advisor',
    photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 19,
    formerCompany: 'JLL',
    formerTitle: 'Managing Director',
    bio: 'Former JLL managing director with expertise in lease negotiations, portfolio optimization, and workplace strategy. I help companies reduce their real estate costs.',
    specialties: ['facilities'],
    categories: ['Lease Negotiation', 'Portfolio Strategy', 'Workplace Design', 'Coworking'],
    regions: ['NA', 'APAC'],
    questionsAnswered: 289,
    rating: 4.9,
    reviewCount: 96,
    responseTime: '< 24 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 175,
      consultation: 350,
    },
    isTopVoice: true,
    badges: ['Real Estate Expert', 'Lease Negotiation'],
    recentActivity: [
      { type: 'report', title: 'Office Market Outlook 2025', date: '1 week ago' },
      { type: 'question', title: 'Lease restructuring options', date: '3 days ago' },
    ],
  },
  {
    id: 'expert-025',
    name: 'Michelle Wong',
    title: 'Asia Pacific Sourcing Expert',
    photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&h=200&fit=crop&crop=face',
    availability: 'available',
    yearsExperience: 15,
    formerCompany: 'Li & Fung',
    formerTitle: 'Director of Sourcing',
    bio: 'Former Li & Fung director with deep expertise in APAC manufacturing and supplier development. I help companies navigate China+1 strategies and alternative sourcing.',
    specialties: ['packaging', 'metals'],
    categories: ['China Sourcing', 'Vietnam Manufacturing', 'Supplier Development', 'Quality Assurance'],
    regions: ['APAC', 'NA'],
    questionsAnswered: 378,
    rating: 4.85,
    reviewCount: 112,
    responseTime: '~8 hours',
    rates: {
      quickQuestion: 50,
      deepDive: 175,
      consultation: 350,
    },
    isTopVoice: true,
    badges: ['APAC Expert', 'Supplier Development'],
    recentActivity: [
      { type: 'insight', title: 'Vietnam manufacturing capacity', date: '2 days ago' },
      { type: 'report', title: 'China+1 Strategy Guide', date: '2 weeks ago' },
    ],
  },
];

// Mock Reviews
export const MOCK_REVIEWS: ExpertReview[] = [
  {
    id: 'review-001',
    expertId: 'expert-001',
    clientName: 'Procurement Manager, Fortune 500 Manufacturing',
    rating: 5,
    comment: 'Sarah provided exceptional insights on steel market trends. Her analysis helped us negotiate a 12% cost reduction with our primary supplier.',
    date: '2 weeks ago',
    engagementType: 'consultation',
  },
  {
    id: 'review-002',
    expertId: 'expert-001',
    clientName: 'Director of Supply Chain, Automotive OEM',
    rating: 5,
    comment: 'Quick response with detailed data on aluminum pricing. Exactly what we needed for our quarterly review.',
    date: '1 month ago',
    engagementType: 'quick_question',
  },
  {
    id: 'review-003',
    expertId: 'expert-001',
    clientName: 'VP Procurement, Consumer Electronics',
    rating: 4,
    comment: 'Great deep-dive on copper market dynamics. Would have liked more supplier-specific recommendations.',
    date: '2 months ago',
    engagementType: 'deep_dive',
  },
  {
    id: 'review-004',
    expertId: 'expert-003',
    clientName: 'Global Logistics Director, Retail Company',
    rating: 5,
    comment: 'Maria\'s expertise in ocean freight is unmatched. Her negotiation strategies saved us $2M annually on carrier contracts.',
    date: '3 weeks ago',
    engagementType: 'consultation',
  },
  {
    id: 'review-005',
    expertId: 'expert-005',
    clientName: 'Energy Procurement Lead, Manufacturing',
    rating: 5,
    comment: 'Emily helped us navigate the complex PPA market. Her guidance was invaluable in securing a competitive renewable energy contract.',
    date: '1 month ago',
    engagementType: 'deep_dive',
  },
];

// Domain metadata for carousel
export const EXPERT_DOMAINS = [
  { id: 'metals', name: 'Metals & Mining', expertCount: 4 },
  { id: 'packaging', name: 'Packaging', expertCount: 4 },
  { id: 'logistics', name: 'Logistics', expertCount: 3 },
  { id: 'chemicals', name: 'Chemicals', expertCount: 3 },
  { id: 'energy', name: 'Energy', expertCount: 2 },
  { id: 'it_services', name: 'IT Services', expertCount: 2 },
  { id: 'mro', name: 'MRO', expertCount: 2 },
  { id: 'hr_services', name: 'HR Services', expertCount: 2 },
  { id: 'marketing', name: 'Marketing', expertCount: 2 },
  { id: 'facilities', name: 'Facilities', expertCount: 3 },
] as const;

// Helper Functions
export function getMockExperts(filters?: ExpertFilters): ExpertProfile[] {
  let experts = [...MOCK_EXPERTS];

  if (filters?.specialty) {
    experts = experts.filter((e) => e.specialties.includes(filters.specialty!));
  }

  if (filters?.availableNow) {
    experts = experts.filter((e) => e.availability === 'available');
  }

  if (filters?.minRating) {
    experts = experts.filter((e) => e.rating >= filters.minRating!);
  }

  if (filters?.region) {
    experts = experts.filter((e) => e.regions.includes(filters.region!));
  }

  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    experts = experts.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.title.toLowerCase().includes(query) ||
        e.categories.some((c) => c.toLowerCase().includes(query)) ||
        e.bio.toLowerCase().includes(query)
    );
  }

  return experts;
}

export function getMockExpertById(id: string): ExpertProfile | undefined {
  return MOCK_EXPERTS.find((e) => e.id === id);
}

export function getMockExpertReviews(expertId: string): ExpertReview[] {
  return MOCK_REVIEWS.filter((r) => r.expertId === expertId);
}

export function getMockFeaturedExperts(): ExpertProfile[] {
  // Return experts with isTopVoice or highest ratings
  return MOCK_EXPERTS.filter((e) => e.isTopVoice || e.rating >= 4.85).slice(0, 5);
}

export function getMockExpertMatches(query: string): ExpertMatch[] {
  // Simulate AI matching based on query keywords
  const queryLower = query.toLowerCase();
  const matches: ExpertMatch[] = [];

  for (const expert of MOCK_EXPERTS) {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Check specialty matches
    for (const specialty of expert.specialties) {
      if (queryLower.includes(specialty.replace('_', ' '))) {
        score += 20;
        reasons.push(`Specializes in ${specialty.replace('_', ' ')}`);
      }
    }

    // Check category matches
    for (const category of expert.categories) {
      if (queryLower.includes(category.toLowerCase())) {
        score += 15;
        reasons.push(`Expert in ${category}`);
      }
    }

    // Check keywords in query
    const keywords = ['price', 'cost', 'supplier', 'market', 'forecast', 'negotiate', 'trend'];
    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        score += 5;
      }
    }

    // Boost for availability
    if (expert.availability === 'available') {
      score += 10;
      reasons.push('Available now');
    }

    // Boost for top voice
    if (expert.isTopVoice) {
      score += 5;
      reasons.push('Top Voice');
    }

    // Boost for high rating
    if (expert.rating >= 4.8) {
      score += 5;
      reasons.push(`${expert.rating} rating`);
    }

    // Cap at 100
    score = Math.min(score, 100);

    if (score > 60 || reasons.length > 0) {
      matches.push({
        expert,
        matchScore: score,
        matchReasons: reasons.slice(0, 3),
      });
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

export function getMockAvailableSlots(expertId: string, date: string): EngagementSlot[] {
  // Generate mock available slots for the given date
  const slots: EngagementSlot[] = [];
  const times = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  times.forEach((time, index) => {
    slots.push({
      id: `slot-${expertId}-${date}-${index}`,
      date,
      time,
      available: Math.random() > 0.3, // 70% chance of availability
    });
  });

  return slots;
}

export function getExpertsCountBySpecialty(): Record<ExpertSpecialty, number> {
  const counts: Record<string, number> = {};

  for (const expert of MOCK_EXPERTS) {
    for (const specialty of expert.specialties) {
      counts[specialty] = (counts[specialty] || 0) + 1;
    }
  }

  return counts as Record<ExpertSpecialty, number>;
}

export function getAvailableExpertsCount(): number {
  return MOCK_EXPERTS.filter((e) => e.availability === 'available').length;
}

export function getTotalExpertsCount(): number {
  return MOCK_EXPERTS.length;
}
