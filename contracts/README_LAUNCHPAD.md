# 📜 LAUNCHPAD 2.0 - SMART CONTRACTS

Contratos inteligentes para o Launchpad 2.0 na rede Base (Ethereum L2).

---

## 🚀 QUICK START

### **1. Instalar Dependências**
```bash
npm install
```

### **2. Configurar Ambiente**
```bash
# Copiar .env.example para .env
cp .env.example .env

# Editar .env e adicionar:
# - BASE_SEPOLIA_PRIVATE_KEY (sua testnet wallet)
# - BASESCAN_API_KEY (opcional, para verificação)
```

### **3. Obter Testnet ETH**
```
Acesse: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
Conecte sua wallet
Solicite 0.1 ETH testnet
```

### **4. Verificar Setup**
```bash
npx hardhat run scripts/check-setup.js --network baseSepolia
```

**Output esperado:**
```
🔍 Verificando configuração da Base...

📡 Network: baseSepolia
   Chain ID: 84532

💼 Deployer address: 0x...
💰 Balance: 0.05 ETH
   ✅ Balance suficiente para deploy!

🔗 RPC conectado!
   Block atual: 12345678

⛽ Gas price: 0.5 gwei
   ✅ Gas normal para Base

✨ Setup verificado com sucesso!
```

---

## 📁 CONTRATOS

### **🆕 Launchpad 2.0 (Base)**

| Contrato | Status | Descrição |
|----------|--------|-----------|
| `TokenFactory.sol` | 🚧 Em desenvolvimento | Deploy automático de ERC-20 |
| `BondingCurve.sol` | ⏳ Planejado | Preço automático baseado em supply |
| `YieldDistributor.sol` | ⏳ Planejado | Distribui 1% de trades para holders |
| `LiquidityLocker.sol` | ⏳ Planejado | Lock obrigatório de liquidez |
| `CreatorRegistry.sol` | ⏳ Planejado | Reputação on-chain de creators |
| `FeeCollector.sol` | ⏳ Planejado | Coleta taxas da plataforma |

### **📦 PrideConnect (Arquivado - Polygon)**

| Contrato | Status | Descrição |
|----------|--------|-----------|
| `PaymentSplitter.sol` | ✅ Completo | Base para FeeCollector.sol |
| `MockUSDC.sol` | ✅ Completo | Token de teste |

---

## 🛠️ COMANDOS

### **Compilar:**
```bash
npx hardhat compile
```

### **Testar:**
```bash
npx hardhat test
```

### **Deploy Testnet:**
```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

### **Deploy Mainnet:**
```bash
# ⚠️ CUIDADO: Isso gasta ETH real!
npx hardhat run scripts/deploy.js --network base
```

### **Verificar Contrato:**
```bash
npx hardhat verify --network baseSepolia CONTRACT_ADDRESS "constructor args"
```

### **Verificar Setup:**
```bash
npx hardhat run scripts/check-setup.js --network baseSepolia
```

---

## 🌐 NETWORKS

### **Base Sepolia (Testnet)**
```
RPC: https://sepolia.base.org
Chain ID: 84532
Explorer: https://sepolia.basescan.org
Faucet: https://www.coinbase.com/faucets
```

### **Base Mainnet (Produção)**
```
RPC: https://mainnet.base.org
Chain ID: 8453
Explorer: https://basescan.org
```

---

## 📚 DOCUMENTAÇÃO

- **Setup completo:** [SETUP_BASE.md](SETUP_BASE.md)
- **Plano de negócio:** [../adult-marketplace/Document/launchpad_bizplan_v2.md](../adult-marketplace/Document/launchpad_bizplan_v2.md)
- **Estrutura do projeto:** [../PROJETO_ESTRUTURA.md](../PROJETO_ESTRUTURA.md)
- **Base Docs:** https://docs.base.org
- **Hardhat Docs:** https://hardhat.org

---

## 🔐 SEGURANÇA

### **⚠️ NUNCA COMMITE:**
- `.env` (suas private keys)
- Mnemonic phrases
- API keys privadas

### **✅ BOAS PRÁTICAS:**
- Use wallet separada para testnet
- Use hardware wallet (Ledger/Trezor) para mainnet
- Teste TUDO na testnet antes de mainnet
- Audite contratos antes de deploy final
- Monitore gas prices antes de deploy

---

## 🐛 TROUBLESHOOTING

### **Erro: "insufficient funds"**
```
Solução: Obtenha testnet ETH no faucet
https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
```

### **Erro: "network not found"**
```
Solução: Verifique hardhat.config.js
Certifique-se que BASE_SEPOLIA_RPC está no .env
```

### **Erro: "nonce too high"**
```
Solução: Reset do nonce da conta
npx hardhat clean
ou
Mude de wallet/account
```

### **Gas price muito alto**
```
Base normalmente tem gas < 1 gwei
Se estiver alto (> 5 gwei), aguarde alguns minutos
```

---

## 📞 LINKS ÚTEIS

- **Base Faucet:** https://www.coinbase.com/faucets
- **BaseScan:** https://basescan.org
- **Base Bridge:** https://bridge.base.org
- **Chainlist:** https://chainlist.org (adicionar rede ao MetaMask)
- **Alchemy:** https://www.alchemy.com (RPC provider)

---

**Status:** 🚧 Em desenvolvimento ativo  
**Network:** Base (Ethereum L2 - Coinbase)  
**Última atualização:** 18/02/2026
