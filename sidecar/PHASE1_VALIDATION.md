# Phase 1 Validation — zingolib v6 Testnet Smoke Test

**Complete this BEFORE running any sidecar code. Validate the Zcash
connection in isolation first — this is the highest-risk item.**

---

## Prerequisites

### 1. Install Rust (nightly required for zingolib v6)
```powershell
# Windows
winget install Rustlang.Rustup
rustup update nightly
rustup default nightly  # zingolib v6 uses edition 2024

# Or if you prefer stable and edition 2024 is in stable:
rustup update stable
rustup default stable
```

### 2. Install build prerequisites (Windows)
```powershell
# Install protobuf compiler (required by zingolib's gRPC)
# Option A: Chocolatey
choco install protoc

# Option B: Scoop
scoop install protobuf

# Verify:
protoc --version
```

### 3. Install clang (required for some zingolib transitive deps)
```powershell
winget install LLVM.LLVM
# Set env var:
$env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"
```

---

## Step 1: Clone and build zingo-cli

```bash
git clone https://github.com/zingolabs/zingolib.git
cd zingolib

# Build just the CLI (this validates the full dep tree)
cargo build --package zingo-cli --release
```

**Expected**: Compiles in ~5–10 min (first time). If it fails,
check the error — most common issues are missing `protoc` or `clang`.

---

## Step 2: Connect to testnet

```bash
# From the zingolib directory:
./target/release/zingo-cli --chain testnet --server https://testnet.zec.rocks:443

# You should see the interactive prompt:
# Block:XXXXXX [Syncing XX / XX outputs]
```

**Confirm**: The wallet syncs and shows a block height > 0.

### Alternative public testnet endpoints (if testnet.zec.rocks is down):
- Check https://status.zec.rocks for current status
- Experimental: `https://zaino.testnet.unsafe.zec.rocks:443`

---

## Step 3: Get testnet ZEC from faucet

From the zingo-cli prompt:
```
> address
```
Copy the unified address. Then go to:
- **Testnet faucet**: https://faucet.zec.rocks/
- Request ZEC to your testnet unified address

After a few minutes:
```
> sync
> balance
```
You should see a non-zero testnet balance.

---

## Step 4: Send a test transaction

```
> send ztestsapling1... 100000 "ZIVA test send"
```

Where `ztestsapling1...` is ANY valid testnet shielded address 
(you can use the faucet address as recipient for a return payment).

**Confirm**:
- A txid is printed
- Check on testnet explorer: https://explorer.testnet.zec.rocks/

---

## Step 5: Verify and record

Document in this file:
- [ ] Synced to testnet block height: ______
- [ ] Received testnet ZEC: ______
- [ ] Sent test transaction txid: ______
- [ ] Confirmed on explorer: yes/no

**Only proceed to sidecar wrapper code after all boxes are checked.**

---

## What the sidecar does (for reference)

The Rust sidecar (`ziva-sidecar`) wraps zingolib v6's `LightClient` in an
Axum HTTP service. The flow it implements:

```
POST /send { to_address, amount_zat, memo }
  → client.propose_send(TransactionRequest, account_id)   // build proposal
  → client.execute_proposal()                             // sign + broadcast
  → returns { txid }
```

Key zingolib v6 API facts:
- `LightClient::new(ClientConfig, overwrite: bool) -> Result<Self>`
- `WalletConfig::NewSeed { chain_height }` — fresh wallet
- `WalletConfig::MnemonicPhrase { phrase, birthday }` — restore from seed
- `ChainType::Testnet` — testnet
- `lib_birthday(ChainType::Testnet)` → `4_134_000` (NU6.3 testnet activation)
- Send = propose_send → execute_proposal (two-step, NOT a single do_send)
- Amount unit: zatoshis (1 ZEC = 100_000_000 zat)

---

## Sidecar build (after Phase 1 passes)

```powershell
cd ziva/sidecar
$env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"
cargo build --release

# Run:
cp .env.example .env  # fill in WALLET_SEED if restoring
./target/release/ziva-sidecar
# → Listening on http://0.0.0.0:3001

# Health check:
curl http://localhost:3001/health
```
