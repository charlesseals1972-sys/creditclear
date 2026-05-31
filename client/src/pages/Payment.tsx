import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { setSession } from "@/lib/sessionStore";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield, CheckCircle2, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/5kQ14oaMx9f054T58ofw400";

export default function Payment() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Check if returning from Stripe with ?paid=true&session=<id>
  useEffect(() => {
    const params = new URLSearchParams(search);
    const paid = params.get("paid");
    const sessionId = params.get("session");
    const returnEmail = params.get("email") || "";
    const returnName = params.get("name") || "";

    if (paid === "true" && sessionId) {
      setVerifying(true);
      // Mark session as paid on the backend
      apiRequest("POST", "/api/stripe-return", { sessionId })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setSession(sessionId, returnEmail, returnName);
            toast({ title: "Payment confirmed!", description: "Redirecting to upload…" });
            setTimeout(() => setLocation("/upload"), 1000);
          } else {
            setVerifying(false);
            toast({ title: "Could not verify payment", description: "Please contact support.", variant: "destructive" });
          }
        })
        .catch(() => {
          setVerifying(false);
          toast({ title: "Verification error", description: "Please try again.", variant: "destructive" });
        });
    }
  }, [search]);

  const sessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/session", { email });
      return res.json();
    },
  });

  const handlePay = async () => {
    if (!email || !name) {
      toast({ title: "Missing fields", description: "Please enter your name and email.", variant: "destructive" });
      return;
    }

    try {
      setRedirecting(true);
      const session = await sessionMutation.mutateAsync();

      // Build return URL — Stripe will redirect back here after payment
      const base = window.location.origin + window.location.pathname;
      const returnUrl = `${base}?paid=true&session=${session.id}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;

      // Redirect to Stripe payment link with prefill + return URL
      const stripeUrl = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(email)}&client_reference_id=${session.id}&success_url=${encodeURIComponent(returnUrl)}`;
      window.location.href = stripeUrl;
    } catch {
      setRedirecting(false);
      toast({ title: "Error", description: "Could not start checkout. Please try again.", variant: "destructive" });
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Verifying payment…</h2>
          <p className="text-muted-foreground">Just a moment, setting up your session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <svg aria-label="CreditClear" viewBox="0 0 40 40" width="28" height="28" fill="none">
              <rect width="40" height="40" rx="8" fill="hsl(var(--primary))"/>
              <path d="M20 8C13.373 8 8 13.373 8 20s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8z" fill="none" stroke="white" strokeWidth="2"/>
              <path d="M15 20l3.5 3.5L25 16" stroke="hsl(var(--secondary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>CreditClear</span>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-0">
            {[
              { label: "Payment", num: "1", active: true, done: false },
              { label: "Upload Report", num: "2", active: false, done: false },
              { label: "Review Errors", num: "3", active: false, done: false },
              { label: "Get Letters", num: "4", active: false, done: false },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step.done ? "step-done" : step.active ? "step-active" : "step-pending"}`}>
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                  </div>
                  <span className={`text-xs hidden sm:block ${step.active ? "text-primary font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
                {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-border mx-2 mb-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Complete Your Purchase</h1>
            <p className="text-muted-foreground">One-time payment of <span className="font-bold text-foreground">$20</span> — get all three bureau dispute letters</p>
          </div>

          <Card className="border border-border shadow-md">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="w-4 h-4 text-green-600" />
                Secure Checkout — Powered by Stripe
              </CardTitle>
              <CardDescription>You'll be redirected to Stripe's secure payment page</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-base font-semibold gap-2"
                onClick={handlePay}
                disabled={redirecting || sessionMutation.isPending}
              >
                {redirecting ? "Redirecting to Stripe…" : (
                  <>
                    Pay $20 — Secure Stripe Checkout
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 pt-2">
                {[
                  { icon: <Lock className="w-3 h-3" />, text: "256-bit SSL" },
                  { icon: <Shield className="w-3 h-3" />, text: "Powered by Stripe" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                    {item.icon}
                    {item.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What's included */}
          <Card className="mt-4 border border-border/50">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-foreground mb-3">What's included:</div>
              <div className="space-y-2">
                {[
                  "AI analysis of your full credit report",
                  "Dispute letters for Equifax, TransUnion & Experian",
                  "FCRA citations (§ 1681i, § 1681e(b), § 1681c)",
                  "Supreme Court case references",
                  "Professional, certified-mail-ready format",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
