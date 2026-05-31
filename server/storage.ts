import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  sessions, creditReports, disputeItems, disputeLetters,
  type Session, type InsertSession,
  type CreditReport, type InsertCreditReport,
  type DisputeItem, type InsertDisputeItem,
  type DisputeLetter, type InsertDisputeLetter,
} from "@shared/schema";

const sqlite = new Database("data.db");
export const db = drizzle(sqlite, { schema });

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    email TEXT,
    paid INTEGER DEFAULT 0,
    payment_intent_id TEXT,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS credit_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES sessions(id),
    filename TEXT NOT NULL,
    raw_text TEXT,
    uploaded_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS dispute_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER REFERENCES credit_reports(id),
    session_id TEXT REFERENCES sessions(id),
    bureau TEXT NOT NULL,
    creditor_name TEXT NOT NULL,
    account_number TEXT,
    error_type TEXT NOT NULL,
    description TEXT NOT NULL,
    fcra_section TEXT NOT NULL,
    supreme_court_case TEXT,
    legal_basis TEXT NOT NULL,
    severity TEXT NOT NULL,
    selected INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS dispute_letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES sessions(id),
    bureau TEXT NOT NULL,
    letter_content TEXT NOT NULL,
    generated_at INTEGER
  );
`);

export interface IStorage {
  // Sessions
  getSession(id: string): Session | undefined;
  createSession(data: InsertSession): Session;
  updateSessionPaid(id: string, paid: boolean, paymentIntentId?: string): Session | undefined;

  // Credit Reports
  createCreditReport(data: InsertCreditReport): CreditReport;
  getCreditReport(id: number): CreditReport | undefined;
  getCreditReportBySession(sessionId: string): CreditReport | undefined;

  // Dispute Items
  createDisputeItems(items: InsertDisputeItem[]): DisputeItem[];
  getDisputeItemsBySession(sessionId: string): DisputeItem[];
  updateDisputeItemSelected(id: number, selected: boolean): void;
  deleteDisputeItemsBySession(sessionId: string): void;

  // Dispute Letters
  createDisputeLetters(letters: InsertDisputeLetter[]): DisputeLetter[];
  getDisputeLettersBySession(sessionId: string): DisputeLetter[];
}

export class Storage implements IStorage {
  getSession(id: string): Session | undefined {
    return db.select().from(sessions).where(eq(sessions.id, id)).get();
  }

  createSession(data: InsertSession): Session {
    return db.insert(sessions).values({ ...data, createdAt: new Date() }).returning().get();
  }

  updateSessionPaid(id: string, paid: boolean, paymentIntentId?: string): Session | undefined {
    return db.update(sessions)
      .set({ paid, paymentIntentId })
      .where(eq(sessions.id, id))
      .returning().get();
  }

  createCreditReport(data: InsertCreditReport): CreditReport {
    return db.insert(creditReports).values({ ...data, uploadedAt: new Date() }).returning().get();
  }

  getCreditReport(id: number): CreditReport | undefined {
    return db.select().from(creditReports).where(eq(creditReports.id, id)).get();
  }

  getCreditReportBySession(sessionId: string): CreditReport | undefined {
    return db.select().from(creditReports).where(eq(creditReports.sessionId, sessionId)).get();
  }

  createDisputeItems(items: InsertDisputeItem[]): DisputeItem[] {
    if (items.length === 0) return [];
    return db.insert(disputeItems).values(items).returning().all();
  }

  getDisputeItemsBySession(sessionId: string): DisputeItem[] {
    return db.select().from(disputeItems).where(eq(disputeItems.sessionId, sessionId)).all();
  }

  updateDisputeItemSelected(id: number, selected: boolean): void {
    db.update(disputeItems).set({ selected }).where(eq(disputeItems.id, id)).run();
  }

  deleteDisputeItemsBySession(sessionId: string): void {
    db.delete(disputeItems).where(eq(disputeItems.sessionId, sessionId)).run();
  }

  createDisputeLetters(letters: InsertDisputeLetter[]): DisputeLetter[] {
    if (letters.length === 0) return [];
    return db.insert(disputeLetters).values(letters.map(l => ({ ...l, generatedAt: new Date() }))).returning().all();
  }

  getDisputeLettersBySession(sessionId: string): DisputeLetter[] {
    return db.select().from(disputeLetters).where(eq(disputeLetters.sessionId, sessionId)).all();
  }
}

export const storage = new Storage();
