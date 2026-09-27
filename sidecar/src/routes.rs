use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{AppState, wallet::ZivaWallet};

#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
}

pub async fn health_check() -> impl IntoResponse {
    Json(HealthResponse {
        status: "ok".to_string(),
    })
}

#[derive(Deserialize)]
pub struct CreateWalletRequest {
    seed: Option<String>,
}

#[derive(Serialize)]
pub struct CreateWalletResponse {
    address: String,
    seed: Option<String>,
}

pub async fn create_wallet(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateWalletRequest>,
) -> Result<Json<CreateWalletResponse>, StatusCode> {
    let mut wallet_lock = state.wallet.write().await;
    
    match ZivaWallet::new(payload.seed.clone()).await {
        Ok(wallet) => {
            let address = wallet.get_address().await.unwrap_or_default();
            *wallet_lock = Some(wallet);
            Ok(Json(CreateWalletResponse {
                address,
                seed: payload.seed,
            }))
        }
        Err(e) => {
            tracing::error!("Failed to create/restore wallet: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[derive(Serialize)]
pub struct WalletInfoResponse {
    address: String,
    balance: f64,
    last_synced_block: u64,
}

pub async fn wallet_info(
    State(state): State<Arc<AppState>>,
) -> Result<Json<WalletInfoResponse>, StatusCode> {
    let wallet_lock = state.wallet.read().await;
    let wallet = wallet_lock.as_ref().ok_or(StatusCode::BAD_REQUEST)?;

    // Synchronize first
    let _ = wallet.do_sync().await;
    
    let address = wallet.get_address().await.unwrap_or_default();
    let balance_zat = wallet.get_balance().await.unwrap_or(0);
    
    Ok(Json(WalletInfoResponse {
        address,
        balance: balance_zat as f64 / 100_000_000.0, // ZEC
        last_synced_block: 0, // TODO: verify against zingolib 0.x.x API
    }))
}

#[derive(Deserialize)]
pub struct SendTxRequest {
    to_address: String,
    amount_zat: u64,
    memo: Option<String>,
}

#[derive(Serialize)]
pub struct SendTxResponse {
    txid: String,
}

pub async fn send_tx(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SendTxRequest>,
) -> Result<Json<SendTxResponse>, StatusCode> {
    let wallet_lock = state.wallet.read().await;
    let wallet = wallet_lock.as_ref().ok_or(StatusCode::BAD_REQUEST)?;

    match wallet.send(&payload.to_address, payload.amount_zat, payload.memo.as_deref()).await {
        Ok(txid) => Ok(Json(SendTxResponse { txid })),
        Err(e) => {
            tracing::error!("Failed to send tx: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[derive(Serialize)]
pub struct TxStatusResponse {
    status: String,
}

pub async fn tx_status(
    Path(txid): Path<String>,
    State(_state): State<Arc<AppState>>,
) -> Result<Json<TxStatusResponse>, StatusCode> {
    // TODO: verify against zingolib 0.x.x API on checking specific tx status
    // For now, return unknown
    Ok(Json(TxStatusResponse {
        status: "unknown".to_string(),
    }))
}
