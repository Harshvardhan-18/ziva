# UMBRA — Private Spend Control for AI Agent Fleets
### Full Build Specification & Agent Instructions
### Colosseum "Crypto World's Fair" Hackathon — Zcash Track

**You are the lead engineer on this project.** This document is your complete context. Read it fully before writing any code. It is organized into phases — work through them in order, do not skip ahead, and do not consider a phase done until its Definition of Done is fully met. If something here is ambiguous or you hit a blocker that changes scope, stop and flag it rather than guessing silently.

"UMBRA" is a working name — rename freely if a better one comes to mind, but keep it consistent across code, docs, and the pitch once chosen.

---

## 1. Mission Context

We are entering **Colosseum's Crypto World's Fair hackathon** (Sept 14 – Oct 12, 2026, 11:59pm PT — that's ~12:29pm IST on Oct 13). The **Zcash track** awards **$100,000 across the 10 best products that integrate with the Zcash blockchain or asset** — one of the largest tracks in the event, on par with Solana/Tempo/Hyperliquid.

We are building **solo** (one human, AI-assisted coding), with multiple hours/day available. The goal is **not an MVP — it's a submission built to actually win**, judged on six criteria we must explicitly satisfy (see Section 9).

---

## 2. The Pitch (memorize this, it drives every decision below)

> **A spend-control layer for AI agent commerce, where the money moves privately.**
> Think Stripe Radar plus treasury dual-approval — except the counterparty and the negotiator are both AI agents.

**Who pays for this**: enterprises running fleets of autonomous AI agents that transact on their behalf (procurement, vendor payments, contractor payouts). Zcash is the **enabling settlement layer**, not the customer.

**Why privacy specifically matters (this is the whole pitch, get this right)**: a company running agents on a *public* chain broadcasts its entire vendor list and spend pattern to every competitor watching that chain — the same reason companies don't publish their AWS bill or supplier contracts. This is a competitive-intelligence argument, not a crypto-privacy-ideology argument. It should land with a judge who has never heard of privacy coins.

**The market, sourced (use this exact citation, do not invent a number)**: Gartner's 2026 forecast puts AI agent software spending at **$201.9–206.5B in 2026** (up ~139–141% YoY), overtaking chatbot/assistant spending by 2027, projected to reach **$752.7B by 2029** (Gartner, 4Q25 AI Spending Forecast). Cite Gartner by name on the TAM slide.

**Pre-empt the obvious objection before a judge raises it**: "Isn't private/pseudonymous agent spending a compliance red flag?" Answer: Zcash is shielded by default from the public and from competitors, but **selectively disclosable to auditors or regulators via viewing keys**. This is a first-class Zcash capability, not a workaround. Put this on its own slide.

---

## 3. Hard Constraints (Official Rules Compliance)

Non-negotiable, per Colosseum's Official Rules:

- All submission content (UI copy, docs, pitch) must be in **English**.
- We register **individually and as a Team** on colosseum.com before the deadline — a GitHub repo alone is not an entry.
- **One submission only** — do not fragment scope across multiple half-finished ideas. Everything below is one cohesive product.
- We must **disclose all third-party/open-source dependencies** in the submission (LangGraph, zingolib, the TypeSafe/Jev SDK, FastAPI, Next.js, etc.) — keep a running list, see Section 10.
- **Open-source the repo** — it's an explicit judging criterion, not optional polish. Pick a permissive license (MIT or Apache-2.0) and add it early, not at the end.
- Don't use Zcash Foundation / TypeSafe / Colosseum logos or branding in a way that implies their endorsement. "Built with Zcash" and "powered by Jev" are fine; co-branded lockups are not.
- No malicious code, no infringing assets, nothing that could remotely be read as deceptive — this should never be an issue for legitimate work, just don't cut corners on dependency licensing.

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js — Ops/Compliance Dashboard                              │
│  (approval queue, audit log, selective-disclosure demo)          │
└───────────────────────────┬───────────────────────────────────────┘
                            │ REST
┌───────────────────────────▼───────────────────────────────────────┐
│  FastAPI + Postgres — Core Backend                                │
│  agents, payment requests, vendors, budgets, policy state, audit  │
└───────┬─────────────────────┬───────────────────────────┬─────────┘
       │                     │                            │
┌──────▼──────┐   ┌──────────▼──────────┐   ┌─────────────▼─────────┐
│ LangGraph    │   │ Deterministic Policy │   │ Jev (via Vercel AI     │
│ Agent Layer  │   │ Engine (plain code)  │   │ Gateway) — fuzzy       │
│ (purchasing  │   │ amount/schedule/     │   │ judgment only          │
│ personas +   │   │ vendor-allowlist     │   │ (anomaly, risk tier,   │
│ vendors)     │   │ exact-match checks   │   │ route decision)        │
└──────────────┘   └───────────┬───────────┘   └────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Rust Sidecar         │
                    │ (zingolib) —         │
                    │ builds/broadcasts    │
                    │ shielded testnet txs │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ lightwalletd         │
                    │ → zebrad (testnet)   │
                    └──────────────────────┘
```

**FROST** (stretch goal) sits between the Policy Engine and the Rust sidecar as an optional co-signing gate for payments above a configurable threshold.

---

## 5. Tech Stack (final)

| Layer | Choice | Why |
|---|---|---|
| Chain settlement | Zcash **testnet**, via **zingolib** (not Zallet — Zallet is alpha, breaking changes expected) | zingolib is mature, purpose-built for lightwalletd-backed shielded tx construction |
| Indexer | **lightwalletd** talking to **zebrad** | zcashd is fully end-of-life as of July 18, 2026 (block 3,417,100) — do not build against zcashd |
| Sidecar language | **Rust** (thin HTTP/gRPC wrapper around zingolib) | zingolib is Rust-native; don't fight it |
| Orchestration | **LangGraph** | matches existing stack/expertise |
| Backend | **FastAPI + PostgreSQL** | matches existing stack/expertise |
| Frontend | **Next.js** | matches existing stack/expertise |
| Fuzzy decisions | **Jev**, via **Vercel AI Gateway** (`typesafe-ai/jev`, no waitlist) | direct TypeSafe API is waitlist-gated; the Gateway route isn't |
| Threshold signing (stretch) | **FROST** (Zcash Foundation's frost-client/frost-server) | note: this tooling is pre-1.0, still adding encryption/auth between participants as of the most recent sprints — treat accordingly |

---

## 6. Component Specifications

### 6.1 Zcash Settlement Layer (build this FIRST — highest risk item)
- Stand up a testnet zingolib wallet against a public testnet lightwalletd endpoint (find a current one — check zingolabs' docs/repo for maintained testnet endpoints, don't assume an old one still runs).
- Get one real shielded send working end-to-end **from the zingolib CLI**, before writing any wrapper code. This is the item most likely to eat unplanned time — validate it in isolation first.
- Only after that works: wrap the needed operations (create wallet / get balance / build+broadcast shielded tx / check tx status) as a small Rust HTTP service FastAPI can call.

### 6.2 Deterministic Policy Engine
Plain Python in FastAPI. For every payment request, check (in this order, short-circuit on first failure):
1. Vendor is on the agent's approved vendor list.
2. Amount exactly matches the agreed quote/invoice (or is within an explicitly configured tolerance — don't silently default to fuzzy matching here).
3. Within the agent's remaining budget for the period.
4. Payment date/schedule is consistent with the agreed terms.

Only requests that pass all four proceed to Jev. This layer must never call an LLM or Jev — it's cheap, deterministic, and instant by design, and it's also your answer to "how do you make sure the AI doesn't approve a payment that's off by a decimal."

### 6.3 Jev Fuzzy Judgment Layer
**Before implementing this, fetch and read the current docs at docs.typesafe.ai (and its llms.txt if available) plus the Vercel AI Gateway integration docs for the exact current SDK call syntax — do not guess parameter names, this integration is only weeks old and may have changed.**

Design constraints to hold onto regardless of exact syntax:
- Jev cannot do arithmetic, count, or reason about dates, and cannot produce a value that isn't already in the option list you give it. Never ask it a question whose answer requires computing something — that's what Section 6.2 is for.
- It scores ~68% on TypeSafe's own four-workflow eval — treat it as a mid-tier, fast, cheap signal, not ground truth. Every Jev decision above a risk threshold should still have a human escalation path, never a silent auto-execute for high-stakes cases.
- Accuracy drops as the state blob fills with irrelevant content — curate what you send per call; don't dump the whole agent history in.
- Batch the three questions for one payment into a single call for latency/cost reasons.

Question set for the demo (design these three as `Choice`/`Score`/`Noul` per the current API):
- **Noul**: "Does this vendor's behavior look anomalous relative to this agent's payment history?" (curated summary of recent history in state, not raw logs)
- **Score**: counterparty risk tier, 1–5
- **Choice**: route — `auto_approve` / `escalate_to_human` / `block`

### 6.4 LangGraph Agent Layer
Three purchasing-agent personas for the demo, each with a budget and a mandate:
- **Cloud Infra Agent**
- **Marketing Tools Agent**
- **Contractor Payments Agent**

Plus a small set of simulated vendor agents/personas they negotiate with. Agents should generate realistic-looking payment requests (not hardcoded canned transactions) that flow into the Policy Engine.

### 6.5 FastAPI + Postgres Backend
Own the data model: agents, budgets, vendors, payment requests (with full audit trail — status transitions, timestamps, who/what approved), and the plaintext record of everything (see Section 6.6 for why this is deliberate, not a leak).

### 6.6 Next.js Ops/Compliance Dashboard
This is the "who's accountable when an autonomous agent spends money" answer, made visible. Screens:
- **Live agent activity feed** — requests as they're generated.
- **Pending approvals queue** — anything Jev routed to `escalate_to_human`.
- **Full audit log** — every payment, every check result, every decision, in plaintext.
- **"Reveal to auditor" control** — a deliberate demo of Zcash viewing-key-based selective disclosure: an otherwise-shielded transaction's details get decrypted and shown, on demand, to a simulated "auditor" role.

**Have a crisp, rehearsed answer ready for "what's actually private, and from whom?"**: the public chain reveals nothing to outside observers or other agents. Your own backend necessarily sees plaintext state, because it *is* the trusted, counterparty-facing operator side of the system — that's a deliberate architectural boundary, not an oversight. Say this proactively in the demo, don't wait to be asked.

### 6.7 FROST (Stretch Goal — scope this honestly)
The Zcash Foundation's FROST tooling is real and actively maintained, but as of the most recent engineering work, frost-client/frost-server are still adding encryption and authentication between participants — this is pre-1.0 tooling. Time-box this hard. Acceptable outcomes, in order of ambition:
1. Live 2-of-3 signing of one real testnet transaction, demoed on stage.
2. A working local simulation of the threshold-signing flow (not networked/production-shaped) that still demonstrates the concept.
3. If neither is achievable in the time-boxed window: cut it, keep it as a documented "here's exactly how this extends to enterprise wire-approval workflows (2-of-3 sign-off above $X)" slide with a partial code sketch. **A polished cut feature beats a broken demoed one — do not let this eat the buffer meant for Phase 8/9.**

---

## 7. Demo Script (what actually happens on stage)

1. Cloud Infra Agent needs to renew a hosting contract; generates a payment request to an approved vendor.
2. Deterministic check passes (amount matches quote, vendor approved, within budget).
3. Jev evaluates in under a second: low risk, auto-approve.
4. A real shielded testnet Zcash transaction executes. Show the public block explorer: it reveals nothing usable.
5. Show the dashboard: full detail visible to the operator, exactly as it should be.
6. Second example: Contractor Payments Agent requests an unusually large payment to a new vendor. Jev flags it — escalate. It shows up in the pending-approvals queue. A human approves it on the dashboard.
7. If a payment exceeds the FROST threshold, show the 2-of-3 sign-off happening (live or simulated, per Section 6.7's outcome).
8. Click "reveal to auditor" on one transaction — show selective disclosure working. This is the beat that pre-empts the compliance objection.
9. Close on the TAM slide and the one-line pitch from Section 2.

---

## 8. Build Phases

Work through these in order. Each phase has a Definition of Done — do not move on until it's met.

**Phase 1 — Zcash Settlement Proof (Days 1–2)**
Real shielded send working via zingolib CLI against testnet lightwalletd.
*DoD*: a transaction you sent shows up confirmed on a testnet block explorer.

**Phase 2 — Rust Sidecar (Days 3–4)**
Minimal HTTP service wrapping zingolib: create/check wallet, build+broadcast shielded tx, check status.
*DoD*: FastAPI can trigger a shielded testnet send via an HTTP call to the sidecar and get a real confirmed tx back.

**Phase 3 — Backend Core (Days 5–6)**
FastAPI + Postgres: agents, vendors, budgets, payment requests, audit trail. Deterministic Policy Engine (Section 6.2) wired to Phase 2's sidecar.
*DoD*: a manually-created payment request that passes all deterministic checks results in a real testnet shielded payment; one that fails any check is rejected with a logged reason.

**Phase 4 — Agent Layer (Days 7–8)**
LangGraph purchasing personas + simulated vendors generating real payment requests into Phase 3's pipeline.
*DoD*: running the system produces a stream of varied, realistic payment requests without manual input.

**Phase 5 — Jev Integration (Days 9–10)**
Read current TypeSafe/Vercel AI Gateway docs first. Implement the question set from Section 6.3, wired in after deterministic checks pass, before the sidecar call.
*DoD*: every request that clears deterministic checks gets a real Jev decision (not a stub) in under ~1 second, and the route decision correctly gates execution.

**Phase 6 — Dashboard (Days 11–12)**
Next.js screens from Section 6.6, including the selective-disclosure demo control.
*DoD*: someone with no context can watch the dashboard and understand what's happening and why, without narration.

**Phase 7 — FROST (Days 13–14, hard time-box)**
Per Section 6.7's tiered outcomes.
*DoD*: whichever of the three tiers is achieved, it's clearly and honestly represented — never claim more than what's actually working.

**Phase 8 — Pitch & Compliance Assets (Day 15)**
- Pitch deck following Section 2 and the demo script (Section 7).
- TAM slide with the Gartner citation.
- Objection-handling slide (selective disclosure).
- README covering architecture, setup, and the privacy threat model (Section 6.6's "what's private from whom" answer, written down, not just rehearsed).
- Third-party dependency disclosure list (Section 10).
- LICENSE file (MIT or Apache-2.0).

**Phase 9 — Buffer & Submission (Days 16–17)**
Demo video, final bug fixes, both team-leader and (if applicable) member registration confirmed on colosseum.com, submission uploaded with real margin before the deadline — not at 11:58pm PT on Oct 12.

---

## 9. Judging Criteria — Make Sure Every Phase Serves These

| Criterion | How this build satisfies it |
|---|---|
| **Functionality** | Phases 1–6 produce a real, working end-to-end flow, not mocked pieces |
| **Potential Impact** | Section 2's TAM + enterprise narrative |
| **Novelty** | The Zcash-privacy + non-hallucinating-decision-model pairing is genuinely uncommon |
| **UX** | Phase 6's dashboard is the primary UX surface — invest real time here |
| **Open-source** | MIT/Apache-2.0 license, clean repo, from Phase 8 onward — don't bolt this on at the last minute |
| **Business Plan** | Section 2's pitch + sourced TAM + a clear "who pays and why" answer |

---

## 10. Third-Party Dependency Disclosure (keep this updated as you build)

Start this list now and add to it as dependencies are introduced. At minimum expect: LangGraph, FastAPI, Next.js, PostgreSQL driver, zingolib, the TypeSafe/Jev SDK (via Vercel AI Gateway / AI SDK), and whatever FROST library is used in Phase 7. Include this list in the final submission per Section 3's disclosure requirement.

---

## 11. Working Agreement

- Prototype the riskiest unknown first in each phase (this is why Phase 1 is a CLI test before any wrapper code exists).
- Never fabricate a demo — if something doesn't work, cut it or clearly label it as simulated, don't fake it and hope no one asks.
- Don't invent numbers, benchmarks, or capabilities in the pitch that the code doesn't actually back up.
- If a phase's scope turns out to be wrong given real time constraints, say so explicitly rather than quietly descoping — the plan should stay honest and current, not aspirational.
- Commit and check in progress against each phase's Definition of Done before declaring it complete.
