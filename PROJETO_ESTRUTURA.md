# 🏗️ ESTRUTURA DO PROJETO

**Data:** 18 de Fevereiro de 2026  
**Status:** Pivô para Launchpad 2.0

---

## 📌 BRANCHES DO REPOSITÓRIO

### **🚀 launchpad-2.0** (ATIVA - DESENVOLVIMENTO ATUAL)
**Produto:** Launchpad de tokens descentralizado na rede Base

**Objetivo:**
Plataforma de lançamento de tokens com bonding curve, yield automático para holders e divulgação integrada via IA.

**Stack Técnica:**
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express + Prisma + PostgreSQL
- Smart Contracts: Solidity (Base/Ethereum L2)
- IA: OpenAI/Claude API para geração de conteúdo
- Real-time: Socket.io

**Documentação Principal:**
- [launchpad_bizplan_v2.md](adult-marketplace/Document/launchpad_bizplan_v2.md) - Plano de negócio completo
- [PLATFORM_OVERVIEW.md](PLATFORM_OVERVIEW.md) - Visão geral técnica (será atualizado)

---

### **🏳️‍🌈 archive/prideconnect-adult-platform** (ARQUIVADA - PRESERVADA)
**Produto:** Plataforma de conteúdo adulto LGBT+ com pagamentos cripto

**Status:**
- Código funcional preservado
- Não está em desenvolvimento ativo
- Pode ser retomado no futuro

**Por que foi arquivado:**
- Falta de validação com mercado-alvo (creators LGBT+)
- Desenvolvedor não tem experiência no nicho
- Competição muito forte (OnlyFans domina)
- Requer capital maior para marketing
- Desenvolvedor tem mais afinidade com DeFi/tokens

**Código reusável:**
65-70% do código PrideConnect foi reutilizado no Launchpad 2.0:
- ✅ Web3Auth (100%)
- ✅ Socket.io + Chat (90%)
- ✅ Auth JWT + Express (100%)
- ✅ Redis (100%)
- ✅ PaymentSplitter base (70% - adaptado para YieldDistributor)
- ✅ Notifications (85%)
- ✅ Posts/Feed (80% - adaptado para tokens)

---

### **📦 main** (PRINCIPAL)
Branch de merge para produção.

Atualmente aponta para `launchpad-2.0` como desenvolvimento ativo.

---

## 🎯 DECISÃO DE PIVÔ - COMPARAÇÃO

| Critério | Launchpad 2.0 | PrideConnect |
|----------|---------------|--------------|
| Alinhamento com desenvolvedor | ✅ Trader ativo, analisa tokens | ❌ Sem experiência adulto |
| Conhecimento do mercado | ✅ Trabalha com memecoins | ❌ Nunca validou |
| Capital inicial necessário | ✅ $110-280/mês | ❌ $250-700/mês |
| Break-even estimado | ✅ Mês 3-4 | ❌ Mês 6-12 |
| Competição | ✅ Base sem player forte | ❌ OnlyFans domina |
| Potencial Ano 1 | ✅ $225k-375k/mês | ❌ $5k-7.5k/mês |
| Validação possível | ✅ Imediata (dev é usuário) | ❌ Precisa encontrar creators |

**Resultado:** 7-0 para Launchpad 2.0

---

## 📁 ESTRUTURA DE PASTAS

```
Exercise-Plataform/
├── adult-marketplace/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── contexts/          # Context API (Auth, Chat, etc.)
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   ├── config/            # Configurações Web3Auth, Wagmi
│   │   └── utils/             # Utilidades
│   └── Document/
│       ├── launchpad_bizplan_v2.md  # 📋 PLANO DE NEGÓCIO PRINCIPAL
│       ├── 100%crypto.md            # (PrideConnect - arquivado)
│       └── API_ROUTES.md            # (PrideConnect - arquivado)
│
├── backend/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/       # Lógica de negócio
│   │   ├── routes/            # Rotas da API
│   │   ├── services/          # Serviços externos
│   │   ├── middleware/        # Auth, validação, etc.
│   │   ├── socket/            # WebSocket handlers
│   │   └── utils/             # Utilidades
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Migrações
│   └── server.js              # Entry point
│
├── contracts/                  # Smart Contracts (Solidity)
│   ├── contracts/
│   │   ├── PaymentSplitter.sol      # (PrideConnect - base reusada)
│   │   ├── MockUSDC.sol             # (PrideConnect - teste)
│   │   ├── TokenFactory.sol         # 🆕 LAUNCHPAD - Deploy de tokens
│   │   ├── BondingCurve.sol         # 🆕 LAUNCHPAD - Preço automático
│   │   ├── YieldDistributor.sol     # 🆕 LAUNCHPAD - Yield para holders
│   │   ├── LiquidityLocker.sol      # 🆕 LAUNCHPAD - Lock de liquidez
│   │   ├── CreatorRegistry.sol      # 🆕 LAUNCHPAD - Reputação on-chain
│   │   └── FeeCollector.sol         # 🆕 LAUNCHPAD - Taxas da plataforma
│   ├── scripts/
│   │   └── deploy.js          # Scripts de deploy
│   ├── test/                  # Testes dos contratos
│   └── hardhat.config.js      # Configuração Hardhat + Base
│
├── PLATFORM_OVERVIEW.md       # Visão geral técnica (será atualizado)
├── PROJETO_ESTRUTURA.md       # 📋 ESTE ARQUIVO
└── README.md                  # Documentação principal

```

---

## 🔄 CÓDIGO REUTILIZADO DE PRIDECONNECT

### **Smart Contracts:**
- `PaymentSplitter.sol` → Base para `FeeCollector.sol` e `YieldDistributor.sol`
- Lógica de split automático (90/10) adaptada para (99/1 - holders/plataforma)

### **Backend:**
- Auth completo (JWT + Web3)
- Socket.io para chat das comunidades
- Prisma schema como base (Users, Posts adaptado para Tokens)
- Redis para cache
- Express + middleware

### **Frontend:**
- Web3Auth (100% reusado)
- Componentes de UI (LoadingSpinner, ErrorBoundary, etc.)
- Hooks customizados (useSocket, useDebounce, etc.)
- Contexts (AuthContext, SocketContext)
- Posts/Feed → adaptado para feed de tokens

---

## 🎯 PRÓXIMOS PASSOS

### **Fase 1 - Setup (Semana 1-2):**
- [x] Estrutura de branches criada
- [x] Plano de negócio definido
- [ ] Ambiente Base configurado
- [ ] Primeiro smart contract (TokenFactory.sol)

### **Fase 2 - Smart Contracts (Semana 2-4):**
- [ ] BondingCurve.sol
- [ ] YieldDistributor.sol
- [ ] LiquidityLocker.sol
- [ ] CreatorRegistry.sol
- [ ] FeeCollector.sol
- [ ] Deploy testnet Base Sepolia

### **Fase 3 - Frontend (Semana 4-6):**
- [ ] Feed de tokens
- [ ] Formulário de lançamento
- [ ] Dashboard creator
- [ ] Dashboard trader
- [ ] Integração Web3

### **Fase 4 - IA & Marketing (Semana 6-7):**
- [ ] Bot Telegram
- [ ] Gerador de conteúdo (OpenAI/Claude)
- [ ] Sistema de posts diários

### **Fase 5 - Launch (Semana 8):**
- [ ] Deploy mainnet Base
- [ ] Primeiro token lançado
- [ ] Marketing ativo

---

## 📞 CONTATO E RECURSOS

### **Rede Base:**
- RPC: https://mainnet.base.org
- Testnet (Sepolia): https://sepolia.base.org
- Explorer: https://basescan.org
- Docs: https://docs.base.org

### **Ferramentas:**
- Hardhat: Framework de smart contracts
- OpenAI/Claude: IA para conteúdo
- Telegram Bot API: Bot de comunidade
- Web3Auth: Onboarding sem fricção

---

**Última atualização:** 18/02/2026  
**Próxima revisão:** Após deploy testnet (Semana 3)
