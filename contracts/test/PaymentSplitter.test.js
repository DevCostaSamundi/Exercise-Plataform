const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentSplitter", function () {
    let paymentSplitter;
    let mockUSDC;
    let owner;
    let platformWallet;
    let creator;
    let user;
    let addrs;

    const USDC_DECIMALS = 6;
    const ONE_USDC = ethers.parseUnits("1", USDC_DECIMALS);
    const TEN_USDC = ethers.parseUnits("10", USDC_DECIMALS);
    const HUNDRED_USDC = ethers.parseUnits("100", USDC_DECIMALS);

    beforeEach(async function () {
        // Get signers
        [owner, platformWallet, creator, user, ...addrs] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.waitForDeployment();

        // Deploy PaymentSplitter
        const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");
        paymentSplitter = await PaymentSplitter.deploy(
            await mockUSDC.getAddress(),
            platformWallet.address
        );
        await paymentSplitter.waitForDeployment();

        // Mint USDC to user for testing
        await mockUSDC.mint(user.address, HUNDRED_USDC * 10n);
    });

    describe("Deployment", function () {
        it("Should set the correct USDC token address", async function () {
            expect(await paymentSplitter.usdcToken()).to.equal(await mockUSDC.getAddress());
        });

        it("Should set the correct platform wallet", async function () {
            expect(await paymentSplitter.platformWallet()).to.equal(platformWallet.address);
        });

        it("Should set the correct owner", async function () {
            expect(await paymentSplitter.owner()).to.equal(owner.address);
        });

        it("Should set the correct platform fee (10%)", async function () {
            expect(await paymentSplitter.PLATFORM_FEE_BPS()).to.equal(1000);
        });

        it("Should revert if USDC address is zero", async function () {
            const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");
            await expect(
                PaymentSplitter.deploy(ethers.ZeroAddress, platformWallet.address)
            ).to.be.revertedWith("Invalid USDC address");
        });

        it("Should revert if platform wallet is zero", async function () {
            const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");
            await expect(
                PaymentSplitter.deploy(await mockUSDC.getAddress(), ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid platform wallet");
        });
    });

    describe("Payment Processing", function () {
        beforeEach(async function () {
            // Approve contract to spend user's USDC
            await mockUSDC.connect(user).approve(
                await paymentSplitter.getAddress(),
                ethers.MaxUint256
            );
        });

        it("Should split payment correctly (90% creator, 10% platform)", async function () {
            const amount = TEN_USDC;
            const orderId = "order_123";

            const creatorBalanceBefore = await mockUSDC.balanceOf(creator.address);
            const platformBalanceBefore = await mockUSDC.balanceOf(platformWallet.address);

            await paymentSplitter.connect(user).processPayment(
                creator.address,
                amount,
                orderId
            );

            const creatorBalanceAfter = await mockUSDC.balanceOf(creator.address);
            const platformBalanceAfter = await mockUSDC.balanceOf(platformWallet.address);

            // Creator should receive 90% (9 USDC)
            expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(
                ethers.parseUnits("9", USDC_DECIMALS)
            );

            // Platform should receive 10% (1 USDC)
            expect(platformBalanceAfter - platformBalanceBefore).to.equal(
                ethers.parseUnits("1", USDC_DECIMALS)
            );
        });

        it("Should emit PaymentReceived event", async function () {
            const amount = TEN_USDC;
            const orderId = "order_123";

            await expect(
                paymentSplitter.connect(user).processPayment(
                    creator.address,
                    amount,
                    orderId
                )
            )
                .to.emit(paymentSplitter, "PaymentReceived")
                .withArgs(
                    user.address,
                    creator.address,
                    orderId,
                    amount,
                    ethers.parseUnits("9", USDC_DECIMALS), // 90%
                    ethers.parseUnits("1", USDC_DECIMALS), // 10%
                    await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
                );
        });

        it("Should revert if creator address is zero", async function () {
            await expect(
                paymentSplitter.connect(user).processPayment(
                    ethers.ZeroAddress,
                    TEN_USDC,
                    "order_123"
                )
            ).to.be.revertedWith("Invalid creator address");
        });

        it("Should revert if amount is below minimum", async function () {
            const minAmount = await paymentSplitter.minPaymentAmount();
            const belowMin = minAmount - 1n;

            await expect(
                paymentSplitter.connect(user).processPayment(
                    creator.address,
                    belowMin,
                    "order_123"
                )
            ).to.be.revertedWith("Amount below minimum");
        });

        it("Should revert if order ID is empty", async function () {
            await expect(
                paymentSplitter.connect(user).processPayment(
                    creator.address,
                    TEN_USDC,
                    ""
                )
            ).to.be.revertedWith("Order ID required");
        });

        it("Should handle large amounts correctly", async function () {
            const largeAmount = ethers.parseUnits("10000", USDC_DECIMALS);

            // Mint more USDC to user
            await mockUSDC.mint(user.address, largeAmount);

            await paymentSplitter.connect(user).processPayment(
                creator.address,
                largeAmount,
                "large_order"
            );

            const creatorBalance = await mockUSDC.balanceOf(creator.address);
            const platformBalance = await mockUSDC.balanceOf(platformWallet.address);

            expect(creatorBalance).to.equal(ethers.parseUnits("9000", USDC_DECIMALS));
            expect(platformBalance).to.equal(ethers.parseUnits("1000", USDC_DECIMALS));
        });
    });

    describe("Batch Payment Processing", function () {
        beforeEach(async function () {
            await mockUSDC.connect(user).approve(
                await paymentSplitter.getAddress(),
                ethers.MaxUint256
            );
        });

        it("Should process batch payments correctly", async function () {
            const creators = [creator.address, addrs[0].address, addrs[1].address];
            const amounts = [TEN_USDC, TEN_USDC, TEN_USDC];
            const orderIds = ["order_1", "order_2", "order_3"];

            await paymentSplitter.connect(user).processPaymentBatch(
                creators,
                amounts,
                orderIds
            );

            // Each creator should receive 9 USDC
            for (const creatorAddr of creators) {
                const balance = await mockUSDC.balanceOf(creatorAddr);
                expect(balance).to.equal(ethers.parseUnits("9", USDC_DECIMALS));
            }

            // Platform should receive 3 USDC total (1 USDC per payment)
            const platformBalance = await mockUSDC.balanceOf(platformWallet.address);
            expect(platformBalance).to.equal(ethers.parseUnits("3", USDC_DECIMALS));
        });

        it("Should revert if array lengths mismatch", async function () {
            await expect(
                paymentSplitter.connect(user).processPaymentBatch(
                    [creator.address],
                    [TEN_USDC, TEN_USDC],
                    ["order_1"]
                )
            ).to.be.revertedWith("Array length mismatch");
        });

        it("Should revert if arrays are empty", async function () {
            await expect(
                paymentSplitter.connect(user).processPaymentBatch([], [], [])
            ).to.be.revertedWith("Empty arrays");
        });

        it("Should revert if batch is too large", async function () {
            const creators = new Array(51).fill(creator.address);
            const amounts = new Array(51).fill(TEN_USDC);
            const orderIds = new Array(51).fill("order");

            await expect(
                paymentSplitter.connect(user).processPaymentBatch(
                    creators,
                    amounts,
                    orderIds
                )
            ).to.be.revertedWith("Batch too large");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update platform wallet", async function () {
            const newWallet = addrs[0].address;

            await expect(
                paymentSplitter.connect(owner).updatePlatformWallet(newWallet)
            )
                .to.emit(paymentSplitter, "PlatformWalletUpdated")
                .withArgs(platformWallet.address, newWallet);

            expect(await paymentSplitter.platformWallet()).to.equal(newWallet);
        });

        it("Should revert if non-owner tries to update platform wallet", async function () {
            await expect(
                paymentSplitter.connect(user).updatePlatformWallet(addrs[0].address)
            ).to.be.reverted;
        });

        it("Should allow owner to update minimum payment amount", async function () {
            const newMin = ethers.parseUnits("5", USDC_DECIMALS);

            await expect(
                paymentSplitter.connect(owner).updateMinPaymentAmount(newMin)
            )
                .to.emit(paymentSplitter, "MinPaymentAmountUpdated")
                .withArgs(ONE_USDC, newMin);

            expect(await paymentSplitter.minPaymentAmount()).to.equal(newMin);
        });

        it("Should allow owner to pause contract", async function () {
            await paymentSplitter.connect(owner).pause();
            expect(await paymentSplitter.paused()).to.be.true;
        });

        it("Should revert payments when paused", async function () {
            await mockUSDC.connect(user).approve(
                await paymentSplitter.getAddress(),
                ethers.MaxUint256
            );

            await paymentSplitter.connect(owner).pause();

            await expect(
                paymentSplitter.connect(user).processPayment(
                    creator.address,
                    TEN_USDC,
                    "order_123"
                )
            ).to.be.reverted;
        });

        it("Should allow owner to unpause contract", async function () {
            await paymentSplitter.connect(owner).pause();
            await paymentSplitter.connect(owner).unpause();
            expect(await paymentSplitter.paused()).to.be.false;
        });
    });

    describe("Emergency Withdrawal", function () {
        it("Should allow owner to emergency withdraw USDC", async function () {
            // Send some USDC to contract
            await mockUSDC.transfer(await paymentSplitter.getAddress(), TEN_USDC);

            const ownerBalanceBefore = await mockUSDC.balanceOf(owner.address);

            await paymentSplitter.connect(owner).emergencyWithdraw(
                await mockUSDC.getAddress(),
                owner.address,
                TEN_USDC
            );

            const ownerBalanceAfter = await mockUSDC.balanceOf(owner.address);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(TEN_USDC);
        });

        it("Should revert if non-owner tries emergency withdrawal", async function () {
            await expect(
                paymentSplitter.connect(user).emergencyWithdraw(
                    await mockUSDC.getAddress(),
                    user.address,
                    TEN_USDC
                )
            ).to.be.reverted;
        });
    });

    describe("View Functions", function () {
        it("Should return correct USDC balance", async function () {
            await mockUSDC.transfer(await paymentSplitter.getAddress(), TEN_USDC);
            expect(await paymentSplitter.getUSDCBalance()).to.equal(TEN_USDC);
        });

        it("Should calculate split correctly", async function () {
            const amount = ethers.parseUnits("100", USDC_DECIMALS);
            const [creatorAmount, platformFee] = await paymentSplitter.calculateSplit(amount);

            expect(creatorAmount).to.equal(ethers.parseUnits("90", USDC_DECIMALS));
            expect(platformFee).to.equal(ethers.parseUnits("10", USDC_DECIMALS));
        });
    });
});
