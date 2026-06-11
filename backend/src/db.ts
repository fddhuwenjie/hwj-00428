import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'contracts.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initTables()
  }
  return db
}

function initTables(): void {
  const d = getDb()

  d.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      variables TEXT NOT NULL,
      usage_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      template_id TEXT,
      variables TEXT,
      current_version TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deadline TEXT,
      signed_at TEXT,
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    CREATE TABLE IF NOT EXISTS contract_versions (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      version TEXT NOT NULL,
      content TEXT NOT NULL,
      title TEXT NOT NULL,
      modified_at TEXT NOT NULL,
      modified_by TEXT NOT NULL,
      summary TEXT NOT NULL,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS signing_flows (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL UNIQUE,
      mode TEXT NOT NULL,
      current_step INTEGER,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS signers (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL,
      signature_image TEXT,
      signed_at TEXT,
      rejected_reason TEXT,
      order_index INTEGER NOT NULL,
      delegate_info TEXT,
      delegated_to TEXT,
      FOREIGN KEY (flow_id) REFERENCES signing_flows(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      operator TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      ip TEXT,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    );
  `)
}

export function resetDb(): void {
  const d = getDb()
  d.exec(`
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS reminders;
    DROP TABLE IF EXISTS signers;
    DROP TABLE IF EXISTS signing_flows;
    DROP TABLE IF EXISTS contract_versions;
    DROP TABLE IF EXISTS contracts;
    DROP TABLE IF EXISTS templates;
  `)
  db = null
  getDb()
}
