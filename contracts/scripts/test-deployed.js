/**
 * Test Deployed Contracts on Base Sepolia
 * Verifies that all deployed contracts are working correctly
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🧪 Testing Deployed Contracts on Base Sepolia\n");
  console.log("=".repeat(60));

  const signers = await hre.ethers.getSigners();
  const signer = signers[0];
  
  if (!signer) {
    throw new Error("No signer available");
  }
  
  console.log("Testing with account:", signer.address);
  
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Contract addresses from env
  const TOKEN_FACTORY = process.env.TOKEN_FACTORY_ADDRESS;
  const BONDING_CURVE = process.env.BONDING_CURVE_ADDRESS;
  const LIQUIDITY_LOCKER = process.env.LIQUIDITY_LOCKER_ADDRESS;
  const YIELD_DISTRIBUTOR = process.env.YIELD_DISTRIBUTOR_ADDRESS;
  const CREATOR_REGISTRY = process.env.CREATOR_REGISTRY_ADDRESS;
  const FEE_COLLECTOR = process.env.FEE_COLLECTOR_ADDRESS;

  console.log("Contract Addresses:");
  console.log("  TokenFactory:", TOKEN_FACTORY);
  console.log("  BondingCurve:", BONDING_CURVE);
  console.log("  LiquidityLocker:", LIQUIDITY_LOCKER);
  console.log("  YieldDistributor:", YIELD_DISTRIBUTOR);
  console.log("  CreatorRegistry:", CREATOR_REGISTRY);
  console.log("  FeeCollector:", FEE_COLLECTOR);
  console.log("\n" + "=".repeat(60) + "\n");

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: TokenFactory - Check launch fee
  try {
    console.log("Test 1: Reading TokenFactory launch fee...");
    const TokenFactory = await hre.ethers.getContractAt("TokenFactory", TOKEN_FACTORY);
    const launchFee = await TokenFactory.launchFee();
    console.log("  ✅ Launch Fee:", hre.ethers.formatEther(launchFee), "ETH");
    passedTests++;
  } catch (error) {
    console.log("  ❌ FAILED:", error.message);
    failedTests++;
  }

  // Test 2: TokenFactory - Check fee receiver
  try {
    console.log("\nTest 2: Reading TokenFactory fee receiver...");
    const TokenFactory = await hre.ethers.getContractAt("TokenFactory", TOKEN_FACTORY);
    const feeReceiver = await TokenFactory.feeReceiver();
    console.log("  ✅ Fee Receiver:", feeReceiver);
    passedTests++;
  } catch (error) {
    console.log("  ❌ FAILED:", error.message);
    failedTests++;
  }

  // Test 3: BondingCurve - Check token factory
  try {
    console.log("\nTest 3: Reading BondingCurve token factory...");
    const BondingCurve = await hre.ethers.getContractAt("BondingCurve", BONDING_CURVE);
    const tokenFactory = await BondingCurve.tokenFactory();
    console.log("  ✅ Token Factory:", tokenFactory);
    
    if (tokenFactory.toLowerCase() === TOKEN_FACTORY.toLowerCase()) {
      console.log("  ✅ Correctly linked to TokenFactory");
      passedTests++;
    } else {
      console.log("  ❌ Wrong TokenFactory address");
      failedTests++;
    }
  } catch (error) {
    console.log("  ❌ FAILED:", error.message);
    failedTests++;
  }

  // Test 4: LiquidityLocker - Check penalty receiver
  try {
    console.log("\nTest 4: Reading LiquidityLocker penalty receiver...");
    const LiquidityLocker = await hre.ethers.getContractAt("LiquidityLocker", LIQUIDITY_LOCKER);
    const penaltyReceiver = await LiquidityLocker.penaltyReceiver();
    console.log("  ✅ Penalty Receiver:", penaltyReceiver);
    passedTests++;
  } catch (error) {
    console.log("  ❌ FAILED:", error.message);
    failedTests++;
  }

  // Test 5: YieldDistributor - Check owner
  try {
    console.log("\nTest 5: Reading YieldDistributor owner...");
    const YieldDistributor = await hre.ethers.getContractAt("YieldDistributor", YIELD_DISTRIBUTOR);
    const owner = await YieldDistributor.owner();
    console.log("  ✅ Owner:", owner);
    passedTests++;
  } catch (error) {
    console.log("  ❌ FAILED:", error.message);
    failedTests++;
  }

  // Test 6: CreatorRegistry - Check owner
  try {
    console.log("\nTest 6: Reading CreatorRegistry owner...");
    const CreatorRegistry = await hre.ethers.getContractAt("CreatorRegistry", CREATOR_REGISTRY);
    const owner = await CreatorRegistry.owner();
    console.log("  ✅ Owner:", owner);
    passedTests++;
  } catch (error) {
    console.log("  ❌ FAILED:", error.message);
    failedTests++;
  }

  // Test 7: FeeCollector - Check yield distributor
  try {
    console.log("\nTest 7: Reading FeeCollector yield distributor...");
    const FeeCollector = await hre.ethers.getContractAt("FeeCollector", FEE_COLLECTOR);
    const yieldDistributor = await FeeCollector.yieldDistributor();
    console.log("  ✅ Yield Distributor:", yieldDistributor);
    
    if (yieldDistributor.toLowerCase() === YIELD_DISTRIBUTOR.toLowerCase()) {
      console.log("  ✅ Correctly linked to YieldDistributor");
      passedTests++;
    } else {
      console.log("  ❌ Wrong YieldDistributor address");
      failedTests++;
    }
  } catch (error) {
    console.log("  ❌ FAILED:", error.message);
    failedTests++;
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total: ${passedTests + failedTests}`);
  
  if (failedTests === 0) {
    console.log("\n🎉 All tests passed! Contracts are working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the errors above.");
  }
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
