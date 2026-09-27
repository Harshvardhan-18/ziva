"""
Jev fuzzy judgment layer for ZIVA.

Design constraints (from spec):
- Jev cannot do arithmetic, count, or reason about dates — never ask it to compute anything.
- All three questions are batched into ONE call for latency/cost reasons.
- Jev scores ~68% on TypeSafe's own eval — treat as mid-tier signal, not ground truth.
- Accuracy drops with irrelevant state — curate what we send per call.
- Every Jev decision above risk threshold has a human escalation path.
"""
import os
import logging
from dataclasses import dataclass
from typing import Optional

from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

logger = logging.getLogger(__name__)


@dataclass
class JevResult:
    anomaly_noul: float          # 0.0–1.0; near 1 = likely anomalous
    risk_score: float            # 0.0–4.0 mapped to levels 1–5
    route: str                   # auto_approve | escalate_to_human | block
    route_confidence: float      # confidence in the route choice


def _build_client() -> TypeSafeClient:
    """
    Build TypeSafe client. Prefer Vercel AI Gateway (no waitlist).
    Falls back to direct TypeSafe API if AI_GATEWAY_API_KEY is not set.
    """
    gateway_key = os.getenv("AI_GATEWAY_API_KEY")
    if gateway_key:
        return TypeSafeClient(
            api_key=gateway_key,
            base_url="https://ai-gateway.vercel.sh/typesafe",
            model="typesafe-ai/jev",
        )

    direct_key = os.getenv("TYPESAFE_API_KEY")
    if direct_key:
        return TypeSafeClient(api_key=direct_key)

    raise RuntimeError(
        "No Jev API key configured. "
        "Set AI_GATEWAY_API_KEY (Vercel AI Gateway) or TYPESAFE_API_KEY (direct)."
    )


def evaluate_payment(
    agent_name: str,
    vendor_name: str,
    vendor_category: str,
    vendor_is_new: bool,
    amount_usd: float,
    recent_payment_summary: str,
) -> JevResult:
    """
    Evaluate a payment request using Jev.

    Batches THREE questions into ONE API call:
    1. Noul  — Does vendor behavior look anomalous vs agent history?
    2. Score — Counterparty risk tier (5 descriptive levels)
    3. Choice — Route: auto_approve / escalate_to_human / block

    NOTE: We do NOT ask Jev to compute amounts, check budgets, or compare dates.
    Those checks live exclusively in the deterministic Policy Engine.
    We curate a focused state summary — NOT raw logs.
    """
    # Curated state: only what Jev needs for behavioral judgment
    state = {
        "agent": agent_name,
        "vendor": vendor_name,
        "vendor_category": vendor_category,
        "vendor_is_new": vendor_is_new,
        "amount_usd": amount_usd,
        "recent_payment_context": recent_payment_summary,
    }

    with _build_client() as client:
        response = client.system_one(
            state=state,
            questions={
                "anomaly": Noul(
                    instructions=(
                        "Does `vendor` look anomalous for `agent` given `recent_payment_context`? "
                        "Consider whether this vendor or amount pattern is unusual relative to what "
                        "this agent typically pays."
                    ),
                ),
                "risk_tier": Score(
                    instructions=(
                        "What is the counterparty risk tier for `vendor` in this payment context? "
                        "Use `vendor_is_new`, `vendor_category`, and `recent_payment_context`."
                    ),
                    criteria=[
                        "Established vendor, long consistent relationship with this agent",
                        "Known vendor, limited but clean payment history",
                        "New vendor, amount is standard for this category",
                        "New vendor, amount is elevated relative to category norms",
                        "Unknown vendor or highly anomalous pattern",
                    ],
                ),
                "route": Choice(
                    instructions=(
                        "Based on `vendor`, `vendor_is_new`, `amount_usd`, and `recent_payment_context`, "
                        "which action should the spend-control system take for this payment?"
                    ),
                    criteria={
                        "auto_approve": "Low risk, proceed automatically without human review",
                        "escalate_to_human": (
                            "Elevated risk, uncertainty, or unusual pattern — route to human reviewer"
                        ),
                        "block": "High risk or clear anomaly — do not proceed with this payment",
                    },
                ),
            },
        )

    anomaly_noul = response.answers["anomaly"].noul
    risk_score = response.answers["risk_tier"].score
    route = response.answers["route"].choice
    route_confidence = response.answers["route"].confidence

    logger.info(
        "Jev evaluation: agent=%s vendor=%s anomaly=%.2f risk=%.2f route=%s confidence=%.2f",
        agent_name, vendor_name, anomaly_noul, risk_score, route, route_confidence,
    )

    return JevResult(
        anomaly_noul=anomaly_noul,
        risk_score=risk_score,
        route=route,
        route_confidence=route_confidence,
    )


def build_payment_context_summary(db_agent, db_vendor, recent_payments: list) -> str:
    """
    Build a curated, concise state summary for Jev.
    Do NOT dump raw logs — accuracy drops with irrelevant content.
    """
    recent_lines = []
    for p in recent_payments[-5:]:  # last 5 payments only
        recent_lines.append(
            f"  - {p.get('vendor_name', 'Unknown')} | ${p.get('amount_usd', 0):.2f} | {p.get('status', '?')}"
        )
    recent_text = "\n".join(recent_lines) if recent_lines else "  No recent payments on record."

    return (
        f"Agent '{db_agent.name}' payment history (last 5 payments):\n"
        f"{recent_text}\n"
        f"Current request is to vendor '{db_vendor.name}' (category: {db_vendor.category})."
    )
