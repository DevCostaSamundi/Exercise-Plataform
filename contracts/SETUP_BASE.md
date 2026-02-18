# 🔧 SETUP BASE TESTNET - GUIA RÁPIDO

**Data:** 18/02/2026  
**Objetivo:** Configurar ambiente para desenvolver na Base Sepolia

---

## 📋 CHECKLIST

### **1. Obter Base Sepolia ETH (Testnet)**

Você precisa de ETH na testnet Base Sepolia para:
- Deploy de contratos
- Testes de transações
- Gas fees

**Opções para conseguir:**

#### **Opção A: Faucet da Coinbase (Recomendado)**
```
1. Acesse: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. Conecte sua wallet (MetaMask, etc.)
3. Mude a network para "Base Sepolia"
4. Solicite testnet ETH (0.1 ETH grátis)
```

#### **Opção B: Faucet Alchemy**
```
1. Acesse: https://www.alchemy.com/faucets/base-sepolia
2. Cole seu endereço de wallet
3. Receba 0.5 ETH testnet
```

#### **Opção C: Bridge de Sepolia ETH**
```
Se você já tem Sepolia ETH (Ethereum testnet):
1. Acesse: https://bridge.base.org/deposit
2. Selecione "Testnet"
3. Faça bridge de Sepolia → Base Sepolia
```

---

### **2. Configurar MetaMask para Base Sepolia**

**Adicionar rede manualmente:**

```
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency Symbol: ETH
Block Explorer: https://sepolia.basescan.org
```

**Ou adicionar automaticamente:**
- Vá em https://chainlist.org
- Busque "Base Sepolia"
- Clique "Add to MetaMask"

---

### **3. Configurar Hardhat para Base**

Já vamos atualizar o `hardhat.config.js` para incluir Base.

**Variáveis de ambiente necessárias (.env):**
```env
# Base Sepolia (Testnet)
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_SEPOLIA_PRIVATE_KEY=sua_private_key_aqui

# Base Mainnet (Produção)
BASE_MAINNET_RPC=https://mainnet.base.org
BASE_MAINNET_PRIVATE_KEY=sua_private_key_mainnet_aqui

# BaseScan API (para verificação de contratos)
BASESCAN_API_KEY=sua_api_key_aqui
```

**Como obter BaseScan API Key:**
1. Acesse: https://basescan.org/register
2. Crie conta
3. Vá em "API Keys"
4. Gere nova key (grátis)

---

### **4. RPC Providers (Opcional mas Recomendado)**

Para melhor performance e rate limits maiores:

#### **Alchemy (Recomendado)**
```
1. Acesse: https://www.alchemy.com
2. Crie conta grátis
3. Crie novo app "Base Sepolia"
4. Copie RPC URL
5. Use no .env: BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

#### **QuickNode**
```
1. Acesse: https://www.quicknode.com
2. Crie endpoint Base Sepolia
3. Copie URL
```

#### **Infura**
```
1. Acesse: https://infura.io
2. Crie projeto Base
3. Copie URL
```

**Nota:** RPC público (`https://sepolia.base.org`) funciona, mas tem rate limits.

---

### **5. Verificar Instalação**

Depois de configurar, teste:

```bash
# Ver networks disponíveis
npx hardhat networks

# Compilar contratos (teste)
npx hardhat compile

# Ver contas
npx hardhat accounts

# Checar balance na testnet
npx hardhat run scripts/check-balance.js --network baseSepolia
```

---

## 🎯 PRÓXIMOS PASSOS

Depois de completar este setup:
1. ✅ Ter Base Sepolia ETH na wallet
2. ✅ MetaMask configurado
3. ✅ Hardhat.config.js atualizado
4. ✅ .env com todas as keys
5. ✅ RPC provider escolhido (Alchemy recomendado)

**Então você estará pronto para:**
- Desenvolver smart contracts
- Deploy na testnet
- Testar transações
- Começar o TokenFactory.sol

---

## 🔗 LINKS ÚTEIS

**Documentação:**
- Base Docs: https://docs.base.org
- Base Sepolia Explorer: https://sepolia.basescan.org
- Hardhat Base Guide: https://docs.base.org/tools/hardhat

**Faucets:**
- Coinbase Faucet: https://www.coinbase.com/faucets
- Alchemy Faucet: https://www.alchemy.com/faucets/base-sepolia
- Base Bridge: https://bridge.base.org

**Tools:**
- Chainlist: https://chainlist.org
- BaseScan: https://basescan.org
- Base Bridge: https://bridge.base.org

---

**Status:** ⏳ Em progresso  
**Próximo:** Atualizar hardhat.config.js
