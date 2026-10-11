//! ZivaWallet: thin wrapper around zingolib v6 LightClient for ZIVA sidecar.

use std::num::NonZeroU32;
use std::path::PathBuf;

use anyhow::{Context, Result, anyhow};
use tracing::{debug, info, warn};

use pepper_sync::config::{PerformanceLevel, SyncConfig, TransparentAddressDiscovery};
use zingolib::{
    config::{ChainType, ClientConfig, DEFAULT_WALLET_NAME, WalletConfig, lib_birthday},
    lightclient::LightClient,
    wallet::WalletSettings,
};

/// The testnet lightwalletd endpoint.
pub const TESTNET_LIGHTWALLETD: &str = "https://testnet.zec.rocks:443";

/// Wallet data directory inside the sidecar's storage.
const WALLET_DIR: &str = "/app/wallet";

/// ZIP-32 account 0 (the only account ZIVA uses).
const ACCOUNT_ZERO: zip32::AccountId = zip32::AccountId::ZERO;

pub struct ZivaWallet {
    pub client: LightClient,
}

impl ZivaWallet {
    /// Create or restore a testnet wallet.
    pub async fn new(seed_phrase: Option<String>) -> Result<Self> {
        // Ensure crypto provider is initialized
        zingolib::netutils::ensure_default_crypto_provider();

        let server_uri: http::Uri = TESTNET_LIGHTWALLETD
            .parse()
            .context("parse lightwalletd URI")?;

        let wallet_dir = PathBuf::from(
            std::env::var("WALLET_DIR").unwrap_or_else(|_| WALLET_DIR.to_string()),
        );
        std::fs::create_dir_all(&wallet_dir).context("create wallet directory")?;

        let wallet_file = wallet_dir.join(DEFAULT_WALLET_NAME);
        let no_of_accounts = NonZeroU32::try_from(1).expect("valid account count");
        let wallet_settings = WalletSettings {
            sync_config: SyncConfig {
                transparent_address_discovery: TransparentAddressDiscovery::default(),
                performance_level: PerformanceLevel::High,
                shutdown_on_completion: false,
            },
            min_confirmations: NonZeroU32::try_from(1).unwrap(),
        };

        let birthday = lib_birthday(ChainType::Testnet);

        let wallet_config = if let Some(phrase) = seed_phrase {
            info!("Restoring wallet from seed phrase (testnet)");
            WalletConfig::MnemonicPhrase {
                mnemonic_phrase: phrase,
                no_of_accounts,
                birthday,
                wallet_settings,
            }
        } else if wallet_file.exists() {
            info!("Reading existing wallet from disk");
            WalletConfig::Read
        } else {
            info!("Creating new testnet wallet");
            WalletConfig::NewSeed {
                no_of_accounts,
                chain_height: birthday,
                wallet_settings,
            }
        };

        let config = ClientConfig::builder()
            .set_chain_type(ChainType::Testnet)
            .set_wallet_dir(wallet_dir)
            .set_wallet_config(wallet_config)
            .set_indexer_uri(server_uri)
            .build()
            .map_err(|e| anyhow!("build ClientConfig failed: {e}"))?;

        let client = LightClient::new(config, false)
            .await
            .map_err(|e| anyhow!("LightClient::new failed: {e:?}"))?;

        Ok(Self { client })
    }

    /// Trigger sync and wait for completion.
    pub async fn do_sync(&mut self) -> Result<()> {
        debug!("Triggering wallet sync...");
        match self.client.sync().await {
            Ok(()) => {}
            Err(zingolib::lightclient::error::LightClientError::SyncModeError(
                pepper_sync::error::SyncModeError::SyncAlreadyRunning,
            )) => {
                debug!("Sync task already in progress");
            }
            Err(e) => return Err(anyhow!("sync failed: {e:?}")),
        }

        // Wait until sync is finished or timeout (120 s)
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(120);
        while self.client.sync_mode() != pepper_sync::wallet::SyncMode::NotRunning {
            if std::time::Instant::now() > deadline {
                warn!("Sync timed out after 120s");
                break;
            }
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        }
        info!("Wallet sync finished");
        Ok(())
    }

    /// Return the wallet's spendable confirmed balance in zatoshis.
    pub async fn get_balance(&mut self) -> Result<u64> {
        let bal = self
            .client
            .account_balance(ACCOUNT_ZERO)
            .await
            .map_err(|e| anyhow!("account_balance failed: {e:?}"))?;

        use zcash_protocol::value::Zatoshis;
        let ironwood = bal.confirmed_ironwood_balance.unwrap_or(Zatoshis::ZERO);
        let orchard = bal.confirmed_orchard_balance.unwrap_or(Zatoshis::ZERO);
        let sapling = bal.confirmed_sapling_balance.unwrap_or(Zatoshis::ZERO);
        let transparent = bal.confirmed_transparent_balance.unwrap_or(Zatoshis::ZERO);

        let total: u64 = u64::from(ironwood)
            + u64::from(orchard)
            + u64::from(sapling)
            + u64::from(transparent);

        Ok(total)
    }

    /// Return the primary encoded unified address.
    pub async fn get_address(&mut self) -> Result<String> {
        let addresses = self.client.unified_addresses_json().await;
        if let Some(first) = addresses.members().next() {
            if let Some(encoded) = first["encoded_address"].as_str() {
                return Ok(encoded.to_string());
            }
        }
        Err(anyhow!("No address found in wallet"))
    }

    /// Build and broadcast a shielded transaction using quick_send_reported.
    pub async fn send(
        &mut self,
        to_address: &str,
        amount_zat: u64,
        memo: Option<&str>,
    ) -> Result<String> {
        use zcash_address::ZcashAddress;
        use zcash_protocol::{memo::MemoBytes, value::Zatoshis};
        use zingolib::data::receivers::{Receiver, transaction_request_from_receivers};

        let recipient: ZcashAddress = to_address
            .parse()
            .map_err(|e| anyhow!("invalid recipient address '{to_address}': {e}"))?;

        let amount = Zatoshis::from_u64(amount_zat)
            .map_err(|_| anyhow!("invalid amount: {amount_zat} zatoshis"))?;

        let memo_bytes: Option<MemoBytes> = memo
            .map(|m| MemoBytes::from_bytes(m.as_bytes()))
            .transpose()
            .map_err(|e| anyhow!("invalid memo: {e}"))?;

        let receiver = Receiver {
            recipient_address: recipient,
            amount,
            memo: memo_bytes,
        };
        let request = transaction_request_from_receivers(vec![receiver])
            .map_err(|e| anyhow!("invalid TransactionRequest: {e}"))?;

        info!("Sending {amount_zat} zat to {to_address}...");
        let reports = self
            .client
            .quick_send_reported(request, ACCOUNT_ZERO, true)
            .await
            .map_err(|e| anyhow!("quick_send_reported failed: {e:?}"))?;

        let txid = reports.first().txid.to_string();
        info!("Transaction broadcasted successfully: txid={txid}");
        Ok(txid)
    }
}
