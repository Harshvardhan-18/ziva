FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed by asyncpg / cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    "sqlalchemy[asyncio]" \
    alembic \
    asyncpg \
    "pydantic>=2.0.0" \
    python-dotenv \
    langgraph \
    langchain-openai \
    langchain-core \
    typesafe-sdk \
    httpx \
    "python-jose[cryptography]" \
    passlib \
    sse-starlette

# Copy application code
COPY . .

# Run Alembic migrations then start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
