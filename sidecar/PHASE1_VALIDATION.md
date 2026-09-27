# Phase 1 Validation Guide

This document explains how to validate the Phase 1 setup (zingolib CLI test before integrating the Rust wrapper).

## Prerequisites

1. Get Zcash Testnet ZEC from the faucet: `https://faucet.zecpages.com/` or `https://faucet.ywallet.app/`
2. You will need a testnet lightwalletd endpoint: `https://testnet.zec.rocks:443`

## Steps to Validate

1. Download or build the `zingo-cli` from the official [zingolib repository](https://github.com/zingolabs/zingolib).
2. Create a new testnet wallet and note down the seed phrase:
   ```bash
   zingo-cli --chain testnet --server https://testnet.zec.rocks:443 new
   ```
3. Generate a unified address (shielded Orchard/Sapling):
   ```bash
   zingo-cli addresses
   ```
4. Request testnet ZEC to your shielded address from a faucet.
5. Sync the wallet to detect the incoming funds:
   ```bash
   zingo-cli sync
   ```
6. Check your balance:
   ```bash
   zingo-cli balance
   ```
   *Note: Ensure you have confirmed testnet ZEC.*
7. Send a shielded transaction (amount in ZEC):
   ```bash
   zingo-cli send <DESTINATION_TESTNET_ADDRESS> <AMOUNT>
   ```
8. The CLI will return a `txid`. Check the transaction status on a testnet block explorer (e.g., Zcash Block Explorer for testnet) using the `txid`.

Once you have successfully executed these steps, it confirms that the zingolib functionality, testnet network, and endpoint are working perfectly for shielded transactions.
