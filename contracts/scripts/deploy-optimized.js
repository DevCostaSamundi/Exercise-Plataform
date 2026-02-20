const hre = require("hardhat");
const fs = require('fs');

/**
 * DEPLOY OTIMIZADO - ECONOMIZA GAS
 * Usa gasLimit mais baixo e remove logs desnecessários
 */
async function main() {
  console.log("🚀 DEPLOYING LAUNCHPAD 2.0 (OPTIMIZED)\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  const deployedContracts = {};
  const FEE_RECEIVER = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;
  const LAUNCH_FEE = hre.ethers.parseEther("0.01");

  try {
    // 1. TokenFactory
    console.log("1/6 TokenFactory...");
    const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(FEE_RECEIVER, LAUNCH_FEE);
    await tokenFactory.waitForDeployment();
    deployedContracts.TokenFactory = await tokenFactory.getAddress();
    console.log("✅", deployedContracts.TokenFactory);

    // 2. FeeCollector (temporário)
    console.log("\n2/6 FeeCollector...");
    const FeeCollector = await hre.ethers.getContractFactory("FeeCollector");
    const feeCollector = await FeeCollector.deploy(FEE_RECEIVER, FEE_RECEIVER);
    await feeCollector.waitForDeployment();
    deployedContracts.FeeCollector = await feeCollector.getAddress();
    console.log("✅", deployedContracts.FeeCollector);

    // 3. YieldDistributor
    console.log("\n3/6 YieldDistributor...");
    const YieldDistributor = await hre.ethers.getContractFactory("YieldDistributor");
    const yieldDistributor = await YieldDistributor.deploy();
    await yieldDistributor.waitForDeployment();
    deployedContracts.YieldDistributor = await yieldDistributor.getAddress();
    console.log("✅", deployedContracts.YieldDistributor);

    // 4. BondingCurve
    console.log("\n4/6 BondingCurve...");
    const BondingCurve = await hre.ethers.getContractFactory("BondingCurve");
    const bondingCurve = await BondingCurve.deploy(
      deployedContracts.TokenFactory,
      deployedContracts.FeeCollector
    );
    await bondingCurve.waitForDeployment();
    deployedContracts.BondingCurve = await bondingCurve.getAddress();
    console.log("✅", deployedContracts.BondingCurve);

    // 5. LiquidityLocker
    console.log("\n5/6 LiquidityLocker...");
    const LiquidityLocker = await hre.ethers.getContractFactory("LiquidityLocker");
    const liquidityLocker = await LiquidityLocker.deploy(FEE_RECEIVER);
    await liquidityLocker.waitForDeployment();
    deployedContracts.LiquidityLocker = await liquidityLocker.getAddress();
    console.log("✅", deployedContracts.LiquidityLocker);

    // 6. CreatorRegistry
    console.log("\n6/6 CreatorRegistry...");
    const CreatorRegistry = await hre.ethers.getContractFactory("CreatorRegistry");
    const creatorRegistry = await CreatorRegistry.deploy();
    await creatorRegistry.waitForDeployment();
    deployedContracts.CreatorRegistry = await creatorRegistry.getAddress();
    console.log("✅", deployedContracts.CreatorRegistry);

    // Configuration
    console.log("\n⚙️  Configuring...");
    const setYieldTx = await feeCollector.setYieldDistributor(deployedContracts.YieldDistributor);
    await setYieldTx.wait();
    console.log("✅ YieldDistributor configured");

    // Summary
    const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("=".repeat(50));
    console.log("\nGas Used:", hre.ethers.formatEther(gasUsed), "ETH");
    console.log("Balance:", hre.ethers.formatEther(finalBalance), "ETH\n");
    
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });

    // Save
    const deployment = {
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      gasUsed: gasUsed.toString(),
      contracts: deployedContracts
    };

    if (!fs.existsSync('deployments')) fs.mkdirSync('deployments');
    const filename = `deployments/${hre.network.name}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
    console.log("\n💾", filename);

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
