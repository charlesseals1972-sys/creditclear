import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Download, Mail, Printer, Copy, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { DisputeLetter } from "@shared/schema";
import { getSessionId } from "@/lib/sessionStore";

const BUREAU_ADDRESSES: Record<string, string[]> = {
  Equifax: ["Equifax Information Services LLC", "P.O. Box 740256", "Atlanta, GA 30374"],
  TransUnion: ["TransUnion LLC Consumer Dispute Center", "P.O. Box 2000", "Chester, PA 19016"],
  Experian: ["Experian", "P.O. Box 4500", "Allen, TX 75013"],
};

const BUREAU_COLORS: Record<string, string> = {
  Equifax: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  TransUnion: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Experian: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function Letters() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const sessionId = getSessionId();
  const [printingBureau, setPrintingBureau] = useState<string | null>(null);

  const { data: letters = [], isLoading } = useQuery<DisputeLetter[]>({
    queryKey: [`/api/letters/${sessionId}`],
    enabled: !!sessionId,
  });

  const copyLetter = (content: string, bureau: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast({ title: "Copied!", description: `${bureau} letter copied to clipboard.` });
    });
  };

  const downloadLetter = (content: string, bureau: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CreditClear_Dispute_${bureau}_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printLetter = (content: string, bureau: string) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Dispute Letter — ${bureau}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.6; margin: 1in; color: #000; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
      </style></head>
      <body><pre>${content}</pre></body></html>
    `);
    win.document.close();
    win.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your letters...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 dark:bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg aria-label="CreditClear" viewBox="0 0 40 40" width="28" height="28" fill="none">
              <rect width="40" height="40" rx="8" fill="hsl(var(--primary))"/>
              <path d="M20 8C13.373 8 8 13.373 8 20s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8z" fill="none" stroke="white" strokeWidth="2"/>
              <path d="M15 20l3.5 3.5L25 16" stroke="hsl(var(--secondary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>CreditClear</span>
          </div>
          <button
            onClick={() => setLocation("/results")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-0">
            {["Payment", "Upload Report", "Review Errors", "Get Letters"].map((label, i, arr) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? "bg-green-600 text-white" : "step-active"}`}>
                    {i < 3 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i === 3 ? "text-primary font-medium" : "text-muted-foreground"}`}>{label}</span>
                </div>
                {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-border mx-2 mb-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Your Dispute Letters Are Ready</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {letters.length} professional dispute letter{letters.length !== 1 ? "s" : ""} generated with FCRA citations and Supreme Court precedent.
            Print, sign, and send via <strong>Certified Mail with Return Receipt Requested</strong>.
          </p>
        </div>

        {/* Mailing instructions */}
        <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 mb-8">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-2">Mailing Instructions (Important)</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-xs">Equifax</p>
                    {BUREAU_ADDRESSES.Equifax.map((l, i) => <p key={i} className="text-xs">{l}</p>)}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-xs">TransUnion</p>
                    {BUREAU_ADDRESSES.TransUnion.map((l, i) => <p key={i} className="text-xs">{l}</p>)}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-xs">Experian</p>
                    {BUREAU_ADDRESSES.Experian.map((l, i) => <p key={i} className="text-xs">{l}</p>)}
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-foreground">Tips:</p>
                    <p>• Send via Certified Mail (Return Receipt)</p>
                    <p>• Keep a copy of each letter</p>
                    <p>• Bureaus have 30 days to respond (45 days if you submit supporting docs)</p>
                    <p>• Include a copy of your ID and proof of address</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Letters tabs */}
        {letters.length > 0 ? (
          <Tabs defaultValue={letters[0].bureau}>
            <TabsList className="mb-6">
              {letters.map(letter => (
                <TabsTrigger key={letter.bureau} value={letter.bureau} data-testid={`tab-${letter.bureau.toLowerCase()}`}>
                  {letter.bureau}
                </TabsTrigger>
              ))}
            </TabsList>

            {letters.map(letter => (
              <TabsContent key={letter.bureau} value={letter.bureau}>
                <Card className="border border-border shadow-sm">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <Badge className={BUREAU_COLORS[letter.bureau] || "bg-gray-100 text-gray-800"}>
                          {letter.bureau}
                        </Badge>
                        <CardTitle className="text-sm font-semibold text-foreground">
                          Formal FCRA Dispute Letter
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          data-testid={`btn-copy-${letter.bureau.toLowerCase()}`}
                          variant="outline"
                          size="sm"
                          onClick={() => copyLetter(letter.letterContent, letter.bureau)}
                          className="gap-2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </Button>
                        <Button
                          data-testid={`btn-download-${letter.bureau.toLowerCase()}`}
                          variant="outline"
                          size="sm"
                          onClick={() => downloadLetter(letter.letterContent, letter.bureau)}
                          className="gap-2"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </Button>
                        <Button
                          data-testid={`btn-print-${letter.bureau.toLowerCase()}`}
                          size="sm"
                          onClick={() => printLetter(letter.letterContent, letter.bureau)}
                          className="gap-2 bg-primary hover:bg-primary/90 text-white"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-white dark:bg-card/50 rounded-b-lg overflow-auto max-h-[600px]">
                      <pre className="letter-text p-6">{letter.letterContent}</pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card className="border border-border">
            <CardContent className="py-16 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Letters Generated</h3>
              <p className="text-muted-foreground text-sm mb-4">Go back and select dispute items and fill in your info.</p>
              <Button onClick={() => setLocation("/results")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Next steps */}
        <Card className="mt-8 border border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">What Happens After You Mail</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { time: "Within 5 days", title: "Bureau Receives Letter", desc: "The bureau is required to acknowledge receipt of your dispute." },
                { time: "Within 30 days", title: "Investigation Period", desc: "The bureau must investigate each disputed item with the original furnisher." },
                { time: "After Investigation", title: "Resolution", desc: "Bureau must send you written results. Inaccurate items must be corrected or deleted." },
              ].map((step, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs font-bold text-primary">{step.time}</div>
                  <div className="font-medium text-foreground text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          CreditClear letters are for informational purposes. This is not legal advice. If bureaus fail to comply after 30 days, consult a consumer protection attorney about pursuing statutory damages under 15 U.S.C. § 1681n.
        </p>
      </div>
    </div>
  );
}
