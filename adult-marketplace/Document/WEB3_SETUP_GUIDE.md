# 🚀 Web3 Payment System - Complete Setup Guide

This guide will walk you through setting up the entire Web3 payment system from scratch.

---

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Git
- Metamask wallet (for deployment)
- ~$50 USD worth of MATIC (for contract deployment and testing)

---

## 🎯 PHASE 1: Get API Keys (30 minutes)

### 1.1 Web3Auth (Social Login)

**Purpose:** Allow users to login with Google/Facebook and auto-create crypto wallet

**Steps:**
1. Go to: https://dashboard.web3auth.io/
2. Sign up / Login
3. Create New Project
   - Name: "PrideConnect"
   - Environment: Mainnet
4. Configure:
   - Add `http://localhost:5173` to Whitelist
   - Add `http://localhost:5000` to Whitelist
   - Enable: Google, Facebook, Twitter, Discord
5. Copy **Client ID**
6. Save in `.env`:
```
   WEB3AUTH_CLIENT_ID=BPK...your_client_id
```

**Cost:** FREE (up to 1,000 monthly active users)

---

### 1.2 Transak (Fiat On-Ramp)

**Purpose:** Allow users to pay with PIX/Credit Card, auto-convert to USDC

**Steps:**
1. Go to: https://dashboard.transak.com/signup
2. Sign up
3. For Testing:
   - Use **Individual Account** (no LLC needed)
   - Complete basic KYC (passport + selfie)
   - Approval: 1-2 days
4. After approval:
   - Go to API Keys
   - Copy **Staging API Key** (for testing)
   - Copy **Webhook Secret**
5. Configure Webhook:
   - URL: `https://yourdomain.com/api/v1/payments/webhook/transak`
   - Events: All
6. Save in `.env`:
```
   TRANSAK_API_KEY=your_staging_key
   TRANSAK_ENV=STAGING
   TRANSAK_WEBHOOK_SECRET=your_webhook_secret
```

**Cost:** 
- Testing: FREE
- Production: 2.99% per transaction

**Note:** For production (real money), you'll need LLC documents later.

---

### 1.3 Alchemy RPC (Blockchain Provider)

**Purpose:** Connect to Polygon blockchain

**Steps:**
1. Go to: https://www.alchemy.com/
2. Sign up
3. Create App:
   - Name: PrideConnect
   - Chain: Polygon Mainnet
   - Network: Polygon Mainnet
4. Get API Key
5. Create another for testnet:
   - Chain: Polygon Mumbai (testnet)
6. Save in `.env`:
```
   POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
   MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
```

**Cost:** FREE (up to 300M compute units/month)

---

## 🔧 PHASE 2: Setup Development Environment (15 minutes)

### 2.1 Clone & Install
```bash