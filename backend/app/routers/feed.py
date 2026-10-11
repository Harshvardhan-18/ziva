"""
Server-Sent Events feed for real-time ZIVA dashboard updates.

Streams new payment request events to the dashboard as they're created.
Uses polling against the DB (simple, reliable for demo — LISTEN/NOTIFY
is the production upgrade path but adds asyncpg dependency complexity).
"""
import asyncio
import json
import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.payment_requests import PaymentRequest

logger = logging.getLogger(__name__)
router = APIRouter()


async def payment_event_stream():
    """
    Streams new payment request events via SSE.
    Polls every 3 seconds for new records created after the connection opened.
    Streams each new payment as a JSON event.
    """
    from app.database import AsyncSessionLocal

    since = datetime.now(timezone.utc)
    seen_ids: set[str] = set()

    try:
        while True:
            await asyncio.sleep(3)
            try:
                async with AsyncSessionLocal() as session:
                    result = await session.execute(
                        select(PaymentRequest)
                        .where(PaymentRequest.created_at >= since - timedelta(seconds=30))
                        .order_by(PaymentRequest.created_at.desc())
                        .limit(20)
                    )
                    payments = result.scalars().all()

                    for p in payments:
                        if p.id not in seen_ids:
                            seen_ids.add(p.id)
                            event_data = json.dumps({
                                "id": p.id,
                                "agent_name": p.agent_id,
                                "vendor_name": p.vendor_id,
                                "amount_usd": float(p.amount_usd),
                                "amount_zec": (p.amount_zat or 0) / 1e8,
                                "status": p.status,
                                "jev_risk_score": float(p.jev_risk_score) if p.jev_risk_score else 0,
                                "anomaly_probability": float(p.jev_anomaly_noul) if p.jev_anomaly_noul else None,
                                "route_decision": p.jev_route,
                                "txid": p.txid,
                                "requested_at": p.created_at.isoformat() if p.created_at else None,
                            })
                            yield f"data: {event_data}\n\n"

            except Exception as e:
                logger.error("SSE feed DB error: %s", e)
                # Send a keepalive comment so the connection stays open
                yield ": keepalive\n\n"

    finally:
        pass


@router.get("/live")
async def live_feed():
    """
    Server-Sent Events stream of payment activity.
    Connect from the dashboard with EventSource('/feed/live').
    Each event is a JSON-serialized payment request.
    """
    return StreamingResponse(
        payment_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Connection": "keep-alive",
        },
    )
