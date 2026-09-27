"""
Cloud Infrastructure Agent persona for ZIVA.

Mandate: Manages hosting, compute, and cloud infrastructure payments.
Approved vendors: AWS, GCP, Azure, Hetzner, Cloudflare, Fastly
Typical payment range: $200–$5,000/month
Budget: $25,000/month
"""
from .base_agent import COMPILED_GRAPH, AgentState

CLOUD_INFRA_CONFIG = {
    "persona": "Cloud Infrastructure Agent",
    "mandate": (
        "Manages all cloud hosting, compute, CDN, and infrastructure vendor payments. "
        "Authorized to renew existing contracts and pay monthly invoices for approved cloud vendors."
    ),
    "typical_vendors": [
        {"name": "AWS", "category": "cloud_compute", "base_price_usd": 2400.0},
        {"name": "Cloudflare", "category": "cdn_security", "base_price_usd": 500.0},
        {"name": "Hetzner", "category": "dedicated_hosting", "base_price_usd": 340.0},
        {"name": "Fastly", "category": "cdn", "base_price_usd": 1200.0},
        {"name": "GCP", "category": "cloud_compute", "base_price_usd": 1800.0},
    ],
}


async def run_cloud_infra_agent(agent_id: str, approved_vendors: list[dict], budget_usd: float, budget_spent_usd: float):
    """Run one cycle of the Cloud Infra Agent."""
    state: AgentState = {
        "agent_id": agent_id,
        "agent_name": CLOUD_INFRA_CONFIG["persona"],
        "mandate": CLOUD_INFRA_CONFIG["mandate"],
        "approved_vendors": approved_vendors or CLOUD_INFRA_CONFIG["typical_vendors"],
        "budget_usd": budget_usd,
        "budget_spent_usd": budget_spent_usd,
        "payment_request": None,
        "error": None,
    }
    return await COMPILED_GRAPH.ainvoke(state)
