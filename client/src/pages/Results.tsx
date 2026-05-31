import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Scale, AlertTriangle, Shield, CheckCircle2, ChevronDown, ChevronUp, FileText, Loader2 } from "lucide-react";
import type { DisputeItem } from "@shared/schema";
import { getSessionId, getSessionName } from "@/lib/sessionStore";

export default function Results() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const sessionId = getSessionId();
  const savedName = getSessionName() || "";

  const [expanded, setExpanded] = useState<number | null>(null);
  const [userInfo, setUserInfo] = useState({
    name: savedName || "",
    address: "",
    ssn: "",
    dob: "",
  });

  const { data: items = [], isLoading } = useQuery<DisputeItem[]>({
    queryKey: [`/api/disputes/${sessionId}`],
    enabled: !!sessionId,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, selected }: { id: number; selected: boolean }) => {
      await apiRequest("PATCH", `/api/disputes/${id}/select`, { selected });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/disputes/${sessionId}`] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/generate-letters", { sessionId, userInfo });
      return res.json();
    },
    onSuccess: () => {
      setLocation("/letters");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate letters. Please try again.", variant: "destructive" });
    },
  });

  const selectedItems = items.filter(i => i.selected);
  const bureaus = [...new Set(items.flatMap(i => i.bureau === "All Bureaus" ? ["Equifax", "TransUnion", "Experian"] : [i.bureau]))];

  const getSeverityClass = (s: string) => {
    if (s === "high") return "severity-high";
    if (s === "medium") return "severity-medium";
    return "severity-low";
  };

  const handleGenerate = () => {
    if (!userInfo.name || !userInfo.address || !userInfo.ssn || !userInfo.dob) {
      toast({ title: "Missing info", description: "Please fill in all your personal details to generate letters.", variant: "destructive" });
      return;
    }
    if (selectedItems.length === 0) {
      toast({ title: "No items selected", description: "Please select at least one dispute item.", variant: "destructive" });
      return;
    }
    generateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading dispute analysis...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <svg aria-label="CreditClear" viewBox="0 0 40 40" width="28" height="28" fill="none">
            <rect width="40" height="40" rx="8" fill="hsl(var(--primary))"/>
            <path d="M20 8C13.373 8 8 13.373 8 20s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8z" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M15 20l3.5 3.5L25 16" stroke="hsl(var(--secondary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>CreditClear</span>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-0">
            {[
              { label: "Payment", done: true },
              { label: "Upload Report", done: true },
              { label: "Review Errors", active: true },
              { label: "Get Letters", active: false },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.done ? "bg-green-600 text-white" : step.active ? "step-active" : "step-pending"}`}>
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${step.active ? "text-primary font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
                {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-border mx-2 mb-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{items.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Issues Found</div>
            </CardContent>
          </Card>
          <Card className="border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{items.filter(i => i.severity === "high").length}</div>
              <div className="text-xs text-muted-foreground mt-1">High Severity</div>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{selectedItems.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Selected to Dispute</div>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{bureaus.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Bureau Letters</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: dispute items list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">FCRA Violations Found</h2>
              <p className="text-sm text-muted-foreground">Select items to include in your dispute</p>
            </div>

            {items.length === 0 ? (
              <Card className="border border-border">
                <CardContent className="py-16 text-center">
                  <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Violations Detected</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Our AI didn't find clear FCRA violations. Your credit report may already be accurate, 
                    or try uploading as a text file for better parsing.
                  </p>
                  <Button className="mt-6" variant="outline" onClick={() => setLocation("/upload")}>
                    Upload Different Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    data-testid={`card-dispute-${item.id}`}
                    className={`border transition-all ${item.selected ? "border-primary/30 bg-primary/5" : "border-border/60 opacity-70"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          data-testid={`checkbox-dispute-${item.id}`}
                          checked={item.selected ?? true}
                          onCheckedChange={(checked) => {
                            toggleMutation.mutate({ id: item.id, selected: !!checked });
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold text-foreground text-sm">{item.creditorName}</span>
                            {item.accountNumber && item.accountNumber !== "Not Provided" && (
                              <span className="text-xs text-muted-foreground">#{item.accountNumber}</span>
                            )}
                            <Badge variant="outline" className="text-xs">{item.bureau}</Badge>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityClass(item.severity)}`}>
                              {item.severity.toUpperCase()}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-primary mb-1">{item.errorType}</div>
                          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>

                          <button
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                          >
                            <Scale className="w-3 h-3" />
                            Legal Basis
                            {expanded === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {expanded === item.id && (
                            <div className="mt-3 bg-muted/50 rounded-lg p-3 space-y-2">
                              <div>
                                <span className="text-xs font-bold text-foreground">FCRA Section: </span>
                                <span className="text-xs text-muted-foreground">{item.fcraSection}</span>
                              </div>
                              {item.supremeCourtCase && (
                                <div>
                                  <span className="text-xs font-bold text-foreground">Supreme Court: </span>
                                  <span className="text-xs text-muted-foreground">{item.supremeCourtCase}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right: personal info + generate */}
          <div>
            <Card className="border border-border sticky top-24">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4 text-primary" />
                  Your Information
                </CardTitle>
                <p className="text-xs text-muted-foreground">Required to personalize your dispute letters</p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full-name" className="text-xs">Full Legal Name</Label>
                  <Input
                    id="full-name"
                    data-testid="input-fullname"
                    placeholder="John A. Smith"
                    value={userInfo.name}
                    onChange={e => setUserInfo(u => ({ ...u, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs">Mailing Address</Label>
                  <Input
                    id="address"
                    data-testid="input-address"
                    placeholder="123 Main St, Dallas TX 75001"
                    value={userInfo.address}
                    onChange={e => setUserInfo(u => ({ ...u, address: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ssn" className="text-xs">Last 4 of SSN</Label>
                  <Input
                    id="ssn"
                    data-testid="input-ssn"
                    placeholder="1234"
                    maxLength={4}
                    value={userInfo.ssn}
                    onChange={e => setUserInfo(u => ({ ...u, ssn: e.target.value.replace(/\D/g, "").substring(0, 4) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob" className="text-xs">Date of Birth</Label>
                  <Input
                    id="dob"
                    data-testid="input-dob"
                    placeholder="MM/DD/YYYY"
                    value={userInfo.dob}
                    onChange={e => setUserInfo(u => ({ ...u, dob: e.target.value }))}
                  />
                </div>

                <div className="pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground mb-3 space-y-1">
                    <p>Letters will be generated for:</p>
                    {bureaus.length > 0 ? bureaus.map(b => (
                      <div key={b} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>{b}</span>
                      </div>
                    )) : <span className="text-muted-foreground">Select items above</span>}
                  </div>
                  <Button
                    data-testid="btn-generate-letters"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || selectedItems.length === 0}
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <>Generate {bureaus.length} Dispute Letter{bureaus.length !== 1 ? "s" : ""}</>
                    )}
                  </Button>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 rounded p-3">
                  <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Your personal info is used only to generate your letters and is not stored beyond this session.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
