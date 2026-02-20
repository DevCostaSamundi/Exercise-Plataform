const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 DEPLOYING LAUNCHPAD 2.0 - ALL CONTRACTS");
  console.log("=".repeat(70) + "\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Network:", hre.network.name);
  console.log("👤 Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.01")) {
    console.log("\n⚠️  WARNING: Low balance! Deploy might fail.");
    console.log("Get testnet ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet\n");
  }

  const deployedContracts = {};
  const FEE_RECEIVER = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;
  
  if (FEE_RECEIVER === deployer.address) {
    console.log("ℹ️  Using deployer address as fee receiver\n");
  }

  console.log("─".repeat(70));

  // ========== 1. TokenFactory ==========
  console.log("\n1️⃣  Deploying TokenFactory...");
  const LAUNCH_FEE = hre.ethers.parseEther("0.01");
  
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy(FEE_RECEIVER, LAUNCH_FEE);
  await tokenFactory.waitForDeployment();
  
  const tokenFactoryAddress = await tokenFactory.getAddress();
  deployedContracts.TokenFactory = tokenFactoryAddress;
  console.log("   ✅ TokenFactory:", tokenFactoryAddress);
  console.log("      Launch Fee:", hre.ethers.formatEther(LAUNCH_FEE), "ETH");

  // ========== 2. FeeCollector ==========
  console.log("\n2️⃣  Deploying FeeCollector...");
  
  // FeeCollector precisa de YieldDistributor, então deploy placeholder primeiro
  const TEMP_YIELD_DISTRIBUTOR = FEE_RECEIVER; // Temporário, será atualizado depois
  
  const FeeCollector = await hre.ethers.getContractFactory("FeeCollector");
  const feeCollector = await FeeCollector.deploy(FEE_RECEIVER, TEMP_YIELD_DISTRIBUTOR);
  await feeCollector.waitForDeployment();
  
  const feeCollectorAddress = await feeCollector.getAddress();
  deployedContracts.FeeCollector = feeCollectorAddress;
  console.log("   ✅ FeeCollector:", feeCollectorAddress);
  console.log("      Team Wallet:", FEE_RECEIVER);

  // ========== 3. YieldDistributor ==========
  console.log("\n3️⃣  Deploying YieldDistributor...");
  
  const YieldDistributor = await hre.ethers.getContractFactory("YieldDistributor");
  const yieldDistributor = await YieldDistributor.deploy(); // Sem argumentos!
  await yieldDistributor.waitForDeployment();
  
  const yieldDistributorAddress = await yieldDistributor.getAddress();
  deployedContracts.YieldDistributor = yieldDistributorAddress;
  console.log("   ✅ YieldDistributor:", yieldDistributorAddress);
  console.log("      Fee Collector:", feeCollectorAddress);

  // ========== 4. BondingCurve ==========
  console.log("\n4️⃣  Deploying BondingCurve...");
  
  const BondingCurve = await hre.ethers.getContractFactory("BondingCurve");
  const bondingCurve = await BondingCurve.deploy(
    tokenFactoryAddress,
    feeCollectorAddress
  );
  await bondingCurve.waitForDeployment();
  
  const bondingCurveAddress = await bondingCurve.getAddress();
  deployedContracts.BondingCurve = bondingCurveAddress;
  console.log("   ✅ BondingCurve:", bondingCurveAddress);
  console.log("      Token Factory:", tokenFactoryAddress);

  // ========== 5. LiquidityLocker ==========
  console.log("\n5️⃣  Deploying LiquidityLocker...");
  
  const LiquidityLocker = await hre.ethers.getContractFactory("LiquidityLocker");
  const liquidityLocker = await LiquidityLocker.deploy(FEE_RECEIVER);
  await liquidityLocker.waitForDeployment();
  
  const liquidityLockerAddress = await liquidityLocker.getAddress();
  deployedContracts.LiquidityLocker = liquidityLockerAddress;
  console.log("   ✅ LiquidityLocker:", liquidityLockerAddress);
  console.log("      Penalty Receiver:", FEE_RECEIVER);

  // ========== 6. CreatorRegistry ==========
  console.log("\n6️⃣  Deploying CreatorRegistry...");
  
  const CreatorRegistry = await hre.ethers.getContractFactory("CreatorRegistry");
  const creatorRegistry = await CreatorRegistry.deploy(); // Sem argumentos!
  await creatorRegistry.waitForDeployment();
  
  const creatorRegistryAddress = await creatorRegistry.getAddress();
  deployedContracts.CreatorRegistry = creatorRegistryAddress;
  console.log("   ✅ CreatorRegistry:", creatorRegistryAddress);

  // ========== Configuration ==========
  console.log("\n" + "─".repeat(70));
  console.log("⚙️  Configuring contracts...");

  // Set YieldDistributor in FeeCollector
  const setYieldTx = await feeCollector.setYieldDistributor(yieldDistributorAddress);
  await setYieldTx.wait();
  console.log("   ✅ FeeCollector → YieldDistributor configured");

  // ========== Summary ==========
  console.log("\n" + "=".repeat(70));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(70));
  console.log("\n🌐 Network:", hre.network.name);
  console.log("👤 Deployer:", deployer.address);
  console.log("\n📦 Deployed Contracts:");
  
  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`   ${name.padEnd(20)} ${address}`);
  });

  // Calculate total gas used
  const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
  const gasUsed = balance - finalBalance;
  console.log("\n⛽ Gas Used:", hre.ethers.formatEther(gasUsed), "ETH");
  console.log("💰 Final Balance:", hre.ethers.formatEther(finalBalance), "ETH");

  // Save deployment info
  const deployment = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    gasUsed: gasUsed.toString(),
    contracts: deployedContracts,
    config: {
      launchFee: LAUNCH_FEE.toString(),
      feeReceiver: FEE_RECEIVER
    }
  };

  const filename = `deployments/${hre.network.name}-${Date.now()}.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
  console.log("\n💾 Deployment saved to:", filename);

  // Verification instructions
  console.log("\n" + "=".repeat(70));
  console.log("🔍 VERIFICATION COMMANDS");
  console.log("=".repeat(70));
  console.log("\nRun these commands to verify on BaseScan:\n");
  
  console.log(`npx hardhat verify --network ${hre.network.name} ${tokenFactoryAddress} "${FEE_RECEIVER}" "${LAUNCH_FEE}"`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${feeCollectorAddress} "${FEE_RECEIVER}" "${TEMP_YIELD_DISTRIBUTOR}"`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${yieldDistributorAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${bondingCurveAddress} "${tokenFactoryAddress}" "${feeCollectorAddress}"`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${liquidityLockerAddress} "${FEE_RECEIVER}"`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${creatorRegistryAddress}`);

  // Next steps
  console.log("\n" + "=".repeat(70));
  console.log("🎯 NEXT STEPS");
  console.log("=".repeat(70));
  console.log("\n1. ✅ Verify contracts on BaseScan (run commands above)");
  console.log("2. 🧪 Test contracts:");
  console.log("   - Create a test token");
  console.log("   - Test buy/sell operations");
  console.log("   - Test yield distribution");
  console.log("3. 🎨 Update frontend:");
  console.log("   - Add contract addresses to wagmi.config.js");
  console.log("   - Create Web3 hooks");
  console.log("4. 📱 Create first real token!");
  console.log("\n" + "=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
