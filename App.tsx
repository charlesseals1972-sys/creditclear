import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Landing from "@/pages/Landing";
import Payment from "@/pages/Payment";
import Upload from "@/pages/Upload";
import Results from "@/pages/Results";
import Letters from "@/pages/Letters";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/pay" component={Payment} />
          <Route path="/upload" component={Upload} />
          <Route path="/results" component={Results} />
          <Route path="/letters" component={Letters} />
          <Route component={NotFound} />
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
