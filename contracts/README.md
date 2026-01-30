# PrideConnect Smart Contracts

Smart contracts for Web3 P2P payment system on Polygon.

## 📋 Overview

This directory contains the smart contracts for PrideConnect's decentralized payment system:

- **PaymentSplitter.sol**: Main contract that automatically splits payments 90% to creators, 10% to platform
- **MockUSDC.sol**: Mock USDC token for local testing

## 🏗️ Architecture

```

Contract automatically splits:
  → 90% to Creator wallet
  → 10% to Platform wallet
         ↓
Event emitted for backend tracking
```

## 🚀 Setup

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

Required variables:
- `DEPLOYER_PRIVATE_KEY`: Private key for deployment
- `POLYGON_RPC_URL`: Alchemy/Infura RPC URL for Polygon
- `MUMBAI_RPC_URL`: RPC URL for Mumbai testnet
- `POLYGONSCAN_API_KEY`: For contract verification
- `PLATFORM_WALLET_ADDRESS`: Wallet to receive platform fees

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run tests with gas reporting:
```bash
REPORT_GAS=true npm test
```

Run tests with coverage:
```bash
npm run coverage
```

## 📦 Compilation

Compile contracts:
```bash
npm run compile
```

## 🚢 Deployment

### Deploy to Mumbai Testnet

```bash
npm run deploy:testnet
```

### Deploy to Polygon Mainnet

```bash
npm run deploy:mainnet
```

Deployment info will be saved to `deployments/` directory.

## ✅ Verification

Contracts are automatically verified on Polygonscan after deployment.

Manual verification:
```bash
npx hardhat verify --network polygon <CONTRACT_ADDRESS> <USDC_ADDRESS> <PLATFORM_WALLET>
```

## 📊 Contract Details

### PaymentSplitter

**Key Features:**
- Automatic 90/10 split
- Batch payment processing (gas optimization)
- Pausable (emergency stop)
- Emergency withdrawal (owner only)
- Minimum payment amount protection
- Comprehensive event logging

**Functions:**
- `processPayment(creator, amount, orderId)` - Process single payment
- `processPaymentBatch(creators[], amounts[], orderIds[])` - Process multiple payments
- `updatePlatformWallet(newWallet)` - Update platform wallet (owner only)
- `pause()` / `unpause()` - Emergency pause (owner only)
- `emergencyWithdraw(token, to, amount)` - Emergency withdrawal (owner only)

**Events:**
- `PaymentReceived` - Emitted on each payment with full details
- `PlatformWalletUpdated` - Platform wallet changed
- `MinPaymentAmountUpdated` - Minimum amount changed
- `EmergencyWithdrawal` - Emergency withdrawal executed

## 🔒 Security

- Uses OpenZeppelin contracts for security
- ReentrancyGuard on payment functions
- Pausable for emergency stops
- Owner-only admin functions
- Minimum payment amount to prevent dust attacks

## 📝 USDC Addresses

**Polygon Mainnet:**
- USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

**Mumbai Testnet:**
- USDC: `0x0FA8781a83E46826621b3BC094Ea2A0212e71B23`

## 💰 Gas Costs (Estimated)

- Deploy: ~$0.50
- Single payment: ~$0.01
- Batch payment (10 items): ~$0.03

## 🔗 Useful Links

- [Polygon Docs](https://docs.polygon.technology/)
- [Hardhat Docs](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Polygonscan](https://polygonscan.com/)

## 📞 Support

For issues or questions, contact the development team.
