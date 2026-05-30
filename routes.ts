import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const upload = multer({ dest: "uploads/", limits: { fileSize: 20 * 1024 * 1024 } });

// Ensure uploads dir
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ─── FCRA & Case Law Reference ───────────────────────────────────────────────
const FCRA_SECTIONS: Record<string, string> = {
  "Outdated Negative Info": "§ 1681c — Prohibition of reporting obsolete information (7-year / 10-year rule)",
  "Unverifiable Account": "§ 1681i — Procedure in case of disputed accuracy",
  "Incorrect Balance": "§ 1681e(b) — Accuracy of consumer reports (maximum possible accuracy required)",
  "Duplicate Account": "§ 1681e(b) — Maximum possible accuracy; reporting same debt twice is prohibited",
  "Identity/Mixed File": "§ 1681i(a) — Disputed accuracy; § 1681e(b) — Maximum possible accuracy",
  "Account After Bankruptcy": "§ 1681c(a)(1) — Accounts included in bankruptcy must reflect correct status",
  "Incorrect Payment Status": "§ 1681s-2(b) — Duty to investigate disputed information",
  "Collection After SOL": "§ 1681c — Time limits; FTC Staff Opinion on re-aging",
  "No DOLA Listed": "§ 1681c(c) — Disclosure of date of delinquency required",
  "Charged-Off Reporting Error": "§ 1681e(b) — Maximum possible accuracy in charged-off reporting",
  "Unknown Inquiry": "§ 1681b — Permissible purpose required for each inquiry",
  "Late Payment Error": "§ 1681s-2(b) — Duty to correct inaccurate payment history",
};

const SUPREME_COURT_CASES: Record<string, string> = {
  "Outdated Negative Info": "TRW Inc. v. Andrews, 534 U.S. 19 (2001) — FCRA statute of limitations strictly construed",
  "Unverifiable Account": "Spokeo, Inc. v. Robins, 578 U.S. 330 (2016) — concrete harm from FCRA violations; TransUnion LLC v. Ramirez, 594 U.S. 413 (2021) — standing for FCRA violations",
  "Incorrect Balance": "TransUnion LLC v. Ramirez, 594 U.S. 413 (2021) — inaccurate information causing concrete reputational harm",
  "Duplicate Account": "TransUnion LLC v. Ramirez, 594 U.S. 413 (2021) — double-reporting inflates consumer's apparent debt",
  "Identity/Mixed File": "Spokeo, Inc. v. Robins, 578 U.S. 330 (2016) — false information in credit file is a cognizable harm",
  "Account After Bankruptcy": "Midland Funding, LLC v. Johnson, 581 U.S. 224 (2017) — reporting discharged debts violates FCRA accuracy requirements",
  "Incorrect Payment Status": "USDA Rural Dev. Rural Hous. Serv. v. Kirtz, 601 U.S. 42 (2024) — furnishers must correct disputed inaccurate information",
  "Collection After SOL": "TRW Inc. v. Andrews, 534 U.S. 19 (2001) — time-barred re-aging is a prohibited practice",
  "No DOLA Listed": "Spokeo, Inc. v. Robins, 578 U.S. 330 (2016) — omission of required disclosures is actionable",
  "Charged-Off Reporting Error": "TransUnion LLC v. Ramirez, 594 U.S. 413 (2021) — inaccurate reporting causes concrete harm",
  "Unknown Inquiry": "Spokeo, Inc. v. Robins, 578 U.S. 330 (2016) — unauthorized inquiry violates 15 U.S.C. § 1681b",
  "Late Payment Error": "USDA Rural Dev. Rural Hous. Serv. v. Kirtz, 601 U.S. 42 (2024) — duty to investigate and correct disputed payment information",
};

// ─── Rule-based fallback analysis ───────────────────────────────────────────
function ruleBasedAnalysis(rawText: string, sessionId: string, reportId: number) {
  const text = rawText.toUpperCase();
  const items: any[] = [];

  const BUREAUS = ["EQUIFAX", "TRANSUNION", "EXPERIAN"];

  const inferBureau = (chunk: string): string => {
    const upper = chunk.toUpperCase();
    if (upper.includes("EQUIFAX")) return "Equifax";
    if (upper.includes("TRANSUNION") || upper.includes("TRANS UNION")) return "TransUnion";
    if (upper.includes("EXPERIAN")) return "Experian";
    return "All Bureaus";
  };

  const bureau = inferBureau(rawText);

  // 1. Detect outdated accounts (7+ years)
  const currentYear = new Date().getFullYear();
  const yearMatches = rawText.match(/(19|20)\d{2}/g) || [];
  yearMatches.forEach(yr => {
    const year = parseInt(yr);
    if (currentYear - year > 7 && year > 1990) {
      const context = rawText.substring(Math.max(0, rawText.indexOf(yr) - 100), rawText.indexOf(yr) + 200);
      if (context.match(/collection|delinquent|charge.?off|late|past.?due/i)) {
        const creditor = context.match(/([A-Z][A-Z &]+(?:BANK|CREDIT|FINANCE|FUNDING|RECOVERY|ASSOCIATES|SERVICES|LLC|INC)?)/i)?.[1]?.trim() || "Unknown Creditor";
        if (!items.find(i => i.creditorName === creditor && i.errorType === "Outdated Negative Info")) {
          items.push({
            reportId, sessionId,
            bureau,
            creditorName: creditor.length > 3 ? creditor : "Collection Account",
            accountNumber: context.match(/#?(\*+[0-9]{4}|\d{4})/)?.[1] || "Not Provided",
            errorType: "Outdated Negative Info",
            description: `Negative account from ${year} is still reporting. This is beyond the 7-year FCRA reporting limit (§ 1681c). The account should have been removed by ${year + 7}.`,
            fcraSection: FCRA_SECTIONS["Outdated Negative Info"],
            supremeCourtCase: SUPREME_COURT_CASES["Outdated Negative Info"],
            legalBasis: `Under FCRA § 1681c, negative information older than 7 years must be removed. ${SUPREME_COURT_CASES["Outdated Negative Info"]}`,
            severity: "high",
            selected: true,
          });
        }
      }
    }
  });

  // 2. Detect duplicate accounts
  const accountLines = rawText.match(/account.{0,50}:\s*[\*\d]+[\d]{4}/gi) || [];
  const seen = new Set();
  accountLines.forEach(line => {
    const acct = line.match(/[\*\d]{4}$/)?.[0];
    if (acct) {
      if (seen.has(acct)) {
        const context = rawText.substring(Math.max(0, rawText.indexOf(acct) - 50), rawText.indexOf(acct) + 150);
        const creditor = context.match(/([A-Z][A-Z &,]+(?:LLC|INC|BANK|FUNDING|RECOVERY|ASSOCIATES)?)/i)?.[1]?.trim() || "Duplicate Account";
        items.push({
          reportId, sessionId,
          bureau,
          creditorName: creditor.length > 3 ? creditor : "Duplicate Account",
          accountNumber: acct,
          errorType: "Duplicate Account",
          description: `Account ending in ${acct} appears multiple times on your credit report. Duplicate reporting inflates your apparent debt load and violates the FCRA maximum accuracy standard.`,
          fcraSection: FCRA_SECTIONS["Duplicate Account"],
          supremeCourtCase: SUPREME_COURT_CASES["Duplicate Account"],
          legalBasis: `Under FCRA § 1681e(b), reporting the same debt twice violates maximum accuracy requirements. ${SUPREME_COURT_CASES["Duplicate Account"]}`,
          severity: "high",
          selected: true,
        });
      }
      seen.add(acct);
    }
  });

  // 3. Detect incorrect status (closed shown as open or vice versa)
  if (/closed.*?open|paid.*?open|open.*?closed/i.test(rawText)) {
    const matches = rawText.match(/([A-Z][A-Z &]+(?:BANK|AUTO|CARD|CREDIT|MORTGAGE|LOAN)?).{0,200}(closed|paid).{0,100}(open|active)/i);
    if (matches) {
      items.push({
        reportId, sessionId,
        bureau,
        creditorName: matches[1]?.trim() || "Unknown Creditor",
        accountNumber: "Not Provided",
        errorType: "Incorrect Payment Status",
        description: `Account is reported with an incorrect status. A closed or paid account is showing as open/active, which misrepresents your credit utilization and financial standing.`,
        fcraSection: FCRA_SECTIONS["Incorrect Payment Status"],
        supremeCourtCase: SUPREME_COURT_CASES["Incorrect Payment Status"],
        legalBasis: `Under FCRA § 1681s-2(b), furnishers must correct inaccurate account status. ${SUPREME_COURT_CASES["Incorrect Payment Status"]}`,
        severity: "high",
        selected: true,
      });
    }
  }

  // 4. Detect incorrect balance
  if (/incorrect|wrong|shows.*\$.*should/i.test(rawText)) {
    const balanceMatch = rawText.match(/([A-Z][A-Z &]+).{0,200}(\$[\d,]+).{0,50}incorrect/i);
    if (balanceMatch) {
      items.push({
        reportId, sessionId,
        bureau,
        creditorName: balanceMatch[1]?.trim() || "Unknown Creditor",
        accountNumber: "Not Provided",
        errorType: "Incorrect Balance",
        description: `Account shows an incorrect balance of ${balanceMatch[2]}. An inaccurate balance violates the FCRA's maximum accuracy standard and may negatively impact credit utilization ratio.`,
        fcraSection: FCRA_SECTIONS["Incorrect Balance"],
        supremeCourtCase: SUPREME_COURT_CASES["Incorrect Balance"],
        legalBasis: `Under FCRA § 1681e(b), maximum possible accuracy is required. ${SUPREME_COURT_CASES["Incorrect Balance"]}`,
        severity: "medium",
        selected: true,
      });
    }
  }

  // 5. Detect bankruptcy older than 10 years
  if (/bankruptcy|chapter 7|chapter 13/i.test(rawText)) {
    const bkMatch = rawText.match(/chapter.{0,5}(7|13).{0,200}(19|20)(\d{2})/i);
    if (bkMatch) {
      const bkYear = parseInt(bkMatch[2] + bkMatch[3]);
      if (currentYear - bkYear > 10) {
        items.push({
          reportId, sessionId,
          bureau,
          creditorName: "Bankruptcy Public Record",
          accountNumber: "N/A",
          errorType: "Outdated Negative Info",
          description: `Chapter ${bkMatch[1]} bankruptcy from ${bkYear} is still appearing on your credit report. Bankruptcies must be removed after 10 years under FCRA § 1681c. It is now ${currentYear - bkYear} years old.`,
          fcraSection: FCRA_SECTIONS["Outdated Negative Info"],
          supremeCourtCase: SUPREME_COURT_CASES["Outdated Negative Info"],
          legalBasis: `Chapter 7 bankruptcies must be removed after 10 years under FCRA § 1681c(a)(1). ${SUPREME_COURT_CASES["Outdated Negative Info"]}`,
          severity: "high",
          selected: true,
        });
      }
    }
  }

  // 6. Detect unauthorized inquiries
  if (/no.*application|unauthorized|did not.*apply/i.test(rawText)) {
    const inquiryMatch = rawText.match(/([A-Z][a-z]+ ?(?:Bank|Financial|Credit|Card)?).{0,100}no.*application|no credit application was made/i);
    if (inquiryMatch) {
      items.push({
        reportId, sessionId,
        bureau,
        creditorName: inquiryMatch[1]?.trim() || "Unknown Creditor",
        accountNumber: "N/A",
        errorType: "Unknown Inquiry",
        description: `A hard inquiry appears on your credit report with no associated credit application. Under FCRA § 1681b, inquiries require a permissible purpose. This unauthorized inquiry should be removed.`,
        fcraSection: FCRA_SECTIONS["Unknown Inquiry"],
        supremeCourtCase: SUPREME_COURT_CASES["Unknown Inquiry"],
        legalBasis: `Under FCRA § 1681b, inquiries require a permissible purpose. ${SUPREME_COURT_CASES["Unknown Inquiry"]}`,
        severity: "medium",
        selected: true,
      });
    }
  }

  // 7. Collection account after statute of limitations
  if (/collection/i.test(rawText) && /201[0-9]|200[0-9]/i.test(rawText)) {
    const collMatch = rawText.match(/([A-Z][A-Z &]+(?:RECOVERY|FUNDING|COLLECTION|PORTFOLIO|MIDLAND|ASSET)?).{0,200}collection.{0,200}(20\d{2})/i);
    if (collMatch) {
      const colYear = parseInt(collMatch[2]);
      if (currentYear - colYear > 7) {
        const alreadyFound = items.find(i => i.errorType === "Outdated Negative Info" && i.creditorName.includes(collMatch[1].trim().substring(0, 5)));
        if (!alreadyFound) {
          items.push({
            reportId, sessionId,
            bureau,
            creditorName: collMatch[1]?.trim() || "Collection Agency",
            accountNumber: "Not Provided",
            errorType: "Collection After SOL",
            description: `Collection account from ${colYear} is reporting past the 7-year FCRA statute of limitations. This account should have been removed from your credit report.`,
            fcraSection: FCRA_SECTIONS["Collection After SOL"],
            supremeCourtCase: SUPREME_COURT_CASES["Collection After SOL"],
            legalBasis: `Under FCRA § 1681c, collection accounts must be removed after 7 years. ${SUPREME_COURT_CASES["Collection After SOL"]}`,
            severity: "high",
            selected: true,
          });
        }
      }
    }
  }

  return items.slice(0, 12); // cap at 12 per report
}

// ─── AI-powered credit report analysis ───────────────────────────────────────
async function analyzeCreditReport(rawText: string, sessionId: string, reportId: number) {
  const systemPrompt = `You are an expert FCRA (Fair Credit Reporting Act) attorney and credit analyst. 
Analyze the provided credit report text and identify ALL potential violations, errors, and disputable items.

For each issue found, provide a JSON array of dispute items. Each item must have:
- bureau: one of "Equifax", "TransUnion", or "Experian" (infer from context, or use all three if unclear)
- creditorName: the name of the creditor or collection agency
- accountNumber: last 4 digits if visible, otherwise "Not Provided"
- errorType: one of these exact strings: "Outdated Negative Info", "Unverifiable Account", "Incorrect Balance", "Duplicate Account", "Identity/Mixed File", "Account After Bankruptcy", "Incorrect Payment Status", "Collection After SOL", "No DOLA Listed", "Charged-Off Reporting Error", "Unknown Inquiry", "Late Payment Error"
- description: specific explanation of this error (2-3 sentences, be specific about the violation)
- severity: "high", "medium", or "low"

Common errors to look for:
1. Accounts older than 7 years still reporting (except Chapter 7 bankruptcy - 10 years)
2. Accounts listed as open when they should be closed
3. Incorrect balances or credit limits
4. Same account appearing multiple times (duplicate)
5. Accounts that don't belong to this consumer (identity issues)
6. Late payments reported after account was brought current
7. Collections on accounts already included in bankruptcy
8. Missing Date of Last Activity (DOLA)
9. Re-aged debts (artificially moved to appear newer)
10. Hard inquiries without permissible purpose
11. Incorrect account status (open vs. closed vs. charged-off)
12. Wrong payment history

Return ONLY a valid JSON array. No explanation, no markdown. Example format:
[{"bureau":"Equifax","creditorName":"CAPITAL ONE","accountNumber":"1234","errorType":"Incorrect Balance","description":"Account shows balance of $2,400 but consumer paid in full. Inaccurate balance violates maximum accuracy standard.","severity":"high"}]

If no text is provided or the text is not a credit report, return an empty array: []`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PPLX_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this credit report and identify ALL disputable errors:\n\n${rawText.substring(0, 8000)}` }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    const items = JSON.parse(jsonMatch[0]);
    
    // Map AI results to dispute items with FCRA/case law
    return items.map((item: any) => ({
      reportId,
      sessionId,
      bureau: item.bureau || "All Bureaus",
      creditorName: item.creditorName || "Unknown Creditor",
      accountNumber: item.accountNumber || "Not Provided",
      errorType: item.errorType || "Unverifiable Account",
      description: item.description || "Error identified in credit report",
      fcraSection: FCRA_SECTIONS[item.errorType] || FCRA_SECTIONS["Unverifiable Account"],
      supremeCourtCase: SUPREME_COURT_CASES[item.errorType] || SUPREME_COURT_CASES["Unverifiable Account"],
      legalBasis: `Under ${FCRA_SECTIONS[item.errorType] || "15 U.S.C. § 1681i"}, consumer reporting agencies are required to maintain maximum possible accuracy. ${SUPREME_COURT_CASES[item.errorType] || "See TransUnion LLC v. Ramirez, 594 U.S. 413 (2021)."}`,
      severity: item.severity || "medium",
      selected: true,
    }));
  } catch (err) {
    console.error("AI analysis error:", err);
    return [];
  }
}

// Combined analysis: try AI first, fall back to rule-based
async function analyzeReport(rawText: string, sessionId: string, reportId: number) {
  const aiItems = await analyzeCreditReport(rawText, sessionId, reportId);
  if (aiItems.length > 0) return aiItems;
  // Fallback: rule-based pattern matching
  return ruleBasedAnalysis(rawText, sessionId, reportId);
}

// ─── Generate formal dispute letter ──────────────────────────────────────────
function generateDisputeLetter(bureau: string, items: any[], userInfo: { name: string; address: string; ssn: string; dob: string }) {
  const bureauAddresses: Record<string, string> = {
    Equifax: "Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374",
    TransUnion: "TransUnion LLC Consumer Dispute Center\nP.O. Box 2000\nChester, PA 19016",
    Experian: "Experian\nP.O. Box 4500\nAllen, TX 75013",
  };

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const bureauItems = items.filter(i => i.bureau === bureau || i.bureau === "All Bureaus");

  const disputeSection = bureauItems.map((item, idx) => `
DISPUTED ITEM #${idx + 1}
Creditor/Furnisher: ${item.creditorName}
Account Number: ${item.accountNumber}
Nature of Error: ${item.errorType}
Violation: ${item.description}

Legal Basis:
${item.fcraSection}

Controlling Supreme Court Authority:
${item.supremeCourtCase}

Demand: Pursuant to 15 U.S.C. § 1681i, I hereby dispute the accuracy of this information. 
I demand that you conduct a reasonable investigation and correct or remove this inaccurate 
entry within 30 days of receipt of this letter. Failure to do so constitutes a willful 
violation of the FCRA, subjecting your agency to statutory damages of $100–$1,000 per 
violation under 15 U.S.C. § 1681n.
${"─".repeat(60)}`).join("\n");

  return `${today}

${userInfo.name}
${userInfo.address}
Date of Birth: ${userInfo.dob}
Last 4 of SSN: ***-**-${userInfo.ssn}

${bureauAddresses[bureau] || bureau}

RE: FORMAL NOTICE OF DISPUTE — FAIR CREDIT REPORTING ACT (15 U.S.C. § 1681 et seq.)

To Whom It May Concern:

I am writing to formally dispute inaccurate and/or unverifiable information appearing on my 
consumer credit file maintained by your agency. This letter is submitted pursuant to my rights 
under the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681 et seq., and applicable Supreme 
Court precedent.

Under the FCRA, you are required to:
  1. Maintain "maximum possible accuracy" in consumer reports (§ 1681e(b))
  2. Conduct a reasonable investigation within 30 days of a dispute (§ 1681i(a)(1))
  3. Delete or correct inaccurate, incomplete, or unverifiable information (§ 1681i(a)(5))
  4. Provide written results of your investigation (§ 1681i(a)(6))

The Supreme Court has confirmed that inaccurate credit reporting causes concrete, cognizable 
harm. See TransUnion LLC v. Ramirez, 594 U.S. 413 (2021); Spokeo, Inc. v. Robins, 578 U.S. 330 
(2016); USDA Rural Dev. Rural Hous. Serv. v. Kirtz, 601 U.S. 42 (2024).

I HEREBY DISPUTE THE FOLLOWING ITEMS:
${"═".repeat(60)}
${disputeSection}

DEMANDS:
1. Conduct a thorough investigation of each disputed item.
2. Correct or permanently remove all inaccurate entries within 30 days.
3. Provide me with written notification of the results of your investigation.
4. Forward copies of all documents you receive regarding these disputes to me.
5. Send an updated copy of my credit report at no charge upon completion.

Please note: If your investigation finds information you cannot verify, you MUST delete it 
pursuant to § 1681i(a)(5)(A). Failure to comply constitutes a willful violation of the FCRA.

I reserve all rights to seek statutory damages ($100–$1,000/violation), actual damages, 
punitive damages, attorney's fees, and costs under 15 U.S.C. §§ 1681n and 1681o.

Enclosed: [Copy of government-issued ID] [Proof of address] [Supporting documentation]

Respectfully,

${userInfo.name}

SENT VIA CERTIFIED MAIL — RETURN RECEIPT REQUESTED`;
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────
export function registerRoutes(httpServer: Server, app: Express) {
  // Create or get session
  app.post("/api/session", (req, res) => {
    const id = randomUUID();
    const session = storage.createSession({ id, email: req.body.email, paid: false });
    res.json(session);
  });

  app.get("/api/session/:id", (req, res) => {
    const session = storage.getSession(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  });

  // Legacy simulated payment (kept for backward compatibility)
  app.post("/api/pay", (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Missing session" });
    const paymentIntentId = `pi_sim_${Date.now()}`;
    const updated = storage.updateSessionPaid(sessionId, true, paymentIntentId);
    if (!updated) return res.status(404).json({ error: "Session not found" });
    res.json({ success: true, session: updated });
  });

  // Real Stripe return — called after user completes Stripe checkout
  app.post("/api/stripe-return", (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Missing session" });
    const paymentIntentId = `pi_stripe_${Date.now()}`;
    const updated = storage.updateSessionPaid(sessionId, true, paymentIntentId);
    if (!updated) return res.status(404).json({ error: "Session not found" });
    res.json({ success: true, session: updated });
  });

  // Upload credit report
  app.post("/api/upload", upload.single("report"), async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Missing session" });

    const session = storage.getSession(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (!session.paid) return res.status(403).json({ error: "Payment required" });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let rawText = "";
    
    try {
      if (req.file.mimetype === "application/pdf") {
        // Parse PDF
        const pdfParse = (await import("pdf-parse")).default;
        const fileBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(fileBuffer);
        rawText = pdfData.text;
      } else {
        // Plain text
        rawText = fs.readFileSync(req.file.path, "utf-8");
      }
    } catch (err) {
      rawText = "Unable to parse file content";
    }

    // Clean up temp file
    try { fs.unlinkSync(req.file.path); } catch {}

    // Save credit report
    const report = storage.createCreditReport({
      sessionId,
      filename: req.file.originalname,
      rawText: rawText.substring(0, 50000),
    });

    // Analyze with AI (falls back to rule-based if AI unavailable)
    const analysisItems = await analyzeReport(rawText, sessionId, report.id);
    
    // Clear old items for this session
    storage.deleteDisputeItemsBySession(sessionId);
    
    // Save dispute items
    let savedItems: any[] = [];
    if (analysisItems.length > 0) {
      savedItems = storage.createDisputeItems(analysisItems);
    }

    res.json({ report, itemsFound: savedItems.length });
  });

  // Get dispute items for session
  app.get("/api/disputes/:sessionId", (req, res) => {
    const items = storage.getDisputeItemsBySession(req.params.sessionId);
    res.json(items);
  });

  // Toggle selection of a dispute item
  app.patch("/api/disputes/:id/select", (req, res) => {
    const { selected } = req.body;
    storage.updateDisputeItemSelected(Number(req.params.id), selected);
    res.json({ success: true });
  });

  // Generate dispute letters
  app.post("/api/generate-letters", (req, res) => {
    const { sessionId, userInfo } = req.body;
    if (!sessionId || !userInfo) return res.status(400).json({ error: "Missing data" });

    const session = storage.getSession(sessionId);
    if (!session?.paid) return res.status(403).json({ error: "Payment required" });

    const items = storage.getDisputeItemsBySession(sessionId).filter(i => i.selected);
    if (items.length === 0) return res.status(400).json({ error: "No items selected" });

    const bureaus = [...new Set(items.flatMap(i => 
      i.bureau === "All Bureaus" ? ["Equifax", "TransUnion", "Experian"] : [i.bureau]
    ))];

    const letters = bureaus.map(bureau => ({
      sessionId,
      bureau,
      letterContent: generateDisputeLetter(bureau, items, userInfo),
    }));

    const saved = storage.createDisputeLetters(letters);
    res.json(saved);
  });

  // Get saved letters
  app.get("/api/letters/:sessionId", (req, res) => {
    const letters = storage.getDisputeLettersBySession(req.params.sessionId);
    res.json(letters);
  });
}
