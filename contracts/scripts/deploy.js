const hre = require("hardhat");
require("dotenv/config");

async function main() {
    console.log("🚀 Starting PaymentSplitter deployment...\n");

    // Get network
    const network = hre.network.name;
    console.log(`📡 Network: ${network}`);

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} MATIC\n`);

    // Get USDC address based on network
    let usdcAddress;
    if (network === "polygon") {
        usdcAddress = process.env.USDC_ADDRESS_POLYGON || "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
        console.log("🌐 Deploying to Polygon Mainnet");
    } else if (network === "mumbai") {
        usdcAddress = process.env.USDC_ADDRESS_MUMBAI || "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23";
        console.log("🧪 Deploying to Mumbai Testnet");
    } else {
        // For local testing, deploy a mock USDC
        console.log("🏠 Deploying to local network - deploying mock USDC");
        const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
        const mockUsdc = await MockUSDC.deploy();
        await mockUsdc.waitForDeployment();
        usdcAddress = await mockUsdc.getAddress();
        console.log(`✅ Mock USDC deployed to: ${usdcAddress}`);
    }

    // Get platform wallet
    const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;

    if (platformWallet === deployer.address) {
        console.log("⚠️  WARNING: Using deployer address as platform wallet");
    }

    console.log(`💼 Platform Wallet: ${platformWallet}`);
    console.log(`🪙  USDC Address: ${usdcAddress}\n`);

    // Deploy PaymentSplitter
    console.log("📝 Deploying PaymentSplitter contract...");
    const PaymentSplitter = await hre.ethers.getContractFactory("PaymentSplitter");
    const paymentSplitter = await PaymentSplitter.deploy(usdcAddress, platformWallet);

    await paymentSplitter.waitForDeployment();
    const contractAddress = await paymentSplitter.getAddress();

    console.log(`✅ PaymentSplitter deployed to: ${contractAddress}\n`);

    // Save deployment info
    const deploymentInfo = {
        network: network,
        contractAddress: contractAddress,
        usdcAddress: usdcAddress,
        platformWallet: platformWallet,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber(),
    };

    console.log("📄 Deployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Save to file
    const fs = require("fs");
    const path = require("path");
    const deploymentsDir = path.join(__dirname, "../deployments");

    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    const filename = `${network}-${Date.now()}.json`;
    fs.writeFileSync(
        path.join(deploymentsDir, filename),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log(`\n💾 Deployment info saved to: deployments/${filename}`);

    // Verify contract on Polygonscan (if not local)
    if (network !== "hardhat" && network !== "localhost") {
        console.log("\n⏳ Waiting 30 seconds before verification...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        console.log("🔍 Verifying contract on Polygonscan...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [usdcAddress, platformWallet],
            });
            console.log("✅ Contract verified successfully!");
        } catch (error) {
            console.log("❌ Verification failed:", error.message);
            console.log("You can verify manually later with:");
            console.log(`npx hardhat verify --network ${network} ${contractAddress} ${usdcAddress} ${platformWallet}`);
        }
    }

    console.log("\n🎉 Deployment complete!\n");
    console.log("📋 Next steps:");
    console.log("1. Update backend .env with:");
    console.log(`   PAYMENT_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`   PLATFORM_WALLET_ADDRESS=${platformWallet}`);
    console.log("2. Update frontend .env with:");
    console.log(`   VITE_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("3. Test the contract with a small payment");
    console.log("\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
