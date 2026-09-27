export type PaymentStatus =
  | "pending"
  | "policy_failed"
  | "jev_approved"
  | "jev_escalated"
  | "jev_blocked"
  | "human_approved"
  | "human_rejected"
  | "broadcasting"
  | "confirmed"
  | "failed"
  // Legacy / mock aliases
  | "auto_approved"
  | "blocked";

export interface PaymentRequest {
  id: string;
  agent_name: string;
  vendor_name: string;
  amount_usd: number;
  amount_zec: number;
  status: PaymentStatus;
  jev_risk_score: number;
  anomaly_probability?: number;
  route_decision?: string;
  jev_reasoning?: string;
  jev_confidence?: number;
  requested_at: string;
  txid?: string;
  memo?: string;
  business_purpose?: string;
  policy_fail_reason?: string;
}

export interface AuditEvent {
  id: string;
  payment_request_id: string;
  event_type: string;
  detail_json: Record<string, unknown>;
  actor: string;
  timestamp: string;
}

export interface Agent {
  id: string;
  name: string;
  persona: string;
  budget_usd: number;
  budget_spent_usd: number;
  budget_period: string;
  approved_vendors: string[];
}

export interface SummaryStats {
  total_agents_active: number;
  pending_approvals_count: number;
  total_zec_settled_today: number;
}
