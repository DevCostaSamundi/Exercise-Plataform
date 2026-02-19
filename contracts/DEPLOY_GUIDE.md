# 🚀 Guia de Deploy - Launchpad 2.0

## Preparação (5 minutos)

### 1. Configure Wallet Testnet

**Crie uma nova wallet MetaMask** (só para testnet):
1. Abra MetaMask
2. Clique no ícone da conta → "Add account"
3. Nomeie: "Base Testnet"

**Exporte a Private Key:**
1. Settings → Security & Privacy
2. "Reveal Secret Recovery Phrase" ou "Export Private Key"
3. ⚠️ **NUNCA compartilhe isso!**

### 2. Obtenha ETH Testnet (Grátis)

1. Acesse: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Conecte sua wallet testnet
3. Clique "Send me ETH"
4. Aguarde 1-2 minutos
5. Verifique: 0.05 ETH recebido

### 3. Configure Variáveis de Ambiente

```bash
cd /home/devcosta/Music/Exercise-Plataform/contracts
nano .env
```

**Cole e edite:**
```env
# Base Sepolia Testnet
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_SEPOLIA_PRIVATE_KEY=sua_private_key_aqui_sem_0x

# BaseScan API Key (Opcional - para verificação automática)
BASESCAN_API_KEY=sua_api_key_aqui

# Platform wallet (deixe vazio para usar deployer)
PLATFORM_WALLET_ADDRESS=
```

**Salve:** `Ctrl+X` → `Y` → `Enter`

---

## Deploy (2 minutos)

### Opção 1: Deploy Todos os Contratos (Recomendado)

```bash
cd /home/devcosta/Music/Exercise-Plataform/contracts
npx hardhat run scripts/deploy-all.js --network baseSepolia
```

**Output esperado:**
```
🚀 DEPLOYING LAUNCHPAD 2.0 - ALL CONTRACTS
══════════════════════════════════════════

📍 Network: baseSepolia
👤 Deployer: 0x...
💰 Balance: 0.05 ETH

1️⃣  Deploying TokenFactory...
   ✅ TokenFactory: 0x...
   
2️⃣  Deploying FeeCollector...
   ✅ FeeCollector: 0x...
   
(... continua ...)

✅ ALL CONTRACTS DEPLOYED!
💾 Deployment saved to: deployments/baseSepolia-xxxxx.json
```

### Opção 2: Deploy Individual (Se algum falhar)

```bash
# Apenas contratos core (Semana 1)
npx hardhat run scripts/deploy-core.js --network baseSepolia
```

---

## Verificação no BaseScan (3 minutos)

### Automática (se configurou BASESCAN_API_KEY)

```bash
# Usando o arquivo de deployment gerado
./scripts/verify-all.sh deployments/baseSepolia-xxxxx.json
```

### Manual (sem API key)

Copie e execute cada comando mostrado no output do deploy:

```bash
npx hardhat verify --network baseSepolia 0x... "arg1" "arg2"
```

**Verificar no navegador:**
1. Abra: https://sepolia.basescan.org
2. Cole endereço do contrato
3. Veja tab "Contract" → ✅ verificado

---

## Teste Rápido (5 minutos)

### 1. Criar Token de Teste

Abra Hardhat Console:
```bash
npx hardhat console --network baseSepolia
```

No console:
```javascript
// Conectar ao TokenFactory
const TokenFactory = await ethers.getContractFactory("TokenFactory");
const factory = TokenFactory.attach("ENDERECO_DO_TOKEN_FACTORY");

// Criar token
const tx = await factory.createToken(
  "Test Token",
  "TEST",
  ethers.parseUnits("1000000", 18),
  { value: ethers.parseEther("0.01") }
);
await tx.wait();

// Pegar endereço do token criado
const events = await factory.queryFilter(factory.filters.TokenCreated());
const tokenAddress = events[events.length - 1].args.tokenAddress;
console.log("Token criado:", tokenAddress);
```

### 2. Verificar no BaseScan

```
https://sepolia.basescan.org/address/SEU_TOKEN_ADDRESS
```

Deve mostrar:
- Name: "Test Token"
- Symbol: "TEST"
- Total Supply: 1,000,000

---

## Troubleshooting

### Erro: "insufficient funds"
```bash
# Verifique balance
npx hardhat console --network baseSepolia
const [deployer] = await ethers.getSigners();
const balance = await ethers.provider.getBalance(deployer.address);
console.log("Balance:", ethers.formatEther(balance), "ETH");
```

**Solução:** Pegue mais ETH no faucet

### Erro: "invalid private key"
- Verifique se copiou corretamente (sem espaços)
- Private key NÃO deve ter prefixo "0x"
- Teste com: `echo $BASE_SEPOLIA_PRIVATE_KEY | wc -c` (deve ser 65 caracteres)

### Erro: "nonce too high"
```bash
# Reset do account nonce
npx hardhat clean
npx hardhat compile
```

### Verificação falha: "Already Verified"
✅ Tudo certo! Contrato já foi verificado.

---

## Após Deploy Bem-Sucedido

### ✅ Checklist

- [ ] Todos os 6 contratos deployados
- [ ] Arquivo `deployments/baseSepolia-xxxxx.json` criado
- [ ] Contratos verificados no BaseScan
- [ ] Token de teste criado com sucesso
- [ ] Gas usado < 0.02 ETH

### 📝 Próximos Passos

1. **Atualizar Frontend:**
   ```bash
   # Copiar endereços para frontend
   cp deployments/baseSepolia-xxxxx.json ../adult-marketplace/src/config/contracts.json
   ```

2. **Criar Web3 Hooks:**
   - `useTokenFactory.js`
   - `useBondingCurve.js`
   - `useYieldDistributor.js`
   - `useCreatorRegistry.js`

3. **Testar Integração:**
   - Conectar wallet no frontend
   - Criar token pela interface
   - Buy/Sell tokens
   - Claim yield

4. **Documentar Endereços:**
   - Adicionar ao README.md
   - Adicionar ao ROADMAP_8_SEMANAS.md
   - Commitar deployment file

---

## Referências Rápidas

- **Base Sepolia Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Base Docs:** https://docs.base.org
- **Hardhat Docs:** https://hardhat.org/docs

---

**Estimativa total: ~10-15 minutos**

**Custo total: $0 (testnet grátis)**

**Resultado: 6 contratos deployados e verificados! 🎉**
