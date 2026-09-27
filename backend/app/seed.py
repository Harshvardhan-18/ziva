"""
Database seed script for ZIVA demo.
Run this after running Alembic migrations to populate demo agents and vendors.

Usage:
    python -m app.seed
"""
import asyncio
import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os

from app.models.agents import Agent
from app.models.vendors import Vendor
from app.database import Base

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://ziva:ziva_dev_password@localhost:5432/ziva")

# ── Demo Vendors ─────────────────────────────────────────────────────────────
DEMO_VENDORS = [
    # Cloud Infra vendors
    {"id": "v-aws", "name": "AWS", "category": "cloud_compute", "address_zcash": "ztestsapling1aws...", "risk_tier": 1},
    {"id": "v-cloudflare", "name": "Cloudflare", "category": "cdn_security", "address_zcash": "ztestsapling1cf...", "risk_tier": 1},
    {"id": "v-hetzner", "name": "Hetzner", "category": "dedicated_hosting", "address_zcash": "ztestsapling1hz...", "risk_tier": 2},
    {"id": "v-fastly", "name": "Fastly", "category": "cdn", "address_zcash": "ztestsapling1fa...", "risk_tier": 1},
    {"id": "v-gcp", "name": "GCP", "category": "cloud_compute", "address_zcash": "ztestsapling1gcp...", "risk_tier": 1},
    # Marketing vendors
    {"id": "v-hubspot", "name": "HubSpot", "category": "crm", "address_zcash": "ztestsapling1hs...", "risk_tier": 1},
    {"id": "v-segment", "name": "Segment", "category": "analytics", "address_zcash": "ztestsapling1sg...", "risk_tier": 2},
    {"id": "v-mailchimp", "name": "Mailchimp", "category": "email_marketing", "address_zcash": "ztestsapling1mc...", "risk_tier": 1},
    {"id": "v-figma", "name": "Figma", "category": "design_tools", "address_zcash": "ztestsapling1fg...", "risk_tier": 1},
    {"id": "v-mixpanel", "name": "Mixpanel", "category": "product_analytics", "address_zcash": "ztestsapling1mp...", "risk_tier": 2},
    # Contractor vendors
    {"id": "v-alice", "name": "Alice Dev (Contract)", "category": "software_dev", "address_zcash": "ztestsapling1al...", "risk_tier": 1},
    {"id": "v-bob", "name": "Bob Design Studio", "category": "design", "address_zcash": "ztestsapling1bd...", "risk_tier": 1},
    {"id": "v-carol", "name": "Carol Legal Services", "category": "legal", "address_zcash": "ztestsapling1cl...", "risk_tier": 2},
    # New/anomalous vendors — will trigger escalation in demo
    {"id": "v-datainsights", "name": "DataInsights LLC", "category": "consulting", "address_zcash": "ztestsapling1di...", "risk_tier": 4},
    {"id": "v-unknown", "name": "Unknown Contractor", "category": "unknown", "address_zcash": "ztestsapling1uk...", "risk_tier": 5},
]

# ── Demo Agents ───────────────────────────────────────────────────────────────
DEMO_AGENTS = [
    {
        "id": "a-cloud-infra",
        "name": "Cloud Infra Agent",
        "persona": "cloud_infra",
        "budget_usd": 25000.0,
        "budget_spent_usd": 8200.0,
        "budget_period": "monthly",
        "approved_vendors": ["v-aws", "v-cloudflare", "v-hetzner", "v-fastly", "v-gcp"],
    },
    {
        "id": "a-marketing",
        "name": "Marketing Tools Agent",
        "persona": "marketing_tools",
        "budget_usd": 8000.0,
        "budget_spent_usd": 2100.0,
        "budget_period": "monthly",
        "approved_vendors": ["v-hubspot", "v-segment", "v-mailchimp", "v-figma", "v-mixpanel"],
    },
    {
        "id": "a-contractor",
        "name": "Contractor Payments Agent",
        "persona": "contractor_payments",
        "budget_usd": 15000.0,
        "budget_spent_usd": 4500.0,
        "budget_period": "monthly",
        "approved_vendors": ["v-alice", "v-bob", "v-carol"],
        # Note: v-datainsights and v-unknown are NOT in approved list
        # This is what triggers Jev escalation in the demo
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Insert vendors
        for vd in DEMO_VENDORS:
            vendor = Vendor(
                id=vd["id"],
                name=vd["name"],
                category=vd["category"],
                address_zcash=vd["address_zcash"],
                risk_tier=vd["risk_tier"],
            )
            session.add(vendor)

        # Insert agents
        for ag in DEMO_AGENTS:
            agent = Agent(
                id=ag["id"],
                name=ag["name"],
                persona=ag["persona"],
                budget_usd=ag["budget_usd"],
                budget_spent_usd=ag["budget_spent_usd"],
                budget_period=ag["budget_period"],
                approved_vendors=ag["approved_vendors"],
            )
            session.add(agent)

        await session.commit()
        logger.info("Demo seed complete: %d vendors, %d agents", len(DEMO_VENDORS), len(DEMO_AGENTS))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed())
