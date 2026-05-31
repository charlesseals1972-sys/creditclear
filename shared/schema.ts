import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users / sessions
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  email: text("email"),
  paid: integer("paid", { mode: "boolean" }).default(false),
  paymentIntentId: text("payment_intent_id"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({ createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Credit report uploads
export const creditReports = sqliteTable("credit_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").references(() => sessions.id),
  filename: text("filename").notNull(),
  rawText: text("raw_text"),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }),
});

export const insertCreditReportSchema = createInsertSchema(creditReports).omit({ uploadedAt: true });
export type InsertCreditReport = z.infer<typeof insertCreditReportSchema>;
export type CreditReport = typeof creditReports.$inferSelect;

// Dispute items found
export const disputeItems = sqliteTable("dispute_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportId: integer("report_id").references(() => creditReports.id),
  sessionId: text("session_id").references(() => sessions.id),
  bureau: text("bureau").notNull(), // "Equifax" | "TransUnion" | "Experian"
  creditorName: text("creditor_name").notNull(),
  accountNumber: text("account_number"),
  errorType: text("error_type").notNull(),
  description: text("description").notNull(),
  fcraSection: text("fcra_section").notNull(),
  supremeCourtCase: text("supreme_court_case"),
  legalBasis: text("legal_basis").notNull(),
  severity: text("severity").notNull(), // "high" | "medium" | "low"
  selected: integer("selected", { mode: "boolean" }).default(true),
});

export const insertDisputeItemSchema = createInsertSchema(disputeItems).omit({});
export type InsertDisputeItem = z.infer<typeof insertDisputeItemSchema>;
export type DisputeItem = typeof disputeItems.$inferSelect;

// Generated dispute letters
export const disputeLetters = sqliteTable("dispute_letters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").references(() => sessions.id),
  bureau: text("bureau").notNull(),
  letterContent: text("letter_content").notNull(),
  generatedAt: integer("generated_at", { mode: "timestamp" }),
});

export const insertDisputeLetterSchema = createInsertSchema(disputeLetters).omit({ generatedAt: true });
export type InsertDisputeLetter = z.infer<typeof insertDisputeLetterSchema>;
export type DisputeLetter = typeof disputeLetters.$inferSelect;
