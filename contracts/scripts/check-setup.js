// Script para verificar configuração da Base
// Usage: npx hardhat run scripts/check-setup.js --network baseSepolia

const hre = require("hardhat");

async function main() {
  console.log("\n🔍 Verificando configuração da Base...\n");

  // 1. Checar network
  const network = hre.network.name;
  console.log(`📡 Network: ${network}`);
  console.log(`   Chain ID: ${hre.network.config.chainId}`);

  // 2. Checar contas
  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n💼 Deployer address: ${deployer.address}`);

  // 3. Checar balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInEth = hre.ethers.formatEther(balance);
  console.log(`💰 Balance: ${balanceInEth} ETH`);

  if (parseFloat(balanceInEth) < 0.01) {
    console.log(`   ⚠️  WARNING: Balance baixo! Obtenha testnet ETH em:`);
    console.log(`   https://www.coinbase.com/faucets/base-ethereum-goerli-faucet`);
  } else {
    console.log(`   ✅ Balance suficiente para deploy!`);
  }

  // 4. Checar RPC
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  console.log(`\n🔗 RPC conectado!`);
  console.log(`   Block atual: ${blockNumber}`);

  // 5. Gas price
  const feeData = await hre.ethers.provider.getFeeData();
  const gasPriceGwei = hre.ethers.formatUnits(feeData.gasPrice, "gwei");
  console.log(`\n⛽ Gas price: ${gasPriceGwei} gwei`);
  
  if (parseFloat(gasPriceGwei) > 5) {
    console.log(`   ⚠️  Gas alto para Base (geralmente < 1 gwei)`);
  } else {
    console.log(`   ✅ Gas normal para Base`);
  }

  console.log(`\n✨ Setup verificado com sucesso!\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
