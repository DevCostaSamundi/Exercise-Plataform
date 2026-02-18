const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Launchpad 2.0 Core Contracts to Base Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // ========== 1. Deploy TokenFactory ==========
  console.log("📝 Deploying TokenFactory...");
  
  const LAUNCH_FEE = hre.ethers.parseEther("0.01"); // 0.01 ETH
  const FEE_RECEIVER = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;
  
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy(FEE_RECEIVER, LAUNCH_FEE);
  await tokenFactory.waitForDeployment();
  
  const tokenFactoryAddress = await tokenFactory.getAddress();
  console.log("✅ TokenFactory deployed to:", tokenFactoryAddress);
  console.log("   - Fee Receiver:", FEE_RECEIVER);
  console.log("   - Launch Fee:", hre.ethers.formatEther(LAUNCH_FEE), "ETH\n");

  // ========== 2. Deploy BondingCurve ==========
  console.log("📈 Deploying BondingCurve...");
  
  const BondingCurve = await hre.ethers.getContractFactory("BondingCurve");
  const bondingCurve = await BondingCurve.deploy(
    tokenFactoryAddress,
    FEE_RECEIVER
  );
  await bondingCurve.waitForDeployment();
  
  const bondingCurveAddress = await bondingCurve.getAddress();
  console.log("✅ BondingCurve deployed to:", bondingCurveAddress);
  console.log("   - Token Factory:", tokenFactoryAddress);
  console.log("   - Fee Collector:", FEE_RECEIVER, "\n");

  // ========== 3. Deploy LiquidityLocker ==========
  console.log("🔒 Deploying LiquidityLocker...");
  
  const PENALTY_RECEIVER = FEE_RECEIVER;
  
  const LiquidityLocker = await hre.ethers.getContractFactory("LiquidityLocker");
  const liquidityLocker = await LiquidityLocker.deploy(PENALTY_RECEIVER);
  await liquidityLocker.waitForDeployment();
  
  const liquidityLockerAddress = await liquidityLocker.getAddress();
  console.log("✅ LiquidityLocker deployed to:", liquidityLockerAddress);
  console.log("   - Penalty Receiver:", PENALTY_RECEIVER, "\n");

  // ========== Summary ==========
  console.log("=" .repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(60));
  console.log("\nNetwork:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContracts:");
  console.log("  TokenFactory:", tokenFactoryAddress);
  console.log("  BondingCurve:", bondingCurveAddress);
  console.log("  LiquidityLocker:", liquidityLockerAddress);
  console.log("\nNext Steps:");
  console.log("  1. Verify contracts on BaseScan:");
  console.log(`     npx hardhat verify --network baseSepolia ${tokenFactoryAddress} "${FEE_RECEIVER}" "${LAUNCH_FEE}"`);
  console.log(`     npx hardhat verify --network baseSepolia ${bondingCurveAddress} "${tokenFactoryAddress}" "${FEE_RECEIVER}"`);
  console.log(`     npx hardhat verify --network baseSepolia ${liquidityLockerAddress} "${PENALTY_RECEIVER}"`);
  console.log("\n  2. Test contracts:");
  console.log("     - Create a test token via TokenFactory");
  console.log("     - Create market via BondingCurve");
  console.log("     - Test buy/sell operations");
  console.log("\n  3. Update frontend with contract addresses");
  console.log("=" .repeat(60));

  // Save addresses to file
  const fs = require('fs');
  const addresses = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      TokenFactory: tokenFactoryAddress,
      BondingCurve: bondingCurveAddress,
      LiquidityLocker: liquidityLockerAddress
    },
    config: {
      launchFee: LAUNCH_FEE.toString(),
      feeReceiver: FEE_RECEIVER,
      penaltyReceiver: PENALTY_RECEIVER
    }
  };

  const filename = `deployments-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(addresses, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
