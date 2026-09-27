"use client";

import { useEffect, useState, useRef } from "react";
import { PaymentRequest, SummaryStats } from "@/lib/types";
import { getStats } from "@/lib/api";
import { PaymentCard } from "@/components/PaymentCard";
import { Activity, ShieldAlert, CheckCircle2, Coins } from "lucide-react";

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
          setPayments((prev) => [...prev, newPayment].slice(-50)); // Keep last 50
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

    // Fallback logic for demo purposes if backend isn't running
    function startFallback() {
      const statuses: PaymentRequest["status"][] = ["auto_approved", "jev_escalated", "blocked"];
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
          amount_zec: amount / 45, // roughly
          status: randStatus,
          jev_risk_score: randStatus === "blocked" ? 4.5 + Math.random()*0.5 : randStatus === "jev_escalated" ? 3.0 + Math.random() : Math.random() * 2,
          route_decision: randStatus === "auto_approved" ? "auto_approve" : randStatus === "blocked" ? "block" : "escalate_to_human",
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
    <div className="max-w-5xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Live Activity Feed</h1>
          <p className="text-slate-400">Real-time ZIVA private agent transactions.</p>
        </div>
        
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-4 min-w-[200px] shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="text-emerald-400 w-5 h-5" />
            <span className="text-sm text-emerald-300/80 font-medium uppercase tracking-wider">ZEC Balance</span>
          </div>
          <div className="text-2xl font-bold text-emerald-100">
            1,452.88 <span className="text-base text-emerald-400 font-normal">ZEC</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-200">{stats?.total_agents_active || 14}</div>
            <div className="text-xs text-slate-500 uppercase font-medium">Active Agents</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-200">{stats?.pending_approvals_count || 2}</div>
            <div className="text-xs text-slate-500 uppercase font-medium">Pending Approvals</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-200">{stats?.total_zec_settled_today?.toFixed(2) || "145.20"} ZEC</div>
            <div className="text-xs text-slate-500 uppercase font-medium">Settled Today</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl relative">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-900/50 to-transparent z-10 pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {payments.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 animate-pulse">
              Waiting for agent activity...
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
