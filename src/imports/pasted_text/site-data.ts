// 10 virtual meters for site-tz-001 (Jumeme-style Lake Victoria island mini-grid)
// Each meter has a realistic load profile matching its customer type

export const SITE = {
  id: 'site-tz-001',
  name: 'Ukerewe Island — Nansio Feeder',
  operator: 'op-jumeme-001',
  location: { lat: -2.0167, lng: 33.0167 },
  capacity_kw: 50,
  tariff_tzs_per_kwh: {
    residential: 1710,
    business: 1560,
    productive: 1310,
  },
  currency: 'TZS',
};

export const METERS = [
  {
    id: 'MTR-001',
    serial: 'HXG-2024-001',
    brand: 'Hexing',
    model: 'HXE115-KP',
    customer: { name: 'Amina Hassan', type: 'residential', phone: '+255711001001' },
    initial_balance_tzs: 5200,
    load_profile: 'low_residential',   // lights + phone charging
    phase: 'single',
  },
  {
    id: 'MTR-002',
    serial: 'HXG-2024-002',
    brand: 'Hexing',
    model: 'HXE115-KP',
    customer: { name: 'Joseph Mwangi', type: 'residential', phone: '+255711001002' },
    initial_balance_tzs: 12800,
    load_profile: 'mid_residential',   // lights + TV + fridge
    phase: 'single',
  },
  {
    id: 'MTR-003',
    serial: 'SPK-2023-003',
    brand: 'SparkMeter',
    model: 'SM-Advantage',
    customer: { name: 'Mama Pima Duka', type: 'business', phone: '+255711001003' },
    initial_balance_tzs: 28000,
    load_profile: 'small_business',    // shop: lights + fridge + radio
    phase: 'single',
  },
  {
    id: 'MTR-004',
    serial: 'SPK-2023-004',
    brand: 'SparkMeter',
    model: 'SM-Advantage',
    customer: { name: 'Baraka Fishing Co', type: 'productive', phone: '+255711001004' },
    initial_balance_tzs: 45000,
    load_profile: 'fish_processing',   // ice maker + lights (peak morning/evening)
    phase: 'single',
  },
  {
    id: 'MTR-005',
    serial: 'HXG-2024-005',
    brand: 'Hexing',
    model: 'HXE115-KP',
    customer: { name: 'Grace Nyamweru', type: 'residential', phone: '+255711001005' },
    initial_balance_tzs: 800,
    load_profile: 'low_credit',        // nearly empty — will trigger low-credit alert
    phase: 'single',
  },
  {
    id: 'MTR-006',
    serial: 'HXG-2024-006',
    brand: 'Hexing',
    model: 'HXE115-KP',
    customer: { name: 'St. Peter Primary School', type: 'productive', phone: '+255711001006' },
    initial_balance_tzs: 67000,
    load_profile: 'school',            // high daytime, off at night
    phase: 'single',
  },
  {
    id: 'MTR-007',
    serial: 'CNL-2024-007',
    brand: 'Conlog',
    model: 'BEC23',
    customer: { name: 'Ali Dispensary', type: 'business', phone: '+255711001007' },
    initial_balance_tzs: 32000,
    load_profile: 'health_clinic',     // 24hr low load + medical fridge
    phase: 'single',
  },
  {
    id: 'MTR-008',
    serial: 'HXG-2024-008',
    brand: 'Hexing',
    model: 'HXE115-KP',
    customer: { name: 'Zawadi Restaurant', type: 'business', phone: '+255711001008' },
    initial_balance_tzs: 19500,
    load_profile: 'restaurant',        // cooking hours 6-9am, 12-2pm, 6-9pm
    phase: 'single',
  },
  {
    id: 'MTR-009',
    serial: 'SPK-2024-009',
    brand: 'SparkMeter',
    model: 'SM-Advantage',
    customer: { name: 'Farida Tailoring', type: 'business', phone: '+255711001009' },
    initial_balance_tzs: 7200,
    load_profile: 'small_business',
    phase: 'single',
  },
  {
    id: 'MTR-010',
    serial: 'HXG-2024-010',
    brand: 'Hexing',
    model: 'HXE115-KP',
    customer: { name: 'Pastor Elias Home', type: 'residential', phone: '+255711001010' },
    initial_balance_tzs: 0,
    load_profile: 'disconnected',      // zero balance — disconnected
    phase: 'single',
  },
];

// Load profiles define realistic power draw (watts) by hour-of-day
// Array index = hour (0-23), value = base watts + random variance applied in simulator
export const LOAD_PROFILES = {
  low_residential:  [5,5,5,5,5,5,10,20,15,10,10,10,15,10,10,10,15,30,40,50,45,35,20,10],
  mid_residential:  [10,10,10,10,10,10,20,40,30,20,20,25,30,20,20,20,30,80,120,150,120,80,40,20],
  small_business:   [5,5,5,5,5,5,5,60,80,90,90,90,90,90,90,90,90,90,70,50,30,15,10,5],
  fish_processing:  [200,180,160,140,120,200,250,300,280,260,240,200,180,160,140,120,100,200,280,300,260,240,220,200],
  school:           [5,5,5,5,5,5,5,30,200,250,250,250,200,200,200,200,150,50,20,10,10,10,5,5],
  health_clinic:    [40,40,40,40,40,40,40,60,80,100,100,100,100,80,80,80,80,80,60,60,50,50,45,40],
  restaurant:       [5,5,5,5,5,100,200,250,150,50,40,200,250,200,80,50,40,200,300,280,180,80,30,10],
  low_credit:       [5,5,5,5,5,5,10,15,12,8,8,8,10,8,8,8,10,20,25,28,22,15,10,8],
  disconnected:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
};
