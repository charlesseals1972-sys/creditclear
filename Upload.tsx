import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { queryClient, API_BASE } from "@/lib/queryClient";
import { getSessionId } from "@/lib/sessionStore";

type UploadState = "idle" | "uploading" | "analyzing" | "done" | "error";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [itemsFound, setItemsFound] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sessionId = getSessionId();

  const handleFile = async (file: File) => {
    if (!sessionId) {
      toast({ title: "Session expired", description: "Please complete payment first.", variant: "destructive" });
      setLocation("/pay");
      return;
    }

    if (!file.name.match(/\.(pdf|txt)$/i)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or TXT file.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setState("uploading");

    const formData = new FormData();
    formData.append("report", file);
    formData.append("sessionId", sessionId);

    try {
      setState("analyzing");

      const resp = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const result = await resp.json();
      setItemsFound(result.itemsFound);
      setState("done");

      // Invalidate disputes cache
      queryClient.invalidateQueries({ queryKey: [`/api/disputes/${sessionId}`] });
    } catch (err: any) {
      setState("error");
      toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-3">
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
              { label: "Payment", num: "1", active: false, done: true },
              { label: "Upload Report", num: "2", active: true, done: false },
              { label: "Review Errors", num: "3", active: false, done: false },
              { label: "Get Letters", num: "4", active: false, done: false },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step.done ? "bg-green-600 text-white" : step.active ? "step-active" : "step-pending"}`}>
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

      <div className="flex-1 flex items-start justify-center py-16 px-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-foreground mb-2">Upload Your Credit Report</h1>
            <p className="text-muted-foreground">Upload a PDF or TXT file from any credit bureau — we'll scan every line for FCRA violations.</p>
          </div>

          {/* Upload zone */}
          {state === "idle" || state === "error" ? (
            <Card
              className={`border-2 border-dashed transition-all cursor-pointer ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <CardContent className="py-20 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground mb-1">Drop your credit report here</p>
                  <p className="text-sm text-muted-foreground">or click to browse files</p>
                  <p className="text-xs text-muted-foreground mt-2">Supports PDF and TXT files up to 20MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  data-testid="input-file"
                  onChange={onFileInput}
                />
                <Button variant="outline" className="mt-2 pointer-events-none">Browse Files</Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Analyzing state */}
          {(state === "uploading" || state === "analyzing") && (
            <Card className="border border-primary/20 bg-primary/5">
              <CardContent className="py-16 flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center scanning">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="font-semibold text-foreground">
                      {state === "uploading" ? "Uploading report..." : "AI analyzing your credit report..."}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {state === "analyzing" 
                      ? "Scanning for FCRA violations, outdated accounts, incorrect balances, and unauthorized inquiries..."
                      : "Uploading your file securely..."
                    }
                  </p>
                  {fileName && <p className="text-xs text-primary mt-2">{fileName}</p>}
                </div>
                <div className="w-48 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: state === "uploading" ? "30%" : "75%" }} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Done state */}
          {state === "done" && (
            <Card className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
              <CardContent className="py-16 flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground mb-2">Analysis Complete</h2>
                  {itemsFound > 0 ? (
                    <>
                      <p className="text-3xl font-bold text-primary mb-1">{itemsFound}</p>
                      <p className="text-muted-foreground mb-1">potential FCRA violations found</p>
                      <div className="flex items-center gap-1 text-amber-600 text-sm justify-center">
                        <AlertTriangle className="w-4 h-4" />
                        These errors are disputable under the Fair Credit Reporting Act
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No clear FCRA violations detected. Your report may already be accurate, or try pasting the report text directly.</p>
                  )}
                </div>
                <Button
                  data-testid="btn-view-results"
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-5"
                  onClick={() => setLocation("/results")}
                >
                  {itemsFound > 0 ? "Review Violations & Create Letters" : "View Report Analysis"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="mt-6 border border-border/50">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">Tips for best results</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Get your free report at AnnualCreditReport.com",
                  "Upload the full report (not just one section)",
                  "Include all three bureau reports if possible",
                  "PDF format gives the most accurate analysis",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i+1}</div>
                    {tip}
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
