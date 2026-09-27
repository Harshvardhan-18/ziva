FROM rust:1.77-slim-bookworm AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
# Install build dependencies if zingolib requires any C libraries (e.g. build-essential, pkg-config, libssl-dev)
RUN apt-get update && apt-get install -y pkg-config libssl-dev build-essential
# Note: Since there is no Cargo.lock, the `COPY Cargo.lock* ./` prevents it from failing if Cargo.lock doesn't exist yet
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/ziva-sidecar /usr/local/bin/
EXPOSE 3001
CMD ["ziva-sidecar"]
