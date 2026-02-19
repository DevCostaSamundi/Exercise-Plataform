# Semana 3: Frontend Foundations - Plano Detalhado
## Objetivo: Transformar PrideConnect em Launchpad 2.0

**Timeline**: 7 dias  
**Foco**: Visual + UX + Integração Web3  
**Approach**: Detalhista, passo a passo, sem pular etapas

---

## 📋 Inventário Atual (PrideConnect)

### ✅ O que MANTER (65% aproveitamento)
```
src/
├── config/
│   ├── wagmi.config.js        ✅ MANTER (Web3 config)
│   ├── web3auth.config.js     ✅ MANTER (Login social)
│   └── constants.js           ⚠️  ADAPTAR (mudar valores)
├── contexts/
│   ├── AuthContext.jsx        ✅ MANTER (100%)
│   ├── NotificationContext.jsx ✅ MANTER (100%)
│   └── SocketContext.jsx      ⚠️  ADAPTAR (eventos diferentes)
├── hooks/
│   ├── useDebounce.js         ✅ MANTER
│   ├── useInfiniteScroll.js   ✅ MANTER
│   └── useSocket.js           ⚠️  ADAPTAR
├── components/
│   ├── ErrorBoundary.jsx      ✅ MANTER
│   ├── ErrorMessage.jsx       ✅ MANTER
│   ├── LoadingSpinner.jsx     ✅ MANTER
│   ├── ProtectedRoute.jsx     ✅ MANTER
│   ├── CryptoPaymentModal.jsx ⚠️  ADAPTAR (para buy tokens)
│   ├── Web3PaymentModal.jsx   ⚠️  ADAPTAR
│   ├── layout/                ✅ MANTER (Header, Footer, etc)
│   └── common/                ✅ MANTER (Button, Input, etc)
├── utils/
│   └── formatters.js          ✅ MANTER
└── services/
    └── api.js                 ⚠️  ADAPTAR (novos endpoints)
```

### ❌ O que DELETAR (conteúdo adulto)
```
- pages/Creator/ (todo o diretório)
- pages/subscriber/ (todo o diretório)
- pages/ProductPage.jsx
- pages/FavoritesPage.jsx
- pages/MySubscriptionsPage.jsx
- components/AgeGate.jsx
- components/CreatorSidebar.jsx
- components/DMButton.jsx
- components/TipModal.jsx
- components/WithdrawalModal.jsx
- components/ImageViewer.jsx
- components/CommentSection.jsx
- components/LikeButton.jsx
- components/subscriber/
```

### 🔄 O que ADAPTAR
```
- pages/HomePage.jsx → LaunchpadHome.jsx
- pages/ExplorePage.jsx → ExplorePage.jsx (mudar cards)
- pages/TrendingPage.jsx → TrendingPage.jsx (mudar cards)
- components/Sidebar.jsx → TokenSidebar.jsx
- components/RightSidebar.jsx → TrendingSidebar.jsx
```

---

## 🎯 Deliverables da Semana 3

### DIA 1-2: Limpeza e Setup Base

#### Passo 1.1: Limpar arquivos desnecessários
```bash
# Deletar pastas e arquivos de conteúdo adulto
rm -rf src/pages/Creator/
rm -rf src/pages/subscriber/
rm -rf src/components/subscriber/
rm src/pages/ProductPage.jsx
rm src/pages/FavoritesPage.jsx
rm src/pages/MySubscriptionsPage.jsx
rm src/components/AgeGate.jsx
rm src/components/CreatorSidebar.jsx
rm src/components/DMButton.jsx
rm src/components/TipModal.jsx
rm src/components/WithdrawalModal.jsx
rm src/components/ImageViewer.jsx
rm src/components/CommentSection.jsx
rm src/components/LikeButton.jsx
rm src/components/LiveChatInput.jsx
```

#### Passo 1.2: Atualizar constants.js
```javascript
// src/config/constants.js
export const APP_NAME = 'Launchpad 2.0';
export const APP_DESCRIPTION = 'Launch memecoins on Base Network';
export const NETWORK = 'base-sepolia'; // Testnet
export const NETWORK_NAME = 'Base Sepolia';
export const CHAIN_ID = 84532;

// Contract Addresses (Base Sepolia)
export const CONTRACTS = {
  TOKEN_FACTORY: '0x...', // Será preenchido após deploy
  BONDING_CURVE: '0x...',
  LIQUIDITY_LOCKER: '0x...',
  YIELD_DISTRIBUTOR: '0x...',
  CREATOR_REGISTRY: '0x...',
  FEE_COLLECTOR: '0x...',
};

// UI Constants
export const COLORS = {
  primary: '#6366f1',      // Indigo
  secondary: '#8b5cf6',    // Purple
  success: '#10b981',      // Green
  danger: '#ef4444',       // Red
  warning: '#f59e0b',      // Amber
};

export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  TRENDING: '/trending',
  CREATE: '/launch',
  PORTFOLIO: '/portfolio',
  TOKEN: '/token/:address',
  CREATOR: '/creator/:address',
  HELP: '/help',
  SAFETY: '/safety',
};
```

#### Passo 1.3: Criar ABIs pasta
```bash
mkdir -p src/abis
# Copiar ABIs dos contratos compilados
```

---

### DIA 2-3: Criar Novos Hooks Web3

#### Hook 1: useTokenFactory.js
```javascript
// src/hooks/useTokenFactory.js
import { useContractRead, useContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import TokenFactoryABI from '../abis/TokenFactory.json';
import { CONTRACTS } from '../config/constants';

export function useTokenFactory() {
  // Read: Get recent tokens
  const { data: recentTokens, isLoading: loadingTokens } = useContractRead({
    address: CONTRACTS.TOKEN_FACTORY,
    abi: TokenFactoryABI,
    functionName: 'getRecentTokens',
    args: [20], // últimos 20 tokens
    watch: true, // auto-refresh
  });

  // Write: Create token
  const { write: createToken, isLoading: creating } = useContractWrite({
    address: CONTRACTS.TOKEN_FACTORY,
    abi: TokenFactoryABI,
    functionName: 'createToken',
  });

  const handleCreateToken = async (name, symbol, supply) => {
    const launchFee = parseEther('0.001'); // 0.001 ETH
    
    return createToken({
      args: [name, symbol, supply],
      value: launchFee,
    });
  };

  return {
    recentTokens,
    loadingTokens,
    createToken: handleCreateToken,
    creating,
  };
}
```

#### Hook 2: useBondingCurve.js
```javascript
// src/hooks/useBondingCurve.js
import { useContractRead, useContractWrite } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import BondingCurveABI from '../abis/BondingCurve.json';
import { CONTRACTS } from '../config/constants';

export function useBondingCurve(tokenAddress) {
  // Get current price
  const { data: marketData } = useContractRead({
    address: CONTRACTS.BONDING_CURVE,
    abi: BondingCurveABI,
    functionName: 'markets',
    args: [tokenAddress],
    watch: true,
  });

  // Calculate buy cost
  const { data: buyCost } = useContractRead({
    address: CONTRACTS.BONDING_CURVE,
    abi: BondingCurveABI,
    functionName: 'calculateBuyCost',
    args: [tokenAddress, parseEther('1000')], // custo de 1000 tokens
    enabled: !!tokenAddress,
  });

  // Buy tokens
  const { write: buyTokens, isLoading: buying } = useContractWrite({
    address: CONTRACTS.BONDING_CURVE,
    abi: BondingCurveABI,
    functionName: 'buy',
  });

  // Sell tokens
  const { write: sellTokens, isLoading: selling } = useContractWrite({
    address: CONTRACTS.BONDING_CURVE,
    abi: BondingCurveABI,
    functionName: 'sell',
  });

  const handleBuy = async (amount, maxCost) => {
    return buyTokens({
      args: [tokenAddress, amount, maxCost],
      value: maxCost,
    });
  };

  const handleSell = async (amount, minReturn) => {
    return sellTokens({
      args: [tokenAddress, amount, minReturn],
    });
  };

  return {
    currentPrice: marketData?.currentPrice,
    totalSupply: marketData?.totalSupply,
    buyCost,
    buyTokens: handleBuy,
    sellTokens: handleSell,
    buying,
    selling,
  };
}
```

#### Hook 3: useYieldClaim.js
```javascript
// src/hooks/useYieldClaim.js
import { useContractRead, useContractWrite } from 'wagmi';
import YieldDistributorABI from '../abis/YieldDistributor.json';
import { CONTRACTS } from '../config/constants';

export function useYieldClaim(userAddress) {
  // Get all tokens with pending yield
  // (precisa implementar backend helper que lista tokens do user)
  
  const { write: claimYield, isLoading: claiming } = useContractWrite({
    address: CONTRACTS.YIELD_DISTRIBUTOR,
    abi: YieldDistributorABI,
    functionName: 'claimMultiple',
  });

  const handleClaimAll = async (tokenAddresses) => {
    return claimYield({
      args: [tokenAddresses],
    });
  };

  return {
    claimYield: handleClaimAll,
    claiming,
  };
}
```

#### Hook 4: useCreatorProfile.js
```javascript
// src/hooks/useCreatorProfile.js
import { useContractRead, useContractWrite } from 'wagmi';
import CreatorRegistryABI from '../abis/CreatorRegistry.json';
import { CONTRACTS } from '../config/constants';

export function useCreatorProfile(creatorAddress) {
  const { data: profile, isLoading } = useContractRead({
    address: CONTRACTS.CREATOR_REGISTRY,
    abi: CreatorRegistryABI,
    functionName: 'getProfile',
    args: [creatorAddress],
    enabled: !!creatorAddress,
  });

  const { data: stats } = useContractRead({
    address: CONTRACTS.CREATOR_REGISTRY,
    abi: CreatorRegistryABI,
    functionName: 'getStats',
    args: [creatorAddress],
    enabled: !!creatorAddress,
  });

  const { write: registerCreator } = useContractWrite({
    address: CONTRACTS.CREATOR_REGISTRY,
    abi: CreatorRegistryABI,
    functionName: 'registerCreator',
  });

  const handleRegister = async (name, bio, website, twitter, telegram) => {
    return registerCreator({
      args: [name, bio, website, twitter, telegram],
    });
  };

  return {
    profile,
    stats,
    isLoading,
    registerCreator: handleRegister,
  };
}
```

---

### DIA 3-4: Criar Novas Pages

#### Page 1: LaunchpadHome.jsx
**Design**: Hero section + Trending tokens grid + Create CTA

**Features**:
- Hero com título "Launch Your Memecoin on Base"
- Grid de 6 trending tokens (cards)
- CTA "Create Token" button (destaque)
- Stats: Total tokens, Total volume, Total creators

**Layout**:
```
┌─────────────────────────────────────────┐
│           HERO SECTION                  │
│  "Launch Your Memecoin on Base"        │
│  [Create Token Button]                  │
│                                         │
│  Stats: 125 tokens | $2.5M vol | 89 cr │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│         TRENDING TOKENS                 │
│  ┌────┐ ┌────┐ ┌────┐                  │
│  │ T1 │ │ T2 │ │ T3 │                  │
│  └────┘ └────┘ └────┘                  │
│  ┌────┐ ┌────┐ ┌────┐                  │
│  │ T4 │ │ T5 │ │ T6 │                  │
│  └────┘ └────┘ └────┘                  │
└─────────────────────────────────────────┘
```

#### Page 2: CreateTokenPage.jsx
**Design**: Form wizard (3 steps)

**Steps**:
1. **Token Info**: Name, Symbol, Supply
2. **Creator Profile**: Name, Bio, Social links
3. **Review & Launch**: Preview + gas estimate

**Validations**:
- Name: 3-50 characters
- Symbol: 2-10 characters, uppercase
- Supply: 1M - 1B tokens
- Bio: max 500 characters

#### Page 3: TokenDetailPage.jsx
**Design**: Split screen - Info esquerda, Trading direita

**Layout**:
```
┌──────────────────┬─────────────────────┐
│   TOKEN INFO     │   TRADING PANEL     │
│                  │                     │
│  Logo + Name     │  BUY / SELL tabs    │
│  Price: $0.001   │  Amount input       │
│  MCap: $50k      │  You pay: X ETH     │
│  Holders: 123    │  Slippage: 5%       │
│                  │  [Buy Button]       │
│  Creator profile │                     │
│  ⭐⭐⭐⭐⭐ 4.8  │  Recent trades:     │
│                  │  - Alice +1000      │
│  Description...  │  - Bob -500         │
│                  │  - Carol +2000      │
└──────────────────┴─────────────────────┘
```

#### Page 4: MyPortfolioPage.jsx
**Design**: Dashboard com holdings + yield

**Sections**:
1. **Total Balance**: ETH + USD value
2. **My Tokens**: Grid de tokens que o user possui
3. **My Creations**: Tokens que o user criou
4. **Pending Yields**: Claim all button

#### Page 5: ExplorePage.jsx (adaptar)
**Mudanças**:
- Trocar ProductCard por TokenCard
- Filtros: All, Trending, New, High Volume
- Sort: Price, Volume, Holders, Created

---

### DIA 4-5: Criar Componentes Novos

#### Component 1: TokenCard.jsx
**Props**: `token` (address, name, symbol, price, volume, holders)

**Design**:
```
┌─────────────────────────┐
│ 🪙 PEPE               │
│ $PEPE                   │
│                         │
│ Price: $0.00042         │
│ MCap: $420k             │
│ 24h Vol: $12.5k  +25%  │
│                         │
│ Creator: @pepelord ✓    │
│ ⭐⭐⭐⭐⭐ 4.9       │
│                         │
│ [View Details]          │
└─────────────────────────┘
```

#### Component 2: BuyPanel.jsx
**Features**:
- Tabs: BUY / SELL
- Amount input (com max button)
- Price preview (com slippage)
- Balance display
- Buy button (com loading state)
- Success/Error toast

#### Component 3: CreatorCard.jsx
**Props**: `creator` (address, name, rating, tokensCreated, totalVolume)

**Design**:
```
┌─────────────────────────┐
│ 👤 John Doe        ✓   │
│ @johndoe                │
│                         │
│ Rating: ⭐⭐⭐⭐⭐ 4.8  │
│ Tokens: 12              │
│ Volume: $125k           │
│                         │
│ [View Profile]          │
└─────────────────────────┘
```

#### Component 4: TokenSidebar.jsx (adaptar Sidebar.jsx)
**Menu items**:
- 🏠 Home
- 🔥 Trending
- 🔍 Explore
- 🚀 Create Token
- 💼 My Portfolio
- ❓ Help
- 🛡️ Safety

#### Component 5: TrendingSidebar.jsx (adaptar RightSidebar.jsx)
**Sections**:
- 🔥 Top 5 Gainers (24h)
- 🆕 Recently Created
- 👑 Top Creators

---

### DIA 5-6: Adaptar Componentes Existentes

#### 1. CryptoPaymentModal → BuyTokenModal
**Mudanças**:
- Título: "Buy [TOKEN_NAME]"
- Input: Amount de tokens (não USD)
- Preview: "You pay X ETH for Y tokens"
- Slippage warning
- Gas estimate

#### 2. Web3PaymentModal → SellTokenModal
**Similar ao BuyTokenModal mas inverso**

#### 3. App.jsx - Atualizar rotas
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LaunchpadHome from './pages/LaunchpadHome';
import CreateTokenPage from './pages/CreateTokenPage';
import TokenDetailPage from './pages/TokenDetailPage';
import MyPortfolioPage from './pages/MyPortfolioPage';
import ExplorePage from './pages/ExplorePage';
import TrendingPage from './pages/TrendingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LaunchpadHome />} />
        <Route path="/launch" element={<CreateTokenPage />} />
        <Route path="/token/:address" element={<TokenDetailPage />} />
        <Route path="/portfolio" element={<MyPortfolioPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/safety" element={<SafetyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### DIA 6-7: Styling e Polish

#### 1. Tailwind Theme
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        secondary: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
};
```

#### 2. Loading States
- Skeleton loaders para cards
- Spinner para transactions
- Progress bar para multi-step forms

#### 3. Responsive Design
- Mobile: 1 coluna
- Tablet: 2 colunas
- Desktop: 3 colunas + sidebars

#### 4. Animations
- Fade in para cards
- Slide in para modals
- Pulse para CTA buttons
- Success confetti para transactions

---

## 📊 Checklist de Validação

### Funcionalidades Core
- [ ] Wallet connection funciona (MetaMask/WalletConnect)
- [ ] Login social funciona (Web3Auth - Google/Twitter)
- [ ] Contract reads funcionam (getRecentTokens)
- [ ] Contract writes funcionam (createToken em testnet)
- [ ] Navegação entre páginas sem erros
- [ ] Sidebar responsiva (mobile menu)

### UI/UX
- [ ] Design consistente (cores, fonts, spacing)
- [ ] Loading states em todas requests
- [ ] Error handling com mensagens claras
- [ ] Success feedback (toasts/confetti)
- [ ] Responsive em 3 breakpoints
- [ ] Accessibility (keyboard nav, aria-labels)

### Performance
- [ ] First load < 3s
- [ ] Contract reads com cache
- [ ] Images otimizadas (lazy load)
- [ ] Code splitting (React.lazy)

---

## 🎨 Design System

### Typography
```css
/* Headings */
h1: text-4xl font-bold tracking-tight
h2: text-3xl font-semibold
h3: text-2xl font-medium
h4: text-xl font-medium

/* Body */
p: text-base leading-relaxed
small: text-sm text-gray-500
```

### Spacing
```
xs: 0.5rem (8px)
sm: 1rem (16px)
md: 1.5rem (24px)
lg: 2rem (32px)
xl: 3rem (48px)
```

### Components Base
```
Card: rounded-xl shadow-lg p-6
Button: rounded-lg px-6 py-3 font-medium
Input: rounded-lg border-2 px-4 py-2
```

---

## 🚀 Deployment Checklist

### Antes de testar:
- [ ] Deploy contratos no Base Sepolia
- [ ] Atualizar CONTRACTS addresses em constants.js
- [ ] Criar .env com RPC URLs
- [ ] Testar wallet connection
- [ ] Criar 2-3 tokens de teste

### Testing Plan:
1. Connect wallet
2. Create token (pagar gas real)
3. Buy tokens criados
4. Sell parte dos tokens
5. Verificar yield distribution
6. Rate creator
7. Claim yield

---

## 📝 Notas Importantes

### Prioridades:
1. **Funcionalidade** > Design bonito
2. **Contract integration** > UI polish
3. **Error handling** > Animações
4. **Mobile responsivo** > Desktop perfeito

### Atalhos permitidos (MVP):
- Charts podem ser simples (sem lightweight-charts)
- Apenas dark mode (sem light mode toggle)
- Apenas inglês (i18n depois)
- Apenas MetaMask support (outros wallets depois)

### Não pular:
- ❌ Validações de input
- ❌ Loading states
- ❌ Error boundaries
- ❌ Responsive mobile

---

## 🎯 Deliverable Final Semana 3

**O que deve estar funcionando:**
1. ✅ Home page mostrando tokens reais da blockchain
2. ✅ Create token page (form + transaction)
3. ✅ Token detail page (info + buy panel básico)
4. ✅ Wallet connection (MetaMask)
5. ✅ Navegação completa
6. ✅ UI responsiva
7. ✅ Error handling

**Métricas de sucesso:**
- User consegue criar token pagando gas real
- User consegue ver tokens na home
- User consegue navegar sem erros
- UI funciona em mobile + desktop
- Zero crashes/console errors

---

**Pronto para começar?** Vamos fazer passo a passo! 🚀
