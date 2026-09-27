from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import json

from app.database import get_db
from app.models.payment_requests import PaymentRequest
from app.models.agents import Agent
from app.models.vendors import Vendor
from app.models.audit_log import AuditLog
from app.schemas.payment_requests import PaymentRequestCreate, PaymentRequestResponse
from app.policy.engine import check_policy
from app.jev.judge import evaluate_payment, build_payment_context_summary
from app.services.sidecar import send_payment

router = APIRouter()


async def create_audit_log(
    db: AsyncSession, payment_id: str, event_type: str, detail: dict, actor: str
):
    log = AuditLog(
        payment_request_id=payment_id,
        event_type=event_type,
        detail_json=detail,
        actor=actor,
    )
    db.add(log)
    await db.commit()


@router.post("/request", response_model=PaymentRequestResponse)
async def request_payment(
    req_in: PaymentRequestCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # Fetch agent and vendor
    agent = await db.scalar(select(Agent).where(Agent.id == req_in.agent_id))
    vendor = await db.scalar(select(Vendor).where(Vendor.id == req_in.vendor_id))

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Save initial pending request
    db_req = PaymentRequest(**req_in.model_dump())
    db.add(db_req)
    await db.commit()
    await db.refresh(db_req)

    await create_audit_log(
        db, db_req.id, "PAYMENT_REQUESTED", req_in.model_dump(mode="json"), actor=agent.name
    )

    # ── Step 1: Deterministic Policy Engine ──────────────────────────────────
    # Plain Python. No LLM. No Jev. No ambiguity. Short-circuits on first fail.
    policy_res = check_policy(agent, vendor, req_in)
    if not policy_res.passed:
        db_req.status = "policy_failed"
        db_req.policy_fail_reason = policy_res.fail_reason
        await db.commit()
        await create_audit_log(
            db, db_req.id, "POLICY_FAILED", {"reason": policy_res.fail_reason}, actor="System"
        )
        return db_req

    await create_audit_log(db, db_req.id, "POLICY_PASSED", {}, actor="System")

    # ── Step 2: Jev Fuzzy Judgment ───────────────────────────────────────────
    # Only called AFTER all deterministic checks pass.
    # We curate a focused state — NOT raw logs.
    recent_result = await db.execute(
        select(PaymentRequest)
        .where(PaymentRequest.agent_id == agent.id)
        .order_by(PaymentRequest.created_at.desc())
        .limit(5)
    )
    recent_payments = [
        {
            "vendor_name": r.vendor_id,
            "amount_usd": float(r.amount_usd),
            "status": r.status,
        }
        for r in recent_result.scalars().all()
    ]

    vendor_is_new = vendor.id not in [p.get("vendor_name") for p in recent_payments]
    context_summary = build_payment_context_summary(agent, vendor, recent_payments)

    try:
        jev_result = evaluate_payment(
            agent_name=agent.name,
            vendor_name=vendor.name,
            vendor_category=vendor.category,
            vendor_is_new=vendor_is_new,
            amount_usd=float(req_in.amount_usd),
            recent_payment_summary=context_summary,
        )
        db_req.jev_anomaly_noul = jev_result.anomaly_noul
        db_req.jev_risk_score = jev_result.risk_score
        db_req.jev_route = jev_result.route
        db_req.jev_confidence = jev_result.route_confidence

        jev_detail = {
            "anomaly": jev_result.anomaly_noul,
            "risk_score": jev_result.risk_score,
            "route": jev_result.route,
            "confidence": jev_result.route_confidence,
        }

        if jev_result.route == "block":
            db_req.status = "jev_blocked"
            await create_audit_log(db, db_req.id, "JEV_BLOCKED", jev_detail, actor="Jev")
        elif jev_result.route == "escalate_to_human":
            db_req.status = "jev_escalated"
            await create_audit_log(db, db_req.id, "JEV_ESCALATED", jev_detail, actor="Jev")
        else:  # auto_approve
            db_req.status = "jev_approved"
            await create_audit_log(db, db_req.id, "JEV_APPROVED", jev_detail, actor="Jev")
            # Trigger shielded payment execution in background
            background_tasks.add_task(execute_payment, db_req.id)

    except Exception as e:
        db_req.status = "policy_failed"
        db_req.policy_fail_reason = f"Jev integration error: {str(e)}"
        await create_audit_log(db, db_req.id, "JEV_ERROR", {"error": str(e)}, actor="System")

    await db.commit()
    await db.refresh(db_req)
    return db_req


async def execute_payment(payment_id: str):
    """Background task: broadcast shielded Zcash payment via Rust sidecar."""
    async for db in get_db():
        req = await db.scalar(select(PaymentRequest).where(PaymentRequest.id == payment_id))
        vendor = await db.scalar(select(Vendor).where(Vendor.id == req.vendor_id))
        agent = await db.scalar(select(Agent).where(Agent.id == req.agent_id))

        if not req or not vendor or not agent:
            return

        try:
            req.status = "broadcasting"
            await db.commit()

            txid = await send_payment(
                vendor.address_zcash, req.amount_zat, memo=f"ZIVA payment {req.id[:8]}"
            )

            req.txid = txid
            req.status = "confirmed"

            # Update agent budget spent
            agent.budget_spent_usd += req.amount_usd

            await create_audit_log(
                db, req.id, "PAYMENT_EXECUTED", {"txid": txid}, actor="Sidecar"
            )
            await db.commit()
        except Exception as e:
            req.status = "failed"
            await create_audit_log(
                db, req.id, "PAYMENT_FAILED", {"error": str(e)}, actor="Sidecar"
            )
            await db.commit()


@router.get("/", response_model=List[PaymentRequestResponse])
async def list_payments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PaymentRequest).order_by(PaymentRequest.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{id}", response_model=PaymentRequestResponse)
async def get_payment(id: str, db: AsyncSession = Depends(get_db)):
    req = await db.scalar(select(PaymentRequest).where(PaymentRequest.id == id))
    if not req:
        raise HTTPException(status_code=404, detail="Payment request not found")
    return req


@router.post("/{id}/approve", response_model=PaymentRequestResponse)
async def human_approve(
    id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)
):
    req = await db.scalar(select(PaymentRequest).where(PaymentRequest.id == id))
    if not req:
        raise HTTPException(status_code=404, detail="Payment request not found")

    if req.status != "jev_escalated":
        raise HTTPException(
            status_code=400, detail=f"Cannot approve from status '{req.status}'"
        )

    req.status = "human_approved"
    await create_audit_log(db, req.id, "HUMAN_APPROVED", {}, actor="HumanAdmin")
    await db.commit()

    background_tasks.add_task(execute_payment, req.id)
    await db.refresh(req)
    return req


@router.post("/{id}/reject", response_model=PaymentRequestResponse)
async def human_reject(id: str, db: AsyncSession = Depends(get_db)):
    req = await db.scalar(select(PaymentRequest).where(PaymentRequest.id == id))
    if not req:
        raise HTTPException(status_code=404, detail="Payment request not found")

    if req.status != "jev_escalated":
        raise HTTPException(
            status_code=400, detail=f"Cannot reject from status '{req.status}'"
        )

    req.status = "human_rejected"
    await create_audit_log(db, req.id, "HUMAN_REJECTED", {}, actor="HumanAdmin")
    await db.commit()
    await db.refresh(req)
    return req
