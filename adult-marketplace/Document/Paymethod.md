# 📊 Documento de Arquitetura: Sistema de Pagamentos - PrideConnect

---

## 🎯 Visão Geral

A plataforma **PrideConnect** será focada em **criptomoedas como método principal de pagamento**, oferecendo **privacidade, anonimato e taxas reduzidas** para criadores e assinantes LGBT+.  Métodos tradicionais serão opcionais. 

---

## 💰 Métodos de Pagamento

### **🔐 PRINCIPAIS (Criptomoedas)**

#### **1. Bitcoin (BTC)**
- ✅ Mais aceito e reconhecido
- ✅ Maior liquidez
- ⚠️ Taxas variáveis (podem ser altas em alta demanda)
- ⚠️ Confirmação mais lenta (10-60 min)
- **Uso:** Pagamentos de alto valor, assinaturas mensais

#### **2. Ethereum (ETH)**
- ✅ Smart contracts (automação de pagamentos recorrentes)
- ✅ Confirmação mais rápida que BTC (1-5 min)
- ⚠️ Gas fees podem ser altos
- **Uso:** Assinaturas, PPV, gorjetas

#### **3.  USDT (Tether - Stablecoin)**
- ✅ **RECOMENDADO** - Preço estável (1 USDT = 1 USD)
- ✅ Sem volatilidade
- ✅ Taxas baixas (especialmente em rede TRC20)
- ✅ Rápido (1-3 min)
- **Uso:** Método principal para novos usuários, pequenos pagamentos

#### **4.  Lightning Network (BTC)**
- ✅ Transações instantâneas
- ✅ Taxas quase zero
- ✅ Ideal para micropagamentos
- ⚠️ Requer setup mais técnico
- **Uso:** Gorjetas, mensagens pagas, conteúdo de baixo valor

#### **5. Monero (XMR)** *(Opcional Premium)*
- ✅ **Privacidade total** (transações anônimas)
- ✅ Impossível rastrear
- ✅ Taxas baixas
- ⚠️ Menor adoção
- **Uso:** Usuários que priorizam 100% de anonimato

---

### **💳 OPCIONAIS (Métodos Tradicionais)**

#### **6. PIX (Brasil)**
- ✅ Instantâneo
- ✅ Sem taxas para usuários
- ⚠️ Requer CPF/CNPJ (sem anonimato)
- ⚠️ Apenas Brasil
- **Uso:** Usuários brasileiros que não usam cripto

#### **7. Cartão de Crédito/Débito**
- ✅ Familiar para usuários
- ⚠️ Taxas altas (3-5% + gateway)
- ⚠️ Chargeback risk
- ⚠️ Bancos podem bloquear adult content
- **Gateway sugerido:** Stripe (com merchant account adult-friendly)
- **Uso:** Fallback para quem não tem cripto

---

## 🏗️ Arquitetura do Sistema

### **Fluxo de Pagamento**

```
┌─────────────┐
│   Usuário   │
│  Seleciona  │
│  Cripto     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Frontend (React)           │
│  - Mostra QR Code           │
│  - Exibe endereço wallet    │
│  - Calcula valor em cripto  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Backend (Node.js/Express)  │
│  - Gera endereço único      │
│  - Monitora blockchain      │
│  - Valida pagamento         │
│  - Atualiza status          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Blockchain Node/API        │
│  - BTCPay Server (self)     │
│  - NOWPayments API          │
│  - CoinPayments API         │
│  - Blockonomics (BTC)       │
└─────────────────────────────┘
```

---

## 🔧 Soluções Técnicas Recomendadas

### **Opção 1: BTCPay Server** ⭐ **RECOMENDADO**
**Descrição:** Self-hosted, open-source, sem taxas

**Vantagens:**
- ✅ **100% gratuito** (sem taxas de processamento)
- ✅ **Privado** (você controla os dados)
- ✅ **Não-custodial** (você controla as chaves)
- ✅ Suporta BTC, Lightning, altcoins
- ✅ Webhooks para automação
- ✅ Open-source e auditável

**Desvantagens:**
- ⚠️ Requer servidor próprio (VPS)
- ⚠️ Setup técnico mais complexo
- ⚠️ Você gerencia as wallets

**Custo:**
- VPS: $5-10/mês (Digital Ocean, Hetzner)
- Total: **~$10/mês**

**Stack:**
```
BTCPay Server (Docker) → Node.js Backend → React Frontend
```

---

### **Opção 2: NOWPayments** 💎 **MELHOR CUSTO-BENEFÍCIO**
**Descrição:** API de pagamentos cripto com custódia

**Vantagens:**
- ✅ **Setup rápido** (API pronta)
- ✅ Suporta 200+ criptomoedas
- ✅ Auto-conversão para moeda desejada
- ✅ Dashboard completo
- ✅ KYC opcional (até certo volume)
- ✅ Webhooks

**Desvantagens:**
- ⚠️ Taxa: **0.5%** por transação
- ⚠️ Custodial (eles guardam por 24h)
- ⚠️ KYC obrigatório para volumes altos

**Custo:**
- Taxa: 0.5% por transação
- Exemplo: R$ 100 → Taxa R$ 0,50

**Integração:**
```javascript
// Criar pagamento
POST https://api.nowpayments. io/v1/payment
{
  "price_amount": 100,
  "price_currency": "usd",
  "pay_currency": "btc",
  "order_id": "sub_12345",
  "ipn_callback_url": "https://api.prideconnect.com/webhooks/payment"
}
```

---

### **Opção 3: CoinPayments**
**Vantagens:**
- ✅ Veterano do mercado (desde 2013)
- ✅ Suporta 2000+ coins
- ✅ POS virtual

**Desvantagens:**
- ⚠️ Taxa: **0.5%** + withdrawal fees
- ⚠️ Interface desatualizada
- ⚠️ Suporte lento

---

### **Opção 4: Coinbase Commerce**
**Vantagens:**
- ✅ Nome confiável
- ✅ Interface limpa
- ✅ Non-custodial

**Desvantagens:**
- ⚠️ Taxa: **1%**
- ⚠️ Poucas moedas (BTC, ETH, USDC, DAI)
- ⚠️ KYC obrigatório

---

## 🎨 Fluxo de Usuário (UX)

### **Cenário 1: Assinatura Mensal**

```
1.  Usuário clica "Assinar @Pislon - R$ 30/mês"
   ↓
2.  Tela de pagamento mostra:
   ┌─────────────────────────────┐
   │  💎 Escolha a Criptomoeda   │
   ├─────────────────────────────┤
   │  ⚡ USDT (Recomendado)       │
   │     💵 30 USDT              │
   │                             │
   │  🟠 Bitcoin                  │
   │     💵 0. 00043 BTC          │
   │                             │
   │  💎 Ethereum                 │
   │     💵 0.012 ETH            │
   └─────────────────────────────┘
   ↓
3. Usuário seleciona USDT
   ↓
4. Sistema mostra:
   ┌─────────────────────────────┐
   │  📱 QR Code                 │
   │  [   QR CODE IMAGE   ]      │
   │                             │
   │  💳 Endereço:               │
   │  TXs8f... 9dKp              │
   │  [Copiar]                   │
   │                             │
   │  💰 Valor: 30 USDT          │
   │  ⏰ Expira em: 14:32        │
   │                             │
   │  🔄 Aguardando...           │
   └─────────────────────────────┘
   ↓
5. Usuário paga da wallet
   ↓
6.  Sistema detecta pagamento (webhook)
   ↓
7. Confirma após 1 confirmação
   ↓
8. ✅ Assinatura ativada!
   Notificação: "Bem-vindo ao conteúdo de @Pislon!"
```

---

### **Cenário 2: Mensagem Paga (PPV)**

```
1.  Criador envia conteúdo PPV: R$ 15
   ↓
2.  Assinante recebe notificação:
   "💌 @Pislon enviou conteúdo exclusivo - R$ 15"
   ↓
3.  Clica "Desbloquear"
   ↓
4.  Modal de pagamento:
   ┌─────────────────────────────┐
   │  🔓 Desbloquear Conteúdo    │
   │                             │
   │  Valor: R$ 15               │
   │                             │
   │  Pagar com:                 │
   │  ○ USDT (15 USDT)          │
   │  ○ Bitcoin (0.00021 BTC)   │
   │  ○ Lightning ⚡             │
   │                             │
   │  [Continuar]                │
   └─────────────────────────────┘
   ↓
5. Pagamento via Lightning (instantâneo)
   ↓
6. ✅ Conteúdo desbloqueado imediatamente
```

---

## 💾 Estrutura de Dados (Database)

### **Tabela: `payments`**

```prisma
model Payment {
  id              String        @id @default(uuid())
  
  // Relacionamentos
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  
  creatorId       String? 
  creator         Creator?      @relation(fields: [creatorId], references: [id])
  
  // Tipo de pagamento
  type            PaymentType   // SUBSCRIPTION, PPV_MESSAGE, PPV_POST, TIP, GIFT
  
  // Referências
  subscriptionId  String?
  postId          String?
  messageId       String?
  
  // Valores
  amount          Decimal       @db.Decimal(10, 2)  // Valor em USD
  currency        String        @default("USD")
  
  // Cripto
  cryptoCurrency  String?        // BTC, ETH, USDT, XMR
  cryptoAmount    String?       // Quantidade em cripto
  cryptoAddress   String?       // Endereço de recebimento
  txHash          String?       // Transaction hash
  
  // Status
  status          PaymentStatus @default(PENDING)
  // PENDING, CONFIRMING, COMPLETED, FAILED, EXPIRED, REFUNDED
  
  // Gateway
  gateway         PaymentGateway // BTCPAY, NOWPAYMENTS, COINBASE, PIX, STRIPE
  gatewayId       String?       // ID no gateway externo
  
  // Metadados
  confirmedAt     DateTime? 
  expiredAt       DateTime?
  metadata        Json?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([userId])
  @@index([creatorId])
  @@index([status])
  @@index([txHash])
  @@map("payments")
}

enum PaymentType {
  SUBSCRIPTION
  PPV_MESSAGE
  PPV_POST
  TIP
  GIFT
  WITHDRAWAL
}

enum PaymentStatus {
  PENDING
  CONFIRMING
  COMPLETED
  FAILED
  EXPIRED
  REFUNDED
}

enum PaymentGateway {
  BTCPAY
  NOWPAYMENTS
  COINPAYMENTS
  COINBASE
  PIX
  STRIPE
}
```

---

### **Tabela: `withdrawals`** (Saques de Criadores)

```prisma
model Withdrawal {
  id              String           @id @default(uuid())
  creatorId       String
  creator         Creator          @relation(fields: [creatorId], references: [id])
  
  amount          Decimal          @db. Decimal(10, 2)
  currency        String           @default("USD")
  
  // Cripto
  cryptoCurrency  String           // BTC, ETH, USDT
  cryptoAmount    String
  destinationAddress String        // Wallet do criador
  txHash          String? 
  
  status          WithdrawalStatus @default(PENDING)
  // PENDING, PROCESSING, COMPLETED, FAILED
  
  fee             Decimal          @db. Decimal(10, 2) @default(0)
  netAmount       Decimal          @db. Decimal(10, 2) // amount - fee
  
  processedAt     DateTime? 
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@index([creatorId])
  @@index([status])
  @@map("withdrawals")
}

enum WithdrawalStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

---

## 🔄 Automações e Webhooks

### **Eventos do Blockchain**

```javascript
// Backend recebe webhook do NOWPayments/BTCPay
POST /api/v1/webhooks/payment

{
  "payment_id": "5432100",
  "payment_status": "finished",
  "pay_amount": 30.00,
  "pay_currency": "usdt",
  "order_id": "sub_abc123",
  "actually_paid": 30.00,
  "outcome_amount": 29.85,  // Após taxas
  "outcome_currency": "usd"
}

// Backend processa:
1. Valida assinatura do webhook
2. Busca payment no DB pelo order_id
3. Atualiza status para COMPLETED
4.  Ativa assinatura do usuário
5. Envia email de confirmação
6. Notifica criador (novo assinante)
7. Adiciona fundos ao saldo do criador
```

---

### **Assinaturas Recorrentes**

**Problema:** Cripto não tem pagamento recorrente nativo

**Solução:**

1. **Método 1: Manual**
   - Sistema envia email 3 dias antes: "Sua assinatura expira em 3 dias"
   - Usuário renova manualmente

2. **Método 2: Saldo em Conta** ⭐ **RECOMENDADO**
   ```
   - Usuário deposita saldo (ex: $100 USDT)
   - Sistema debita automaticamente todo mês ($30)
   - Notifica quando saldo está baixo
   - Renova automaticamente enquanto houver saldo
   ```

3. **Método 3: Smart Contract (Ethereum/BSC)**
   - Usuário aprova contrato para debitar mensalmente
   - Contrato automatiza cobrança
   - ⚠️ Complexo e caro (gas fees)

---

## 💡 Taxas e Receitas

### **Estrutura de Taxas**

| Tipo | Taxa Plataforma | Taxa Gateway | Total |
|------|----------------|--------------|-------|
| **Assinatura (USDT/NOWPayments)** | 10% | 0.5% | **10.5%** |
| **Assinatura (BTC/BTCPay)** | 10% | 0% | **10%** |
| **PPV/Gorjeta (Cripto)** | 20% | 0-0.5% | **20-20.5%** |
| **Saque Criador (Cripto)** | Fixo $2 | Rede | **$2 + rede** |

**Exemplo:**
```
Assinatura R$ 100/mês (USDT):
- Gateway (NOWPayments): R$ 0,50
- Plataforma (10%): R$ 10,00
- Criador recebe: R$ 89,50
```

---

## 🛡️ Segurança e Compliance

### **KYC/AML**

**Criadores:**
- ✅ KYC obrigatório para sacar > $1000/mês
- ✅ Verificação de identidade (Onfido/Sumsub)
- ✅ Comprovante de endereço

**Usuários:**
- ❌ Não obrigatório (privacidade)
- ✅ Opcional para volumes altos

### **Anti-Fraude**

```javascript
// Validações automáticas
- Verificar txHash no blockchain explorer
- Confirmar amount matches
- Prevenir double-spending
- Rate limiting por IP
- Blacklist de endereços suspeitos
```

### **LGPD/GDPR**

```javascript
// Dados armazenados:
✅ Transaction hashes (públicos)
✅ Valores e datas
❌ NÃO armazenar: Wallets privadas de usuários
❌ NÃO armazenar: Chaves privadas
```

---

## 📊 Dashboard para Criadores

```
┌─────────────────────────────────────┐
│  💰 Saldo Disponível                │
│  💵 $1,247.50 USD                   │
│  (≈ 1,247 USDT)                     │
│                                     │
│  [Sacar]  [Histórico]              │
├─────────────────────────────────────┤
│  📈 Este Mês                        │
│  💸 Ganhos: $3,450                  │
│  👥 Novos assinantes: 23            │
│  📦 PPV vendidos: 47                │
│  💎 Gorjetas: $120                  │
├─────────────────────────────────────┤
│  🔄 Transações Recentes             │
│  ✅ Assinatura - @user123 - $30    │
│  ✅ PPV Mensagem - @fan_456 - $15  │
│  ⏳ Processando - @new_user - $30  │
└─────────────────────────────────────┘
```

---

## 🎯 Recomendação Final

### **Stack Recomendado:**

```
Frontend:
- React + TailwindCSS
- QR Code: react-qr-code
- Crypto icons: react-icons/crypto

Backend:
- Node.js + Express
- Prisma ORM
- NOWPayments API (para começar)
- Migrar para BTCPay Server (quando escalar)

Blockchain:
- Inicio: NOWPayments (facilidade)
- Futuro: BTCPay Server (economia)
- Plus: Lightning Network (micropagamentos)
```

---

## ✅ Próximos Passos de Implementação

**Fase 1: MVP (2-3 semanas)**
1. ✅ Integrar NOWPayments API
2. ✅ Criar models de Payment no Prisma
3. ✅ Frontend: Modal de pagamento
4. ✅ Webhooks para confirmar pagamento
5. ✅ Sistema de saldo para criadores

**Fase 2: Expansão (1 mês)**
1. ✅ Adicionar mais cryptos (BTC, ETH, XMR)
2. ✅ Dashboard de transações
3. ✅ Sistema de saques automáticos
4. ✅ Emails de notificação

**Fase 3: Otimização (2 meses)**
1. ✅ Migrar para BTCPay Server
2. ✅ Implementar Lightning Network
3. ✅ Sistema de saldo recorrente
4. ✅ Analytics avançado

---

**Gostou da arquitetura? ** Quer que eu comece a implementar?  🚀

**Decisões que você precisa tomar:**
1.  Começar com **NOWPayments** (fácil) ou **BTCPay** (complexo mas grátis)? 
2. Quais criptos suportar no MVP?  (USDT + BTC ou mais?)
3. Taxa da plataforma: **10%** ou outro valor? 

┌─────────────────────────────────────────────────┐
│           PRIDECONNECT PAYMENT HUB              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐│
│  │ NOWPayments  │  │  BTCPay      │  │  PIX   ││
│  │              │  │  Server      │  │        ││
│  │ • USDT       │  │ • BTC        │  │ Brasil ││
│  │ • ETH        │  │ • Lightning  │  │        ││
│  │ • XMR        │  │ • LTC        │  └────────┘│
│  │ • 200+ coins │  │ Self-hosted  │            │
│  │              │  │              │            │
│  │ Taxa: 0.5%   │  │ Taxa: 0%     │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘