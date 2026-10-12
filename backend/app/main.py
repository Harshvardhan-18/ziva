import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import agents, vendors, payments, audit, feed

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables (use alembic migrations in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="ZIVA — Private Spend Control for AI Agent Fleets",
    description=(
        "A spend-control layer for AI agent commerce, where the money moves privately. "
        "Built for the Colosseum Crypto World's Fair Hackathon 2026 — Zcash Track."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(vendors.router, prefix="/vendors", tags=["Vendors"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(audit.router, prefix="/audit", tags=["Audit Log"])
app.include_router(feed.router, prefix="/feed", tags=["Real-time Feed"])

# Also mount under /api prefix for frontend compatibility
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit Log"])
app.include_router(feed.router, prefix="/api/feed", tags=["Real-time Feed"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "ziva-backend"}


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "ZIVA Backend",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.post("/demo/trigger-anomaly", tags=["Demo"])
async def trigger_anomaly():
    """
    Demo endpoint: Injects an anomalous payment request from the Contractor
    Payments Agent to a new, unapproved vendor. This demonstrates the
    Jev escalation path for the hackathon demo.
    """
    from datetime import datetime, timezone, timedelta
    import httpx

    payload = {
        "agent_id": "a-contractor",
        "vendor_id": "v-unknown",
        "amount_usd": 12000.0,
        "amount_zat": 30_000_000,
        "quote_amount_usd": 12000.0,
        "tolerance_pct": 0.0,
        "payment_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "memo": "Emergency consulting engagement — new vendor",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"http://localhost:{os.getenv('BACKEND_PORT', 8000)}/payments/request",
            json=payload,
        )
        return resp.json()
