import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileSearch, Mail, CheckCircle2, Scale, BookOpen, AlertTriangle, Star } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 dark:bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg aria-label="CreditClear" viewBox="0 0 40 40" width="36" height="36" fill="none">
              <rect width="40" height="40" rx="8" fill="hsl(var(--primary))"/>
              <path d="M20 8C13.373 8 8 13.373 8 20s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8z" fill="none" stroke="white" strokeWidth="2"/>
              <path d="M15 20l3.5 3.5L25 16" stroke="hsl(var(--secondary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>CreditClear</span>
          </div>
          <Button data-testid="btn-start-header" onClick={() => setLocation("/pay")} className="bg-primary hover:bg-primary/90">
            Get Started — $20
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="mb-6 bg-secondary/20 text-secondary-foreground border-secondary/30" variant="outline">
          FCRA + Supreme Court Precedent
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
          Fight Credit Report Errors<br />With the Law on Your Side
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your credit report. Our AI instantly scans for FCRA violations and generates
          professional dispute letters citing exact law and Supreme Court cases — ready to mail 
          to Equifax, TransUnion, and Experian.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button data-testid="btn-start-hero" size="lg" onClick={() => setLocation("/pay")} className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-base">
            Start for $20
          </Button>
          <Button size="lg" variant="outline" className="px-10 py-6 text-base"
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
            See How It Works
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">One-time fee. No subscriptions. All 3 bureau letters included.</p>
      </section>

      {/* Trust bar */}
      <section className="border-y border-border bg-muted/30 py-6">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: <Shield className="w-5 h-5" />, label: "FCRA Compliant" },
              { icon: <Scale className="w-5 h-5" />, label: "Supreme Court Citations" },
              { icon: <FileSearch className="w-5 h-5" />, label: "AI-Powered Analysis" },
              { icon: <Mail className="w-5 h-5" />, label: "Mail-Ready Letters" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="text-primary">{item.icon}</div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-4">Three Steps to Clean Credit</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">No lawyers needed. No confusing paperwork. Just upload and we handle the rest.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              icon: <FileSearch className="w-6 h-6" />,
              title: "Upload Your Report",
              desc: "Upload your credit report PDF or paste the text. We accept reports from all three bureaus.",
            },
            {
              step: "02",
              icon: <Scale className="w-6 h-6" />,
              title: "AI Finds Every Error",
              desc: "Our AI scans for all FCRA violations — outdated accounts, wrong balances, duplicates, unauthorized inquiries, and more.",
            },
            {
              step: "03",
              icon: <Mail className="w-6 h-6" />,
              title: "Get Your Dispute Letters",
              desc: "Download professional letters for each bureau, citing exact FCRA sections and Supreme Court cases. Print and mail.",
            },
          ].map((item) => (
            <Card key={item.step} className="border border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-muted-foreground mb-1">STEP {item.step}</div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FCRA Section */}
      <section className="bg-primary/5 border-y border-primary/10 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Backed by Federal Law & Supreme Court</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Every dispute letter we generate cites the exact FCRA statute and relevant Supreme Court decisions, 
                putting bureaus on legal notice that they must investigate or face statutory damages.
              </p>
              <div className="space-y-3">
                {[
                  "15 U.S.C. § 1681i — Right to dispute inaccurate information",
                  "15 U.S.C. § 1681e(b) — Maximum possible accuracy requirement",
                  "15 U.S.C. § 1681c — 7-year reporting time limit",
                  "TransUnion v. Ramirez (2021) — Concrete harm standard",
                  "USDA v. Kirtz (2024) — Furnisher duty to investigate",
                  "Spokeo v. Robins (2016) — FCRA violations are actionable",
                ].map((law, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground font-mono">{law}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="border border-primary/20 bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Sample Dispute Letter Excerpt</span>
                </div>
                <div className="text-xs font-mono text-muted-foreground leading-relaxed space-y-2 bg-muted/50 rounded p-4">
                  <p className="font-semibold text-foreground">RE: FORMAL NOTICE OF DISPUTE — FCRA</p>
                  <p className="mt-2">I hereby dispute Account #****1234 with CAPITAL ONE. Under 15 U.S.C. § 1681e(b), you are required to maintain maximum possible accuracy...</p>
                  <p>The balance reported ($2,400) is inaccurate. See TransUnion LLC v. Ramirez, 594 U.S. 413 (2021), which confirmed that inaccurate credit reporting constitutes concrete harm...</p>
                  <p>You have 30 days to investigate and correct this entry. Failure constitutes a willful FCRA violation, subject to $100–$1,000 statutory damages per 15 U.S.C. § 1681n.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What we find */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Errors We Detect & Dispute</h2>
          <p className="text-muted-foreground">Common violations that bureaus must investigate under the FCRA</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "⏰", title: "Outdated Negative Info", desc: "Accounts reporting past the 7-year (or 10-year bankruptcy) limit" },
            { icon: "💰", title: "Incorrect Balances", desc: "Wrong balance, credit limit, or payment amounts reported" },
            { icon: "🔁", title: "Duplicate Accounts", desc: "Same debt appearing multiple times, inflating your apparent debt" },
            { icon: "👤", title: "Identity/Mixed Files", desc: "Accounts or information belonging to another person" },
            { icon: "📋", title: "Wrong Account Status", desc: "Paid accounts still showing as open or delinquent" },
            { icon: "🔍", title: "Unauthorized Inquiries", desc: "Hard pulls made without permissible purpose under FCRA § 1681b" },
            { icon: "📅", title: "Re-Aged Debts", desc: "Artificially moved dates to reset the 7-year reporting clock" },
            { icon: "⚖️", title: "Post-Bankruptcy Errors", desc: "Discharged accounts incorrectly showing as owed" },
            { icon: "❌", title: "Missing DOLA", desc: "Date of Last Activity missing, violating § 1681c(c) disclosure rules" },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div>
                <div className="font-medium text-sm text-foreground">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-primary py-16 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, One-Time Pricing</h2>
          <p className="text-primary-foreground/80 mb-8">Everything you need to dispute errors at all three bureaus</p>
          <Card className="bg-white dark:bg-card max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="text-5xl font-bold text-foreground mb-2">$20</div>
              <div className="text-sm text-muted-foreground mb-6">One-time · No subscription</div>
              <div className="space-y-3 text-left mb-8">
                {[
                  "AI-powered full credit report analysis",
                  "Letters for all 3 bureaus (Equifax, TransUnion, Experian)",
                  "FCRA section citations in every letter",
                  "Supreme Court case law references",
                  "Professional, mail-ready format",
                  "Unlimited downloads",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Button data-testid="btn-start-pricing" size="lg" onClick={() => setLocation("/pay")} className="w-full bg-primary hover:bg-primary/90 text-white py-6">
                Get Started Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg aria-label="CreditClear" viewBox="0 0 40 40" width="24" height="24" fill="none">
              <rect width="40" height="40" rx="8" fill="hsl(var(--primary))"/>
              <path d="M20 8C13.373 8 8 13.373 8 20s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8z" fill="none" stroke="white" strokeWidth="2"/>
              <path d="M15 20l3.5 3.5L25 16" stroke="hsl(var(--secondary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-semibold">CreditClear</span>
          </div>
          <p className="mb-2">CreditClear provides informational dispute letters based on FCRA law. This is not legal advice. Consult an attorney for legal counsel.</p>
          <p className="text-xs">© {new Date().getFullYear()} CreditClear. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
