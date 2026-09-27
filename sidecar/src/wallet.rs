//! ZivaWallet: thin wrapper around zingolib v6 LightClient for ZIVA sidecar.
//!
//! zingolib v6 uses a two-step propose → execute pattern for sending:
//!   1. `client.propose_send(TransactionRequest, account_id)` → stored proposal
//!   2. `client.execute_proposal()` → Vec<TransmitReport> (one per step)
//!
//! The wallet must be synced before balances are accurate and before
//! proposals can be built. Sync is async and can run in background.

use std::path::PathBuf;

use anyhow::{Context, Result, anyhow};
use tracing::{debug, info, warn};

use zingolib::{
    config::{ChainType, ClientConfig, WalletConfig, lib_birthday},
    lightclient::LightClient,
    wallet::WalletBase,
};

/// The testnet lightwalletd endpoint.
const TESTNET_LIGHTWALLETD: &str = "https://testnet.zec.rocks:443";

/// Wallet data directory inside the sidecar's storage.
const WALLET_DIR: &str = "/app/wallet";

/// ZIP-32 account 0 (the only account ZIVA uses).
const ACCOUNT_ZERO: zip32::AccountId = zip32::AccountId::ZERO;

pub struct ZivaWallet {
    pub client: LightClient,
}

impl ZivaWallet {
    /// Create or restore a testnet wallet.
    ///
    /// If `seed_phrase` is `Some`, the wallet is restored from that mnemonic
    /// at the testnet Library Birthday (= earliest safe height for a fresh wallet).
    /// If `None`, a brand-new wallet is generated.
    pub async fn new(seed_phrase: Option<String>) -> Result<Self> {
        // Ensure rustls provider is registered (required for TLS indexer URIs).
        zingo_netutils::ensure_default_crypto_provider();

        let server_uri: http::Uri = TESTNET_LIGHTWALLETD
            .parse()
            .context("parse lightwalletd URI")?;

        let wallet_dir = PathBuf::from(
            std::env::var("WALLET_DIR").unwrap_or_else(|_| WALLET_DIR.to_string()),
        );
        std::fs::create_dir_all(&wallet_dir).context("create wallet directory")?;

        let wallet_config = match seed_phrase {
            Some(phrase) => {
                info!("Restoring wallet from seed phrase (testnet)");
                WalletConfig::MnemonicPhrase {
                    phrase,
                    birthday: lib_birthday(ChainType::Testnet),
                }
            }
            None => {
                info!("Creating new testnet wallet");
                WalletConfig::NewSeed {
                    chain_height: lib_birthday(ChainType::Testnet),
                }
            }
        };

        let config = ClientConfig::builder()
            .data_dir(wallet_dir)
            .chain_type(ChainType::Testnet)
            .wallet_config(wallet_config)
            .indexer_uri(server_uri)
            .build()
            .context("build ClientConfig")?;

        let client = LightClient::new(config, false)
            .await
            .map_err(|e| anyhow!("LightClient::new failed: {e:?}"))?;

        Ok(Self { client })
    }

    /// Trigger a background sync and wait for it to complete.
    pub async fn sync(&mut self) -> Result<()> {
        use pepper_sync::wallet::SyncMode;

        debug!("Starting wallet sync...");
        self.client
            .start_sync(SyncMode::Normal)
            .await
            .map_err(|e| anyhow!("sync start failed: {e:?}"))?;

        // Poll until sync is complete (timeout: 120 s)
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(120);
        loop {
            use pepper_sync::wallet::SyncMode;
            let mode = self.client.sync_mode();
            if mode == SyncMode::NotRunning {
                break;
            }
            if std::time::Instant::now() > deadline {
                warn!("Sync timed out after 120 s — balance may be stale");
                break;
            }
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        }
        info!("Wallet sync complete");
        Ok(())
    }

    /// Return the wallet's current shielded (Orchard + Sapling) balance in zatoshis.
    pub async fn balance_zat(&self) -> Result<u64> {
        let wallet = self.client.wallet().read().await;
        let balance = wallet
            .spendable_balance_of_account(ACCOUNT_ZERO)
            .map_err(|e| anyhow!("balance error: {e:?}"))?;
        // balance is in zatoshis (u64)
        Ok(u64::from(balance))
    }

    /// Return the wallet's primary unified address as a string.
    pub async fn address(&self) -> Result<String> {
        let wallet = self.client.wallet().read().await;
        let addr = wallet
            .unified_address(ACCOUNT_ZERO)
            .map_err(|e| anyhow!("address error: {e:?}"))?;
        Ok(addr.encode(&ChainType::Testnet))
    }

    /// Build and broadcast a shielded transaction.
    /// Returns the txid hex string on success.
    /// Amount is in zatoshis (1 ZEC = 100_000_000 zatoshis).
    pub async fn send(
        &mut self,
        to_address: &str,
        amount_zat: u64,
        memo: Option<&str>,
    ) -> Result<String> {
        use zcash_address::ZcashAddress;
        use zcash_client_backend::zip321::{Payment, TransactionRequest};
        use zcash_protocol::{memo::MemoBytes, value::Zatoshis};

        let recipient: ZcashAddress = to_address
            .parse()
            .map_err(|e| anyhow!("invalid recipient address '{to_address}': {e}"))?;

        let amount = Zatoshis::from_u64(amount_zat)
            .map_err(|_| anyhow!("invalid amount: {amount_zat} zatoshis"))?;

        let memo_bytes: Option<MemoBytes> = memo
            .map(|m| MemoBytes::from_bytes(m.as_bytes()))
            .transpose()
            .map_err(|e| anyhow!("invalid memo: {e}"))?;

        let payment = Payment::new(recipient, amount, memo_bytes, None, None, vec![])
            .map_err(|e| anyhow!("invalid payment: {e}"))?;

        let request = TransactionRequest::new(vec![payment])
            .map_err(|e| anyhow!("invalid TransactionRequest: {e}"))?;

        // Step 1: Propose
        info!("Proposing send of {amount_zat} zat to {to_address}");
        self.client
            .propose_send(request, ACCOUNT_ZERO)
            .await
            .map_err(|e| anyhow!("propose_send failed: {e:?}"))?;

        // Step 2: Execute (build + transmit)
        info!("Executing proposal...");
        let reports = self
            .client
            .execute_proposal()
            .await
            .map_err(|e| anyhow!("execute_proposal failed: {e:?}"))?;

        // Return the first txid (simple sends always produce exactly one)
        let txid = reports
            .first()
            .map(|r| r.txid.to_string())
            .ok_or_else(|| anyhow!("execute_proposal returned no transactions"))?;

        info!("Transaction broadcast: txid={txid}");
        Ok(txid)
    }
}
