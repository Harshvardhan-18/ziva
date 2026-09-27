# ZIVA — Private Spend Control for AI Agent Fleets

> **A spend-control layer for AI agent commerce, where the money moves privately.**
> Think Stripe Radar plus treasury dual-approval — except the counterparty and the negotiator are both AI agents.

Built for the **Colosseum Crypto World's Fair Hackathon 2026** — Zcash Track.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## What ZIVA Does

Enterprises running fleets of autonomous AI agents face a new problem: their agents transact on their behalf — procurement, vendor payments, contractor payouts — on public blockchains. Every transaction is visible to competitors, revealing supplier relationships, spend patterns, and business intent.

ZIVA solves this with a three-layer control stack:

1. **Deterministic Policy Engine** — checks vendor allowlists, amounts, budgets, and schedules in plain code. No AI, no ambiguity, no decimal errors.
2. **Jev Fuzzy Judgment** — TypeSafe's structured decision model evaluates anomaly probability, counterparty risk, and routing. Batched into a single call, completes in <1 second.
3. **Zcash Shielded Settlement** — via zingolib on testnet. The public chain reveals nothing about sender, recipient, or amount. Auditors get selective disclosure via viewing keys.

### Why Privacy Matters (and it's not ideology)

A company running agents on a public chain broadcasts its entire vendor list and spend pattern to every competitor watching that chain — the same reason companies don't publish their AWS bill or supplier contracts. Zcash's shielded transactions solve this at the settlement layer.

**The compliance answer**: Zcash is shielded by default from the public and competitors, but selectively disclosable to auditors or regulators via **viewing keys** — a first-class Zcash capability. Click "Reveal to Auditor" in the dashboard for a live demo.

### The Market (Gartner, 4Q25 AI Spending Forecast)
Gartner's 2026 forecast puts AI agent software spending at **$201.9–206.5B in 2026** (up ~139–141% YoY), projected to reach **$752.7B by 2029**. ZIVA targets the enterprise operator layer managing these fleets.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js — Ops/Compliance Dashboard                              │
│  (approval queue, audit log, selective-disclosure demo)          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST / SSE
┌───────────────────────────▼─────────────────────────────────────┐
│  FastAPI + PostgreSQL — Core Backend                              │
│  agents, payment requests, vendors, budgets, policy state, audit │
└───────┬─────────────────────┬───────────────────────┬───────────┘
       │                     │                        │
┌──────▼──────┐   ┌──────────▼──────────┐   ┌────────▼──────────┐
│ LangGraph    │   │ Deterministic Policy │   │ Jev (TypeSafe SDK  │
│ Agent Layer  │   │ Engine (plain code)  │   │ via Vercel AI GW)  │
│              │   │ vendor / amount /    │   │ anomaly Noul +     │
│ 3 purchasing │   │ budget / schedule    │   │ risk Score +       │
│ personas     │   │ no LLM, no ambiguity │   │ route Choice       │
└──────────────┘   └───────────┬─────────┘   └────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Rust Sidecar         │
                    │ (zingolib wrapper)   │
                    │ shielded testnet txs │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ lightwalletd/Zaino   │
                    │ → zebrad (testnet)   │
                    └──────────────────────┘
```

---

## Privacy Model — What's Private, and From Whom?

| Observer | What they see |
|----------|--------------|
| **Public / competitors** | Nothing. Shielded Zcash transactions reveal no sender, recipient, or amount on-chain. |
| **ZIVA backend** | Everything — the backend IS the trusted, operator-facing side of the system. It holds plaintext state by design, as any treasury system must. |
| **Auditors / regulators** | Selectively disclosed transaction details via Zcash **viewing keys**, on demand, without exposing the key to the public or competitors. |
| **Other AI agents** | Nothing — no agent can observe another agent's payment flows from the chain. |

This is an explicit architectural boundary, not an oversight. The question "isn't your backend a privacy leak?" confuses the chain's privacy (which is real) with the operator's own records (which any treasury system keeps).

---

## Stack

| Layer | Technology |
|-------|------------|
| Chain settlement | Zcash testnet via **zingolib** |
| Indexer | **lightwalletd** / Zaino → **zebrad** |
| Rust sidecar | **Axum** HTTP wrapper around zingolib |
| Agent orchestration | **LangGraph** |
| Backend | **FastAPI + PostgreSQL** |
| Fuzzy judgment | **Jev** (TypeSafe SDK via Vercel AI Gateway) |
| Frontend | **Next.js 14** |
| Threshold signing | **FROST** (stretch goal) |

> **zcashd is deliberately excluded** — it reached end-of-life on July 18, 2026 (block 3,417,100). All chain connectivity uses zebrad.

---

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Rust toolchain (for local sidecar dev)
- Node.js 20+ (for dashboard dev)
- Python 3.11+ (for backend dev)

### Environment Setup

```bash
cp .env.example .env
# Fill in:
# TYPESAFE_API_KEY or AI_GATEWAY_API_KEY (Vercel AI Gateway)
# OPENAI_API_KEY (for LangGraph agents)
# WALLET_SEED (or leave blank to generate on first run)
```

### Run Everything

```bash
docker-compose up
```

Services:
- Dashboard: http://localhost:3000
- Backend API: http://localhost:8000
- Sidecar: http://localhost:3001
- API docs: http://localhost:8000/docs

### Run Agents (generate payment requests)

```bash
cd backend
python -m app.agents.runner
```

---

## Phase 1 Validation — Testnet Proof

See [`sidecar/PHASE1_VALIDATION.md`](./sidecar/PHASE1_VALIDATION.md) for the step-by-step CLI validation of a real shielded testnet transaction via zingolib, before any wrapper code is run.

---

## Project Structure

```
ziva/
├── LICENSE                   # MIT
├── README.md                 # This file
├── DEPENDENCIES.md           # Third-party disclosure (submission requirement)
├── docker-compose.yml        # Full-stack orchestration
├── .env.example
├── sidecar/                  # Phase 2 — Rust/zingolib HTTP sidecar
├── backend/                  # Phase 3-5 — FastAPI + Postgres + LangGraph + Jev
└── dashboard/                # Phase 6 — Next.js ops dashboard
```

---

## Demo Script (Hackathon)

1. Cloud Infra Agent generates a hosting renewal request → approved vendor, amount matches quote, within budget
2. Deterministic checks pass → Jev evaluates: low risk → **auto_approve**
3. A real shielded testnet Zcash transaction executes. Block explorer shows: nothing usable.
4. Dashboard shows full detail to the operator — agent, vendor, amount, all checks, Jev scores.
5. Contractor Payments Agent requests an unusually large payment to a new vendor → Jev flags it: **escalate_to_human** → appears in approvals queue → human approves on dashboard.
6. Click **"Reveal to Auditor"** → selective disclosure demo — shielded tx details appear for the simulated auditor role.
7. TAM slide: $752.7B AI agent transaction volume by 2029 (Gartner, 4Q25).

---

## Third-Party Dependencies

See [`DEPENDENCIES.md`](./DEPENDENCIES.md) for the full disclosure list required by the Colosseum hackathon submission rules.

---

## License

MIT — see [LICENSE](./LICENSE).
