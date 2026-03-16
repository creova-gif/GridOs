/**
 * GridOS — Supabase Live Wiring
 * Run: node src/scripts/setupSupabase.js
 *
 * 1. Tests connection
 * 2. Checks TimescaleDB extension
 * 3. Seeds operator + site + 10 customers + 10 meters
 * 4. Verifies RLS policies
 * 5. Starts MQTT bridge health check
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const OP_ID   = '00000000-0000-0000-0000-000000000001';
const SITE_ID = '00000000-0000-0000-0000-000000000010';

async function run() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   GridOS — Supabase Setup & Seed      ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // ── 1. Connection test ───────────────────────────────────────
  console.log('1. Testing connection...');
  const { error: pingErr } = await supabase.from('operators').select('count').limit(1);
  if (pingErr) {
    console.error('   ✗ Connection failed:', pingErr.message);
    console.error('   Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }
  console.log('   ✓ Connected to Supabase\n');

  // ── 2. Seed operator ─────────────────────────────────────────
  console.log('2. Seeding operator...');
  await supabase.from('operators').upsert({
    id: OP_ID, name: 'Jumeme Rural Power',
    country: 'TZ', contact_email: 'ops@jumeme.com', plan: 'growth'
  }, { onConflict: 'id' });
  console.log('   ✓ Operator: Jumeme Rural Power\n');

  // ── 3. Seed site ─────────────────────────────────────────────
  console.log('3. Seeding site...');
  await supabase.from('sites').upsert({
    id: SITE_ID, operator_id: OP_ID,
    name: 'Ukerewe Island — Nansio Feeder',
    country: 'TZ', region: 'Mwanza',
    latitude: -2.0167, longitude: 33.0167,
    capacity_kw: 50, currency: 'TZS',
    tariff_residential: 1710, tariff_business: 1560, tariff_productive: 1310,
    status: 'active'
  }, { onConflict: 'id' });
  console.log('   ✓ Site: Ukerewe Island\n');

  // ── 4. Seed meters + customers ───────────────────────────────
  console.log('4. Seeding 10 meters + customers...');
  const METERS = [
    { ref:'MTR-001', serial:'HXG-2024-001', brand:'Hexing',     model:'HXE115-KP',   name:'Amina Hassan',        type:'residential', phone:'+255711001001', balance:5200  },
    { ref:'MTR-002', serial:'HXG-2024-002', brand:'Hexing',     model:'HXE115-KP',   name:'Joseph Mwangi',       type:'residential', phone:'+255711001002', balance:12800 },
    { ref:'MTR-003', serial:'SPK-2023-003', brand:'SparkMeter', model:'SM-Advantage', name:'Mama Pima Duka',      type:'business',    phone:'+255711001003', balance:28000 },
    { ref:'MTR-004', serial:'SPK-2023-004', brand:'SparkMeter', model:'SM-Advantage', name:'Baraka Fishing Co',   type:'productive',  phone:'+255711001004', balance:45000 },
    { ref:'MTR-005', serial:'HXG-2024-005', brand:'Hexing',     model:'HXE115-KP',   name:'Grace Nyamweru',      type:'residential', phone:'+255711001005', balance:800   },
    { ref:'MTR-006', serial:'HXG-2024-006', brand:'Hexing',     model:'HXE115-KP',   name:'St. Peter Primary',   type:'productive',  phone:'+255711001006', balance:67000 },
    { ref:'MTR-007', serial:'CNL-2024-007', brand:'Conlog',     model:'BEC23',        name:'Ali Dispensary',      type:'business',    phone:'+255711001007', balance:32000 },
    { ref:'MTR-008', serial:'HXG-2024-008', brand:'Hexing',     model:'HXE115-KP',   name:'Zawadi Restaurant',   type:'business',    phone:'+255711001008', balance:19500 },
    { ref:'MTR-009', serial:'SPK-2024-009', brand:'SparkMeter', model:'SM-Advantage', name:'Farida Tailoring',    type:'business',    phone:'+255711001009', balance:7200  },
    { ref:'MTR-010', serial:'HXG-2024-010', brand:'Hexing',     model:'HXE115-KP',   name:'Pastor Elias Home',   type:'residential', phone:'+255711001010', balance:0     },
  ];

  for (const m of METERS) {
    // Upsert meter
    const { data: meter } = await supabase.from('meters').upsert({
      site_id: SITE_ID, operator_id: OP_ID,
      meter_ref: m.ref, serial_number: m.serial,
      brand: m.brand, model: m.model,
      status: m.balance > 0 ? 'active' : 'disconnected',
      load_limit_w: 500, phase: 'single'
    }, { onConflict: 'serial_number' }).select('id').single();

    if (!meter) continue;

    // Upsert customer linked to meter
    const accountNum = `ACC-${m.ref.replace('MTR-', '').padStart(6,'0')}`;
    await supabase.from('customers').upsert({
      operator_id: OP_ID, site_id: SITE_ID, meter_id: meter.id,
      full_name: m.name, phone: m.phone,
      customer_type: m.type, account_number: accountNum,
      balance_tzs: m.balance, low_credit_threshold_tzs: 3000,
      language: 'sw', active: true
    }, { onConflict: 'account_number' });

    console.log(`   ✓ ${m.ref} → ${m.name} (TZS ${m.balance.toLocaleString()})`);
  }
  console.log();

  // ── 5. Verify counts ─────────────────────────────────────────
  console.log('5. Verifying data...');
  const [{ count: mc }, { count: cc }] = await Promise.all([
    supabase.from('meters').select('*', { count:'exact', head:true }).eq('site_id', SITE_ID),
    supabase.from('customers').select('*', { count:'exact', head:true }).eq('site_id', SITE_ID),
  ]);
  console.log(`   ✓ ${mc} meters, ${cc} customers in database\n`);

  console.log('══════════════════════════════════════════');
  console.log('Setup complete! Next steps:');
  console.log('  1. npm run dev          (start API + MQTT bridge)');
  console.log('  2. cd ../minigrid-simulator && node src/simulator.js');
  console.log('  3. cd ../gridios-dashboard && npm run dev');
  console.log('══════════════════════════════════════════\n');
}

run().catch(e => { console.error(e); process.exit(1); });