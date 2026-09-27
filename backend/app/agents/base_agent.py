"""
LangGraph-based base agent for ZIVA purchasing personas.

Each agent:
- Has a mandate (categories of payments it's authorized to make)
- Has a budget and an approved vendor list (stored in backend DB)
- Generates realistic payment requests via LangGraph + LLM
- Posts payment requests to the ZIVA FastAPI backend pipeline
"""
from __future__ import annotations

import asyncio
import logging
import os
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, TypedDict

import httpx
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

logger = logging.getLogger(__name__)

API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")


class AgentState(TypedDict):
    """State flowing through the LangGraph graph."""
    agent_id: str
    agent_name: str
    mandate: str
    approved_vendors: list[dict]  # [{id, name, category, base_price_usd}]
    budget_usd: float
    budget_spent_usd: float
    payment_request: dict | None
    error: str | None


def _llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.7,
    )


def generate_payment_node(state: AgentState) -> AgentState:
    """
    LLM-driven node: generate a realistic payment request.
    The LLM decides WHICH vendor to pay and a realistic justification.
    Amounts are grounded in the vendor's base_price_usd — slight variation only.
    """
    if not state["approved_vendors"]:
        return {**state, "error": "No approved vendors available"}

    # Pick a vendor — weight toward known vendors, occasionally pick "new" ones
    vendor = random.choice(state["approved_vendors"])

    # Generate a realistic invoice amount near the vendor's base price
    base_price = vendor.get("base_price_usd", 500.0)
    variation = random.uniform(0.95, 1.05)  # ±5% natural invoice variation
    amount = round(base_price * variation, 2)

    # LLM generates a realistic business context / memo
    llm = _llm()
    response = llm.invoke([
        SystemMessage(content=(
            f"You are the {state['agent_name']} for a tech company. "
            f"Your mandate: {state['mandate']}. "
            "Write a concise one-sentence business justification for this payment. "
            "Be specific and realistic. No JSON, just the sentence."
        )),
        HumanMessage(content=(
            f"Payment to: {vendor['name']} ({vendor['category']}) "
            f"Amount: ${amount:.2f} USD"
        )),
    ])
    memo = response.content.strip()

    # Payment date: within the next 1-3 business days
    payment_date = datetime.now(timezone.utc) + timedelta(days=random.randint(1, 3))

    payment_request = {
        "agent_id": state["agent_id"],
        "vendor_id": vendor["id"],
        "amount_usd": amount,
        "amount_zat": int(amount * 100_000_000 / 40_000),  # rough ZEC/USD approximation
        "quote_amount_usd": base_price,
        "tolerance_pct": 5.0,
        "payment_date": payment_date.isoformat(),
        "memo": memo,
    }

    logger.info(
        "Agent %s generated request: $%.2f to %s",
        state["agent_name"], amount, vendor["name"]
    )
    return {**state, "payment_request": payment_request, "error": None}


async def submit_payment_node(state: AgentState) -> AgentState:
    """
    Submit the generated payment request to the ZIVA backend pipeline.
    The pipeline will run: Policy Engine → Jev → Sidecar (if approved).
    """
    if state.get("error") or not state.get("payment_request"):
        return state

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                f"{API_URL}/payments/request",
                json=state["payment_request"],
            )
            resp.raise_for_status()
            result = resp.json()
            logger.info(
                "Payment submitted: id=%s status=%s",
                result.get("id"), result.get("status")
            )
        except Exception as e:
            logger.error("Failed to submit payment: %s", e)
            return {**state, "error": str(e)}

    return state


def build_agent_graph() -> Any:
    """Build the LangGraph state machine for a purchasing agent."""
    graph = StateGraph(AgentState)

    graph.add_node("generate_payment", generate_payment_node)
    graph.add_node("submit_payment", submit_payment_node)

    graph.set_entry_point("generate_payment")
    graph.add_edge("generate_payment", "submit_payment")
    graph.add_edge("submit_payment", END)

    return graph.compile()


COMPILED_GRAPH = build_agent_graph()
