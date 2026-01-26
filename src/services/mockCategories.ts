// Mock managed categories data for P1 demo
// Beroe maintains ~500 validated categories
// Expanded sample for realistic demo

import type {
  ManagedCategory,
  CategoryDomain,
  ActivatedCategory,
  CategorySlotSummary,
} from '../types/managedCategories';
import { createSeededRandom, SEEDS, REFERENCE_DATE } from '../utils/seededRandom';

// Helper to create deterministic seed from category id
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Category domains (top-level groupings)
export const MOCK_CATEGORY_DOMAINS: CategoryDomain[] = [
  { id: 'metals', name: 'Metals', slug: 'metals', categoryCount: 76, icon: 'Box', color: 'text-slate-600 bg-slate-100' },
  { id: 'packaging', name: 'Packaging', slug: 'packaging', categoryCount: 48, icon: 'Package', color: 'text-amber-600 bg-amber-50' },
  { id: 'logistics', name: 'Logistics', slug: 'logistics', categoryCount: 42, icon: 'Truck', color: 'text-blue-600 bg-blue-50' },
  { id: 'it_services', name: 'IT Services', slug: 'it-services', categoryCount: 58, icon: 'Monitor', color: 'text-violet-600 bg-violet-50' },
  { id: 'chemicals', name: 'Chemicals', slug: 'chemicals', categoryCount: 64, icon: 'Beaker', color: 'text-emerald-600 bg-emerald-50' },
  { id: 'energy', name: 'Energy', slug: 'energy', categoryCount: 36, icon: 'Zap', color: 'text-yellow-600 bg-yellow-50' },
  { id: 'mro', name: 'MRO', slug: 'mro', categoryCount: 52, icon: 'Wrench', color: 'text-orange-600 bg-orange-50' },
  { id: 'marketing', name: 'Marketing', slug: 'marketing', categoryCount: 34, icon: 'Megaphone', color: 'text-pink-600 bg-pink-50' },
  { id: 'hr_services', name: 'HR Services', slug: 'hr-services', categoryCount: 28, icon: 'Users', color: 'text-cyan-600 bg-cyan-50' },
  { id: 'facilities', name: 'Facilities', slug: 'facilities', categoryCount: 24, icon: 'Building', color: 'text-indigo-600 bg-indigo-50' },
  { id: 'travel', name: 'Travel', slug: 'travel', categoryCount: 18, icon: 'Plane', color: 'text-sky-600 bg-sky-50' },
  { id: 'fleet', name: 'Fleet', slug: 'fleet', categoryCount: 22, icon: 'Car', color: 'text-red-600 bg-red-50' },
];

// Helper to create category
const createCategory = (
  id: string,
  name: string,
  domainId: string,
  domain: string,
  subDomain: string,
  description: string,
  analystName: string,
  analystTitle: string,
  analystPhoto?: string,
  options: Partial<ManagedCategory> = {}
): ManagedCategory => {
  // Use seeded random based on category id for deterministic values
  const random = createSeededRandom(SEEDS.CATEGORIES + hashString(id));
  const daysAgo = Math.floor(random() * 14);
  const lastUpdatedDate = new Date(REFERENCE_DATE);
  lastUpdatedDate.setDate(lastUpdatedDate.getDate() - daysAgo);

  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    domainId,
    domain,
    subDomain,
    description,
    leadAnalyst: {
      id: `analyst_${id}`,
      name: analystName,
      title: analystTitle,
      photo: analystPhoto,
    },
    analystTeamSize: Math.floor(random() * 4) + 2,
    updateFrequency: ['daily', 'weekly', 'bi-weekly', 'monthly'][Math.floor(random() * 4)] as ManagedCategory['updateFrequency'],
    lastUpdated: lastUpdatedDate.toISOString(),
    hasMarketReport: true,
    hasPriceIndex: random() > 0.2,
    hasSupplierData: random() > 0.1,
    hasNewsAlerts: random() > 0.3,
    hasCostModel: random() > 0.4,
    responseTimeSla: random() > 0.5 ? '24 hours' : '48 hours',
    clientCount: Math.floor(random() * 300) + 50,
    isPopular: random() > 0.7,
    ...options,
  };
};

// Expanded managed categories
export const MOCK_MANAGED_CATEGORIES: ManagedCategory[] = [
  // METALS (30+ categories)
  createCategory('steel_hrc', 'Steel (Hot Rolled Coil)', 'metals', 'Metals', 'Ferrous', 'Carbon steel hot rolled coil products', 'Sarah Chen', 'Senior Analyst, Metals', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', { isPopular: true }),
  createCategory('steel_crc', 'Steel (Cold Rolled Coil)', 'metals', 'Metals', 'Ferrous', 'Carbon steel cold rolled coil products', 'Sarah Chen', 'Senior Analyst, Metals', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', { isPopular: true }),
  createCategory('stainless_steel', 'Stainless Steel', 'metals', 'Metals', 'Ferrous', 'Stainless steel sheets, coils, and bars', 'Sarah Chen', 'Senior Analyst, Metals', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', { isPopular: true }),
  createCategory('aluminum_primary', 'Aluminum (Primary)', 'metals', 'Metals', 'Non-Ferrous', 'Primary aluminum ingots and billets', 'James Park', 'Analyst, Metals', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', { isPopular: true }),
  createCategory('aluminum_extrusions', 'Aluminum Extrusions', 'metals', 'Metals', 'Non-Ferrous', 'Extruded aluminum profiles and shapes', 'James Park', 'Analyst, Metals', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'),
  createCategory('aluminum_sheets', 'Aluminum Sheets', 'metals', 'Metals', 'Non-Ferrous', 'Rolled aluminum sheets and plates', 'James Park', 'Analyst, Metals', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'),
  createCategory('copper_cathodes', 'Copper Cathodes', 'metals', 'Metals', 'Non-Ferrous', 'High-purity copper cathodes', 'James Park', 'Analyst, Metals', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', { isPopular: true }),
  createCategory('copper_wire', 'Copper Wire Rod', 'metals', 'Metals', 'Non-Ferrous', 'Copper wire rod for electrical applications', 'James Park', 'Analyst, Metals', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'),
  createCategory('zinc', 'Zinc', 'metals', 'Metals', 'Non-Ferrous', 'Zinc ingots and alloys', 'Lisa Wang', 'Analyst, Metals'),
  createCategory('nickel', 'Nickel', 'metals', 'Metals', 'Non-Ferrous', 'Nickel products for stainless and batteries', 'Lisa Wang', 'Analyst, Metals'),
  createCategory('lead', 'Lead', 'metals', 'Metals', 'Non-Ferrous', 'Lead ingots and recycled lead', 'Lisa Wang', 'Analyst, Metals'),
  createCategory('tin', 'Tin', 'metals', 'Metals', 'Non-Ferrous', 'Tin ingots for soldering and plating', 'Lisa Wang', 'Analyst, Metals'),
  createCategory('titanium', 'Titanium', 'metals', 'Metals', 'Specialty', 'Titanium sponge, ingots, and mill products', 'Mark Stevens', 'Senior Analyst, Specialty Metals'),
  createCategory('cobalt', 'Cobalt', 'metals', 'Metals', 'Specialty', 'Cobalt for batteries and superalloys', 'Mark Stevens', 'Senior Analyst, Specialty Metals'),
  createCategory('lithium', 'Lithium', 'metals', 'Metals', 'Specialty', 'Lithium carbonate and hydroxide', 'Mark Stevens', 'Senior Analyst, Specialty Metals', undefined, { isPopular: true }),
  createCategory('rare_earths', 'Rare Earth Elements', 'metals', 'Metals', 'Specialty', 'Rare earth oxides and metals', 'Mark Stevens', 'Senior Analyst, Specialty Metals'),

  // PACKAGING (16+ categories)
  createCategory('corrugated', 'Corrugated Boxes', 'packaging', 'Packaging', 'Paper-Based', 'Corrugated shipping containers', 'Emily Watson', 'Senior Analyst, Packaging', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', { isPopular: true }),
  createCategory('folding_cartons', 'Folding Cartons', 'packaging', 'Packaging', 'Paper-Based', 'Folding carton packaging', 'Emily Watson', 'Senior Analyst, Packaging', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'),
  createCategory('flexible_films', 'Flexible Films', 'packaging', 'Packaging', 'Plastics', 'Flexible plastic films and pouches', 'Emily Watson', 'Senior Analyst, Packaging', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', { isPopular: true }),
  createCategory('rigid_plastics', 'Rigid Plastic Containers', 'packaging', 'Packaging', 'Plastics', 'Rigid plastic bottles and containers', 'Tom Anderson', 'Analyst, Packaging'),
  createCategory('glass_containers', 'Glass Containers', 'packaging', 'Packaging', 'Glass', 'Glass bottles and jars', 'Tom Anderson', 'Analyst, Packaging'),
  createCategory('metal_cans', 'Metal Cans', 'packaging', 'Packaging', 'Metal', 'Aluminum and steel cans', 'Tom Anderson', 'Analyst, Packaging'),
  createCategory('labels', 'Labels & Tags', 'packaging', 'Packaging', 'Ancillary', 'Pressure-sensitive labels and tags', 'Tom Anderson', 'Analyst, Packaging'),
  createCategory('pallets', 'Pallets', 'packaging', 'Packaging', 'Ancillary', 'Wood and plastic pallets', 'Tom Anderson', 'Analyst, Packaging'),

  // LOGISTICS (12+ categories)
  createCategory('contract_logistics', 'Contract Logistics', 'logistics', 'Logistics', '3PL', 'Third-party logistics and warehousing', 'Robert Chang', 'Senior Analyst, Logistics', undefined, { isPopular: true }),
  createCategory('ocean_freight', 'Ocean Freight', 'logistics', 'Logistics', 'Freight', 'Container shipping services', 'Robert Chang', 'Senior Analyst, Logistics', undefined, { isPopular: true }),
  createCategory('air_freight', 'Air Freight', 'logistics', 'Logistics', 'Freight', 'Air cargo and express services', 'Robert Chang', 'Senior Analyst, Logistics'),
  createCategory('road_freight', 'Road Freight', 'logistics', 'Logistics', 'Freight', 'Trucking and LTL services', 'Robert Chang', 'Senior Analyst, Logistics'),
  createCategory('rail_freight', 'Rail Freight', 'logistics', 'Logistics', 'Freight', 'Rail cargo services', 'Jennifer Liu', 'Analyst, Logistics'),
  createCategory('customs_brokerage', 'Customs Brokerage', 'logistics', 'Logistics', 'Services', 'Customs clearance services', 'Jennifer Liu', 'Analyst, Logistics'),
  createCategory('warehousing', 'Warehousing', 'logistics', 'Logistics', 'Services', 'Warehouse and distribution centers', 'Jennifer Liu', 'Analyst, Logistics'),
  createCategory('last_mile', 'Last Mile Delivery', 'logistics', 'Logistics', 'Services', 'Final mile delivery services', 'Jennifer Liu', 'Analyst, Logistics'),

  // IT SERVICES (12+ categories)
  createCategory('it_staffing', 'IT Staffing', 'it_services', 'IT Services', 'Staffing', 'IT contract staffing services', 'David Kim', 'Senior Analyst, IT'),
  createCategory('cloud_iaas', 'Cloud IaaS', 'it_services', 'IT Services', 'Cloud', 'Infrastructure as a Service', 'David Kim', 'Senior Analyst, IT', undefined, { isPopular: true }),
  createCategory('cloud_saas', 'Enterprise SaaS', 'it_services', 'IT Services', 'Cloud', 'Software as a Service platforms', 'David Kim', 'Senior Analyst, IT', undefined, { isPopular: true }),
  createCategory('cybersecurity', 'Cybersecurity Services', 'it_services', 'IT Services', 'Security', 'Security consulting and managed services', 'David Kim', 'Senior Analyst, IT'),
  createCategory('managed_services', 'IT Managed Services', 'it_services', 'IT Services', 'Services', 'Outsourced IT management', 'Amy Zhou', 'Analyst, IT'),
  createCategory('data_center', 'Data Center Services', 'it_services', 'IT Services', 'Infrastructure', 'Colocation and data center services', 'Amy Zhou', 'Analyst, IT'),
  createCategory('network_services', 'Network Services', 'it_services', 'IT Services', 'Infrastructure', 'WAN, SD-WAN, and network management', 'Amy Zhou', 'Analyst, IT'),
  createCategory('app_development', 'Application Development', 'it_services', 'IT Services', 'Development', 'Custom software development', 'Amy Zhou', 'Analyst, IT'),

  // CHEMICALS (10+ categories)
  createCategory('petrochemicals', 'Petrochemicals', 'chemicals', 'Chemicals', 'Base', 'Ethylene, propylene, and derivatives', 'Michael Brown', 'Senior Analyst, Chemicals', undefined, { isPopular: true }),
  createCategory('polymers', 'Polymers', 'chemicals', 'Chemicals', 'Plastics', 'PE, PP, PVC, and engineering plastics', 'Michael Brown', 'Senior Analyst, Chemicals', undefined, { isPopular: true }),
  createCategory('specialty_chemicals', 'Specialty Chemicals', 'chemicals', 'Chemicals', 'Specialty', 'Adhesives, coatings, and additives', 'Michael Brown', 'Senior Analyst, Chemicals'),
  createCategory('industrial_gases', 'Industrial Gases', 'chemicals', 'Chemicals', 'Industrial', 'Oxygen, nitrogen, and specialty gases', 'Rachel Green', 'Analyst, Chemicals'),
  createCategory('paints_coatings', 'Paints & Coatings', 'chemicals', 'Chemicals', 'Specialty', 'Industrial and decorative coatings', 'Rachel Green', 'Analyst, Chemicals'),
  createCategory('agrochemicals', 'Agrochemicals', 'chemicals', 'Chemicals', 'Specialty', 'Fertilizers and crop protection', 'Rachel Green', 'Analyst, Chemicals'),
  createCategory('solvents', 'Solvents', 'chemicals', 'Chemicals', 'Base', 'Industrial solvents and cleaners', 'Rachel Green', 'Analyst, Chemicals'),

  // ENERGY (8+ categories)
  createCategory('electricity', 'Electricity', 'energy', 'Energy', 'Utilities', 'Commercial and industrial power', 'Chris Taylor', 'Senior Analyst, Energy'),
  createCategory('natural_gas', 'Natural Gas', 'energy', 'Energy', 'Utilities', 'Natural gas supply and transport', 'Chris Taylor', 'Senior Analyst, Energy'),
  createCategory('solar_energy', 'Solar Energy', 'energy', 'Energy', 'Renewables', 'Solar PV systems and PPAs', 'Chris Taylor', 'Senior Analyst, Energy', undefined, { isPopular: true }),
  createCategory('wind_energy', 'Wind Energy', 'energy', 'Energy', 'Renewables', 'Wind power and PPAs', 'Chris Taylor', 'Senior Analyst, Energy'),
  createCategory('fuel_oil', 'Fuel Oil', 'energy', 'Energy', 'Petroleum', 'Heavy fuel oil and marine fuels', 'Nancy White', 'Analyst, Energy'),
  createCategory('diesel', 'Diesel', 'energy', 'Energy', 'Petroleum', 'Diesel fuel for fleet and industrial', 'Nancy White', 'Analyst, Energy'),

  // MRO (8+ categories)
  createCategory('industrial_supplies', 'Industrial Supplies', 'mro', 'MRO', 'General', 'General industrial consumables', 'Kevin Martinez', 'Senior Analyst, MRO'),
  createCategory('safety_equipment', 'Safety Equipment', 'mro', 'MRO', 'Safety', 'PPE and safety gear', 'Kevin Martinez', 'Senior Analyst, MRO'),
  createCategory('bearings', 'Bearings', 'mro', 'MRO', 'Components', 'Industrial bearings and seals', 'Kevin Martinez', 'Senior Analyst, MRO'),
  createCategory('fasteners', 'Fasteners', 'mro', 'MRO', 'Components', 'Bolts, nuts, and fastening systems', 'Kevin Martinez', 'Senior Analyst, MRO'),
  createCategory('motors_drives', 'Motors & Drives', 'mro', 'MRO', 'Equipment', 'Electric motors and VFDs', 'Sandra Lee', 'Analyst, MRO'),
  createCategory('pumps_valves', 'Pumps & Valves', 'mro', 'MRO', 'Equipment', 'Industrial pumps and valves', 'Sandra Lee', 'Analyst, MRO'),
  createCategory('hand_tools', 'Hand Tools', 'mro', 'MRO', 'Tools', 'Hand tools and power tools', 'Sandra Lee', 'Analyst, MRO'),
  createCategory('lubricants', 'Lubricants', 'mro', 'MRO', 'Consumables', 'Industrial lubricants and greases', 'Sandra Lee', 'Analyst, MRO'),

  // MARKETING (8+ categories)
  createCategory('creative_agencies', 'Creative Agencies', 'marketing', 'Marketing', 'Agencies', 'Creative and branding agencies', 'Jennifer Adams', 'Senior Analyst, Marketing'),
  createCategory('media_buying', 'Media Buying', 'marketing', 'Marketing', 'Media', 'Media planning and buying services', 'Jennifer Adams', 'Senior Analyst, Marketing', undefined, { isPopular: true }),
  createCategory('digital_marketing', 'Digital Marketing', 'marketing', 'Marketing', 'Digital', 'Digital marketing and SEO services', 'Jennifer Adams', 'Senior Analyst, Marketing', undefined, { isPopular: true }),
  createCategory('market_research', 'Market Research', 'marketing', 'Marketing', 'Research', 'Market research and insights', 'Paul Williams', 'Analyst, Marketing'),
  createCategory('pr_services', 'PR Services', 'marketing', 'Marketing', 'Communications', 'Public relations and communications', 'Paul Williams', 'Analyst, Marketing'),
  createCategory('events_management', 'Events Management', 'marketing', 'Marketing', 'Events', 'Corporate events and conferences', 'Paul Williams', 'Analyst, Marketing'),
  createCategory('promotional_products', 'Promotional Products', 'marketing', 'Marketing', 'Merchandise', 'Branded merchandise and swag', 'Paul Williams', 'Analyst, Marketing'),
  createCategory('print_services', 'Print Services', 'marketing', 'Marketing', 'Print', 'Commercial printing services', 'Paul Williams', 'Analyst, Marketing'),

  // HR SERVICES (8+ categories)
  createCategory('recruitment_agencies', 'Recruitment Agencies', 'hr_services', 'HR Services', 'Staffing', 'Executive and professional recruitment', 'Maria Garcia', 'Senior Analyst, HR'),
  createCategory('temp_staffing', 'Temporary Staffing', 'hr_services', 'HR Services', 'Staffing', 'Temporary and contract staffing', 'Maria Garcia', 'Senior Analyst, HR', undefined, { isPopular: true }),
  createCategory('payroll_services', 'Payroll Services', 'hr_services', 'HR Services', 'Admin', 'Payroll processing and management', 'Maria Garcia', 'Senior Analyst, HR'),
  createCategory('benefits_admin', 'Benefits Administration', 'hr_services', 'HR Services', 'Admin', 'Employee benefits management', 'Alex Thompson', 'Analyst, HR'),
  createCategory('training_development', 'Training & Development', 'hr_services', 'HR Services', 'Learning', 'Corporate training programs', 'Alex Thompson', 'Analyst, HR'),
  createCategory('background_checks', 'Background Checks', 'hr_services', 'HR Services', 'Compliance', 'Employee screening services', 'Alex Thompson', 'Analyst, HR'),
  createCategory('relocation_services', 'Relocation Services', 'hr_services', 'HR Services', 'Mobility', 'Employee relocation management', 'Alex Thompson', 'Analyst, HR'),
  createCategory('hr_software', 'HR Software', 'hr_services', 'HR Services', 'Technology', 'HRIS and HCM platforms', 'Alex Thompson', 'Analyst, HR'),

  // FACILITIES (8+ categories)
  createCategory('janitorial_services', 'Janitorial Services', 'facilities', 'Facilities', 'Cleaning', 'Commercial cleaning and janitorial', 'Brian O\'Connor', 'Senior Analyst, Facilities'),
  createCategory('security_services', 'Security Services', 'facilities', 'Facilities', 'Security', 'Physical security and guarding', 'Brian O\'Connor', 'Senior Analyst, Facilities', undefined, { isPopular: true }),
  createCategory('hvac_services', 'HVAC Services', 'facilities', 'Facilities', 'Maintenance', 'Heating, ventilation, and AC', 'Brian O\'Connor', 'Senior Analyst, Facilities'),
  createCategory('landscaping', 'Landscaping', 'facilities', 'Facilities', 'Grounds', 'Grounds maintenance and landscaping', 'Nina Patel', 'Analyst, Facilities'),
  createCategory('pest_control', 'Pest Control', 'facilities', 'Facilities', 'Maintenance', 'Pest management services', 'Nina Patel', 'Analyst, Facilities'),
  createCategory('waste_management', 'Waste Management', 'facilities', 'Facilities', 'Waste', 'Waste disposal and recycling', 'Nina Patel', 'Analyst, Facilities'),
  createCategory('elevator_maintenance', 'Elevator Maintenance', 'facilities', 'Facilities', 'Maintenance', 'Elevator and escalator services', 'Nina Patel', 'Analyst, Facilities'),
  createCategory('fire_safety', 'Fire Safety', 'facilities', 'Facilities', 'Safety', 'Fire protection and suppression', 'Nina Patel', 'Analyst, Facilities'),

  // TRAVEL (8+ categories)
  createCategory('corporate_travel', 'Corporate Travel Management', 'travel', 'Travel', 'TMC', 'Travel management companies', 'Samantha Reed', 'Senior Analyst, Travel', undefined, { isPopular: true }),
  createCategory('airline_contracts', 'Airline Contracts', 'travel', 'Travel', 'Air', 'Corporate airline agreements', 'Samantha Reed', 'Senior Analyst, Travel'),
  createCategory('hotel_programs', 'Hotel Programs', 'travel', 'Travel', 'Lodging', 'Corporate hotel programs', 'Samantha Reed', 'Senior Analyst, Travel'),
  createCategory('car_rental', 'Car Rental', 'travel', 'Travel', 'Ground', 'Corporate car rental programs', 'Derek Johnson', 'Analyst, Travel'),
  createCategory('ground_transport', 'Ground Transportation', 'travel', 'Travel', 'Ground', 'Limo, taxi, and rideshare services', 'Derek Johnson', 'Analyst, Travel'),
  createCategory('travel_tech', 'Travel Technology', 'travel', 'Travel', 'Technology', 'Booking tools and expense management', 'Derek Johnson', 'Analyst, Travel'),
  createCategory('meetings_events', 'Meetings & Events', 'travel', 'Travel', 'Events', 'Meeting planning and venues', 'Derek Johnson', 'Analyst, Travel'),
  createCategory('visa_services', 'Visa Services', 'travel', 'Travel', 'Services', 'Visa and passport services', 'Derek Johnson', 'Analyst, Travel'),

  // FLEET (8+ categories)
  createCategory('fleet_leasing', 'Fleet Leasing', 'fleet', 'Fleet', 'Leasing', 'Vehicle leasing programs', 'Carlos Rodriguez', 'Senior Analyst, Fleet', undefined, { isPopular: true }),
  createCategory('fleet_management', 'Fleet Management', 'fleet', 'Fleet', 'Management', 'Fleet management services', 'Carlos Rodriguez', 'Senior Analyst, Fleet'),
  createCategory('vehicle_telematics', 'Vehicle Telematics', 'fleet', 'Fleet', 'Technology', 'GPS and telematics systems', 'Carlos Rodriguez', 'Senior Analyst, Fleet'),
  createCategory('fuel_cards', 'Fuel Cards', 'fleet', 'Fleet', 'Fuel', 'Fuel card programs', 'Michelle Lee', 'Analyst, Fleet'),
  createCategory('vehicle_maintenance', 'Vehicle Maintenance', 'fleet', 'Fleet', 'Maintenance', 'Fleet maintenance services', 'Michelle Lee', 'Analyst, Fleet'),
  createCategory('tires', 'Tires', 'fleet', 'Fleet', 'Parts', 'Commercial and fleet tires', 'Michelle Lee', 'Analyst, Fleet'),
  createCategory('ev_fleet', 'EV Fleet Solutions', 'fleet', 'Fleet', 'Electric', 'Electric vehicle fleet programs', 'Michelle Lee', 'Analyst, Fleet', undefined, { isPopular: true }),
  createCategory('fleet_insurance', 'Fleet Insurance', 'fleet', 'Fleet', 'Insurance', 'Commercial fleet insurance', 'Michelle Lee', 'Analyst, Fleet'),
];

// Activated categories (selection from above) - 32 of 35 slots
const ACTIVATED_IDS = [
  // Metals (10)
  'steel_hrc', 'steel_crc', 'stainless_steel', 'aluminum_primary', 'aluminum_extrusions',
  'copper_cathodes', 'copper_wire', 'zinc', 'nickel', 'lithium',
  // Packaging (4)
  'corrugated', 'folding_cartons', 'flexible_films', 'rigid_plastics',
  // Logistics (4)
  'contract_logistics', 'ocean_freight', 'air_freight', 'warehousing',
  // IT Services (4)
  'cloud_iaas', 'cloud_saas', 'cybersecurity', 'managed_services',
  // Chemicals (3)
  'petrochemicals', 'polymers', 'specialty_chemicals',
  // Energy (3)
  'electricity', 'natural_gas', 'solar_energy',
  // MRO (2)
  'industrial_supplies', 'safety_equipment',
  // Marketing (2)
  'digital_marketing', 'media_buying',
  // HR Services (2)
  'temp_staffing', 'recruitment_agencies',
  // Facilities (2)
  'janitorial_services', 'security_services',
  // Travel (2)
  'corporate_travel', 'airline_contracts',
  // Fleet (2)
  'fleet_leasing', 'ev_fleet',
];

export const MOCK_ACTIVATED_CATEGORIES: ActivatedCategory[] = ACTIVATED_IDS
  .map(id => MOCK_MANAGED_CATEGORIES.find(c => c.id === id))
  .filter((cat): cat is ManagedCategory => cat !== undefined)
  .map((cat, index) => {
    // Use seeded random for deterministic values
    const random = createSeededRandom(SEEDS.CATEGORIES + hashString(`activated_${cat.id}`));
    const daysAgo = Math.floor(random() * 7);
    const lastAccessedDate = new Date(REFERENCE_DATE);
    lastAccessedDate.setDate(lastAccessedDate.getDate() - daysAgo);

    return {
      id: `act_${cat.id}`,
      categoryId: cat.id,
      category: cat,
      companyId: 'comp_001',
      activatedAt: '2024-03-15T00:00:00Z',
      activatedBy: 'user_001',
      queriesThisMonth: Math.floor(random() * 50) + 5,
      lastAccessedAt: lastAccessedDate.toISOString(),
      alertsEnabled: true,
      weeklyDigestEnabled: index < 5,
    };
  });

// Mock slot summary for Acme Corp
export const MOCK_SLOT_SUMMARY: CategorySlotSummary = {
  companyId: 'comp_001',
  companyName: 'Acme Corporation',
  totalSlots: 35,
  usedSlots: 28,
  remainingSlots: 7,
  activatedCategories: MOCK_ACTIVATED_CATEGORIES,
  suggestedCategories: MOCK_MANAGED_CATEGORIES.filter(c => !ACTIVATED_IDS.includes(c.id)).slice(0, 5),
};

// Helper functions
export function getMockCategories(filter?: { domainId?: string; search?: string }): ManagedCategory[] {
  let categories = [...MOCK_MANAGED_CATEGORIES];

  if (filter?.domainId) {
    categories = categories.filter(c => c.domainId === filter.domainId);
  }

  if (filter?.search) {
    const searchLower = filter.search.toLowerCase();
    categories = categories.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.domain.toLowerCase().includes(searchLower) ||
      c.keywords?.some(k => k.toLowerCase().includes(searchLower))
    );
  }

  return categories;
}

export function getMockCategory(categoryId: string): ManagedCategory | undefined {
  return MOCK_MANAGED_CATEGORIES.find(c => c.id === categoryId);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMockSlotSummary(_companyId: string): CategorySlotSummary {
  return MOCK_SLOT_SUMMARY;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMockActivatedCategories(_companyId: string): ActivatedCategory[] {
  return MOCK_ACTIVATED_CATEGORIES;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isCategoryActivated(categoryId: string, _companyId: string): boolean {
  return MOCK_ACTIVATED_CATEGORIES.some(ac => ac.categoryId === categoryId);
}

/**
 * Get all managed category names for confidence calculation
 * Returns an array of category names (e.g., "Steel (Hot Rolled Coil)", "Aluminum (Primary)")
 */
export function getManagedCategoryNames(): string[] {
  return MOCK_ACTIVATED_CATEGORIES.map(ac => ac.category.name);
}
