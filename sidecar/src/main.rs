mod routes;
mod wallet;

use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::wallet::ZivaWallet;

pub struct AppState {
    pub wallet: RwLock<Option<ZivaWallet>>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "ziva_sidecar=debug,axum=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let state = Arc::new(AppState {
        wallet: RwLock::new(None),
    });

    let app = Router::new()
        .route("/health", get(routes::health_check))
        .route("/wallet/create", post(routes::create_wallet))
        .route("/wallet/info", get(routes::wallet_info))
        .route("/send", post(routes::send_tx))
        .route("/tx/:txid/status", get(routes::tx_status))
        .layer(cors)
        .with_state(state);

    let port = std::env::var("SIDECAR_PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    tracing::info!("Starting sidecar on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
