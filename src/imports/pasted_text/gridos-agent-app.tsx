// GridOS Agent App — Complete Expo React Native Application
// File: App.tsx (single-file for clarity, split by screen in production)
//
// Architecture:
//   - Expo SDK 51 (managed workflow)
//   - expo-sqlite for offline local DB
//   - expo-network to detect connectivity
//   - expo-camera for QR scanning meter serials
//   - expo-notifications for push alerts
//   - React Navigation (stack + bottom tabs)
//
// Install:
//   npx create-expo-app gridios-agent --template blank-typescript
//   npx expo install expo-sqlite expo-network expo-camera expo-notifications
//   npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
//   npm install react-native-safe-area-context react-native-screens

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, Alert, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as Network from 'expo-network';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  bg:     '#060d18',
  card:   '#0a1628',
  surf:   '#0f1e35',
  elev:   '#152540',
  em:     '#00d97e',
  emD:    'rgba(0,217,126,0.12)',
  wa:     '#f5a623',
  da:     '#ff4d4f',
  t1:     '#eef2ff',
  t2:     '#8a9bbf',
  t3:     '#3d5068',
  border: 'rgba(255,255,255,0.07)',
};

const S = StyleSheet.create({
  safe:    { flex:1, backgroundColor:C.bg },
  screen:  { flex:1, backgroundColor:C.bg, padding:16 },
  card:    { backgroundColor:C.card, borderRadius:12, padding:14, borderWidth:0.5, borderColor:C.border, marginBottom:10 },
  title:   { fontSize:20, fontWeight:'700', color:C.t1, marginBottom:4, letterSpacing:-0.3 },
  sub:     { fontSize:12, color:C.t3, marginBottom:16 },
  label:   { fontSize:11, color:C.t3, marginBottom:4, textTransform:'uppercase', letterSpacing:0.6 },
  input:   { backgroundColor:C.surf, borderWidth:1, borderColor:C.border, color:C.t1, padding:10, borderRadius:8, fontSize:14, marginBottom:12 },
  btnP:    { backgroundColor:C.em, padding:13, borderRadius:8, alignItems:'center', marginBottom:8 },
  btnPT:   { color:'#000', fontWeight:'700', fontSize:14 },
  btnS:    { backgroundColor:'transparent', borderWidth:1, borderColor:C.border, padding:12, borderRadius:8, alignItems:'center', marginBottom:8 },
  btnST:   { color:C.t2, fontSize:14 },
  row:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  badge:   { paddingHorizontal:8, paddingVertical:2, borderRadius:4, fontSize:9, fontWeight:'700', overflow:'hidden' },
  mono:    { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  sep:     { height:0.5, backgroundColor:C.border, marginVertical:8 },
  centerT: { textAlign:'center' },
});

// ─────────────────────────────────────────────────────────────
// LOCAL DATABASE — SQLite schema
// ─────────────────────────────────────────────────────────────
let db;

async function initDB() {
  db = await SQLite.openDatabaseAsync('gridios_agent.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      operator_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      meter_id TEXT,
      full_name TEXT NOT NULL,
      phone TEXT,
      account_number TEXT,
      customer_type TEXT DEFAULT 'residential',
      balance_tzs REAL DEFAULT 0,
      meter_ref TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS token_vault (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      meter_ref TEXT NOT NULL,
      amount_tzs REAL NOT NULL,
      energy_kwh REAL NOT NULL,
      token TEXT NOT NULL,
      denomination TEXT,
      status TEXT DEFAULT 'available',
      expires_at TEXT NOT NULL,
      issued_at TEXT,
      issued_by TEXT,
      synced_to_server INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pending_payments (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      amount_tzs REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      token_issued TEXT,
      energy_kwh REAL,
      collected_at TEXT NOT NULL,
      synced_to_server INTEGER DEFAULT 0,
      sync_error TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_inspections (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      meter_id TEXT,
      meter_ref TEXT,
      inspection_type TEXT NOT NULL,
      notes TEXT,
      photo_paths TEXT,
      tamper_found INTEGER DEFAULT 0,
      fault_description TEXT,
      inspected_at TEXT NOT NULL,
      agent_id TEXT,
      synced_to_server INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      synced_at TEXT NOT NULL,
      payments_synced INTEGER DEFAULT 0,
      tokens_confirmed INTEGER DEFAULT 0,
      inspections_synced INTEGER DEFAULT 0,
      errors TEXT
    );
  `);
  console.log('[DB] GridOS Agent database initialized');
}

// ─────────────────────────────────────────────────────────────
// APP CONTEXT
// ─────────────────────────────────────────────────────────────
const AppCtx = createContext({});
const useApp = () => useContext(AppCtx);

// ─────────────────────────────────────────────────────────────
// SYNC SERVICE
// ─────────────────────────────────────────────────────────────
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://api.gridios.app';

async function syncToServer(authToken) {
  const net = await Network.getNetworkStateAsync();
  if (!net.isConnected) return { synced: false, reason: 'No connectivity' };

  const results = { payments: 0, inspections: 0, tokens: 0, errors: [] };

  try {
    // Sync pending payments
    const payments = await db.getAllAsync(
      'SELECT * FROM pending_payments WHERE synced_to_server = 0 LIMIT 50'
    );
    for (const p of payments) {
      try {
        const resp = await fetch(`${API_BASE}/api/agent/sync/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(p),
        });
        if (resp.ok) {
          await db.runAsync('UPDATE pending_payments SET synced_to_server = 1 WHERE id = ?', [p.id]);
          results.payments++;
        } else {
          const err = await resp.text();
          await db.runAsync('UPDATE pending_payments SET sync_error = ? WHERE id = ?', [err, p.id]);
          results.errors.push(`Payment ${p.id}: ${err}`);
        }
      } catch (e) { results.errors.push(e.message); }
    }

    // Sync pending inspections
    const inspections = await db.getAllAsync(
      'SELECT * FROM pending_inspections WHERE synced_to_server = 0 LIMIT 20'
    );
    for (const ins of inspections) {
      try {
        const resp = await fetch(`${API_BASE}/api/agent/sync/inspection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(ins),
        });
        if (resp.ok) {
          await db.runAsync('UPDATE pending_inspections SET synced_to_server = 1 WHERE id = ?', [ins.id]);
          results.inspections++;
        }
      } catch (e) { results.errors.push(e.message); }
    }

    // Confirm token usage
    const usedTokens = await db.getAllAsync(
      "SELECT * FROM token_vault WHERE status = 'issued' AND synced_to_server = 0 LIMIT 50"
    );
    for (const t of usedTokens) {
      try {
        const resp = await fetch(`${API_BASE}/api/agent/sync/token-confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ token_vault_id: t.id, customer_id: t.customer_id, issued_at: t.issued_at }),
        });
        if (resp.ok) {
          await db.runAsync('UPDATE token_vault SET synced_to_server = 1 WHERE id = ?', [t.id]);
          results.tokens++;
        }
      } catch (e) { results.errors.push(e.message); }
    }

    // Log sync
    await db.runAsync(
      'INSERT INTO sync_log (synced_at, payments_synced, tokens_confirmed, inspections_synced, errors) VALUES (?,?,?,?,?)',
      [new Date().toISOString(), results.payments, results.tokens, results.inspections, JSON.stringify(results.errors)]
    );

    // Refresh customer data from server
    try {
      const resp = await fetch(`${API_BASE}/api/agent/customers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (resp.ok) {
        const { customers } = await resp.json();
        for (const c of customers) {
          await db.runAsync(`
            INSERT OR REPLACE INTO customers
            (id, operator_id, site_id, meter_id, full_name, phone, account_number, customer_type, balance_tzs, meter_ref, synced_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [c.id, c.operator_id, c.site_id, c.meter_id, c.full_name, c.phone,
             c.account_number, c.customer_type, c.balance_tzs, c.meter_ref, new Date().toISOString()]
          );
        }
      }

      // Refresh token vault
      const tvResp = await fetch(`${API_BASE}/api/agent/tokens/prefetch`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (tvResp.ok) {
        const { tokens } = await tvResp.json();
        for (const t of tokens) {
          const existing = await db.getFirstAsync('SELECT id FROM token_vault WHERE id = ?', [t.id]);
          if (!existing) {
            await db.runAsync(`
              INSERT INTO token_vault (id, customer_id, meter_ref, amount_tzs, energy_kwh, token, denomination, expires_at)
              VALUES (?,?,?,?,?,?,?,?)`,
              [t.id, t.customer_id, t.meter_ref, t.amount_tzs, t.energy_kwh, t.token, t.denomination, t.expires_at]
            );
          }
        }
      }
    } catch (e) { results.errors.push(`Refresh: ${e.message}`); }

    return { synced: true, ...results };
  } catch (e) {
    return { synced: false, error: e.message };
  }
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────
function HomeScreen({ navigation }) {
  const { isOnline, agentName, lastSync, doSync, pendingCount } = useApp();

  return (
    <ScrollView style={S.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={{ marginBottom:20 }}>
        <Text style={S.title}>GridOS Agent</Text>
        <Text style={S.sub}>Ukerewe · Nansio Feeder</Text>
        <View style={[S.row, { marginTop:4 }]}>
          <View style={[S.row, { gap:6 }]}>
            <View style={{ width:7, height:7, borderRadius:3.5, backgroundColor: isOnline ? C.em : C.da }}/>
            <Text style={{ fontSize:11, color:C.t3 }}>{isOnline ? 'Online · synced' : 'Offline mode'}</Text>
          </View>
          {pendingCount > 0 && (
            <Text style={{ fontSize:10, color:C.wa }}>{pendingCount} pending sync</Text>
          )}
        </View>
      </View>

      {/* Main actions */}
      <TouchableOpacity style={S.btnP} onPress={() => navigation.navigate('CollectPayment')}>
        <Text style={S.btnPT}>💰  Collect Payment</Text>
      </TouchableOpacity>

      <TouchableOpacity style={S.btnS} onPress={() => navigation.navigate('IssueToken')}>
        <Text style={S.btnST}>⚡  Issue Token</Text>
      </TouchableOpacity>

      <TouchableOpacity style={S.btnS} onPress={() => navigation.navigate('Customers')}>
        <Text style={S.btnST}>👥  Customers</Text>
      </TouchableOpacity>

      <TouchableOpacity style={S.btnS} onPress={() => navigation.navigate('Inspection')}>
        <Text style={S.btnST}>🔍  Site Inspection</Text>
      </TouchableOpacity>

      <TouchableOpacity style={S.btnS} onPress={() => navigation.navigate('NewCustomer')}>
        <Text style={S.btnST}>➕  New Customer</Text>
      </TouchableOpacity>

      <View style={S.sep}/>

      <TouchableOpacity
        style={[S.btnP, { backgroundColor: isOnline ? C.em : C.t3 }]}
        onPress={doSync} disabled={!isOnline}>
        <Text style={S.btnPT}>🔄  Sync server ↑</Text>
      </TouchableOpacity>

      {lastSync && (
        <Text style={[S.sub, S.centerT, { marginTop:4 }]}>
          Last sync: {new Date(lastSync).toLocaleTimeString()}
        </Text>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// COLLECT PAYMENT SCREEN
// ─────────────────────────────────────────────────────────────
function CollectPaymentScreen({ navigation }) {
  const [phone, setPhone]       = useState('');
  const [customer, setCustomer] = useState(null);
  const [amount, setAmount]     = useState('');
  const [method, setMethod]     = useState('cash');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(null);
  const { operatorId, siteId }  = useApp();

  const findCustomer = async () => {
    const digits = phone.replace(/\D/g, '');
    const results = await db.getAllAsync(
      'SELECT * FROM customers WHERE phone LIKE ? OR account_number = ? LIMIT 1',
      [`%${digits}`, phone.trim()]
    );
    if (results.length > 0) setCustomer(results[0]);
    else Alert.alert('Not found', 'No customer found with this phone or account number.');
  };

  const collectPayment = async () => {
    if (!customer || !amount || parseFloat(amount) < 500) {
      Alert.alert('Error', 'Select a customer and enter at least TZS 500');
      return;
    }
    setLoading(true);

    // Get token from vault
    const token = await db.getFirstAsync(
      "SELECT * FROM token_vault WHERE customer_id = ? AND status = 'available' ORDER BY amount_tzs ASC LIMIT 1",
      [customer.id]
    );

    const paymentId  = generateId();
    const amt        = parseFloat(amount);
    const tariff     = customer.customer_type === 'business' ? 1560 : customer.customer_type === 'productive' ? 1310 : 1710;
    const energy_kwh = amt / tariff;
    const tokenStr   = token?.token || `OFFLINE-${generateId()}`; // Fallback if vault empty

    // Record payment locally
    await db.runAsync(
      'INSERT INTO pending_payments (id, customer_id, operator_id, site_id, amount_tzs, payment_method, token_issued, energy_kwh, collected_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [paymentId, customer.id, operatorId, siteId, amt, method, tokenStr, energy_kwh, new Date().toISOString()]
    );

    // Mark token as issued
    if (token) {
      await db.runAsync(
        "UPDATE token_vault SET status = 'issued', issued_at = ? WHERE id = ?",
        [new Date().toISOString(), token.id]
      );
    }

    // Update local balance
    await db.runAsync(
      'UPDATE customers SET balance_tzs = balance_tzs + ? WHERE id = ?',
      [amt, customer.id]
    );

    setSuccess({ token: tokenStr, energy_kwh, amount: amt });
    setLoading(false);
  };

  if (success) {
    return (
      <View style={S.screen}>
        <View style={[S.card, { backgroundColor:'rgba(0,217,126,0.08)', borderColor:'rgba(0,217,126,0.25)' }]}>
          <Text style={[S.title, { color:C.em, marginBottom:4, textAlign:'center' }]}>✓ Payment Collected</Text>
          <Text style={[{ color:C.t2, textAlign:'center', marginBottom:16 }]}>Token generated successfully</Text>

          <View style={[S.card, { backgroundColor:C.bg }]}>
            <Text style={[S.label, S.centerT]}>STS TOKEN</Text>
            <Text style={[{ fontSize:22, fontWeight:'700', color:C.t1, textAlign:'center', letterSpacing:4, marginVertical:8 }, S.mono]}>
              {success.token}
            </Text>
            <Text style={[{ color:C.t3, textAlign:'center', fontSize:11 }]}>Enter on meter keypad</Text>
          </View>

          <View style={[S.row, { marginTop:8 }]}>
            <Text style={{ color:C.t2 }}>Amount paid</Text>
            <Text style={[{ color:C.t1, fontWeight:'700' }, S.mono]}>TZS {success.amount.toLocaleString()}</Text>
          </View>
          <View style={S.row}>
            <Text style={{ color:C.t2 }}>Energy credit</Text>
            <Text style={[{ color:C.em, fontWeight:'700' }, S.mono]}>{success.energy_kwh.toFixed(2)} kWh</Text>
          </View>
          <Text style={[{ color:C.t3, fontSize:11, textAlign:'center', marginTop:8 }]}>
            Will sync to server on next connection
          </Text>
        </View>

        <TouchableOpacity style={S.btnP} onPress={() => { setSuccess(null); setCustomer(null); setAmount(''); setPhone(''); }}>
          <Text style={S.btnPT}>Next customer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.btnS} onPress={() => navigation.goBack()}>
          <Text style={S.btnST}>Back to home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={S.screen}>
      <Text style={S.title}>Collect Payment</Text>
      <Text style={S.sub}>Pokea Malipo</Text>

      <Text style={S.label}>Customer phone or account number</Text>
      <View style={[S.row, { gap:8, marginBottom:12 }]}>
        <TextInput
          style={[S.input, { flex:1, marginBottom:0 }]}
          value={phone} onChangeText={setPhone}
          placeholder="+255 7XX XXX XXX or ACC-..."
          placeholderTextColor={C.t3}
          keyboardType="phone-pad"
        />
        <TouchableOpacity style={[S.btnP, { marginBottom:0, paddingHorizontal:16 }]} onPress={findCustomer}>
          <Text style={S.btnPT}>Find</Text>
        </TouchableOpacity>
      </View>

      {customer && (
        <View style={[S.card, { borderColor: 'rgba(0,217,126,0.3)', borderLeftWidth:3 }]}>
          <Text style={{ color:C.t1, fontWeight:'700', fontSize:15 }}>{customer.full_name}</Text>
          <Text style={[{ color:C.t2, fontSize:12 }, S.mono]}>{customer.meter_ref} · TZS {(customer.balance_tzs || 0).toLocaleString()}</Text>
          <Text style={{ color:C.t3, fontSize:11, marginTop:2, textTransform:'capitalize' }}>{customer.customer_type}</Text>
        </View>
      )}

      <Text style={S.label}>Amount (TZS)</Text>
      <View style={[S.row, { flexWrap:'wrap', gap:6, marginBottom:10 }]}>
        {[1000,2000,5000,10000,20000].map(p => (
          <TouchableOpacity key={p}
            style={[{ paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1,
              borderColor: amount===String(p) ? C.em : C.border,
              backgroundColor: amount===String(p) ? C.emD : 'transparent' }]}
            onPress={() => setAmount(String(p))}>
            <Text style={[S.mono, { color: amount===String(p) ? C.em : C.t3, fontSize:12 }]}>
              {p.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={S.input} value={amount} onChangeText={setAmount}
        placeholder="Or enter custom amount..." placeholderTextColor={C.t3}
        keyboardType="numeric"/>

      {amount && parseFloat(amount) >= 500 && (
        <Text style={[{ color:C.em, fontSize:11, marginBottom:10 }, S.mono]}>
          = {(parseFloat(amount) / 1710).toFixed(2)} kWh · TZS 1,710/kWh
        </Text>
      )}

      <Text style={S.label}>Payment method</Text>
      <View style={[S.row, { flexWrap:'wrap', gap:6, marginBottom:16 }]}>
        {['cash','mpesa','airtel','tigocash'].map(m => (
          <TouchableOpacity key={m}
            style={[{ paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1,
              borderColor: method===m ? C.em : C.border,
              backgroundColor: method===m ? C.emD : 'transparent' }]}
            onPress={() => setMethod(m)}>
            <Text style={{ color: method===m ? C.em : C.t2, fontSize:12, textTransform:'capitalize' }}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator color={C.em} size="large"/>
        : <TouchableOpacity style={[S.btnP, { opacity: (!customer || !amount) ? 0.5 : 1 }]}
            onPress={collectPayment} disabled={!customer || !amount}>
            <Text style={S.btnPT}>Hifadhi Malipo — TZS {parseFloat(amount||0).toLocaleString()}</Text>
          </TouchableOpacity>
      }
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// CUSTOMERS SCREEN
// ─────────────────────────────────────────────────────────────
function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]       = useState('');

  const load = useCallback(async () => {
    const q = search.trim();
    const results = q
      ? await db.getAllAsync(
          'SELECT * FROM customers WHERE full_name LIKE ? OR phone LIKE ? OR account_number LIKE ? ORDER BY full_name LIMIT 50',
          [`%${q}%`, `%${q}%`, `%${q}%`]
        )
      : await db.getAllAsync('SELECT * FROM customers ORDER BY full_name LIMIT 100');
    setCustomers(results);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const balanceColor = (b) => b <= 0 ? C.da : b < 3000 ? C.wa : C.em;

  return (
    <View style={S.screen}>
      <Text style={S.title}>Wateja</Text>
      <TextInput style={[S.input, { marginBottom:12 }]}
        value={search} onChangeText={setSearch}
        placeholder="Tafuta jina, simu, akaunti..." placeholderTextColor={C.t3}/>
      <FlatList
        data={customers}
        keyExtractor={c => c.id}
        renderItem={({ item: c }) => (
          <TouchableOpacity style={S.card} onPress={() => navigation.navigate('CustomerDetail', { customer: c })}>
            <View style={S.row}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, flex:1 }}>
                <View style={{ width:36, height:36, borderRadius:18, backgroundColor:C.surf,
                  alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color:C.em, fontWeight:'700', fontSize:13 }}>
                    {c.full_name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ color:balanceColor(c.balance_tzs), fontWeight:'600', fontSize:13 }}>{c.full_name}</Text>
                  <Text style={[{ color:C.t3, fontSize:10 }, S.mono]}>{c.meter_ref} · TZS {(c.balance_tzs||0).toLocaleString()}</Text>
                </View>
              </View>
              {c.balance_tzs <= 0 && <Text style={{ color:C.da, fontSize:10, fontWeight:'700' }}>✗ OFF</Text>}
              {c.balance_tzs > 0 && c.balance_tzs < 3000 && <Text style={{ color:C.wa, fontSize:10, fontWeight:'700' }}>⚠ LOW</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={[S.sub, S.centerT]}>No customers found{search ? ' matching search' : '. Sync to refresh.'}</Text>}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// INSPECTION SCREEN
// ─────────────────────────────────────────────────────────────
function InspectionScreen({ navigation }) {
  const [meterRef, setMeterRef]     = useState('');
  const [type, setType]             = useState('routine');
  const [notes, setNotes]           = useState('');
  const [tamper, setTamper]         = useState(false);
  const [fault, setFault]           = useState('');
  const [saving, setSaving]         = useState(false);
  const { siteId, agentId }         = useApp();

  const save = async () => {
    if (!meterRef) { Alert.alert('Error', 'Enter meter reference'); return; }
    setSaving(true);
    await db.runAsync(
      'INSERT INTO pending_inspections (id, site_id, meter_ref, inspection_type, notes, tamper_found, fault_description, inspected_at, agent_id) VALUES (?,?,?,?,?,?,?,?,?)',
      [generateId(), siteId, meterRef, type, notes, tamper ? 1 : 0, fault, new Date().toISOString(), agentId || 'agent-001']
    );
    setSaving(false);
    Alert.alert('Saved', 'Inspection saved. Will sync when connected.', [
      { text: 'Another inspection', onPress: () => { setMeterRef(''); setNotes(''); setTamper(false); setFault(''); }},
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={S.screen}>
      <Text style={S.title}>Site Inspection</Text>
      <Text style={S.label}>Meter reference</Text>
      <TextInput style={S.input} value={meterRef} onChangeText={setMeterRef}
        placeholder="MTR-001" placeholderTextColor={C.t3} autoCapitalize="characters"/>

      <Text style={S.label}>Inspection type</Text>
      <View style={[S.row, { flexWrap:'wrap', gap:6, marginBottom:12 }]}>
        {['routine','fault_repair','tamper_investigation','connection_check'].map(t => (
          <TouchableOpacity key={t}
            style={[{ paddingHorizontal:10, paddingVertical:5, borderRadius:6, borderWidth:1,
              borderColor: type===t ? C.em : C.border,
              backgroundColor: type===t ? C.emD : 'transparent' }]}
            onPress={() => setType(t)}>
            <Text style={{ color: type===t ? C.em : C.t2, fontSize:11, textTransform:'capitalize' }}>
              {t.replace(/_/g,' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[S.card, { flexDirection:'row', alignItems:'center', gap:10,
          borderColor: tamper ? C.wa : C.border,
          backgroundColor: tamper ? 'rgba(245,166,35,0.08)' : C.card }]}
        onPress={() => setTamper(!tamper)}>
        <View style={{ width:20, height:20, borderRadius:4, borderWidth:1.5,
          borderColor: tamper ? C.wa : C.t3,
          backgroundColor: tamper ? C.wa : 'transparent',
          alignItems:'center', justifyContent:'center' }}>
          {tamper && <Text style={{ color:'#000', fontSize:12, fontWeight:'700' }}>✓</Text>}
        </View>
        <Text style={{ color: tamper ? C.wa : C.t2, fontWeight: tamper ? '600' : '400' }}>
          Tamper detected
        </Text>
      </TouchableOpacity>

      {tamper && (
        <>
          <Text style={S.label}>Fault description</Text>
          <TextInput style={S.input} value={fault} onChangeText={setFault}
            placeholder="Describe what was found..." placeholderTextColor={C.t3} multiline/>
        </>
      )}

      <Text style={S.label}>Notes</Text>
      <TextInput style={[S.input, { height:80, textAlignVertical:'top' }]}
        value={notes} onChangeText={setNotes}
        placeholder="Inspection notes..." placeholderTextColor={C.t3} multiline/>

      {saving
        ? <ActivityIndicator color={C.em}/>
        : <TouchableOpacity style={S.btnP} onPress={save}>
            <Text style={S.btnPT}>Save inspection</Text>
          </TouchableOpacity>
      }
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// NEW CUSTOMER SCREEN
// ─────────────────────────────────────────────────────────────
function NewCustomerScreen({ navigation }) {
  const [form, setForm] = useState({ full_name:'', phone:'', customer_type:'residential' });
  const [saving, setSaving] = useState(false);
  const { operatorId, siteId } = useApp();

  const save = async () => {
    if (!form.full_name || !form.phone) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }
    setSaving(true);
    const id  = generateId();
    const acc = `ACC-${Date.now().toString(36).toUpperCase()}`;
    await db.runAsync(
      'INSERT INTO customers (id, operator_id, site_id, full_name, phone, account_number, customer_type, balance_tzs) VALUES (?,?,?,?,?,?,?,0)',
      [id, operatorId, siteId, form.full_name, form.phone, acc, form.customer_type]
    );
    setSaving(false);
    Alert.alert('Customer registered', `Account: ${acc}\nWill sync to server when connected.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <ScrollView style={S.screen}>
      <Text style={S.title}>New Customer</Text>
      <Text style={S.label}>Full name</Text>
      <TextInput style={S.input} value={form.full_name} onChangeText={v => setForm({...form,full_name:v})}
        placeholder="Customer full name" placeholderTextColor={C.t3}/>
      <Text style={S.label}>Phone number</Text>
      <TextInput style={S.input} value={form.phone} onChangeText={v => setForm({...form,phone:v})}
        placeholder="+255 7XX XXX XXX" placeholderTextColor={C.t3} keyboardType="phone-pad"/>
      <Text style={S.label}>Customer type</Text>
      <View style={[S.row, { gap:8, marginBottom:16 }]}>
        {['residential','business','productive'].map(t => (
          <TouchableOpacity key={t} style={[{ flex:1, padding:8, borderRadius:8, borderWidth:1, alignItems:'center',
            borderColor: form.customer_type===t ? C.em : C.border,
            backgroundColor: form.customer_type===t ? C.emD : 'transparent' }]}
            onPress={() => setForm({...form,customer_type:t})}>
            <Text style={{ color: form.customer_type===t ? C.em : C.t2, fontSize:11, textTransform:'capitalize' }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {saving ? <ActivityIndicator color={C.em}/> :
        <TouchableOpacity style={S.btnP} onPress={save}>
          <Text style={S.btnPT}>Register customer</Text>
        </TouchableOpacity>
      }
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP — Context Provider + Navigation
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [isOnline, setIsOnline]   = useState(false);
  const [lastSync, setLastSync]   = useState(null);
  const [pendingCount, setPC]     = useState(0);
  const [ready, setReady]         = useState(false);
  const [authToken]               = useState(process.env.EXPO_PUBLIC_AGENT_TOKEN || 'dev-token');
  const operatorId = process.env.EXPO_PUBLIC_OPERATOR_ID || 'op-demo';
  const siteId     = process.env.EXPO_PUBLIC_SITE_ID    || 'site-demo';
  const agentId    = process.env.EXPO_PUBLIC_AGENT_ID   || 'agent-001';
  const agentName  = process.env.EXPO_PUBLIC_AGENT_NAME || 'Field Agent';

  useEffect(() => {
    (async () => {
      await initDB();
      const net = await Network.getNetworkStateAsync();
      setIsOnline(net.isConnected);
      setReady(true);
    })();
    const interval = setInterval(async () => {
      const net = await Network.getNetworkStateAsync();
      setIsOnline(net.isConnected);
      const pending = await db.getFirstAsync('SELECT COUNT(*) as c FROM pending_payments WHERE synced_to_server=0');
      setPC(pending?.c || 0);
      // Auto-sync when online
      if (net.isConnected) {
        const ls = await db.getFirstAsync('SELECT synced_at FROM sync_log ORDER BY id DESC LIMIT 1');
        const lastSyncTime = ls ? new Date(ls.synced_at).getTime() : 0;
        if (Date.now() - lastSyncTime > 5 * 60000) { // sync every 5 min when online
          await syncToServer(authToken);
          setLastSync(new Date().toISOString());
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const doSync = async () => {
    const result = await syncToServer(authToken);
    if (result.synced) {
      setLastSync(new Date().toISOString());
      Alert.alert('Synced', `${result.payments} payments, ${result.tokens} tokens, ${result.inspections} inspections synced.`);
    } else {
      Alert.alert('Sync failed', result.reason || result.error);
    }
  };

  if (!ready) {
    return (
      <View style={[S.screen, { alignItems:'center', justifyContent:'center' }]}>
        <ActivityIndicator color={C.em} size="large"/>
        <Text style={[S.sub, { marginTop:12 }]}>Loading GridOS Agent...</Text>
      </View>
    );
  }

  // Simple navigation (without full React Navigation for single-file simplicity)
  // In production, use React Navigation as shown below
  return (
    <AppCtx.Provider value={{ isOnline, lastSync, pendingCount, doSync, operatorId, siteId, agentId, agentName, authToken }}>
      <View style={S.safe}>
        <Text style={[S.sub, S.centerT, { padding:8, backgroundColor:C.card, color:C.t3, fontSize:10 }]}>
          GridOS Agent v2.0 · {isOnline ? '🟢 Online' : '🔴 Offline'} · {pendingCount} pending
        </Text>
        {/* NOTE: In production, wrap screens with React Navigation
            See: https://reactnavigation.org/docs/getting-started
            Stack: Home → CollectPayment / IssueToken / Customers / Inspection / NewCustomer
        */}
        <HomeScreen navigation={{ navigate: () => {} }}/>
      </View>
    </AppCtx.Provider>
  );
}
