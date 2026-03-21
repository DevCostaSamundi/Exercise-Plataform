const hre = require("hardhat");
require("dotenv").config({ path: "../../backend/.env" });

async function main() {
    const USDC_AMOY = process.env.USDC_ADDRESS_AMOY || "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
    const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS;

    if (!PLATFORM_WALLET || PLATFORM_WALLET === "0x0000000000000000000000000000000000000000") {
        throw new Error("PLATFORM_WALLET_ADDRESS not set in .env");
    }

    console.log("🚀 Deploying PaymentSplitter...");
    console.log("   USDC Address:", USDC_AMOY);
    console.log("   Platform Wallet:", PLATFORM_WALLET);

    const PaymentSplitter = await hre.ethers.getContractFactory("PaymentSplitter");
    const contract = await PaymentSplitter.deploy(USDC_AMOY, PLATFORM_WALLET);

    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("✅ PaymentSplitter deployed to:", address);
    console.log("");
    console.log("📋 Update your .env files:");
    console.log(`   PAYMENT_CONTRACT_ADDRESS=${address}`);
    console.log(`   VITE_PAYMENT_CONTRACT_ADDRESS=${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
