/**
 * GridOS Agent — Local SQLite Database
 * Offline-first: all operations write locally first, sync when online.
 *
 * Tables:
 *   pending_payments  — cash collections waiting to sync
 *   token_vault       — pre-generated tokens for offline issuance
 *   customers_cache   — local copy of site customers
 *   sync_log          — audit trail of sync operations
 */

import * as SQLite from 'expo-sqlite';

let db;

export async function initDB() {
  db = await SQLite.openDatabaseAsync('gridios_agent.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS pending_payments (
      id            TEXT PRIMARY KEY,
      customer_id   TEXT NOT NULL,
      meter_ref     TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      amount_tzs    REAL NOT NULL,
      method        TEXT NOT NULL DEFAULT 'cash',
      collected_by  TEXT NOT NULL,
      collected_at  TEXT NOT NULL,
      synced        INTEGER NOT NULL DEFAULT 0,
      sync_error    TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS token_vault (
      id            TEXT PRIMARY KEY,
      customer_id   TEXT NOT NULL,
      meter_ref     TEXT NOT NULL,
      token_value   TEXT NOT NULL UNIQUE,
      amount_tzs    REAL NOT NULL,
      energy_kwh    REAL NOT NULL,
      issued        INTEGER NOT NULL DEFAULT 0,
      issued_at     TEXT,
      synced        INTEGER NOT NULL DEFAULT 0,
      expires_at    TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers_cache (
      id            TEXT PRIMARY KEY,
      meter_ref     TEXT NOT NULL,
      full_name     TEXT NOT NULL,
      phone         TEXT NOT NULL,
      customer_type TEXT NOT NULL,
      balance_tzs   REAL NOT NULL DEFAULT 0,
      site_id       TEXT NOT NULL,
      last_synced   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      operation     TEXT NOT NULL,
      status        TEXT NOT NULL,
      records_synced INTEGER DEFAULT 0,
      error         TEXT,
      synced_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

// ─── Payments ────────────────────────────────────────────────
export async function savePendingPayment({ id, customer_id, meter_ref, customer_name, amount_tzs, method, collected_by }) {
  await db.runAsync(
    `INSERT INTO pending_payments (id, customer_id, meter_ref, customer_name, amount_tzs, method, collected_by, collected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, customer_id, meter_ref, customer_name, amount_tzs, method, collected_by]
  );
}

export async function getPendingPayments() {
  return db.getAllAsync(`SELECT * FROM pending_payments WHERE synced = 0 ORDER BY created_at DESC`);
}

export async function markPaymentSynced(id) {
  await db.runAsync(`UPDATE pending_payments SET synced = 1 WHERE id = ?`, [id]);
}

// ─── Token vault ─────────────────────────────────────────────
export async function getAvailableToken(customer_id) {
  return db.getFirstAsync(
    `SELECT * FROM token_vault WHERE customer_id = ? AND issued = 0 AND synced = 0 ORDER BY created_at ASC LIMIT 1`,
    [customer_id]
  );
}

export async function markTokenIssued(id) {
  await db.runAsync(
    `UPDATE token_vault SET issued = 1, issued_at = datetime('now') WHERE id = ?`,
    [id]
  );
}

export async function bulkInsertTokens(tokens) {
  for (const t of tokens) {
    await db.runAsync(
      `INSERT OR IGNORE INTO token_vault (id, customer_id, meter_ref, token_value, amount_tzs, energy_kwh, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.customer_id, t.meter_ref, t.token_value, t.amount_tzs, t.energy_kwh, t.expires_at]
    );
  }
}

// ─── Customers cache ─────────────────────────────────────────
export async function getCachedCustomers(site_id) {
  return db.getAllAsync(`SELECT * FROM customers_cache WHERE site_id = ? ORDER BY full_name`, [site_id]);
}

export async function upsertCustomers(customers) {
  for (const c of customers) {
    await db.runAsync(
      `INSERT OR REPLACE INTO customers_cache (id, meter_ref, full_name, phone, customer_type, balance_tzs, site_id, last_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [c.id, c.meters?.meter_ref || '', c.full_name, c.phone, c.customer_type, c.balance_tzs, c.site_id]
    );
  }
}

export async function getCustomerByPhone(phone) {
  return db.getFirstAsync(`SELECT * FROM customers_cache WHERE phone = ?`, [phone]);
}

// ─── Sync log ─────────────────────────────────────────────────
export async function logSync(operation, status, records_synced = 0, error = null) {
  await db.runAsync(
    `INSERT INTO sync_log (operation, status, records_synced, error) VALUES (?, ?, ?, ?)`,
    [operation, status, records_synced, error]
  );
}
