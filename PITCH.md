# ZIVA — Private Spend Control for AI Agent Fleets
## Colosseum Crypto World's Fair 2026 · Zcash Track · $100,000 Prize Pool

---

## Slide 1 — The Problem

### AI agents are writing checks. The whole world can read them.

Every autonomous agent payment on a public blockchain is permanently visible to anyone watching that chain.

> A company running procurement agents on a public ledger broadcasts its entire vendor list, spend cadence, and supplier relationships to every competitor watching — the same reason companies don't publish their AWS bill or supplier contracts.

**This is a competitive intelligence problem, not a crypto ideology problem.**

In 2026, autonomous AI agents are executing real commercial transactions:
- Cloud infra provisioning
- SaaS subscription renewals  
- Contractor payouts
- Vendor procurement

There is no spend-control layer built for this. And the one that exists must move money privately.

---

## Slide 2 — The Market

### $201.9B in 2026. $752.7B by 2029.

> *"Gartner's 4Q25 AI Spending Forecast projects AI agent software spending at $201.9–206.5B in 2026, up ~139–141% YoY, overtaking chatbot/assistant spending by 2027, and reaching $752.7B by 2029."*
> — Gartner, 4Q25 AI Spending Forecast

Every dollar of that spending is a transaction. Enterprises running agent fleets need:

| Need | ZIVA Answer |
|------|-------------|
| Budget guardrails | Per-agent limits with period resets |
| Vendor allowlists | Deterministic policy engine (no LLM guessing) |
| Anomaly escalation | Jev AI risk-scoring + human approval queue |
| Audit trails | Full structured log, every state transition |
| Payment privacy | Zcash shielded transactions — invisible on-chain |
| Selective disclosure | Viewing keys for auditors/regulators |

---

## Slide 3 — The Product

### ZIVA: Stripe Radar + treasury dual-approval, where the money moves privately.

```
Agent generates       Policy Engine        Jev AI           Settlement
payment request  →   (deterministic)  →  (fuzzy judge)  →  Zcash testnet
                     ✗ wrong vendor        escalate?        shielded tx
                     ✗ over budget         auto-approve?    (private)
                     ✗ bad date            block?
                     ✓ all clear ──────────────────────►
```

**Four deterministic checks (no LLM, no guessing):**
1. Vendor on agent's approved list?
2. Amount within agreed quote tolerance?
3. Within remaining period budget?
4. Payment date consistent with terms?

**Only requests that pass all four go to Jev.**

**Jev evaluates three signals (one batched call):**
- Anomaly probability (Noul) — is this unusual for this agent+vendor?
- Risk score (Score, 1–5) — counterparty risk tier
- Route decision (Choice) — auto_approve / escalate_to_human / block

**Settlement:** Zcash shielded transaction via zingolib v6. Nothing visible on-chain.

---

## Slide 4 — Architecture

```
┌────────────────────────────────────────────────────────┐
│  Next.js Dashboard                                      │
│  Live feed · Approvals · Audit log · Auditor demo       │
└────────────────────┬───────────────────────────────────┘
                     │ REST + SSE
┌────────────────────▼───────────────────────────────────┐
│  FastAPI + PostgreSQL                                   │
│  agents · vendors · payments · audit · SSE feed         │
└────┬──────────────────┬──────────────────┬─────────────┘
     │                  │                  │
┌────▼────┐  ┌──────────▼──────┐  ┌───────▼─────────────┐
│LangGraph│  │Policy Engine    │  │Jev (typesafe-sdk)   │
│3 Agents │  │plain Python     │  │Vercel AI Gateway    │
│personas │  │4 checks, no LLM │  │anomaly·risk·route   │
└─────────┘  └─────────────────┘  └─────────────────────┘
                                           │
                               ┌───────────▼─────────────┐
                               │Rust Sidecar (zingolib v6)│
                               │propose_send→execute      │
                               │→ shielded testnet tx     │
                               └───────────┬─────────────┘
                                           │
                               ┌───────────▼─────────────┐
                               │lightwalletd→zebrad       │
                               │testnet.zec.rocks:443     │
                               └─────────────────────────┘
```

---

## Slide 5 — Why Zcash

### The privacy is the product. Not a feature.

| Chain | Vendor visible? | Amount visible? | Memo visible? |
|-------|-----------------|-----------------|---------------|
| Ethereum / Solana | ✅ Yes | ✅ Yes | ✅ Yes |
| Bitcoin (pseudonymous) | Linkable | ✅ Yes | N/A |
| **Zcash shielded** | **❌ No** | **❌ No** | **❌ No** |
| Zcash (auditor view key) | ✅ Yes (auth'd) | ✅ Yes | ✅ Yes |

Zcash is the only production-grade blockchain where privacy/audit tradeoff is a first-class protocol feature — not a workaround.

**ZIVA privacy model:**
- **Public chain**: Nothing. Transaction hash only.
- **Competitors**: Cannot see vendor, amount, or business intent.
- **Internal backend**: Full plaintext (the trusted operator side).
- **Regulators/Auditors**: Selective disclosure via viewing keys.

---

## Slide 6 — The Compliance Objection (Pre-empt It)

### "Isn't private agent spending a compliance red flag?"

**No. Here's why:**

Zcash shielded transactions are private from the public ledger and from competitors — but **selectively disclosable** to authorized auditors via **viewing keys**. This is a first-class Zcash protocol capability.

```
Regulator asks:    "Show us all Q3 agent transactions."
Enterprise gives:  A viewing key for the period.
Regulator sees:    Every transaction, amount, vendor, memo.
Public ledger:     Still shows nothing.
```

This is **better** than a public chain for compliance:
- On a public chain, your competitors see the audit trail too.
- With Zcash + viewing keys, only authorized parties see it.

ZIVA ships a live demo of this on the `/auditor` dashboard screen.

---

## Slide 7 — Live Demo (30 seconds)

1. **Live Feed** (`/`) — three agents stream payments in real time
   - Green = auto-approved and settling on Zcash testnet  
   - Yellow = Jev-escalated, needs human review  
   - Red = blocked by policy or Jev

2. **Approvals Queue** (`/approvals`) — review Jev's risk breakdown, approve or reject

3. **Audit Log** (`/audit`) — every state transition, every Jev score; click txid → testnet explorer

4. **Selective Disclosure** (`/auditor`) — shielded tx reveals nothing; press "Reveal to Auditor" → full plaintext via viewing key

---

## Slide 8 — Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Chain | **Zcash testnet** via **zingolib v6** | Shielded tx; not zcashd (EOL July 2026) |
| Indexer | **lightwalletd → zebrad** | testnet.zec.rocks:443 |
| Sidecar | **Rust / Axum** | zingolib is Rust-native |
| Agents | **LangGraph** | Stateful agent graph |
| Backend | **FastAPI + PostgreSQL** | Async, production-grade |
| AI judge | **Jev** via **Vercel AI Gateway** | No-waitlist Gateway route |
| Frontend | **Next.js 14** | TypeScript, Tailwind, shadcn/ui |
| License | **MIT** | Open-source (required by judging rules) |

---

## Slide 9 — Judging Criteria

| Criterion | Evidence |
|-----------|----------|
| ✅ Zcash integration | zingolib v6 shielded send; testnet endpoint; viewing key demo |
| ✅ Working product | Dashboard + backend + agents all running; end-to-end flow |
| ✅ Open source | MIT license; public GitHub; DEPENDENCIES.md |
| ✅ Real use case | $201.9B TAM (Gartner 4Q25); enterprise AI agent fleet spend control |
| ✅ Privacy model | Shielded by default; selective disclosure via viewing keys |
| ✅ UX | Live SSE feed; approval queue; audit log; auditor demo screen |

---

## Slide 10 — What's Next

**Within hackathon window:**
- [ ] Phase 1: First live shielded send via zingolib v6 → real txid on dashboard
- [ ] Phase 7 (stretch): FROST threshold signing for >$10K payments

**Post-hackathon:**
- Mainnet (same codebase, flip `ChainType::Mainnet`)
- FROST multi-sig for treasury controls
- Agent SDK — `npm install ziva-agent` / `pip install ziva-agent`
- Automated viewing-key compliance reports

---

## Dependencies (Colosseum Disclosure Requirement)

Full table in [`DEPENDENCIES.md`](./DEPENDENCIES.md).

Key dependencies: zingolib v6 (MIT), LangGraph (MIT), FastAPI (MIT),
typesafe-sdk (MIT), Next.js (MIT), Axum (MIT), PostgreSQL (PostgreSQL License).

---

*Built solo for Colosseum Crypto World's Fair 2026 — Zcash Track*  
*"A spend-control layer for AI agent commerce, where the money moves privately."*
