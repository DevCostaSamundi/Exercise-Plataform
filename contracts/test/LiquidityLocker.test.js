const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LiquidityLocker", function () {
  let locker, token;
  let owner, user1, user2, penaltyReceiver;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const LOCK_AMOUNT = ethers.parseEther("10000");
  const MIN_DURATION = 30 * 24 * 60 * 60; // 30 days

  beforeEach(async function () {
    [owner, user1, user2, penaltyReceiver] = await ethers.getSigners();

    // Deploy LiquidityLocker
    const LiquidityLocker = await ethers.getContractFactory("LiquidityLocker");
    locker = await LiquidityLocker.deploy(penaltyReceiver.address);

    // Deploy mock token
    const LaunchpadToken = await ethers.getContractFactory("LaunchpadToken");
    token = await LaunchpadToken.deploy(
      "Test Token",
      "TEST",
      INITIAL_SUPPLY,
      user1.address
    );

    // Transfer some tokens to user1
    await token.connect(user1).transfer(user2.address, ethers.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("Should set the right penalty receiver", async function () {
      expect(await locker.penaltyReceiver()).to.equal(penaltyReceiver.address);
    });

    it("Should set the right owner", async function () {
      expect(await locker.owner()).to.equal(owner.address);
    });
  });

  describe("Locking Liquidity", function () {
    it("Should lock liquidity successfully", async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT);
      
      const tx = await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Test lock"
      );

      await expect(tx)
        .to.emit(locker, "LiquidityLocked")
        .withArgs(
          0, // lockId
          await token.getAddress(),
          user1.address,
          LOCK_AMOUNT,
          await time.latest() + MIN_DURATION,
          "Test lock"
        );

      // Verify lock info
      const lockInfo = await locker.getLockInfo(0);
      expect(lockInfo.token).to.equal(await token.getAddress());
      expect(lockInfo.owner).to.equal(user1.address);
      expect(lockInfo.amount).to.equal(LOCK_AMOUNT);
      expect(lockInfo.withdrawn).to.be.false;
    });

    it("Should transfer tokens to locker contract", async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT);
      
      const balanceBefore = await token.balanceOf(await locker.getAddress());
      
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Test lock"
      );

      const balanceAfter = await token.balanceOf(await locker.getAddress());
      expect(balanceAfter - balanceBefore).to.equal(LOCK_AMOUNT);
    });

    it("Should fail if duration is too short", async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT);
      
      const shortDuration = MIN_DURATION - 1;
      
      await expect(
        locker.connect(user1).lockLiquidity(
          await token.getAddress(),
          LOCK_AMOUNT,
          shortDuration,
          "Test lock"
        )
      ).to.be.revertedWith("Duration too short");
    });

    it("Should fail if amount is zero", async function () {
      await expect(
        locker.connect(user1).lockLiquidity(
          await token.getAddress(),
          0,
          MIN_DURATION,
          "Test lock"
        )
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should increment lock ID", async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT * 2n);
      
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Lock 1"
      );

      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Lock 2"
      );

      const lock1 = await locker.getLockInfo(0);
      const lock2 = await locker.getLockInfo(1);

      expect(lock1.description).to.equal("Lock 1");
      expect(lock2.description).to.equal("Lock 2");
    });

    it("Should track user locks", async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT * 2n);
      
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Lock 1"
      );

      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Lock 2"
      );

      const userLocks = await locker.getUserLocks(user1.address);
      expect(userLocks.length).to.equal(2);
      expect(userLocks[0]).to.equal(0);
      expect(userLocks[1]).to.equal(1);
    });

    it("Should update total locked", async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT);
      
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Test lock"
      );

      const totalLocked = await locker.getTotalLocked(await token.getAddress());
      expect(totalLocked).to.equal(LOCK_AMOUNT);
    });
  });

  describe("Unlocking After Timelock", function () {
    beforeEach(async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT);
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Test lock"
      );
    });

    it("Should unlock after timelock expires", async function () {
      // Fast forward time
      await time.increase(MIN_DURATION + 1);

      const balanceBefore = await token.balanceOf(user1.address);
      
      await locker.connect(user1).unlock(0);

      const balanceAfter = await token.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(LOCK_AMOUNT);
    });

    it("Should emit LiquidityUnlocked event", async function () {
      await time.increase(MIN_DURATION + 1);

      await expect(locker.connect(user1).unlock(0))
        .to.emit(locker, "LiquidityUnlocked")
        .withArgs(0, await token.getAddress(), user1.address, LOCK_AMOUNT);
    });

    it("Should fail if timelock not expired", async function () {
      await expect(
        locker.connect(user1).unlock(0)
      ).to.be.revertedWith("Still locked");
    });

    it("Should fail if not lock owner", async function () {
      await time.increase(MIN_DURATION + 1);

      await expect(
        locker.connect(user2).unlock(0)
      ).to.be.revertedWith("Not lock owner");
    });

    it("Should fail if already withdrawn", async function () {
      await time.increase(MIN_DURATION + 1);

      await locker.connect(user1).unlock(0);

      await expect(
        locker.connect(user1).unlock(0)
      ).to.be.revertedWith("Already withdrawn");
    });

    it("Should update total locked after unlock", async function () {
      await time.increase(MIN_DURATION + 1);

      await locker.connect(user1).unlock(0);

      const totalLocked = await locker.getTotalLocked(await token.getAddress());
      expect(totalLocked).to.equal(0);
    });
  });

  describe("Emergency Unlock", function () {
    beforeEach(async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT);
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Test lock"
      );
    });

    it("Should unlock with penalty", async function () {
      const penalty = (LOCK_AMOUNT * 2000n) / 10000n; // 20%
      const expectedAmount = LOCK_AMOUNT - penalty;

      const balanceBefore = await token.balanceOf(user1.address);
      
      await locker.connect(user1).emergencyUnlock(0);

      const balanceAfter = await token.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(expectedAmount);
    });

    it("Should send penalty to penalty receiver", async function () {
      const penalty = (LOCK_AMOUNT * 2000n) / 10000n; // 20%

      const balanceBefore = await token.balanceOf(penaltyReceiver.address);
      
      await locker.connect(user1).emergencyUnlock(0);

      const balanceAfter = await token.balanceOf(penaltyReceiver.address);
      expect(balanceAfter - balanceBefore).to.equal(penalty);
    });

    it("Should emit EmergencyUnlock event", async function () {
      const penalty = (LOCK_AMOUNT * 2000n) / 10000n;
      const expectedAmount = LOCK_AMOUNT - penalty;

      await expect(locker.connect(user1).emergencyUnlock(0))
        .to.emit(locker, "EmergencyUnlock")
        .withArgs(0, user1.address, expectedAmount, penalty);
    });

    it("Should work even before timelock expires", async function () {
      // Não avançar tempo, ainda dentro do lock period
      await expect(
        locker.connect(user1).emergencyUnlock(0)
      ).to.not.be.reverted;
    });
  });

  describe("Extending Locks", function () {
    beforeEach(async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT);
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Test lock"
      );
    });

    it("Should extend lock duration", async function () {
      const lockInfoBefore = await locker.getLockInfo(0);
      const additionalTime = 15 * 24 * 60 * 60; // 15 days

      await locker.connect(user1).extendLock(0, additionalTime);

      const lockInfoAfter = await locker.getLockInfo(0);
      expect(lockInfoAfter.unlockTime).to.equal(
        lockInfoBefore.unlockTime + BigInt(additionalTime)
      );
    });

    it("Should fail if not lock owner", async function () {
      await expect(
        locker.connect(user2).extendLock(0, 1000)
      ).to.be.revertedWith("Not lock owner");
    });

    it("Should fail if already withdrawn", async function () {
      await time.increase(MIN_DURATION + 1);
      await locker.connect(user1).unlock(0);

      await expect(
        locker.connect(user1).extendLock(0, 1000)
      ).to.be.revertedWith("Already withdrawn");
    });
  });

  describe("Increasing Locks", function () {
    beforeEach(async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT * 2n);
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Test lock"
      );
    });

    it("Should increase lock amount", async function () {
      const additionalAmount = ethers.parseEther("5000");

      await locker.connect(user1).increaseLock(0, additionalAmount);

      const lockInfo = await locker.getLockInfo(0);
      expect(lockInfo.amount).to.equal(LOCK_AMOUNT + additionalAmount);
    });

    it("Should update total locked", async function () {
      const additionalAmount = ethers.parseEther("5000");

      await locker.connect(user1).increaseLock(0, additionalAmount);

      const totalLocked = await locker.getTotalLocked(await token.getAddress());
      expect(totalLocked).to.equal(LOCK_AMOUNT + additionalAmount);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT * 3n);
      
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Lock 1"
      );
      
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Lock 2"
      );
      
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION * 2,
        "Lock 3"
      );
    });

    it("Should return active locks", async function () {
      const activeLocks = await locker.getActiveLocks(user1.address);
      expect(activeLocks.length).to.equal(3);
    });

    it("Should exclude withdrawn locks from active locks", async function () {
      await time.increase(MIN_DURATION + 1);
      await locker.connect(user1).unlock(0);

      const activeLocks = await locker.getActiveLocks(user1.address);
      expect(activeLocks.length).to.equal(2);
    });

    it("Should check if lock can be unlocked", async function () {
      expect(await locker.canUnlock(0)).to.be.false;

      await time.increase(MIN_DURATION + 1);

      expect(await locker.canUnlock(0)).to.be.true;
    });

    it("Should return multiple locks info", async function () {
      const locks = await locker.getMultipleLocks([0, 1, 2]);
      expect(locks.length).to.equal(3);
      expect(locks[0].description).to.equal("Lock 1");
      expect(locks[1].description).to.equal("Lock 2");
      expect(locks[2].description).to.equal("Lock 3");
    });

    it("Should calculate time remaining", async function () {
      const lockInfo = await locker.getLockInfo(0);
      expect(lockInfo.timeRemaining).to.be.gt(0);

      await time.increase(MIN_DURATION + 1);

      const lockInfoAfter = await locker.getLockInfo(0);
      expect(lockInfoAfter.timeRemaining).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update penalty receiver", async function () {
      const newReceiver = user2.address;

      await locker.connect(owner).setPenaltyReceiver(newReceiver);

      expect(await locker.penaltyReceiver()).to.equal(newReceiver);
    });

    it("Should not allow non-owner to update penalty receiver", async function () {
      await expect(
        locker.connect(user1).setPenaltyReceiver(user2.address)
      ).to.be.reverted;
    });

    it("Should allow rescue of non-locked tokens", async function () {
      // Send extra tokens to locker (simulating accidental transfer)
      const extraAmount = ethers.parseEther("1000");
      await token.connect(user1).transfer(await locker.getAddress(), extraAmount);

      await locker.connect(owner).rescueTokens(
        await token.getAddress(),
        extraAmount
      );

      // Should succeed as these are not locked
    });

    it("Should not allow rescue of locked tokens", async function () {
      await token.connect(user1).approve(await locker.getAddress(), LOCK_AMOUNT);
      await locker.connect(user1).lockLiquidity(
        await token.getAddress(),
        LOCK_AMOUNT,
        MIN_DURATION,
        "Test lock"
      );

      await expect(
        locker.connect(owner).rescueTokens(await token.getAddress(), LOCK_AMOUNT)
      ).to.be.revertedWith("Cannot withdraw locked tokens");
    });
  });
});
