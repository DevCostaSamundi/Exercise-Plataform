# 🚀 OnlyFans Clone - Web3 Powered Content Platform

A modern, decentralized content creator platform built with **React**, **Node.js**, **Web3Auth**, and **Polygon blockchain**.

## ✨ Features

### 🔐 Authentication & Security
- ✅ Web3Auth social login (Google, Twitter, Discord, Email)
- ✅ Wallet-based authentication
- ✅ JWT token management
- ✅ Secure session handling

### 💰 Payment System
- ✅ **Crypto Payments** - Direct wallet payments with USDC
- ✅ **Balance System** - Internal wallet with instant payments
- ✅ **Smart Deposits** - Auto-detected blockchain deposits
- ✅ **Subscription Management** - Recurring payments
- ✅ **Tipping System** - One-time creator tips
- ✅ **Content Unlocking** - Pay-per-post system

### 👥 User Features
- ✅ Creator profiles
- ✅ Content posting (text, images, videos)
- ✅ Subscription tiers
- ✅ Direct messaging
- ✅ Notifications system
- ✅ Earnings dashboard

### 🎨 UI/UX
- ✅ Modern, responsive design
- ✅ Dark mode support
- ✅ Real-time updates
- ✅ Mobile-friendly interface
---
## 🛠️ Tech Stack
### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching
- **Web3Auth** - Authentication
- **Ethers.js** - Blockchain interaction

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Alchemy** - Blockchain API
- **JWT** - Authentication

### Blockchain
- **Polygon** - Layer 2 network
- **USDC** - Stablecoin payments
- **Smart Contracts** - Payment gateway
- **Web3Auth** - Wallet provider

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed
- ✅ **PostgreSQL 14+** installed
- ✅ **Git** installed
- ✅ **Web3Auth account** ([dashboard.web3auth.io](https://dashboard.web3auth.io))
- ✅ **Alchemy account** ([dashboard.alchemy.com](https://dashboard.alchemy.com))
- ✅ **Crypto wallet** with Polygon USDC (for testing)

---

## 🚀 Quick Start

### 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd onlyfans-clone
```

### 2️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start backend
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Start frontend
npm run dev
```

**Frontend runs on:** `http://localhost:5173`

---

## 🔧 Configuration

### Backend `.env` Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/onlyfans_db

# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here-change-this

# Web3Auth
WEB3AUTH_CLIENT_ID=your_web3auth_client_id
WEB3AUTH_VERIFIER_NAME=your_verifier_name

# Blockchain
NETWORK=polygon-amoy
CHAIN_ID=80002
RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
USDC_ADDRESS_POLYGON=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582
PAYMENT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Alchemy
ALCHEMY_API_KEY=your_alchemy_api_key
ALCHEMY_WEBHOOK_SECRET=your_webhook_secret
ALCHEMY_WEBHOOK_ID=your_webhook_id

# Platform
PLATFORM_FEE_PERCENTAGE=0.10
MIN_WITHDRAWAL=50
```

### Frontend `.env` Configuration

```env
# API
VITE_API_URL=http://localhost:5000/api/v1

# Web3Auth
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
VITE_WEB3AUTH_NETWORK=sapphire_devnet

# Blockchain
VITE_NETWORK=polygon-amoy
VITE_CHAIN_ID=80002
VITE_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
VITE_USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582
VITE_PAYMENT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Features
VITE_ENABLE_WEB3AUTH=true
VITE_ENABLE_CRYPTO_PAYMENTS=true
VITE_ENABLE_BALANCE_PAYMENTS=true
```

---

## ✅ Setup Checklist

### 🔐 Web3Auth Setup

- [ ] Create account at [dashboard.web3auth.io](https://dashboard.web3auth.io)
- [ ] Create new project
- [ ] Copy **Client ID** to both `.env` files
- [ ] Configure **Whitelist URLs**:
  - `http://localhost:5173` (development)
  - Your production domain
- [ ] Enable social providers (Google, Twitter, Discord)
- [ ] Create custom verifier (optional, for advanced auth)

### ⚡ Alchemy Setup

- [ ] Create account at [dashboard.alchemy.com](https://dashboard.alchemy.com)
- [ ] Create new app (Polygon Amoy for testnet)
- [ ] Copy **API Key** to both `.env` files
- [ ] Create **Address Activity Webhook**:
  - URL: `https://your-domain.com/api/v1/payments/webhook/alchemy`
  - Network: Polygon Amoy
  - Add your deposit addresses to watch list
- [ ] Copy **Webhook ID** and **Signing Secret** to `.env`

### 💾 Database Setup

- [ ] Install PostgreSQL
- [ ] Create database: `createdb onlyfans_db`
- [ ] Configure `DATABASE_URL` in backend `.env`
- [ ] Run migrations: `npx prisma migrate dev`
- [ ] Verify with: `npx prisma studio`

### 🪙 Polygon Testnet Setup

- [ ] Get Polygon Amoy MATIC from [faucet](https://faucet.polygon.technology/)
- [ ] Get test USDC:
  - Option 1: Use faucet at `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`
  - Option 2: Swap MATIC for USDC on testnet DEX
- [ ] Verify balance in MetaMask

### 🔗 Smart Contract Setup (Optional)

If deploying your own payment contract:

- [ ] Install Hardhat: `npm install --save-dev hardhat`
- [ ] Compile contracts: `npx hardhat compile`
- [ ] Deploy to Amoy: `npx hardhat run scripts/deploy.js --network amoy`
- [ ] Copy contract address to `.env` files
- [ ] Verify on explorer: `npx hardhat verify --network amoy CONTRACT_ADDRESS`

---

## 🧪 Testing

### Test User Flow

1. **Register/Login**
   ```
   Visit http://localhost:5173
   Click "Login with Google"
   Complete Web3Auth flow
   ```

2. **Deposit Funds**
   ```
   Go to /deposit
   Copy your deposit address
   Send USDC to address (min $10)
   Wait for confirmation (~30 seconds)
   ```

3. **Subscribe to Creator**
   ```
   Browse creators
   Click "Subscribe" ($9.99/month)
   Choose payment method:
   - Pay with Balance (instant)
   - Pay with Crypto (wallet confirmation)
   ```

4. **Create Content (as Creator)**
   ```
   Switch to creator mode
   Create new post
   Set price (optional)
   Upload media
   Publish
   ```

### API Testing

Use the provided Postman collection or test with curl:

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Get profile (requires auth)
curl http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check balance
curl http://localhost:5000/api/v1/auth/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📁 Project Structure

```
onlyfans-clone/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Web3Auth config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation
│   │   ├── models/          # Prisma models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers
│   ├── prisma/              # Database schema
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Route pages
│   │   ├── utils/           # Helpers
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🔄 Payment Flow

### Crypto Payment Flow

```
1. User clicks "Subscribe/Pay"
   ↓
2. PaymentModal opens
   ↓
3. User selects "Pay with Crypto"
   ↓
4. Backend creates payment order
   ↓
5. Frontend initiates Web3 transaction
   ↓
6. User confirms in wallet
   ↓
7. Transaction sent to blockchain
   ↓
8. Alchemy webhook detects transaction
   ↓
9. Backend verifies & confirms payment
   ↓
10. User gets access to content
```

### Balance Payment Flow

```
1. User clicks "Subscribe/Pay"
   ↓
2. PaymentModal opens
   ↓
3. User selects "Pay with Balance"
   ↓
4. Backend checks balance
   ↓
5. Deduct from user balance
   ↓
6. Add to creator balance
   ↓
7. Grant access immediately
   ↓
8. Send notifications
```

### Deposit Flow

```
1. User sends USDC to deposit address
   ↓
2. Transaction confirmed on blockchain
   ↓
3. Alchemy webhook triggers
   ↓
4. Backend verifies transaction
   ↓
5. Credit user balance
   ↓
6. Send notification
```

---

## 🚨 Troubleshooting

### Backend Issues

**Database Connection Error**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Reset database
npx prisma migrate reset
```

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 PID
```

### Frontend Issues

**Web3Auth Not Loading**
- Check `VITE_WEB3AUTH_CLIENT_ID` is correct
- Verify domain is whitelisted in Web3Auth dashboard
- Clear browser cache and cookies

**Payment Not Working**
- Check wallet has USDC balance
- Verify correct network (Polygon Amoy)
- Check Alchemy webhook is active
- Verify smart contract address

**Balance Not Updating**
- Check Alchemy webhook logs
- Verify deposit address is being monitored
- Check backend logs for errors

### Blockchain Issues

**Transaction Failing**
- Ensure sufficient MATIC for gas
- Check USDC allowance is set
- Verify contract address is correct

**Deposits Not Detected**
- Confirm webhook is receiving events
- Check webhook signature validation
- Verify address is in webhook watch list

---

## 🌐 Deployment

### Backend Deployment (Railway/Render)

1. **Prepare for production**
   ```bash
   # Set NODE_ENV
   NODE_ENV=production
   
   # Use production database
   DATABASE_URL=postgresql://prod-db-url
   ```

2. **Deploy**
   - Push to GitHub
   - Connect repository to Railway/Render
   - Set environment variables
   - Deploy

3. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy**
   - Push to GitHub
   - Connect repository to Vercel/Netlify
   - Set environment variables
   - Deploy

3. **Update Web3Auth**
   - Add production domain to whitelist
   - Update redirect URIs

### Post-Deployment

- [ ] Update Alchemy webhook URL to production
- [ ] Test all payment flows
- [ ] Monitor error logs
- [ ] Set up monitoring (Sentry)
- [ ] Configure CDN for media
- [ ] Set up backups

---

## 📊 Monitoring

### Recommended Tools

- **Application Monitoring**: [Sentry](https://sentry.io)
- **Uptime Monitoring**: [UptimeRobot](https://uptimerobot.com)
- **Analytics**: [Google Analytics](https://analytics.google.com)
- **Blockchain Explorer**: [PolygonScan](https://polygonscan.com)
- **Database**: [Prisma Studio](https://www.prisma.io/studio)

### Key Metrics to Monitor

- API response times
- Database query performance
- Payment success rate
- Blockchain transaction status
- User registration/retention
- Creator earnings
- Platform fees collected

---

## 🔒 Security Best Practices

### Backend Security
- ✅ Use strong JWT secrets
- ✅ Implement rate limiting
- ✅ Validate all inputs
- ✅ Sanitize database queries
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated
- ✅ Implement CORS properly

### Frontend Security
- ✅ Never expose private keys
- ✅ Validate user inputs
- ✅ Use environment variables
- ✅ Implement CSP headers
- ✅ Sanitize user content
- ✅ Use secure cookies

### Blockchain Security
- ✅ Verify transaction signatures
- ✅ Validate addresses
- ✅ Check allowances before transfers
- ✅ Use established token contracts
- ✅ Implement transaction limits
- ✅ Monitor for suspicious activity

---

## 📚 Resources

### Documentation
- [Web3Auth Docs](https://web3auth.io/docs)
- [Alchemy Docs](https://docs.alchemy.com)
- [Polygon Docs](https://docs.polygon.technology)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)

### Community
- [Web3Auth Discord](https://discord.com/invite/web3auth)
- [Polygon Discord](https://discord.com/invite/polygon)
- [Alchemy Discord](https://discord.com/invite/alchemy)

### Support
- Open an issue on GitHub
- Contact support@yourplatform.com

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👥 Authors

- **Your Name** - *Initial work*

---

## 🎉 Acknowledgments

- Web3Auth team for amazing authentication
- Alchemy for blockchain infrastructure
- Polygon for affordable transactions
- Open source community

---

## 📈 Roadmap

### Phase 1 (Current) ✅
- ✅ Basic authentication
- ✅ Creator profiles
- ✅ Content posting
- ✅ Crypto payments
- ✅ Balance system
- ✅ Subscriptions

### Phase 2 (Q2 2024)
- [ ] Live streaming
- [ ] Video calls
- [ ] Advanced analytics
- [ ] Mobile apps
- [ ] Multiple currencies
- [ ] NFT integration

### Phase 3 (Q3 2024)
- [ ] Creator tokens
- [ ] DAO governance
- [ ] Cross-chain support
- [ ] AI content moderation
- [ ] Advanced messaging

---

## 💡 FAQ

**Q: Do I need crypto to use the platform?**
A: Yes, users need USDC on Polygon for payments.

**Q: How long do deposits take?**
A: Usually 30-60 seconds after blockchain confirmation.

**Q: What are the platform fees?**
A: 10% platform fee on all transactions.

**Q: Can I withdraw my earnings?**
A: Yes, creators can withdraw to their wallet anytime.

**Q: Is this production-ready?**
A: This is a demo/template. Review and test thoroughly before production use.

---

## 🆘 Need Help?

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [Issues](https://github.com/your-repo/issues)
3. Join our [Discord](https://discord.gg/your-server)
4. Email support@yourplatform.com

---

**Built with ❤️ using Web3 technology**

*Last updated: January 28, 2026*