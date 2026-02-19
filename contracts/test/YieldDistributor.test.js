const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldDistributor", function () {
  let yieldDistributor, token;
  let owner, user1, user2, user3;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy YieldDistributor
    const YieldDistributor = await ethers.getContractFactory("YieldDistributor");
    yieldDistributor = await YieldDistributor.deploy();

    // Deploy mock token
    const LaunchpadToken = await ethers.getContractFactory("LaunchpadToken");
    token = await LaunchpadToken.deploy(
      "Test Token",
      "TEST",
      INITIAL_SUPPLY,
      owner.address
    );

    // Distribute tokens to users
    await token.transfer(user1.address, ethers.parseEther("100000"));
    await token.transfer(user2.address, ethers.parseEther("50000"));
    await token.transfer(user3.address, ethers.parseEther("25000"));
  });

  describe("Pool Management", function () {
    it("Should create pool successfully", async function () {
      await yieldDistributor.createPool(await token.getAddress());
      
      const poolInfo = await yieldDistributor.getPoolInfo(await token.getAddress());
      expect(poolInfo.isActive).to.be.true;
      expect(poolInfo.totalYield).to.equal(0);
    });

    it("Should fail to create duplicate pool", async function () {
      await yieldDistributor.createPool(await token.getAddress());
      
      await expect(
        yieldDistributor.createPool(await token.getAddress())
      ).to.be.revertedWith("Pool exists");
    });

    it("Should only allow owner to create pool", async function () {
      await expect(
        yieldDistributor.connect(user1).createPool(await token.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Yield Deposit", function () {
    beforeEach(async function () {
      await yieldDistributor.createPool(await token.getAddress());
    });

    it("Should deposit yield successfully", async function () {
      const depositAmount = ethers.parseEther("1");
      
      await yieldDistributor.depositYield(await token.getAddress(), {
        value: depositAmount
      });
      
      const poolInfo = await yieldDistributor.getPoolInfo(await token.getAddress());
      expect(poolInfo.totalYield).to.equal(depositAmount);
    });

    it("Should emit YieldDeposited event", async function () {
      const depositAmount = ethers.parseEther("1");
      
      await expect(
        yieldDistributor.depositYield(await token.getAddress(), {
          value: depositAmount
        })
      ).to.emit(yieldDistributor, "YieldDeposited");
    });

    it("Should fail if pool not active", async function () {
      await expect(
        yieldDistributor.depositYield(user1.address, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Pool not active");
    });

    it("Should accumulate multiple deposits", async function () {
      await yieldDistributor.depositYield(await token.getAddress(), {
        value: ethers.parseEther("1")
      });
      
      await yieldDistributor.depositYield(await token.getAddress(), {
        value: ethers.parseEther("0.5")
      });
      
      const poolInfo = await yieldDistributor.getPoolInfo(await token.getAddress());
      expect(poolInfo.totalYield).to.equal(ethers.parseEther("1.5"));
    });
  });

  describe("Yield Distribution", function () {
    beforeEach(async function () {
      await yieldDistributor.createPool(await token.getAddress());
      await yieldDistributor.depositYield(await token.getAddress(), {
        value: ethers.parseEther("10")
      });
    });

    it("Should distribute yield to holders", async function () {
      const holders = [user1.address, user2.address, user3.address];
      const balances = [
        ethers.parseEther("100000"),
        ethers.parseEther("50000"),
        ethers.parseEther("25000")
      ];
      
      await yieldDistributor.distributeYield(
        await token.getAddress(),
        holders,
        balances
      );
      
      const pending1 = await yieldDistributor.getPendingYield(
        await token.getAddress(),
        user1.address
      );
      
      // User1 tem 100k de 175k total = ~57.14% = ~5.714 ETH
      expect(pending1).to.be.closeTo(
        ethers.parseEther("5.714"),
        ethers.parseEther("0.01")
      );
    });

    it("Should emit YieldDistributed event", async function () {
      const holders = [user1.address];
      const balances = [ethers.parseEther("100000")];
      
      await expect(
        yieldDistributor.distributeYield(
          await token.getAddress(),
          holders,
          balances
        )
      ).to.emit(yieldDistributor, "YieldDistributed");
    });

    it("Should fail if arrays length mismatch", async function () {
      const holders = [user1.address, user2.address];
      const balances = [ethers.parseEther("100000")];
      
      await expect(
        yieldDistributor.distributeYield(
          await token.getAddress(),
          holders,
          balances
        )
      ).to.be.revertedWith("Length mismatch");
    });

    it("Should fail if insufficient yield", async function () {
      // Distribuir tudo primeiro
      await yieldDistributor.distributeYield(
        await token.getAddress(),
        [user1.address],
        [ethers.parseEther("100000")]
      );
      
      // Tentar distribuir de novo sem deposit
      await expect(
        yieldDistributor.distributeYield(
          await token.getAddress(),
          [user1.address],
          [ethers.parseEther("100000")]
        )
      ).to.be.revertedWith("Insufficient yield");
    });

    it("Should handle proportional distribution correctly", async function () {
      const holders = [user1.address, user2.address];
      const balances = [
        ethers.parseEther("60000"),  // 60%
        ethers.parseEther("40000")   // 40%
      ];
      
      await yieldDistributor.distributeYield(
        await token.getAddress(),
        holders,
        balances
      );
      
      const pending1 = await yieldDistributor.getPendingYield(
        await token.getAddress(),
        user1.address
      );
      const pending2 = await yieldDistributor.getPendingYield(
        await token.getAddress(),
        user2.address
      );
      
      expect(pending1).to.equal(ethers.parseEther("6")); // 60%
      expect(pending2).to.equal(ethers.parseEther("4")); // 40%
    });

    it("Should update pool stats correctly", async function () {
      await yieldDistributor.distributeYield(
        await token.getAddress(),
        [user1.address],
        [ethers.parseEther("100000")]
      );
      
      const poolInfo = await yieldDistributor.getPoolInfo(await token.getAddress());
      expect(poolInfo.distributedYield).to.equal(ethers.parseEther("10"));
      expect(poolInfo.availableYield).to.equal(0);
    });
  });

  describe("Claiming", function () {
    beforeEach(async function () {
      await yieldDistributor.createPool(await token.getAddress());
      await yieldDistributor.depositYield(await token.getAddress(), {
        value: ethers.parseEther("10")
      });
      
      // Distribute
      await yieldDistributor.distributeYield(
        await token.getAddress(),
        [user1.address, user2.address],
        [ethers.parseEther("100000"), ethers.parseEther("50000")]
      );
    });

    it("Should allow user to claim yield", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      
      const tx = await yieldDistributor.connect(user1).claimYield(await token.getAddress());
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      
      // Deve ter recebido ~6.66 ETH (100k de 150k)
      expect(balanceAfter + gasUsed - balanceBefore).to.be.closeTo(
        ethers.parseEther("6.66"),
        ethers.parseEther("0.01")
      );
    });

    it("Should emit YieldClaimed event", async function () {
      await expect(
        yieldDistributor.connect(user1).claimYield(await token.getAddress())
      ).to.emit(yieldDistributor, "YieldClaimed");
    });

    it("Should reset pending yield after claim", async function () {
      await yieldDistributor.connect(user1).claimYield(await token.getAddress());
      
      const pending = await yieldDistributor.getPendingYield(
        await token.getAddress(),
        user1.address
      );
      
      expect(pending).to.equal(0);
    });

    it("Should fail if amount too low", async function () {
      // user3 não recebeu distribuição
      await expect(
        yieldDistributor.connect(user3).claimYield(await token.getAddress())
      ).to.be.revertedWith("Amount too low");
    });

    it("Should track claimed yield", async function () {
      const claimAmount = await yieldDistributor.getPendingYield(
        await token.getAddress(),
        user1.address
      );
      
      await yieldDistributor.connect(user1).claimYield(await token.getAddress());
      
      const userInfo = await yieldDistributor.getUserYieldInfo(
        await token.getAddress(),
        user1.address
      );
      
      expect(userInfo.claimed).to.equal(claimAmount);
    });
  });

  describe("Multiple Claims", function () {
    let token2;

    beforeEach(async function () {
      // Create second token
      const LaunchpadToken = await ethers.getContractFactory("LaunchpadToken");
      token2 = await LaunchpadToken.deploy(
        "Test Token 2",
        "TEST2",
        INITIAL_SUPPLY,
        owner.address
      );
      
      await token2.transfer(user1.address, ethers.parseEther("100000"));
      
      // Setup both pools
      await yieldDistributor.createPool(await token.getAddress());
      await yieldDistributor.createPool(await token2.getAddress());
      
      await yieldDistributor.depositYield(await token.getAddress(), {
        value: ethers.parseEther("5")
      });
      await yieldDistributor.depositYield(await token2.getAddress(), {
        value: ethers.parseEther("3")
      });
      
      // Distribute
      await yieldDistributor.distributeYield(
        await token.getAddress(),
        [user1.address],
        [ethers.parseEther("100000")]
      );
      await yieldDistributor.distributeYield(
        await token2.getAddress(),
        [user1.address],
        [ethers.parseEther("100000")]
      );
    });

    it("Should claim from multiple tokens at once", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      
      const tx = await yieldDistributor.connect(user1).claimMultiple([
        await token.getAddress(),
        await token2.getAddress()
      ]);
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      
      // Deve ter recebido 5 + 3 = 8 ETH
      expect(balanceAfter + gasUsed - balanceBefore).to.be.closeTo(
        ethers.parseEther("8"),
        ethers.parseEther("0.01")
      );
    });

    it("Should get pending yield for multiple tokens", async function () {
      const pending = await yieldDistributor.getPendingYieldMultiple(
        [await token.getAddress(), await token2.getAddress()],
        user1.address
      );
      
      expect(pending[0]).to.equal(ethers.parseEther("5"));
      expect(pending[1]).to.equal(ethers.parseEther("3"));
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await yieldDistributor.createPool(await token.getAddress());
      await yieldDistributor.depositYield(await token.getAddress(), {
        value: ethers.parseEther("10")
      });
    });

    it("Should return pool info correctly", async function () {
      const poolInfo = await yieldDistributor.getPoolInfo(await token.getAddress());
      
      expect(poolInfo.totalYield).to.equal(ethers.parseEther("10"));
      expect(poolInfo.distributedYield).to.equal(0);
      expect(poolInfo.availableYield).to.equal(ethers.parseEther("10"));
      expect(poolInfo.isActive).to.be.true;
    });

    it("Should check if user can claim", async function () {
      expect(await yieldDistributor.canClaim(await token.getAddress(), user1.address))
        .to.be.false;
      
      // Distribute
      await yieldDistributor.distributeYield(
        await token.getAddress(),
        [user1.address],
        [ethers.parseEther("100000")]
      );
      
      expect(await yieldDistributor.canClaim(await token.getAddress(), user1.address))
        .to.be.true;
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await yieldDistributor.createPool(await token.getAddress());
    });

    it("Should allow owner to deactivate pool", async function () {
      await yieldDistributor.deactivatePool(await token.getAddress());
      
      const poolInfo = await yieldDistributor.getPoolInfo(await token.getAddress());
      expect(poolInfo.isActive).to.be.false;
    });

    it("Should allow owner to reactivate pool", async function () {
      await yieldDistributor.deactivatePool(await token.getAddress());
      await yieldDistributor.reactivatePool(await token.getAddress());
      
      const poolInfo = await yieldDistributor.getPoolInfo(await token.getAddress());
      expect(poolInfo.isActive).to.be.true;
    });

    it("Should allow emergency withdraw", async function () {
      await yieldDistributor.depositYield(await token.getAddress(), {
        value: ethers.parseEther("5")
      });
      
      await yieldDistributor.emergencyWithdraw(await token.getAddress());
      
      const poolInfo = await yieldDistributor.getPoolInfo(await token.getAddress());
      expect(poolInfo.availableYield).to.equal(0);
    });
  });
});
