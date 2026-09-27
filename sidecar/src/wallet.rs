use anyhow::Result;
use zingolib::lightclient::LightClient;
use zingoconfig::{ZingoConfig, ChainType};
use std::sync::Arc;

pub struct ZivaWallet {
    pub client: Arc<LightClient>,
}

impl ZivaWallet {
    pub async fn new(seed_phrase: Option<String>) -> Result<Self> {
        // testnet.zec.rocks:443
        let server_uri = "https://testnet.zec.rocks:443".parse()?;
        
        // TODO: verify against zingolib 0.x.x API
        // Creating config and setting lightwalletd_uri
        let mut config = ZingoConfig::build(ChainType::Testnet);
        config.set_lightwalletd_uri(server_uri);
        
        let client = if let Some(seed) = seed_phrase {
            // TODO: verify against zingolib 0.x.x API
            // Likely LightClient::create_from_wallet_base_async
            LightClient::create_from_wallet_base_async(
                zingolib::wallet::WalletBase::MnemonicPhrase(seed),
                &config,
                0, // height
                false, // overwrite
            ).await.map_err(|e| anyhow::anyhow!("Failed to restore wallet: {:?}", e))?
        } else {
            // TODO: verify against zingolib 0.x.x API
            // Likely LightClient::new or LightClient::create_new
            LightClient::new(&config, 0).map_err(|e| anyhow::anyhow!("Failed to create wallet: {:?}", e))?
        };

        Ok(Self {
            client: Arc::new(client),
        })
    }

    pub async fn do_sync(&self) -> Result<()> {
        // TODO: verify against zingolib 0.x.x API
        self.client.do_sync(true).await.map_err(|e| anyhow::anyhow!("Failed to sync: {:?}", e))?;
        Ok(())
    }

    pub async fn get_balance(&self) -> Result<u64> {
        // TODO: verify against zingolib 0.x.x API
        let _balance_info = self.client.do_balance().await;
        // Stub implementation
        Ok(0)
    }

    pub async fn get_address(&self) -> Result<String> {
        // TODO: verify against zingolib 0.x.x API
        let addresses = self.client.do_addresses().await;
        // Stub implementation
        Ok("ztestsapling1...".to_string())
    }

    pub async fn send(&self, _to_address: &str, _amount_zat: u64, _memo: Option<&str>) -> Result<String> {
        // TODO: verify against zingolib 0.x.x API
        // self.client.do_send(...)
        Ok("txid_stub".to_string())
    }
}
