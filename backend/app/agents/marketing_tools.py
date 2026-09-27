"""
Marketing Tools Agent persona for ZIVA.

Mandate: Manages SaaS tools, marketing platforms, and analytics vendor payments.
Approved vendors: HubSpot, Segment, Mixpanel, Mailchimp, Figma, Notion
Typical payment range: $100–$2,000/month
Budget: $8,000/month
"""
from .base_agent import COMPILED_GRAPH, AgentState

MARKETING_TOOLS_CONFIG = {
    "persona": "Marketing Tools Agent",
    "mandate": (
        "Manages all SaaS subscriptions and marketing platform payments including "
        "CRM, email marketing, analytics, and design tool vendors."
    ),
    "typical_vendors": [
        {"name": "HubSpot", "category": "crm", "base_price_usd": 1200.0},
        {"name": "Segment", "category": "analytics", "base_price_usd": 800.0},
        {"name": "Mailchimp", "category": "email_marketing", "base_price_usd": 299.0},
        {"name": "Figma", "category": "design_tools", "base_price_usd": 450.0},
        {"name": "Mixpanel", "category": "product_analytics", "base_price_usd": 600.0},
        {"name": "Notion", "category": "productivity", "base_price_usd": 160.0},
    ],
}


async def run_marketing_agent(agent_id: str, approved_vendors: list[dict], budget_usd: float, budget_spent_usd: float):
    """Run one cycle of the Marketing Tools Agent."""
    state: AgentState = {
        "agent_id": agent_id,
        "agent_name": MARKETING_TOOLS_CONFIG["persona"],
        "mandate": MARKETING_TOOLS_CONFIG["mandate"],
        "approved_vendors": approved_vendors or MARKETING_TOOLS_CONFIG["typical_vendors"],
        "budget_usd": budget_usd,
        "budget_spent_usd": budget_spent_usd,
        "payment_request": None,
        "error": None,
    }
    return await COMPILED_GRAPH.ainvoke(state)
