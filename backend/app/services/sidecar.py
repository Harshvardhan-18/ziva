"""
HTTP client for the ZIVA Rust sidecar (zingolib wrapper).
Sidecar endpoints: /health, /wallet/create, /wallet/info, /send, /tx/{txid}/status
"""
import os
import logging
from typing import Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)

SIDECAR_URL = os.getenv("SIDECAR_URL", "http://localhost:3001")
_TIMEOUT = 60.0  # Zcash tx broadcast can take a moment


async def get_wallet_info() -> Dict[str, Any]:
    """Get current wallet address and balance."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.get(f"{SIDECAR_URL}/wallet/info")
        response.raise_for_status()
        return response.json()


async def send_payment(to_addr: str, amount_zat: int, memo: Optional[str] = None) -> str:
    """
    Build and broadcast a shielded Zcash transaction.
    Returns the txid on success.
    Amount is in zatoshis (1 ZEC = 100_000_000 zat).
    """
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        payload = {
            "to_address": to_addr,
            "amount_zat": amount_zat,
            "memo": memo or "",
        }
        logger.info("Sending payment via sidecar: %d zat to %s", amount_zat, to_addr[:20] + "...")
        response = await client.post(f"{SIDECAR_URL}/send", json=payload)
        response.raise_for_status()
        data = response.json()
        txid = data.get("txid")
        logger.info("Payment broadcast succeeded: txid=%s", txid)
        return txid


async def get_tx_status(txid: str) -> Dict[str, Any]:
    """Check the status of a previously broadcast transaction."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.get(f"{SIDECAR_URL}/tx/{txid}/status")
        response.raise_for_status()
        return response.json()


async def sidecar_health() -> bool:
    """Returns True if the sidecar is reachable and healthy."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{SIDECAR_URL}/health")
            return resp.status_code == 200
    except Exception:
        return False
