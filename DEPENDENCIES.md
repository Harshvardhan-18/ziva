# Third-Party Dependency Disclosure

This file satisfies the Colosseum Crypto World's Fair submission requirement for
disclosing all third-party and open-source dependencies. Updated as dependencies
are introduced throughout the build.

---

## Zcash Infrastructure

| Package | Version | License | Use |
|---------|---------|---------|-----|
| [zingolib](https://crates.io/crates/zingolib) | latest | MIT | Zcash shielded wallet library (Rust) |
| [zebrad](https://github.com/ZcashFoundation/zebra) | latest | MIT | Zcash full node (testnet) |
| [lightwalletd](https://github.com/zcash/lightwalletd) | latest | MIT | Compact block indexer |

> **Note**: `zcashd` is deliberately excluded — it reached end-of-life on July 18, 2026
> at block 3,417,100. All chain connectivity uses zebrad via lightwalletd/Zaino.

---

## Rust (Sidecar)

| Crate | License | Use |
|-------|---------|-----|
| [axum](https://crates.io/crates/axum) | MIT | HTTP server framework |
| [tokio](https://crates.io/crates/tokio) | MIT | Async runtime |
| [serde](https://crates.io/crates/serde) + serde_json | MIT/Apache-2.0 | Serialization |
| [tower](https://crates.io/crates/tower) | MIT | Middleware |
| [tower-http](https://crates.io/crates/tower-http) | MIT | CORS, tracing middleware |
| [tracing](https://crates.io/crates/tracing) | MIT | Structured logging |
| [anyhow](https://crates.io/crates/anyhow) | MIT/Apache-2.0 | Error handling |
| [uuid](https://crates.io/crates/uuid) | MIT/Apache-2.0 | UUID generation |

---

## Python (Backend)

| Package | License | Use |
|---------|---------|-----|
| [FastAPI](https://fastapi.tiangolo.com/) | MIT | REST API framework |
| [uvicorn](https://www.uvicorn.org/) | BSD | ASGI server |
| [SQLAlchemy](https://www.sqlalchemy.org/) | MIT | ORM |
| [Alembic](https://alembic.sqlalchemy.org/) | MIT | Database migrations |
| [asyncpg](https://github.com/MagicStack/asyncpg) | MIT | Async PostgreSQL driver |
| [pydantic](https://docs.pydantic.dev/) | MIT | Data validation |
| [python-dotenv](https://github.com/theskumar/python-dotenv) | BSD | Environment config |
| [LangGraph](https://github.com/langchain-ai/langgraph) | MIT | Agent orchestration |
| [langchain-core](https://github.com/langchain-ai/langchain) | MIT | LangChain core |
| [langchain-openai](https://github.com/langchain-ai/langchain) | MIT | OpenAI/LLM adapter |
| [typesafe-sdk](https://pypi.org/project/typesafe-sdk/) | MIT | Jev / TypeSafe System One client |
| [httpx](https://www.python-httpx.org/) | BSD | Async HTTP client |
| [python-jose](https://github.com/mpdavis/python-jose) | MIT | JWT handling |
| [sse-starlette](https://github.com/sysid/sse-starlette) | BSD | Server-Sent Events |

---

## JavaScript / TypeScript (Dashboard)

| Package | License | Use |
|---------|---------|-----|
| [Next.js](https://nextjs.org/) | MIT | React framework |
| [React](https://react.dev/) | MIT | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Apache-2.0 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | MIT | Utility-first CSS |
| [shadcn/ui](https://ui.shadcn.com/) | MIT | Component library |
| [lucide-react](https://lucide.dev/) | ISC | Icons |
| [recharts](https://recharts.org/) | MIT | Data visualization |
| [date-fns](https://date-fns.org/) | MIT | Date utilities |

---

## Infrastructure

| Tool | License | Use |
|------|---------|-----|
| [PostgreSQL](https://www.postgresql.org/) | PostgreSQL License (permissive) | Relational database |
| [Docker](https://www.docker.com/) | Apache-2.0 (engine) | Containerization |
| [Docker Compose](https://docs.docker.com/compose/) | Apache-2.0 | Multi-service orchestration |

---

## AI / Decision Layer

| Service | License | Use |
|---------|---------|-----|
| [TypeSafe Jev](https://typesafe.ai/) (via Vercel AI Gateway) | Commercial API, no redistribution | Fuzzy judgment: anomaly detection, risk scoring, route classification |
| OpenAI API (via LangChain) | Commercial API | LangGraph agent reasoning |

> **Jev note**: Jev is TypeSafe's "System One" model — a structured decision model, not a
> generative LLM. It returns typed, constrained answers (Choice/Score/Noul), never free text.
> It scores ~68% on TypeSafe's four-workflow eval benchmark.

---

*Last updated: 2026-09-26. Update this file whenever a new dependency is added.*
