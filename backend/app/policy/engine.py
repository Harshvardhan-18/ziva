from typing import Optional
from dataclasses import dataclass
from datetime import datetime, timezone

from app.models.agents import Agent
from app.models.vendors import Vendor
from app.schemas.payment_requests import PaymentRequestCreate

@dataclass
class PolicyResult:
    passed: bool
    fail_reason: Optional[str] = None

def check_policy(
    agent: Agent,
    vendor: Vendor,
    request: PaymentRequestCreate
) -> PolicyResult:
    """
    DETERMINISTIC policy engine. No LLM calls. Checks IN ORDER.
    Short-circuits on first failure.
    """
    # 1. Vendor is in agent's approved_vendors list
    if vendor.id not in agent.approved_vendors:
        return PolicyResult(passed=False, fail_reason=f"Vendor {vendor.id} not in approved list for agent {agent.id}")
        
    # 2. Amount is within tolerance of quote (exact match by default, explicit tolerance_pct if set)
    if request.quote_amount_usd is not None:
        max_allowed = request.quote_amount_usd * (1.0 + request.tolerance_pct / 100.0)
        if request.amount_usd > max_allowed:
            return PolicyResult(
                passed=False, 
                fail_reason=f"Amount {request.amount_usd} exceeds quote {request.quote_amount_usd} + {request.tolerance_pct}% tolerance"
            )

    # 3. Amount <= agent budget remaining for period
    budget_remaining = agent.budget_usd - agent.budget_spent_usd
    if request.amount_usd > budget_remaining:
        return PolicyResult(
            passed=False,
            fail_reason=f"Amount {request.amount_usd} exceeds remaining budget {budget_remaining}"
        )

    # 4. Payment date consistent with agreed terms (mocked check for now, can be expanded)
    if request.payment_date.tzinfo is None:
        payment_date = request.payment_date.replace(tzinfo=timezone.utc)
    else:
        payment_date = request.payment_date

    if payment_date < datetime.now(timezone.utc):
        return PolicyResult(passed=False, fail_reason="Payment date cannot be in the past")

    return PolicyResult(passed=True)
