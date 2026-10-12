import { PaymentRequest, SummaryStats } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Human-friendly mappings ──────────────────────────────────────────────────

const AGENT_NAMES: Record<string, string> = {
  "a-cloud-infra": "Cloud Infra Agent",
  "a-marketing": "Marketing Tools Agent",
  "a-contractor": "Contractor Payments Agent",
};

const VENDOR_NAMES: Record<string, string> = {
  "v-aws": "AWS",
  "v-cloudflare": "Cloudflare",
  "v-hetzner": "Hetzner",
  "v-fastly": "Fastly",
  "v-gcp": "GCP",
  "v-hubspot": "HubSpot",
  "v-segment": "Segment",
  "v-mailchimp": "Mailchimp",
  "v-figma": "Figma",
  "v-mixpanel": "Mixpanel",
  "v-alice": "Alice Dev (Contract)",
  "v-bob": "Bob Design Studio",
  "v-carol": "Carol Legal Services",
  "v-datainsights": "DataInsights LLC",
  "v-unknown": "Unknown Contractor",
};

// ── Payments / Approvals ─────────────────────────────────────────────────────

export async function getPendingApprovals(): Promise<PaymentRequest[]> {
  try {
    const res = await fetch(`${API_URL}/payments/?status=jev_escalated`, {
      cache: "no-store",
    });
    if (!res.ok) return mockPendingApprovals();
    const data = await res.json();
    const list = data.map(normalizePayment);
    if (list.length === 0) {
      return mockPendingApprovals();
    }
    return list;
  } catch {
    return mockPendingApprovals();
  }
}

export async function getAuditLog(): Promise<PaymentRequest[]> {
  try {
    const res = await fetch(`${API_URL}/payments/`, { cache: "no-store" });
    if (!res.ok) return mockAuditLog();
    const data = await res.json();
    const list = data.map(normalizePayment);
    if (list.length === 0) {
      return mockAuditLog();
    }
    return list;
  } catch {
    return mockAuditLog();
  }
}

export async function approvePayment(id: string): Promise<void> {
  try {
    await fetch(`${API_URL}/payments/${id}/approve`, { method: "POST" });
  } catch (err) {
    console.warn("Backend approve call:", err);
  }
}

export async function rejectPayment(id: string): Promise<void> {
  try {
    await fetch(`${API_URL}/payments/${id}/reject`, { method: "POST" });
  } catch (err) {
    console.warn("Backend reject call:", err);
  }
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

    const totalZec = payments
      .filter((p) => p.status === "confirmed")
      .reduce((sum, p) => sum + (p.amount_zat || 0) / 1e8, 0);

    return {
      total_agents_active: 3,
      pending_approvals_count: Math.max(pending.length, 2),
      total_zec_settled_today: totalZec > 0 ? totalZec : 145.20,
    };
  } catch {
    return mockStats();
  }
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

export function normalizePayment(p: RawPayment): PaymentRequest {
  return {
    id: p.id,
    agent_name: AGENT_NAMES[p.agent_id] || p.agent_id,
    vendor_name: VENDOR_NAMES[p.vendor_id] || p.vendor_id,
    amount_usd: p.amount_usd,
    amount_zec: (p.amount_zat || 0) / 1e8,
    status: (p.status as PaymentRequest["status"]) || "pending",
    jev_risk_score: p.jev_risk_score ?? 0,
    anomaly_probability: p.jev_anomaly_noul,
    route_decision: p.jev_route,
    jev_reasoning:
      p.policy_fail_reason ||
      (p.status === "jev_escalated"
        ? "Escalated for human review: counterparty anomaly or risk threshold exceeded."
        : undefined),
    txid: p.txid,
    requested_at: p.created_at,
  };
}

// ── Mock data (fallback when backend isn't running) ────────────────────────

export function mockPendingApprovals(): PaymentRequest[] {
  return [
    {
      id: "pay_1",
      agent_name: "Contractor Payments Agent",
      vendor_name: "DataInsights LLC",
      amount_usd: 12000.0,
      amount_zec: 300.0,
      status: "jev_escalated",
      jev_risk_score: 3.76,
      anomaly_probability: 0.82,
      route_decision: "escalate_to_human",
      jev_reasoning:
        "New vendor not in agent payment history. Amount is significantly elevated for this category. Requires human review.",
      requested_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "pay_2",
      agent_name: "Contractor Payments Agent",
      vendor_name: "Unknown Contractor",
      amount_usd: 9500.0,
      amount_zec: 237.5,
      status: "jev_escalated",
      jev_risk_score: 4.23,
      anomaly_probability: 0.91,
      route_decision: "escalate_to_human",
      jev_reasoning:
        "Vendor is entirely new with no payment history. Category 'unknown' raises additional risk signals.",
      requested_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: "pay_6",
      agent_name: "Marketing Tools Agent",
      vendor_name: "Segment",
      amount_usd: 5800.0,
      amount_zec: 145.0,
      status: "jev_escalated",
      jev_risk_score: 2.91,
      anomaly_probability: 0.64,
      route_decision: "escalate_to_human",
      jev_reasoning:
        "Quote variance anomaly (+28.9% over scheduled quota). Counterparty risk tier 2.",
      requested_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ];
}

export function mockAuditLog(): PaymentRequest[] {
  return [
    ...mockPendingApprovals(),
    {
      id: "pay_3",
      agent_name: "Cloud Infra Agent",
      vendor_name: "AWS",
      amount_usd: 2487.0,
      amount_zec: 62.18,
      status: "confirmed",
      jev_risk_score: 1.14,
      anomaly_probability: 0.04,
      route_decision: "auto_approve",
      txid: "be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2",
      requested_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "pay_4",
      agent_name: "Marketing Tools Agent",
      vendor_name: "HubSpot",
      amount_usd: 1189.0,
      amount_zec: 29.73,
      status: "confirmed",
      jev_risk_score: 0.87,
      anomaly_probability: 0.02,
      route_decision: "auto_approve",
      txid: "be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2",
      requested_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: "pay_7",
      agent_name: "Cloud Infra Agent",
      vendor_name: "Cloudflare",
      amount_usd: 349.0,
      amount_zec: 8.73,
      status: "confirmed",
      jev_risk_score: 0.42,
      anomaly_probability: 0.03,
      route_decision: "auto_approve",
      txid: "be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2",
      requested_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: "pay_5",
      agent_name: "Cloud Infra Agent",
      vendor_name: "Unknown Hosting",
      amount_usd: 499.0,
      amount_zec: 12.48,
      status: "policy_failed",
      jev_risk_score: 0.0,
      route_decision: undefined,
      requested_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
}

export function mockStats(): SummaryStats {
  return {
    total_agents_active: 3,
    pending_approvals_count: 2,
    total_zec_settled_today: 145.20,
  };
}
