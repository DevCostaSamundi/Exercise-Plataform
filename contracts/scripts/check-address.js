const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📍 SEU ENDEREÇO NA BASE SEPOLIA");
  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log("Endereço:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("ℹ️  ESTE É O ENDEREÇO QUE SERÁ USADO PARA:");
  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log("✓ Fazer deploy dos contratos");
  console.log("✓ Receber as fees (se PLATFORM_WALLET_ADDRESS estiver vazio)");
  console.log("✓ Ser o owner dos contratos");
  console.log("\n═══════════════════════════════════════════════════════════════\n");
}

main().catch(console.error);
