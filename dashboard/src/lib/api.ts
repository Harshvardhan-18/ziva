import { PaymentRequest, SummaryStats } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Payments / Approvals ─────────────────────────────────────────────────────

export async function getPendingApprovals(): Promise<PaymentRequest[]> {
  try {
    const res = await fetch(`${API_URL}/payments/?status=jev_escalated`, {
      cache: "no-store",
    });
    if (!res.ok) return mockPendingApprovals();
    const data = await res.json();
    return data.map(normalizePayment);
  } catch {
    return mockPendingApprovals();
  }
}

export async function getAuditLog(): Promise<PaymentRequest[]> {
  try {
    const res = await fetch(`${API_URL}/payments/`, { cache: "no-store" });
    if (!res.ok) return mockAuditLog();
    const data = await res.json();
    return data.map(normalizePayment);
  } catch {
    return mockAuditLog();
  }
}

export async function approvePayment(id: string): Promise<void> {
  await fetch(`${API_URL}/payments/${id}/approve`, { method: "POST" });
}

export async function rejectPayment(id: string): Promise<void> {
  await fetch(`${API_URL}/payments/${id}/reject`, { method: "POST" });
}

export async function getStats(): Promise<SummaryStats> {
  try {
    const [paymentsRes, pendingRes] = await Promise.all([
      fetch(`${API_URL}/payments/`, { cache: "no-store" }),
      fetch(`${API_URL}/payments/?status=jev_escalated`, { cache: "no-store" }),
    ]);
    if (!paymentsRes.ok) return mockStats();
    const payments: RawPayment[] = await paymentsRes.json();
    const pending: RawPayment[] = pendingRes.ok ? await pendingRes.json() : [];

    const confirmedToday = payments.filter(
      (p) =>
        p.status === "confirmed" &&
        new Date(p.created_at).toDateString() === new Date().toDateString()
    );
    const totalZec = confirmedToday.reduce(
      (sum, p) => sum + (p.amount_zat || 0) / 1e8,
      0
    );
    return {
      total_agents_active: 3,
      pending_approvals_count: pending.length,
      total_zec_settled_today: totalZec,
    };
  } catch {
    return mockStats();
  }
}

export async function triggerAnomalyDemo(): Promise<void> {
  await fetch(`${API_URL}/demo/trigger-anomaly`, { method: "POST" });
}

// ── Normalization ──────────────────────────────────────────────────────────

interface RawPayment {
  id: string;
  agent_id: string;
  vendor_id: string;
  amount_usd: number;
  amount_zat: number;
  status: string;
  jev_anomaly_noul?: number;
  jev_risk_score?: number;
  jev_route?: string;
  jev_confidence?: number;
  txid?: string;
  policy_fail_reason?: string;
  created_at: string;
}

function normalizePayment(p: RawPayment): PaymentRequest {
  return {
    id: p.id,
    agent_name: p.agent_id,
    vendor_name: p.vendor_id,
    amount_usd: p.amount_usd,
    amount_zec: (p.amount_zat || 0) / 1e8,
    status: (p.status as PaymentRequest["status"]) || "pending",
    jev_risk_score: p.jev_risk_score ?? 0,
    anomaly_probability: p.jev_anomaly_noul,
    route_decision: p.jev_route,
    txid: p.txid,
    requested_at: p.created_at,
  };
}

// ── Mock data (fallback when backend isn't running) ────────────────────────

function mockPendingApprovals(): PaymentRequest[] {
  return [
    {
      id: "pay_1",
      agent_name: "Contractor Payments Agent",
      vendor_name: "DataInsights LLC",
      amount_usd: 12000.0,
      amount_zec: 300.0,
      status: "jev_escalated",
      jev_risk_score: 3.8,
      anomaly_probability: 0.82,
      route_decision: "escalate_to_human",
      jev_reasoning:
        "New vendor not in payment history. Amount is significantly elevated for this category. Requires human review.",
      requested_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "pay_2",
      agent_name: "Contractor Payments Agent",
      vendor_name: "Unknown Contractor",
      amount_usd: 9500.0,
      amount_zec: 237.5,
      status: "jev_escalated",
      jev_risk_score: 4.2,
      anomaly_probability: 0.91,
      route_decision: "escalate_to_human",
      jev_reasoning:
        "Vendor is entirely new with no payment history. Category 'unknown' raises additional risk signals.",
      requested_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ];
}

function mockAuditLog(): PaymentRequest[] {
  return [
    ...mockPendingApprovals(),
    {
      id: "pay_3",
      agent_name: "Cloud Infra Agent",
      vendor_name: "AWS",
      amount_usd: 2487.0,
      amount_zec: 62.18,
      status: "confirmed",
      jev_risk_score: 1.1,
      anomaly_probability: 0.04,
      route_decision: "auto_approve",
      txid: "d9e8b7c6a5f43a2b1c0d9e8f3b4a5c6d",
      requested_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "pay_4",
      agent_name: "Marketing Tools Agent",
      vendor_name: "HubSpot",
      amount_usd: 1189.0,
      amount_zec: 29.73,
      status: "confirmed",
      jev_risk_score: 1.0,
      anomaly_probability: 0.02,
      route_decision: "auto_approve",
      txid: "f1e2d3c4b5a69788776655443322110f",
      requested_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: "pay_5",
      agent_name: "Cloud Infra Agent",
      vendor_name: "Cloudflare",
      amount_usd: 499.0,
      amount_zec: 12.48,
      status: "policy_failed",
      jev_risk_score: 0,
      route_decision: undefined,
      requested_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
}

function mockStats(): SummaryStats {
  return {
    total_agents_active: 3,
    pending_approvals_count: 2,
    total_zec_settled_today: 91.91,
  };
}
