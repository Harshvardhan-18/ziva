"""
Agent Runner for ZIVA.

Fetches active agents from the backend DB, maps them to their LangGraph personas,
and runs them on a configurable schedule. This generates the continuous stream
of realistic payment requests seen on the dashboard.

Usage:
    python -m app.agents.runner
    
Or with interval:
    AGENT_INTERVAL_SECONDS=30 python -m app.agents.runner
"""
import asyncio
import logging
import os

import httpx

from .cloud_infra import run_cloud_infra_agent
from .contractor_payments import run_contractor_agent
from .marketing_tools import run_marketing_agent

logger = logging.getLogger(__name__)

API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")
INTERVAL = int(os.getenv("AGENT_INTERVAL_SECONDS", "45"))  # seconds between cycles


# Agent persona mapping: name prefix → runner function
PERSONA_MAP = {
    "Cloud Infra": run_cloud_infra_agent,
    "Marketing Tools": run_marketing_agent,
    "Contractor Payments": run_contractor_agent,
}


async def fetch_agents() -> list[dict]:
    """Fetch active agents from the backend."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{API_URL}/agents/")
        resp.raise_for_status()
        return resp.json()


async def run_cycle():
    """Run one cycle — all agents generate and submit one payment request each."""
    logger.info("Starting agent cycle...")
    
    try:
        agents = await fetch_agents()
    except Exception as e:
        logger.error("Failed to fetch agents: %s. Using demo defaults.", e)
        agents = [
            {
                "id": "demo-cloud-infra",
                "name": "Cloud Infra Agent",
                "budget_usd": 25000.0,
                "budget_spent_usd": 8200.0,
                "approved_vendors": [],
            },
            {
                "id": "demo-marketing",
                "name": "Marketing Tools Agent",
                "budget_usd": 8000.0,
                "budget_spent_usd": 2100.0,
                "approved_vendors": [],
            },
            {
                "id": "demo-contractor",
                "name": "Contractor Payments Agent",
                "budget_usd": 15000.0,
                "budget_spent_usd": 4500.0,
                "approved_vendors": [],
            },
        ]

    tasks = []
    for agent in agents:
        agent_name = agent.get("name", "")
        agent_id = agent.get("id")
        budget_usd = float(agent.get("budget_usd", 10000))
        budget_spent_usd = float(agent.get("budget_spent_usd", 0))
        approved_vendors = agent.get("approved_vendors", [])

        # Match persona by name prefix
        runner = None
        for prefix, fn in PERSONA_MAP.items():
            if prefix.lower() in agent_name.lower():
                runner = fn
                break

        if runner is None:
            logger.warning("No persona match for agent '%s', skipping", agent_name)
            continue

        tasks.append(
            runner(agent_id, approved_vendors, budget_usd, budget_spent_usd)
        )

    if tasks:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, Exception):
                logger.error("Agent cycle error: %s", r)

    logger.info("Agent cycle complete.")


async def main():
    """Run agents in a loop with configurable interval."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    logger.info("Agent runner starting. Interval: %ds", INTERVAL)

    while True:
        try:
            await run_cycle()
        except Exception as e:
            logger.error("Unexpected runner error: %s", e)
        
        logger.info("Sleeping %ds until next cycle...", INTERVAL)
        await asyncio.sleep(INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
