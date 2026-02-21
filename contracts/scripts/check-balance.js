const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           VERIFICAÇÃO DE SALDO - BASE SEPOLIA             ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log("║                                                            ║");
  console.log("  Wallet:  " + deployer.address);
  console.log("  Saldo:   " + hre.ethers.formatEther(balance) + " ETH");
  console.log("║                                                            ║");
  if (parseFloat(hre.ethers.formatEther(balance)) < 0.01) {
    console.log("  ⚠️  ATENÇÃO: Saldo baixo! Você precisa de ETH testnet      ");
    console.log("  para fazer o deploy dos contratos.                        ");
    console.log("║                                                            ║");
    console.log("  🚰 Obtenha ETH grátis em:                                  ");
    console.log("  https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.log("  ou                                                         ");
    console.log("  https://www.alchemy.com/faucets/base-sepolia               ");
  } else {
    console.log("  ✅ Saldo suficiente para deploy!                          ");
  }
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
}

main().catch((error) => {
  console.error("❌ Erro ao verificar saldo:", error.message);
  process.exit(1);
});
