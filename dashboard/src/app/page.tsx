"use client";

import { useEffect, useState, useRef } from "react";
import { PaymentRequest, SummaryStats } from "@/lib/types";
import { getStats } from "@/lib/api";
import { PaymentCard } from "@/components/PaymentCard";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, CheckSquare, Coins } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LiveFeedPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getStats().then(setStats);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout;

    try {
      eventSource = new EventSource(`${API_URL}/api/feed/live`);
      
      eventSource.onmessage = (event) => {
        try {
          const newPayment: PaymentRequest = JSON.parse(event.data);
          setPayments((prev) => [...prev, newPayment].slice(-50));
        } catch {
          console.error("Failed to parse SSE data");
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        startFallback();
      };
    } catch {
      startFallback();
    }

    function startFallback() {
      const statuses: PaymentRequest["status"][] = ["auto_approved", "jev_escalated", "blocked", "confirmed"];
      const vendors = ["AWS", "GitHub", "Vercel", "Stripe", "Twilio", "OpenAI", "Anthropic"];
      const agents = ["DevOps_Bot", "Marketing_AI", "Procurement_Agent", "HR_Automator"];
      
      fallbackInterval = setInterval(() => {
        const randStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = Math.random() * 500 + 10;
        
        const newPayment: PaymentRequest = {
          id: `mock_${Date.now()}`,
          agent_name: agents[Math.floor(Math.random() * agents.length)],
          vendor_name: vendors[Math.floor(Math.random() * vendors.length)],
          amount_usd: amount,
          amount_zec: amount / 45,
          status: randStatus,
          jev_risk_score: randStatus === "blocked" ? 4.5 + Math.random()*0.5 : randStatus === "jev_escalated" ? 3.0 + Math.random() : Math.random() * 2,
          route_decision: randStatus === "auto_approved" || randStatus === "confirmed" ? "auto_approve" : randStatus === "blocked" ? "block" : "escalate_to_human",
          requested_at: new Date().toISOString(),
        };

        setPayments((prev) => [...prev, newPayment].slice(-50));
      }, 3500);
    }

    return () => {
      eventSource?.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [payments]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full p-6 space-y-6">
      {/* Header & Treasury Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Activity Feed
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time autonomous spend execution settling over Zcash shielded transactions.
          </p>
        </div>
        
        <Card className="bg-zinc-950 border-border p-3 min-w-[220px]">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
            <span className="uppercase tracking-wider">TREASURY BALANCE</span>
            <span className="border border-zinc-800 px-1 py-0.2 rounded text-[9px] text-zinc-300">SHIELDED</span>
          </div>
          <div className="font-mono text-lg font-bold text-white tracking-tight">
            1,452.88 <span className="text-xs font-normal text-zinc-400">ZEC</span>
          </div>
          <div className="font-mono text-[10px] text-zinc-500">
            ≈ $43,586.40 USD
          </div>
        </Card>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-zinc-950 border-border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                ACTIVE FLEET
              </div>
              <div className="font-mono text-xl font-bold text-white mt-0.5">
                {stats?.total_agents_active || 3}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Cloud, Marketing, Contractors
              </div>
            </div>
            <div className="size-8 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center">
              <Bot className="size-4 text-zinc-400" strokeWidth={1.75} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                PENDING REVIEWS
              </div>
              <div className="font-mono text-xl font-bold text-white mt-0.5">
                {stats?.pending_approvals_count || 2}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Escalated by JEV policy checks
              </div>
            </div>
            <div className="size-8 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center">
              <CheckSquare className="size-4 text-zinc-400" strokeWidth={1.75} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-border">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                SETTLED TODAY
              </div>
              <div className="font-mono text-xl font-bold text-white mt-0.5">
                {stats?.total_zec_settled_today?.toFixed(2) || "145.20"} <span className="text-xs font-normal text-zinc-400">ZEC</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Shielded testnet transactions
              </div>
            </div>
            <div className="size-8 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center">
              <Coins className="size-4 text-zinc-400" strokeWidth={1.75} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Stream Panel */}
      <div className="flex-1 min-h-0 flex flex-col bg-black border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-white animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-300">
              LIVE SETTLEMENT STREAM
            </span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">
            {payments.length} transactions captured
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {payments.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-zinc-500">
              Waiting for agent transaction requests...
            </div>
          ) : (
            payments.map((p) => (
              <PaymentCard key={p.id} payment={p} />
            ))
          )}
          <div ref={feedEndRef} />
        </div>
      </div>
    </div>
  );
}
