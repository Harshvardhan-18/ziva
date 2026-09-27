"""
Contractor Payments Agent persona for ZIVA.

Mandate: Manages contractor and freelancer payments.
This agent is the primary source of ESCALATION SCENARIOS in the demo:
- Occasionally generates payments to NEW vendors (triggers Jev escalation)
- Occasionally requests amounts higher than the baseline (triggers Jev flag)
- Has the broadest mandate, making anomaly detection most meaningful here.

Approved vendors (known contractors): Alice Dev, Bob Design, Carol Legal
New/unknown vendors: MarketingCo LLC, Unknown Consultant (will trigger escalation)
Budget: $15,000/month
"""
import random
from .base_agent import COMPILED_GRAPH, AgentState

CONTRACTOR_CONFIG = {
    "persona": "Contractor Payments Agent",
    "mandate": (
        "Processes contractor and freelancer invoices. Authorized for known contractors "
        "on the approved list. New contractors require prior approval."
    ),
    "known_vendors": [
        {"name": "Alice Dev (Contract)", "category": "software_dev", "base_price_usd": 4500.0},
        {"name": "Bob Design Studio", "category": "design", "base_price_usd": 2800.0},
        {"name": "Carol Legal Services", "category": "legal", "base_price_usd": 1800.0},
    ],
    # These simulate new/unapproved vendors — will cause Jev to escalate
    "new_vendors": [
        {"name": "DataInsights LLC", "category": "consulting", "base_price_usd": 9500.0},
        {"name": "Unknown Contractor", "category": "unknown", "base_price_usd": 12000.0},
    ],
}


async def run_contractor_agent(
    agent_id: str,
    approved_vendors: list[dict],
    budget_usd: float,
    budget_spent_usd: float,
    inject_anomaly: bool = False,
):
    """
    Run one cycle of the Contractor Payments Agent.
    
    inject_anomaly=True: deliberately uses a new vendor with elevated amount —
    this triggers the escalation path in the demo.
    """
    # 20% chance of anomaly injection in normal mode, or forced if inject_anomaly=True
    use_new_vendor = inject_anomaly or (random.random() < 0.20)

    if use_new_vendor:
        # Use a "new" vendor not on the approved list — Jev will escalate
        vendors = approved_vendors + CONTRACTOR_CONFIG["new_vendors"]
        # Pick one of the new vendors
        vendor_pool = CONTRACTOR_CONFIG["new_vendors"]
    else:
        vendors = approved_vendors or CONTRACTOR_CONFIG["known_vendors"]
        vendor_pool = vendors

    state: AgentState = {
        "agent_id": agent_id,
        "agent_name": CONTRACTOR_CONFIG["persona"],
        "mandate": CONTRACTOR_CONFIG["mandate"],
        "approved_vendors": vendor_pool,
        "budget_usd": budget_usd,
        "budget_spent_usd": budget_spent_usd,
        "payment_request": None,
        "error": None,
    }
    return await COMPILED_GRAPH.ainvoke(state)
