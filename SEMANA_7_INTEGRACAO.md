# Semana 7: Limpeza Backend & Integração com Dados Reais

## Resumo
Semana focada em limpar arquivos do projeto anterior (PrideConnect) e conectar o frontend com dados reais da blockchain através de uma camada de indexação.

## Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  ExplorePage     │  │ TokenDetailPage  │  │ MyPortfolioPage│ │
│  │  (useTokenList)  │  │ (useToken)       │  │ (usePortfolio) │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                     │                     │          │
│           └─────────────────────┼─────────────────────┘          │
│                                 ▼                                │
│                    ┌───────────────────────┐                     │
│                    │   useTokens.js        │                     │
│                    │   (React Query)       │                     │
│                    └───────────┬───────────┘                     │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ HTTP API
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ token.routes.js  │  │portfolio.routes.js│ │ ai.routes.js   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                     │                     │          │
│           └─────────────────────┼─────────────────────┘          │
│                                 ▼                                │
│                    ┌───────────────────────┐                     │
│                    │   tokenService.js     │                     │
│                    └───────────┬───────────┘                     │
│                                │                                 │
│                    ┌───────────┴───────────┐                     │
│                    ▼                       ▼                     │
│         ┌─────────────────┐    ┌─────────────────────────┐       │
│         │   PostgreSQL    │    │  blockchainSyncService  │       │
│         │   (Prisma)      │◄───│  (Event Indexing)       │       │
│         └─────────────────┘    └───────────┬─────────────┘       │
└─────────────────────────────────────────────┼───────────────────┘
                                              │ Viem
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BASE SEPOLIA BLOCKCHAIN                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ TokenFactory │  │ BondingCurve │  │ YieldDistributor       │ │
│  │ (createToken)│  │ (buy/sell)   │  │ (claim)                │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Novos Arquivos Criados

### Backend

#### 1. `prisma/schema.prisma` (ATUALIZADO)
Novos models para o Launchpad:

```prisma
model Token {
  address         String   @id
  name            String
  symbol          String
  totalSupply     Decimal
  currentPrice    Decimal
  marketCap       Decimal
  volume24h       Decimal
  holdersCount    Int
  isGraduated     Boolean
  // ... relations
}

model Trade {
  type            TradeType   // BUY ou SELL
  ethAmount       Decimal
  tokenAmount     Decimal
  price           Decimal
  txHash          String
  // ... relations
}

model TokenHolder {
  balance         Decimal
  percentage      Decimal
  realizedPnl     Decimal
  unrealizedPnl   Decimal
  // ... relations
}

model YieldClaim {
  tokenAddress    String
  claimerAddress  String
  amount          Decimal
  // ... relations
}

model CreatorRating {
  rating          Int       // 1-5
  // ... relations
}

model SyncStatus {
  contractName      String
  lastSyncedBlock   Int
  // ... tracking sync progress
}
```

#### 2. `services/blockchainSyncService.js` (400+ linhas)
Serviço de indexação de eventos on-chain:

```javascript
// Sincroniza eventos da blockchain para PostgreSQL
class BlockchainSyncService {
  // Indexa eventos TokenCreated do TokenFactory
  async syncTokenCreatedEvents() { ... }
  
  // Indexa eventos BUY/SELL do BondingCurve
  async syncTradeEvents() { ... }
  
  // Indexa claims de yield
  async syncYieldClaimEvents() { ... }
  
  // Atualiza métricas do token
  async updateTokenMetrics(tokenAddress) { ... }
  
  // Sync contínuo a cada 30 segundos
  startContinuousSync(intervalMs = 30000) { ... }
}
```

#### 3. `services/tokenService.js` (320+ linhas)
Service layer para operações de tokens:

```javascript
class TokenService {
  getTokens({ page, limit, sortBy, sortOrder, filter })
  getTrendingTokens(limit)
  getRecentTokens(limit)
  getTokenByAddress(address)
  getTokenTrades(address, { page, limit })
  getTokenHolders(address, { page, limit })
  getPriceHistory(address, timeframe)
  getCreatorStats(creatorAddress)
  getUserHoldings(userAddress)
  getUserTrades(userAddress)
  getPlatformStats()
}
```

#### 4. `routes/token.routes.js`
Endpoints REST para tokens:

```
GET  /api/v1/tokens                    - Lista tokens com paginação
GET  /api/v1/tokens/trending           - Top tokens por volume
GET  /api/v1/tokens/recent             - Tokens recentes
GET  /api/v1/tokens/stats              - Estatísticas da plataforma
GET  /api/v1/tokens/:address           - Detalhes do token
GET  /api/v1/tokens/:address/trades    - Trades do token
GET  /api/v1/tokens/:address/holders   - Holders do token
GET  /api/v1/tokens/:address/chart     - Dados para gráfico
PUT  /api/v1/tokens/:address/metadata  - Atualizar metadata (creator only)
GET  /api/v1/tokens/creator/:address   - Tokens por criador
```

#### 5. `routes/portfolio.routes.js`
Endpoints para portfolio do usuário:

```
GET  /api/v1/portfolio                 - Holdings do usuário
GET  /api/v1/portfolio/trades          - Histórico de trades
GET  /api/v1/portfolio/created         - Tokens criados
GET  /api/v1/portfolio/stats           - Estatísticas agregadas
```

### Frontend

#### 1. `hooks/useTokens.js` (260+ linhas)
React Query hooks para dados de tokens:

```javascript
// Lista de tokens com paginação e filtros
useTokenList({ page, limit, sortBy, search })

// Trending tokens
useTrendingTokens(limit)

// Tokens recentes
useRecentTokens(limit)

// Detalhes de um token
useToken(address)

// Trades de um token
useTokenTrades(address)

// Holders de um token
useTokenHolders(address)

// Dados para gráfico
useTokenChart(address, timeframe)

// Portfolio do usuário
usePortfolio()
useUserTrades()
useCreatedTokens()
usePortfolioStats()

// Stats da plataforma
usePlatformStats()

// WebSocket para updates em tempo real
useTokenUpdates(tokenAddress)

// Hybrid: API com fallback blockchain
useTokenWithFallback(address)
```

### Páginas Atualizadas

1. **ExplorePage.jsx** - Agora usa `useTokenList()` com busca debounced
2. **TokenDetailPage.jsx** - Agora usa `useToken()` para dados reais
3. **HomePage.jsx** - Agora usa `useTrendingTokens()` e `usePlatformStats()`
4. **MyPortfolioPage.jsx** - Agora usa `usePortfolio()` e `usePortfolioStats()`

## Limpeza do Backend

### Rotas Mantidas (Core Launchpad)
```
✅ auth.routes.js          - Autenticação
✅ user.routes.js          - Perfil do usuário
✅ web3auth.routes.js      - Autenticação Web3
✅ token.routes.js         - Tokens (NOVO)
✅ portfolio.routes.js     - Portfolio (NOVO)
✅ creator.routes.js       - Criadores
✅ creatorDashboard.routes.js - Dashboard creator
✅ creatorSettings.routes.js  - Configurações creator
✅ notification.routes.js  - Notificações
✅ transaction.routes.js   - Transações
✅ trending.routes.js      - Trending
✅ crypto-payment.routes.js - Pagamentos crypto
✅ ai.routes.js            - IA Marketing
```

### Rotas para Remover (Legacy PrideConnect)
```
❌ chat.routes.js          - Chat privado (adult content)
❌ comment.routes.js       - Comentários em posts
❌ creatorPost.routes.js   - Posts de criadores
❌ creatorSubscribers.routes.js - Assinantes
❌ favorite.routes.js      - Favoritos
❌ like.routes.js          - Likes em posts
❌ live.routes.js          - Lives (adult content)
❌ message.routes.js       - Mensagens privadas
❌ post.routes.js          - Posts (adult content)
❌ subscription.routes.js  - Assinaturas pagas
❌ upload.routes.js        - Upload de mídia
```

## Como Executar

### 1. Migrar o Banco de Dados
```bash
cd backend
npx prisma migrate dev --name add_launchpad_models
```

### 2. Iniciar o Sync Service
```javascript
// Em server.js ou job separado
import blockchainSyncService from './src/services/blockchainSyncService.js';

// Sync inicial
await blockchainSyncService.fullSync();

// Sync contínuo a cada 30s
blockchainSyncService.startContinuousSync(30000);
```

### 3. Testar Endpoints
```bash
# Lista tokens
curl http://localhost:5000/api/v1/tokens

# Token específico
curl http://localhost:5000/api/v1/tokens/0x...

# Trending
curl http://localhost:5000/api/v1/tokens/trending

# Stats da plataforma
curl http://localhost:5000/api/v1/tokens/stats
```

## Fluxo de Dados

1. **Evento na Blockchain** (ex: TokenCreated)
2. **BlockchainSyncService** indexa o evento
3. **PostgreSQL** armazena os dados
4. **API REST** serve os dados
5. **React Query** faz cache e refresh
6. **Frontend** exibe dados reais

## Benefícios da Nova Arquitetura

1. **Performance**: Dados em PostgreSQL são muito mais rápidos que RPC calls
2. **Histórico**: Mantemos todo o histórico de trades e eventos
3. **Métricas**: Podemos calcular 24h volume, price change, etc.
4. **Busca**: Full-text search em tokens
5. **Paginação**: Eficiente para listas grandes
6. **Fallback**: Se API falhar, usamos blockchain diretamente

## Próximos Passos (Semana 8)

1. [ ] Deploy contratos no Base Sepolia
2. [ ] Deploy backend no Railway/Render
3. [ ] Deploy frontend no Vercel
4. [ ] Configurar domínio
5. [ ] Testes de integração
6. [ ] Monitoramento (Sentry, LogRocket)

---
**Status**: ✅ Semana 7 - 80% Completo
**Próximo**: Executar Prisma migration e testar integração
