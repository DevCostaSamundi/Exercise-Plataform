const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying Launchpad 2.0 - Week 2 Contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  const FEE_RECEIVER = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;
  const TOKEN_FACTORY = process.env.TOKEN_FACTORY_ADDRESS;

  // 1. Deploy YieldDistributor
  console.log("📊 Deploying YieldDistributor...");
  const YieldDistributor = await hre.ethers.getContractFactory("YieldDistributor");
  const yieldDistributor = await YieldDistributor.deploy();
  await yieldDistributor.waitForDeployment();
  const yieldDistributorAddress = await yieldDistributor.getAddress();
  console.log("✅ YieldDistributor deployed to:", yieldDistributorAddress);

  // 2. Deploy CreatorRegistry
  console.log("\n�� Deploying CreatorRegistry...");
  const CreatorRegistry = await hre.ethers.getContractFactory("CreatorRegistry");
  const creatorRegistry = await CreatorRegistry.deploy();
  await creatorRegistry.waitForDeployment();
  const creatorRegistryAddress = await creatorRegistry.getAddress();
  console.log("✅ CreatorRegistry deployed to:", creatorRegistryAddress);

  // 3. Deploy FeeCollector
  console.log("\n💰 Deploying FeeCollector...");
  const FeeCollector = await hre.ethers.getContractFactory("FeeCollector");
  const feeCollector = await FeeCollector.deploy(FEE_RECEIVER, yieldDistributorAddress);
  await feeCollector.waitForDeployment();
  const feeCollectorAddress = await feeCollector.getAddress();
  console.log("✅ FeeCollector deployed to:", feeCollectorAddress);

  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY - WEEK 2");
  console.log("=".repeat(60));
  console.log("\nNetwork: baseSepolia");
  console.log("\nNew Contracts:");
  console.log("  YieldDistributor:", yieldDistributorAddress);
  console.log("  CreatorRegistry:", creatorRegistryAddress);
  console.log("  FeeCollector:", feeCollectorAddress);
  console.log("\nExisting:");
  console.log("  TokenFactory:", TOKEN_FACTORY);
  console.log("\nUpdate .env:");
  console.log("YIELD_DISTRIBUTOR_ADDRESS=" + yieldDistributorAddress);
  console.log("CREATOR_REGISTRY_ADDRESS=" + creatorRegistryAddress);
  console.log("FEE_COLLECTOR_ADDRESS=" + feeCollectorAddress);
  console.log("=".repeat(60) + "\n");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
