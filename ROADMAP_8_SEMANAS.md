# Roadmap Detalhado - Launchpad 2.0
## 8 Semanas até Mainnet

**Objetivo:** Lançar plataforma funcional de token launchpad na Base Network com yield, comunidade e IA.

**Branch:** `launchpad-2.0`  
**Timeline:** 8 semanas (56 dias)  
**Orçamento Marketing:** $50  
**Budget Infra:** $110-280/mês

---

## Status Atual ✅

- [x] Estrutura de branches criada
- [x] Base Network configurado (testnet + mainnet)
- [x] Hardhat setup completo
- [x] TokenFactory.sol implementado
- [x] Testes do TokenFactory (16/16 passing)
- [x] Documentação inicial (PROJETO_ESTRUTURA.md, README_LAUNCHPAD.md)

**Próximo Checkpoint:** Semana 1 - BondingCurve.sol

---

## SEMANA 1: Smart Contracts Core (Dias 1-7)

### Objetivo
Implementar os contratos fundamentais de precificação e liquidez.

### Deliverables

#### 1.1 BondingCurve.sol ⏳
**Responsabilidade:** Precificação automática baseada em supply/demand
```solidity
// Funcionalidades:
- calculatePrice(supply) // Função quadrática
- buy(tokenAddress, amount) // Compra tokens
- sell(tokenAddress, amount) // Vende tokens
- Integration com TokenFactory
- Slippage protection (max 5%)
```

**Testes necessários:**
- [x] Price calculation accuracy
- [x] Buy/sell operations
- [x] Slippage scenarios
- [x] Edge cases (supply = 0, very large amounts)

#### 1.2 LiquidityLocker.sol ⏳
**Responsabilidade:** Trava liquidez por 30 dias (obrigatório)
```solidity
// Funcionalidades:
- lockLiquidity(token, amount, duration) // Min 30 days
- unlock(lockId) // Só após timelock
- getLockInfo(lockId) // View function
- Emergency unlock (owner only, com penalty)
```

**Testes necessários:**
- [x] Lock creation
- [x] Timelock enforcement
- [x] Unlock after expiry
- [x] Emergency unlock penalty

#### 1.3 Deploy no Base Sepolia
```bash
npx hardhat run scripts/deploy-core.js --network baseSepolia
npx hardhat verify --network baseSepolia <address>
```

### Validação Semana 1
- [ ] 3 contratos deployados no testnet
- [ ] Verificados no BaseScan
- [ ] Testes 100% passing
- [ ] Gas consumption documented

**Estimativa Gas:** ~500k-800k total  
**ETH Testnet:** 0.05 ETH necessário

---

## SEMANA 2: Yield & Governance (Dias 8-14)

### Objetivo
Implementar distribuição de yield e sistema de governança.

### Deliverables

#### 2.1 YieldDistributor.sol ⏳
**Responsabilidade:** Distribuir 1% das taxas de trading para holders
```solidity
// Funcionalidades:
- distributeYield(token) // Calcula proporções
- claimYield(token) // User claim
- Snapshot system (Merkle tree ou iterativo)
- Integration com BondingCurve
```

**Design Decision:**
- Opção A: Merkle tree (gas eficiente, complexo)
- Opção B: Iterativo (simples, mais gas)
- **Escolha:** Iterativo para MVP, Merkle para v2

#### 2.2 CreatorRegistry.sol ⏳
**Responsabilidade:** Reputação on-chain dos criadores
```solidity
// Funcionalidades:
- registerCreator(profile) // Nome, bio, social
- rateCreator(address, rating) // 1-5 stars
- flagCreator(address, reason) // Report abuse
- getCreatorStats(address) // Tokens criados, rating médio
```

**Métricas:**
- Total de tokens criados
- Rating médio (weighted by token volume)
- Flags recebidas
- Tempo desde primeiro token

#### 2.3 FeeCollector.sol ⏳
**Responsabilidade:** Coletar e distribuir fees da plataforma
```solidity
// Funcionalidades:
- Recebe fees do BondingCurve
- Split: 60% team, 40% yield pool
- withdrawTeamFees() // Time lock 7 dias
- Integration com YieldDistributor
```

### Validação Semana 2
- [ ] 3 novos contratos deployados
- [ ] Integration tests entre contratos
- [ ] Yield distribution testado com 100 holders simulados
- [ ] Gas costs otimizados (<300k por distribuição)

---

## SEMANA 3: Frontend Foundations (Dias 15-21)

### Objetivo
Adaptar frontend do PrideConnect para Launchpad.

### Deliverables

#### 3.1 Component Migration
**Reusar do PrideConnect:**
```javascript
// Mantém (65% do código):
- Web3Auth integration (AuthContext.jsx)
- Wallet connection (wagmi.config.js)
- Modal system (CryptoPaymentModal.jsx)
- Loading states (LoadingSpinner.jsx)
- Error handling (ErrorBoundary.jsx)

// Deletar (conteúdo adulto):
- AgeGate.jsx
- CreatorSidebar.jsx (específico para conteúdo)
- DMButton.jsx
- Todas as pages em pages/Creator/

// Adaptar (mudar contexto):
- Sidebar.jsx -> TokenSidebar.jsx
- RightSidebar.jsx -> TrendingSidebar.jsx
- HomePage.jsx -> LaunchpadHome.jsx
```

#### 3.2 Novas Pages
```
src/pages/
  LaunchpadHome.jsx        // Trending tokens + creator CTA
  CreateTokenPage.jsx      // Form para criar token
  TokenDetailPage.jsx      // Charts, holders, trading
  MyTokensPage.jsx         // Tokens criados pelo user
  ExplorePage.jsx          // Browse all tokens (já existe, adaptar)
```

#### 3.3 Web3 Hooks
```javascript
// src/hooks/
useTokenFactory.js   // createToken(), getRecentTokens()
useBondingCurve.js   // buy(), sell(), getPrice()
useYieldClaim.js     // claimYield(), getPendingYield()
useCreatorProfile.js // getCreator(), updateProfile()
```

### Validação Semana 3
- [ ] Navegação funcional entre páginas
- [ ] Wallet connection working
- [ ] Contract reads funcionando (getRecentTokens)
- [ ] UI responsivo (mobile + desktop)

---

## SEMANA 4: Trading Interface (Dias 22-28)

### Objetivo
Implementar interface de compra/venda de tokens.

### Deliverables

#### 4.1 TradingPanel Component
```jsx
// Funcionalidades:
- Price chart (lightweight-charts library)
- Buy/Sell tabs
- Amount input com preview (slippage, fees)
- Balance display (ETH + Token)
- Recent trades feed
```

**Bibliotecas:**
```json
{
  "lightweight-charts": "^4.1.0",
  "recharts": "^2.10.0" // Alternativa mais simples
}
```

#### 4.2 Transaction Flow
```javascript
1. User entra amount
2. Frontend calcula:
   - Price atual (BondingCurve.calculatePrice)
   - Slippage esperado
   - Fees (platform 1% + gas)
3. User confirma
4. Approve USDC (se necessário)
5. Execute buy/sell
6. Show confirmation + link BaseScan
```

#### 4.3 Notifications System
```javascript
// Reusa NotificationContext.jsx do PrideConnect
- Transaction pending
- Transaction confirmed
- Transaction failed
- Yield claimed
- New token from followed creator
```

### Validação Semana 4
- [ ] Compra de token funcional end-to-end
- [ ] Venda de token funcional
- [ ] Charts mostrando price history
- [ ] Mobile responsivo

**Target Performance:**
- Load time < 2s
- Chart smooth em 60fps
- No layout shift

---

## SEMANA 5: Creator Dashboard (Dias 29-35)

### Objetivo
Interface para criadores gerenciarem seus tokens.

### Deliverables

#### 5.1 Creator Dashboard Page
```jsx
// pages/Creator/Dashboard.jsx
<Dashboard>
  <TokenCreationWizard />
  <MyTokensList />
  <AnalyticsSummary />
  <CreatorProfile />
</Dashboard>
```

**Métricas do Dashboard:**
- Total volume tradado
- Holders atuais
- Revenue (fees)
- Community growth (7d, 30d)

#### 5.2 Token Creation Wizard
```javascript
// Passos:
1. Basic Info (nome, símbolo, supply)
2. Marketing (descrição, logo, social links)
3. Review (summary + estimated fees)
4. Deploy (transaction + confirmation)
```

**Validações:**
- Supply: 1,000 - 1,000,000,000
- Nome: 3-50 chars
- Símbolo: 2-10 chars uppercase
- Logo: max 500KB, PNG/JPG
- Links: valid URLs

#### 5.3 Analytics Dashboard
**Integrações:**
```javascript
// BaseScan API
- Transaction history
- Holder count
- Top holders

// Subgraph (opcional, se tempo)
- Price history
- Volume by day
- Unique traders
```

### Validação Semana 5
- [ ] Criador consegue criar token completo
- [ ] Dashboard mostrando dados reais
- [ ] Perfil do criador editável
- [ ] Analytics refletindo blockchain data

---

## SEMANA 6: IA Content Generation (Dias 36-42)

### Objetivo
Automatizar marketing dos tokens com IA.

### Deliverables

#### 6.1 IA Service Backend
```javascript
// backend/src/services/aiService.js
class AIContentGenerator {
  async generateTwitterPost(tokenData) {
    // Input: nome, descrição, volume, holders
    // Output: tweet otimizado (max 280 chars)
  }
  
  async generateAnnouncement(event) {
    // Events: novo token, milestone, yield distribution
  }
  
  async suggestHashtags(tokenData) {
    // Retorna 3-5 hashtags relevantes
  }
}
```

**API Choice:**
- OpenAI GPT-4 Mini ($0.15/1M tokens) ✅
- Claude Sonnet ($3/1M tokens) - Melhor qualidade
- Groq (free tier) - Mais rápido

**Estimativa Custo:**
- 30 posts/dia * 500 tokens = 15k tokens/dia
- 450k tokens/mês = ~$0.07-1.35/mês
- **Budget:** $5-10/mês IA

#### 6.2 Telegram Bot
```javascript
// backend/src/bots/telegramBot.js
const { Telegraf } = require('telegraf');

// Comandos:
/start - Welcome + link Launchpad
/trending - Top 5 tokens do dia
/token <symbol> - Info de token específico
/claim - Link para claim yield
/create - Link para criar token
```

**Setup:**
```bash
npm install telegraf
# Criar bot com @BotFather
# Adicionar TELEGRAM_BOT_TOKEN no .env
```

#### 6.3 Twitter Integration
**Opções:**
- Opção A: Manual copy-paste (MVP) ✅
- Opção B: Twitter API ($100/mês) ❌
- Opção C: Buffer/Hootsuite ($15/mês)

**Escolha MVP:** Manual com IA suggestions

```javascript
// Frontend: creator dashboard mostra post sugerido
<GeneratedContent>
  <p>{aiGeneratedPost}</p>
  <Button onClick={copyToClipboard}>Copy to Twitter</Button>
</GeneratedContent>
```

### Validação Semana 6
- [ ] IA gerando posts coerentes (teste com 20 tokens)
- [ ] Telegram bot respondendo comandos
- [ ] Creator consegue copiar posts facilmente
- [ ] Content quality review (A/B test 2 prompts)

---

## SEMANA 7: Testing & Security (Dias 43-49)

### Objetivo
Audit de segurança e testes extensivos.

### Deliverables

#### 7.1 Smart Contract Audit
**Ferramentas:**
```bash
# Slither (análise estática)
pip install slither-analyzer
slither contracts/

# Mythril (symbolic execution)
docker pull mythril/myth
myth analyze contracts/TokenFactory.sol

# Hardhat Coverage
npx hardhat coverage
```

**Checklist:**
- [ ] Reentrancy protection
- [ ] Integer overflow/underflow
- [ ] Access control
- [ ] Gas optimization
- [ ] Emergency pause working

#### 7.2 Frontend Security
```javascript
// Validações:
- Input sanitization
- XSS prevention
- CSRF tokens
- Rate limiting (backend)
- Wallet signature verification
```

#### 7.3 Integration Tests
```javascript
// tests/integration/
fullFlow.test.js         // Create -> Trade -> Claim yield
multiUser.test.js        // 100 users trading
gasOptimization.test.js  // Benchmark gas costs
loadTesting.test.js      // 1000 req/min
```

#### 7.4 Bug Bounty (Opcional)
**Plataformas:**
- Immunefi ($5k min)
- Code4rena ($10k min)
- **MVP:** Divulgar no Twitter "Find bugs, win tokens" ✅

### Validação Semana 7
- [ ] 0 critical vulnerabilities
- [ ] 95%+ test coverage
- [ ] Load testing: 500 users simultâneos
- [ ] Gas costs otimizados (reduções documentadas)

---

## SEMANA 8: Mainnet Launch (Dias 50-56)

### Objetivo
Deploy em produção e go-to-market.

### Deliverables

#### 8.1 Mainnet Deploy
```bash
# Dia 50-51: Deploy contratos
npx hardhat run scripts/deploy-all.js --network base

# Verificar no BaseScan
npx hardhat verify --network base <TokenFactory>
npx hardhat verify --network base <BondingCurve>
# ... todos os contratos

# Update frontend com endereços mainnet
# Testar com valores pequenos
```

**Pre-Deploy Checklist:**
- [ ] Testnet funcionando 100%
- [ ] Multisig wallet configurado (Gnosis Safe)
- [ ] Emergency pause testado
- [ ] Backup de todas as keys
- [ ] DNS configurado (launchpad.seudominio.com)

#### 8.2 First Token Launch
**Creator confirmado:** [Nome do criador angolano]
```javascript
// Token specs:
Nome: "Angola Rising"
Símbolo: "AGR"
Supply: 10,000,000
Descrição: "First token on Angolan Launchpad 2.0"
```

**Marketing Plan (Dia 52-53):**
```
Timeline:
- T-24h: Teaser no Twitter
- T-12h: Telegram announcement
- T-1h: Final reminder
- T=0: LAUNCH
- T+1h: First trade screenshot
- T+6h: Volume update
- T+24h: 24h recap
```

#### 8.3 Go-to-Market ($50 budget)
**Alocação:**
```
$20 - Twitter Ads (targeted: crypto Angola/Portugal/Brazil)
$15 - Influencer micro (1-5k followers crypto)
$10 - Telegram group promos
$5  - Buffer/reserved
```

**Organic Growth:**
- Post no Reddit (r/CryptoMoonShots, r/BaseNetworkCommunity)
- ProductHunt launch
- LinkedIn post (targeting Angola tech community)
- GitHub trending (README bem feito)

#### 8.4 Monitoring & Ops
```javascript
// Setup:
- Sentry (error tracking)
- Google Analytics
- Dune Analytics dashboard
- Discord server (community)
- 24/7 monitoring (Uptime Robot)
```

### Validação Semana 8
- [ ] Mainnet deploy success
- [ ] First token launched
- [ ] 50+ users registered
- [ ] $1000+ volume (primeiro dia)
- [ ] 0 critical bugs
- [ ] Media coverage (1+ artigo)

---

## Milestones & Success Metrics

### Month 1 (Semanas 1-4)
- ✅ Smart contracts deployados
- ✅ Trading funcional
- **Target:** 5 tokens criados, 100 users, $10k volume

### Month 2 (Semanas 5-8)
- ✅ Creator dashboard
- ✅ IA marketing
- **Target:** 20 tokens, 500 users, $100k volume

### Month 3 (Post-launch)
- Expansão: Arbitrum, Optimism
- Parcerias: 3 creators grandes
- **Target:** 100 tokens, 5000 users, $1M volume

---

## Riscos & Mitigação

### Risco 1: Base Network outage
**Mitigação:** Deploy também em Sepolia como backup

### Risco 2: Bug crítico pós-launch
**Mitigação:** 
- Emergency pause em todos os contratos
- Multisig para upgrades
- Bug bounty program

### Risco 3: Baixa adoção inicial
**Mitigação:**
- Primeiro token garantido (creator confirmado)
- Airdrop para early adopters
- Referral program (5% de fees)

### Risco 4: Competição (Pump.fun, etc)
**Mitigação:**
- Diferenciação: yield + IA + comunidade Angola
- Foco em nicho (creators africanos)
- Features exclusivas (on-chain reputation)

### Risco 5: Budget overrun
**Mitigação:**
- Infra: usar free tiers (Vercel, Railway)
- IA: usar Groq/llama em vez de GPT-4
- Marketing: 100% organic se necessário

---

## Infraestrutura & Custos

### Desenvolvimento (Semanas 1-8)
```
- Vercel (frontend): $0 (hobby plan)
- Railway (backend): $5/mês
- PostgreSQL: incluído no Railway
- Base Sepolia ETH: $0 (faucet)
- Total: $5/mês
```

### Produção (Mês 1+)
```
- Vercel Pro: $20/mês (se tráfego alto)
- Railway: $20/mês (production tier)
- PostgreSQL: $10/mês
- Domain: $12/ano
- CDN (Cloudinary): $0 (free 25GB)
- Monitoring (Sentry): $0 (free tier)
- Total: $50-60/mês
```

### Mainnet Gas Costs
```
Deploy todos os contratos: ~$50-100
Operações mensais: ~$20-30
Total inicial: ~$100
```

---

## Próximas Ações Imediatas

### Hoje (Dia 1)
- [ ] Ler este roadmap completo
- [ ] Confirmar timeline viável
- [ ] Começar BondingCurve.sol
- [ ] Setup ambiente de testes local

### Esta Semana
- [ ] Completar Semana 1 deliverables
- [ ] Daily commits no GitHub
- [ ] Documentar decisões técnicas
- [ ] Testar no Base Sepolia

### Check-ins
- **Daily:** Commit + push código
- **Weekly:** Review deste roadmap
- **Semanal:** Demo funcionando (mesmo que parcial)

---

## Recursos & Links

### Base Network
- Docs: https://docs.base.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Explorer: https://sepolia.basescan.org

### Smart Contracts
- OpenZeppelin: https://docs.openzeppelin.com/contracts/5.x/
- Hardhat: https://hardhat.org/docs
- Bonding Curves: https://yos.io/2018/11/10/bonding-curves/

### Frontend
- Wagmi: https://wagmi.sh
- RainbowKit: https://www.rainbowkit.com
- Web3Modal: https://web3modal.com

### IA
- OpenAI API: https://platform.openai.com/docs
- Groq: https://console.groq.com
- Prompt engineering: https://www.promptingguide.ai

---

**Última atualização:** 2024
**Versão:** 1.0
**Owner:** [Seu nome]
**Branch:** launchpad-2.0

---

## Notas Finais

Este roadmap é um plano vivo. Ajustes serão necessários conforme:
- Feedback de usuários
- Problemas técnicos inesperados
- Oportunidades que surgirem
- Mudanças no mercado

**Princípio:** Shipping > Perfeição. MVP primeiro, iterate depois.

**Lembre-se:** 
- Você tem expertise em trading/DeFi - use isso nas decisões de produto
- Angola é seu mercado inicial - pense local first
- $50 budget = criatividade > dinheiro
- 8 semanas é apertado mas factível se focar

**Vamos construir! 🚀**
