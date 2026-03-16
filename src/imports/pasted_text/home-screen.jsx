// ============================================================
// screens/HomeScreen.jsx
// ============================================================
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { syncAll, isOnline } from '../services/sync.js';
import { getPendingPayments } from '../db/localDB.js';

export function HomeScreen({ navigation }) {
  const [online, setOnline]       = useState(null);
  const [syncing, setSyncing]     = useState(false);
  const [pendingCount, setPending] = useState(0);
  const [lastSync, setLastSync]   = useState(null);

  useEffect(() => {
    const check = async () => {
      setOnline(await isOnline());
      const p = await getPendingPayments();
      setPending(p.length);
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncAll('agent-001', 'site-tz-001');
    setSyncing(false);
    if (result.success) {
      setLastSync(new Date().toLocaleTimeString());
      const p = await getPendingPayments();
      setPending(p.length);
    }
  };

  return (
    <ScrollView style={s.container}>
      {/* Status bar */}
      <View style={[s.statusBar, { backgroundColor: online ? '#064e3b' : '#450a0a' }]}>
        <View style={[s.dot, { backgroundColor: online ? '#34d399' : '#f87171' }]} />
        <Text style={s.statusText}>{online ? 'Online — synced' : 'Offline mode'}</Text>
        {pendingCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>

      <View style={s.pad}>
        <Text style={s.greeting}>Habari, Agent</Text>
        <Text style={s.sub}>Ukerewe Island · Nansio Feeder</Text>

        {/* Main actions */}
        <View style={s.grid}>
          <TouchableOpacity style={[s.card, s.primary]}
            onPress={() => navigation.navigate('CollectPayment')}>
            <Text style={s.cardIcon}>💵</Text>
            <Text style={s.cardTitle}>Collect Payment</Text>
            <Text style={s.cardSub}>Cash or confirm mobile money</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.card, s.secondary]}
            onPress={() => navigation.navigate('IssueToken')}>
            <Text style={s.cardIcon}>⚡</Text>
            <Text style={s.cardTitle}>Issue Token</Text>
            <Text style={s.cardSub}>Generate & deliver STS token</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.card, s.neutral]}
            onPress={() => navigation.navigate('Customers')}>
            <Text style={s.cardIcon}>👥</Text>
            <Text style={s.cardTitle}>Customers</Text>
            <Text style={s.cardSub}>View & search customer list</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.card, s.neutral]}
            onPress={() => navigation.navigate('Inspection')}>
            <Text style={s.cardIcon}>🔍</Text>
            <Text style={s.cardTitle}>Site Inspection</Text>
            <Text style={s.cardSub}>Log meter check & photos</Text>
          </TouchableOpacity>
        </View>

        {/* Sync button */}
        <TouchableOpacity
          style={[s.syncBtn, (!online || syncing) && s.syncDisabled]}
          onPress={handleSync}
          disabled={!online || syncing}>
          {syncing
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.syncText}>
                {pendingCount > 0 ? `Sync ${pendingCount} pending record(s)` : 'Sync with server'}
              </Text>
          }
        </TouchableOpacity>
        {lastSync && <Text style={s.lastSync}>Last sync: {lastSync}</Text>}
      </View>
    </ScrollView>
  );
}


// ============================================================
// screens/CollectPaymentScreen.jsx
// ============================================================
import { TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { savePendingPayment } from '../db/localDB.js';
import { isOnline, syncAll } from '../services/sync.js';
import { getCachedCustomers } from '../db/localDB.js';

export function CollectPaymentScreen({ navigation }) {
  const [phone, setPhone]         = useState('');
  const [amount, setAmount]       = useState('');
  const [method, setMethod]       = useState('cash');
  const [customer, setCustomer]   = useState(null);
  const [loading, setLoading]     = useState(false);

  const lookupCustomer = async () => {
    const customers = await getCachedCustomers('site-tz-001');
    const found = customers.find(c => c.phone.includes(phone.replace('+255','0')));
    if (found) setCustomer(found);
    else Alert.alert('Hajapatikana', `Mteja mwenye nambari ${phone} hajapatikana.`);
  };

  const submitPayment = async () => {
    if (!customer || !amount || parseFloat(amount) < 500) {
      Alert.alert('Tafadhali', 'Weka kiasi sahihi (angalau TZS 500)');
      return;
    }
    setLoading(true);
    const id = uuidv4();
    await savePendingPayment({
      id,
      customer_id:   customer.id,
      meter_ref:     customer.meter_ref,
      customer_name: customer.full_name,
      amount_tzs:    parseFloat(amount),
      method,
      collected_by:  'agent-001',
    });

    const online = await isOnline();
    if (online) {
      await syncAll('agent-001', 'site-tz-001');
      Alert.alert('✓ Imefanikiwa', `Malipo ya TZS ${parseFloat(amount).toLocaleString()} yamehifadhiwa na kuunganishwa.`,
        [{ text: 'Sawa', onPress: () => navigation.goBack() }]);
    } else {
      Alert.alert('Imehifadhiwa (Offline)', `Malipo yataunganishwa unapopata mtandao.\nID: ${id.slice(0,8)}`,
        [{ text: 'Sawa', onPress: () => navigation.goBack() }]);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <ScrollView style={s.pad}>
        <Text style={s.label}>Nambari ya simu ya mteja</Text>
        <View style={s.row}>
          <TextInput style={[s.input, { flex: 1 }]} value={phone} onChangeText={setPhone}
            placeholder="+255 7XX XXX XXX" keyboardType="phone-pad" placeholderTextColor="#475569"/>
          <TouchableOpacity style={s.lookupBtn} onPress={lookupCustomer}>
            <Text style={s.lookupText}>Tafuta</Text>
          </TouchableOpacity>
        </View>

        {customer && (
          <View style={s.customerCard}>
            <Text style={s.customerName}>{customer.full_name}</Text>
            <Text style={s.customerMeta}>Mita: {customer.meter_ref} · Salio: TZS {customer.balance_tzs?.toLocaleString()}</Text>
          </View>
        )}

        <Text style={[s.label, { marginTop: 20 }]}>Kiasi (TZS)</Text>
        <TextInput style={s.input} value={amount} onChangeText={setAmount}
          placeholder="5000" keyboardType="numeric" placeholderTextColor="#475569"/>

        <Text style={[s.label, { marginTop: 20 }]}>Njia ya malipo</Text>
        <View style={s.methodRow}>
          {['cash','mpesa','airtel','tigocash'].map(m => (
            <TouchableOpacity key={m} style={[s.methodBtn, method === m && s.methodActive]}
              onPress={() => setMethod(m)}>
              <Text style={[s.methodText, method === m && s.methodTextActive]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]}
          onPress={submitPayment} disabled={loading}>
          <Text style={s.submitText}>{loading ? 'Inawasiliana...' : 'Hifadhi Malipo'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


// ============================================================
// screens/CustomersScreen.jsx
// ============================================================
export function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    getCachedCustomers('site-tz-001').then(setCustomers);
  }, []);

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.meter_ref.includes(search)
  );

  return (
    <View style={s.container}>
      <TextInput style={[s.input, s.pad, { margin: 16 }]}
        value={search} onChangeText={setSearch}
        placeholder="Tafuta jina, simu au mita..." placeholderTextColor="#475569"/>
      <ScrollView>
        {filtered.map(c => (
          <TouchableOpacity key={c.id} style={s.customerRow}
            onPress={() => navigation.navigate('CollectPayment', { customer: c })}>
            <View style={[s.avatar, { backgroundColor: c.balance_tzs <= 0 ? '#450a0a' : '#064e3b' }]}>
              <Text style={s.avatarText}>{c.full_name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.customerName}>{c.full_name}</Text>
              <Text style={s.customerMeta}>{c.meter_ref} · {c.phone}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.balance, c.balance_tzs <= 0 ? { color: '#f87171' } : c.balance_tzs < 3000 ? { color: '#fbbf24' } : {}]}>
                TZS {c.balance_tzs?.toLocaleString()}
              </Text>
              <Text style={s.customerMeta}>{c.customer_type}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}


// ─── Shared styles ────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#080f1e' },
  pad:          { paddingHorizontal: 16, paddingTop: 16 },
  statusBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingHorizontal: 16 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  statusText:   { color: '#d1fae5', fontSize: 13, flex: 1 },
  badge:        { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:    { color: '#fff', fontSize: 11 },
  greeting:     { fontSize: 24, fontWeight: '600', color: '#f1f5f9', marginBottom: 4 },
  sub:          { fontSize: 13, color: '#64748b', marginBottom: 24 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card:         { width: '47%', borderRadius: 14, padding: 16, gap: 6 },
  primary:      { backgroundColor: '#064e3b' },
  secondary:    { backgroundColor: '#172554' },
  neutral:      { backgroundColor: '#1e293b' },
  cardIcon:     { fontSize: 24 },
  cardTitle:    { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  cardSub:      { fontSize: 12, color: '#94a3b8' },
  syncBtn:      { backgroundColor: '#10b981', borderRadius: 12, padding: 16, alignItems: 'center' },
  syncDisabled: { backgroundColor: '#1e293b' },
  syncText:     { color: '#fff', fontWeight: '600', fontSize: 15 },
  lastSync:     { textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 8 },
  label:        { color: '#94a3b8', fontSize: 13, marginBottom: 8, fontWeight: '500' },
  input:        { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, color: '#f1f5f9', fontSize: 15, borderWidth: 0.5, borderColor: '#334155' },
  row:          { flexDirection: 'row', gap: 8 },
  lookupBtn:    { backgroundColor: '#10b981', borderRadius: 10, padding: 14, justifyContent: 'center' },
  lookupText:   { color: '#fff', fontWeight: '600' },
  customerCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#10b981' },
  customerName: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  customerMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  methodRow:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  methodBtn:    { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 0.5, borderColor: '#334155' },
  methodActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  methodText:   { color: '#94a3b8', fontSize: 13 },
  methodTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn:    { backgroundColor: '#10b981', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 32 },
  submitText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  customerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#1e293b' },
  avatar:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  balance:      { color: '#34d399', fontWeight: '600', fontSize: 14 },
});
