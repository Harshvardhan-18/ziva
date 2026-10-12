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


from app.models.payment_requests import PaymentRequest
from datetime import datetime, timezone

DEMO_PAYMENTS = [
    {
        "id": "pay-esc-1",
        "agent_id": "a-contractor",
        "vendor_id": "v-datainsights",
        "amount_usd": 12000.0,
        "amount_zat": 30000000000,
        "quote_amount_usd": 12000.0,
        "tolerance_pct": 0.0,
        "status": "jev_escalated",
        "jev_anomaly_noul": 0.82,
        "jev_risk_score": 3.76,
        "jev_route": "escalate_to_human",
        "policy_fail_reason": "New vendor not in agent approved list; JEV risk tier 4",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": "pay-esc-2",
        "agent_id": "a-contractor",
        "vendor_id": "v-unknown",
        "amount_usd": 9500.0,
        "amount_zat": 23750000000,
        "quote_amount_usd": 9500.0,
        "tolerance_pct": 0.0,
        "status": "jev_escalated",
        "jev_anomaly_noul": 0.91,
        "jev_risk_score": 4.23,
        "jev_route": "escalate_to_human",
        "policy_fail_reason": "Unrecognized contractor identity; anomaly probability 0.91",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": "pay-conf-1",
        "agent_id": "a-cloud-infra",
        "vendor_id": "v-aws",
        "amount_usd": 2487.0,
        "amount_zat": 6218000000,
        "quote_amount_usd": 2487.0,
        "tolerance_pct": 0.0,
        "status": "confirmed",
        "jev_anomaly_noul": 0.04,
        "jev_risk_score": 1.14,
        "jev_route": "auto_approve",
        "txid": "be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": "pay-conf-2",
        "agent_id": "a-marketing",
        "vendor_id": "v-hubspot",
        "amount_usd": 1189.0,
        "amount_zat": 2973000000,
        "quote_amount_usd": 1189.0,
        "tolerance_pct": 0.0,
        "status": "confirmed",
        "jev_anomaly_noul": 0.07,
        "jev_risk_score": 0.87,
        "jev_route": "auto_approve",
        "txid": "be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": "pay-conf-3",
        "agent_id": "a-cloud-infra",
        "vendor_id": "v-cloudflare",
        "amount_usd": 349.0,
        "amount_zat": 873000000,
        "quote_amount_usd": 349.0,
        "tolerance_pct": 0.0,
        "status": "confirmed",
        "jev_anomaly_noul": 0.03,
        "jev_risk_score": 0.42,
        "jev_route": "auto_approve",
        "txid": "be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": "pay-conf-4",
        "agent_id": "a-contractor",
        "vendor_id": "v-alice",
        "amount_usd": 4200.0,
        "amount_zat": 10500000000,
        "quote_amount_usd": 4200.0,
        "tolerance_pct": 0.0,
        "status": "confirmed",
        "jev_anomaly_noul": 0.11,
        "jev_risk_score": 1.68,
        "jev_route": "auto_approve",
        "txid": "be88b650ad803c69452f0fc34656509dd8813abad5ec9cf13218836615b58ba2",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": "pay-esc-3",
        "agent_id": "a-marketing",
        "vendor_id": "v-segment",
        "amount_usd": 5800.0,
        "amount_zat": 14500000000,
        "quote_amount_usd": 4500.0,
        "tolerance_pct": 0.0,
        "status": "jev_escalated",
        "jev_anomaly_noul": 0.64,
        "jev_risk_score": 2.91,
        "jev_route": "escalate_to_human",
        "policy_fail_reason": "Amount exceeds agreed quote by 28.9% (tolerance: 0%)",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": "pay-block-1",
        "agent_id": "a-cloud-infra",
        "vendor_id": "v-unknown",
        "amount_usd": 499.0,
        "amount_zat": 1248000000,
        "quote_amount_usd": 499.0,
        "tolerance_pct": 0.0,
        "status": "policy_failed",
        "jev_risk_score": 0.0,
        "policy_fail_reason": "Vendor 'v-unknown' is not in approved list for agent 'Cloud Infra Agent'",
        "created_at": datetime.now(timezone.utc),
    },
]

from app.database import engine, AsyncSessionLocal, Base

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Insert vendors
        for vd in DEMO_VENDORS:
            vendor = Vendor(
                id=vd["id"],
                name=vd["name"],
                category=vd["category"],
                address_zcash=vd["address_zcash"],
                risk_tier=vd["risk_tier"],
            )
            await session.merge(vendor)

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
            await session.merge(agent)

        # Insert demo payments
        for pm in DEMO_PAYMENTS:
            payment = PaymentRequest(
                id=pm["id"],
                agent_id=pm["agent_id"],
                vendor_id=pm["vendor_id"],
                amount_usd=pm["amount_usd"],
                amount_zat=pm["amount_zat"],
                quote_amount_usd=pm["quote_amount_usd"],
                tolerance_pct=pm["tolerance_pct"],
                payment_date=pm["created_at"],
                status=pm["status"],
                policy_fail_reason=pm.get("policy_fail_reason"),
                jev_anomaly_noul=pm.get("jev_anomaly_noul"),
                jev_risk_score=pm.get("jev_risk_score"),
                jev_route=pm.get("jev_route"),
                txid=pm.get("txid"),
                created_at=pm["created_at"],
            )
            await session.merge(payment)

        await session.commit()
        logger.info(
            "Demo seed complete: %d vendors, %d agents, %d payments",
            len(DEMO_VENDORS),
            len(DEMO_AGENTS),
            len(DEMO_PAYMENTS),
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed())
