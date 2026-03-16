// Seed customer data to KV store
// This should be run once to populate initial customer data

import * as kv from "./kv_store.tsx";

const CUSTOMERS = [
  {
    id: '1',
    name: 'Amina Hassan',
    phone: '+255711001001',
    type: 'residential',
    meterId: 'MTR-001',
    balance: 4980,
    score: 82,
    village: 'Nansio',
    status: 'active'
  },
  {
    id: '2',
    name: 'Joseph Mwangi',
    phone: '+255711001002',
    type: 'commercial',
    meterId: 'MTR-002',
    balance: 12540,
    score: 95,
    village: 'Nansio',
    status: 'active'
  },
  {
    id: '3',
    name: 'Sarah Kibonge',
    phone: '+255711001003',
    type: 'productive',
    meterId: 'MTR-003',
    balance: 8720,
    score: 88,
    village: 'Nansio',
    status: 'active'
  },
  {
    id: '4',
    name: 'Baraka Fishing Co',
    phone: '+255711001004',
    type: 'commercial',
    meterId: 'MTR-004',
    balance: 6340,
    score: 76,
    village: 'Nansio',
    status: 'active'
  },
  {
    id: '5',
    name: 'Grace Nyamweru',
    phone: '+255711001005',
    type: 'residential',
    meterId: 'MTR-005',
    balance: 680,
    score: 45,
    village: 'Nansio',
    status: 'warning'
  },
  {
    id: '6',
    name: 'Michael Kamara',
    phone: '+255711001006',
    type: 'residential',
    meterId: 'MTR-006',
    balance: 5120,
    score: 71,
    village: 'Nansio',
    status: 'active'
  },
  {
    id: '7',
    name: 'Duka la Mama Pendo',
    phone: '+255711001007',
    type: 'commercial',
    meterId: 'MTR-007',
    balance: 15200,
    score: 92,
    village: 'Nansio',
    status: 'active'
  },
  {
    id: '8',
    name: 'Lucy Welding Shop',
    phone: '+255711001008',
    type: 'productive',
    meterId: 'MTR-008',
    balance: 9840,
    score: 85,
    village: 'Nansio',
    status: 'active'
  },
  {
    id: '9',
    name: 'Hassan Bakari',
    phone: '+255711001009',
    type: 'residential',
    meterId: 'MTR-009',
    balance: 3200,
    score: 68,
    village: 'Nansio',
    status: 'active'
  },
  {
    id: '10',
    name: 'Pastor Elias',
    phone: '+255711001010',
    type: 'residential',
    meterId: 'MTR-010',
    balance: 0,
    score: 28,
    village: 'Nansio',
    status: 'critical'
  }
];

export async function seedCustomers() {
  console.log('Seeding customers...');
  
  for (const customer of CUSTOMERS) {
    await kv.set(`customer:${customer.id}`, customer);
    console.log(`Seeded customer: ${customer.name}`);
  }
  
  console.log('Customer seeding complete!');
}
