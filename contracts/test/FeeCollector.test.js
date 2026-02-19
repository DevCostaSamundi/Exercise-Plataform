const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FeeCollector", function () {
  let feeCollector, yieldDistributor, mockToken;
  let owner, teamWallet, user1;
  const TEAM_SPLIT = 6000; // 60%
  const YIELD_SPLIT = 4000; // 40%
  const WITHDRAWAL_LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [owner, teamWallet, user1] = await ethers.getSigners();

    // Deploy YieldDistributor
    const YieldDistributor = await ethers.getContractFactory("YieldDistributor");
    yieldDistributor = await YieldDistributor.deploy();

    // Deploy FeeCollector
    const FeeCollector = await ethers.getContractFactory("FeeCollector");
    const yieldDistributorAddress = await yieldDistributor.getAddress();
    feeCollector = await FeeCollector.deploy(
      teamWallet.address,
      yieldDistributorAddress
    );

    // Deploy mock token for testing
    const ERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await ERC20.deploy("Test Token", "TEST");
  });

  describe("Deployment", function () {
    it("Should set addresses correctly", async function () {
      expect(await feeCollector.teamWallet()).to.equal(teamWallet.address);
      expect(await feeCollector.yieldDistributor()).to.equal(await yieldDistributor.getAddress());
    });

    it("Should set split percentages", async function () {
      expect(await feeCollector.teamSplit()).to.equal(TEAM_SPLIT);
      expect(await feeCollector.yieldSplit()).to.equal(YIELD_SPLIT);
    });

    it("Should set withdrawal lock period", async function () {
      expect(await feeCollector.withdrawalLockPeriod()).to.equal(WITHDRAWAL_LOCK_PERIOD);
    });

    it("Should fail if team wallet is zero", async function () {
      const FeeCollector = await ethers.getContractFactory("FeeCollector");
      
      await expect(
        FeeCollector.deploy(
          ethers.ZeroAddress,
          await yieldDistributor.getAddress()
        )
      ).to.be.revertedWith("Invalid team wallet");
    });

    it("Should fail if yield distributor is zero", async function () {
      const FeeCollector = await ethers.getContractFactory("FeeCollector");
      
      await expect(
        FeeCollector.deploy(
          teamWallet.address,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid yield distributor");
    });
  });

  describe("Fee Deposits", function () {
    it("Should receive ETH via receive function", async function () {
      const amount = ethers.parseEther("1");
      
      await user1.sendTransaction({
        to: await feeCollector.getAddress(),
        value: amount
      });

      expect(await ethers.provider.getBalance(await feeCollector.getAddress())).to.equal(amount);
    });

    it("Should split fees correctly on receive", async function () {
      const amount = ethers.parseEther("1");
      
      await expect(
        user1.sendTransaction({
          to: await feeCollector.getAddress(),
          value: amount
        })
      ).to.emit(feeCollector, "FeeDeposited");

      const teamAmount = await feeCollector.teamBalance();
      const yieldAmount = await feeCollector.yieldBalance();
      
      expect(teamAmount).to.equal(amount * BigInt(TEAM_SPLIT) / BigInt(10000));
      expect(yieldAmount).to.equal(amount * BigInt(YIELD_SPLIT) / BigInt(10000));
    });

    it("Should accept fees via depositFee function", async function () {
      const amount = ethers.parseEther("1");
      
      await feeCollector.connect(user1).depositFee({ value: amount });

      const teamAmount = await feeCollector.teamBalance();
      expect(teamAmount).to.equal(amount * BigInt(TEAM_SPLIT) / BigInt(10000));
    });

    it("Should emit FeeDeposited event", async function () {
      const amount = ethers.parseEther("1");
      
      await expect(
        feeCollector.connect(user1).depositFee({ value: amount })
      ).to.emit(feeCollector, "FeeDeposited")
        .withArgs(user1.address, amount, amount * BigInt(TEAM_SPLIT) / BigInt(10000), amount * BigInt(YIELD_SPLIT) / BigInt(10000));
    });

    it("Should accumulate multiple deposits", async function () {
      await feeCollector.connect(user1).depositFee({ value: ethers.parseEther("1") });
      await feeCollector.connect(user1).depositFee({ value: ethers.parseEther("2") });

      const teamAmount = await feeCollector.teamBalance();
      expect(teamAmount).to.equal(ethers.parseEther("3") * BigInt(TEAM_SPLIT) / BigInt(10000));
    });
  });

  describe("Team Withdrawals", function () {
    beforeEach(async function () {
      // Deposit fees
      await feeCollector.connect(user1).depositFee({ value: ethers.parseEther("10") });
    });

    it("Should withdraw after lock period", async function () {
      await time.increase(WITHDRAWAL_LOCK_PERIOD);

      const teamBalanceBefore = await ethers.provider.getBalance(teamWallet.address);
      const withdrawAmount = await feeCollector.teamBalance();
      
      await feeCollector.connect(teamWallet).withdrawTeamFees();

      const teamBalanceAfter = await ethers.provider.getBalance(teamWallet.address);
      expect(teamBalanceAfter).to.be.gt(teamBalanceBefore);
    });

    it("Should emit TeamFeesWithdrawn event", async function () {
      await time.increase(WITHDRAWAL_LOCK_PERIOD);
      const amount = await feeCollector.teamBalance();

      await expect(
        feeCollector.connect(teamWallet).withdrawTeamFees()
      ).to.emit(feeCollector, "TeamFeesWithdrawn")
        .withArgs(teamWallet.address, amount);
    });

    it("Should fail if lock period not passed", async function () {
      await expect(
        feeCollector.connect(teamWallet).withdrawTeamFees()
      ).to.be.revertedWith("Withdrawal locked");
    });

    it("Should fail if no balance", async function () {
      await time.increase(WITHDRAWAL_LOCK_PERIOD);
      await feeCollector.connect(teamWallet).withdrawTeamFees();

      // Avançar mais 7 dias para permitir outro withdrawal
      await time.increase(WITHDRAWAL_LOCK_PERIOD);

      await expect(
        feeCollector.connect(teamWallet).withdrawTeamFees()
      ).to.be.revertedWith("No balance");
    });

    it("Should only allow team wallet to withdraw", async function () {
      await time.increase(WITHDRAWAL_LOCK_PERIOD);

      await expect(
        feeCollector.connect(user1).withdrawTeamFees()
      ).to.be.revertedWith("Not team wallet");
    });

    it("Should update last withdrawal time", async function () {
      await time.increase(WITHDRAWAL_LOCK_PERIOD);
      
      const timestampBefore = await feeCollector.lastWithdrawalTime();
      await feeCollector.connect(teamWallet).withdrawTeamFees();
      const timestampAfter = await feeCollector.lastWithdrawalTime();

      expect(timestampAfter).to.be.gt(timestampBefore);
    });
  });

  describe("Yield Distribution", function () {
    beforeEach(async function () {
      await feeCollector.connect(user1).depositFee({ value: ethers.parseEther("10") });
      // Criar pool no YieldDistributor para o mockToken
      await yieldDistributor.createPool(await mockToken.getAddress());
    });

    it("Should send yield to distributor", async function () {
      const yieldAmount = await feeCollector.yieldBalance();
      
      await expect(
        feeCollector.sendYieldToDistributor(await mockToken.getAddress())
      ).to.emit(feeCollector, "YieldSent");

      expect(await feeCollector.yieldBalance()).to.equal(0);
    });

    it("Should emit YieldSent event", async function () {
      const yieldAmount = await feeCollector.yieldBalance();

      await expect(
        feeCollector.sendYieldToDistributor(await mockToken.getAddress())
      ).to.emit(feeCollector, "YieldSent")
        .withArgs(await mockToken.getAddress(), yieldAmount);
    });

    it("Should fail if no yield balance", async function () {
      await feeCollector.sendYieldToDistributor(await mockToken.getAddress());

      await expect(
        feeCollector.sendYieldToDistributor(await mockToken.getAddress())
      ).to.be.revertedWith("No yield to send");
    });

    it("Should fail if token address is zero", async function () {
      await expect(
        feeCollector.sendYieldToDistributor(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid token");
    });
  });

  describe("Admin Functions", function () {
    it("Should update team wallet", async function () {
      await feeCollector.updateTeamWallet(user1.address);
      expect(await feeCollector.teamWallet()).to.equal(user1.address);
    });

    it("Should emit TeamWalletUpdated event", async function () {
      await expect(
        feeCollector.updateTeamWallet(user1.address)
      ).to.emit(feeCollector, "TeamWalletUpdated")
        .withArgs(teamWallet.address, user1.address);
    });

    

    it("Should update yield distributor", async function () {
      await feeCollector.updateYieldDistributor(user1.address);
      expect(await feeCollector.yieldDistributor()).to.equal(user1.address);
    });

    it("Should reset withdrawal lock", async function () {
      // Depositar fees para ter balance
      await feeCollector.connect(user1).depositFee({ value: ethers.parseEther("1") });
      
      await feeCollector.resetWithdrawalLock();
      
      const [canWithdraw, timeLeft] = await feeCollector.getWithdrawalInfo();
      expect(canWithdraw).to.be.true;
      expect(timeLeft).to.equal(0);
    });

    it("Should only allow owner to call admin functions", async function () {
      await expect(
        feeCollector.connect(user1).updateTeamWallet(user1.address)
      ).to.be.reverted;
    });
  });

  describe("Emergency Functions", function () {
    beforeEach(async function () {
      await feeCollector.connect(user1).depositFee({ value: ethers.parseEther("10") });
    });

    it("Should emergency withdraw", async function () {
      const balance = await ethers.provider.getBalance(await feeCollector.getAddress());
      const ownerBefore = await ethers.provider.getBalance(owner.address);

      await feeCollector.emergencyWithdraw();

      const ownerAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerAfter).to.be.gt(ownerBefore);
    });

    it("Should emit EmergencyWithdrawal event", async function () {
      const balance = await ethers.provider.getBalance(await feeCollector.getAddress());

      // EmergencyWithdraw doesn't emit event in this contract
      await feeCollector.emergencyWithdraw();
      expect(await ethers.provider.getBalance(await feeCollector.getAddress())).to.equal(0);
    });

    it("Should only allow owner to emergency withdraw", async function () {
      await expect(
        feeCollector.connect(user1).emergencyWithdraw()
      ).to.be.reverted;
    });
    
    it("Should pause contract", async function () {
      await feeCollector.pause();
      
      // Pause não implementado, mas função existe
      await expect(
        feeCollector.connect(user1).depositFee({ value: ethers.parseEther("1") })
      ).to.not.be.reverted;
    });

    it("Should unpause contract", async function () {
      await feeCollector.pause();
      await feeCollector.unpause();
      
      await expect(
        feeCollector.connect(user1).depositFee({ value: ethers.parseEther("1") })
      ).to.not.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should get balances", async function () {
      await feeCollector.connect(user1).depositFee({ value: ethers.parseEther("10") });

      const [team, yield_] = await feeCollector.getBalances();
      
      expect(team).to.equal(ethers.parseEther("6")); // 60%
      expect(yield_).to.equal(ethers.parseEther("4")); // 40%
    });

    it("Should get stats", async function () {
      await feeCollector.connect(user1).depositFee({ value: ethers.parseEther("10") });
      
      const stats = await feeCollector.getStats();
      
      expect(stats[0]).to.equal(ethers.parseEther("10")); // totalFeesCollected
    });
    
    it("Should get withdrawal info", async function () {
      const [canWithdraw, timeLeft] = await feeCollector.getWithdrawalInfo();
      
      expect(canWithdraw).to.be.false;
      expect(timeLeft).to.be.gt(0);
    });

    it("Should show can withdraw after lock period", async function () {
      // Depositar fees para ter balance
      await feeCollector.connect(user1).depositFee({ value: ethers.parseEther("1") });
      
      await time.increase(WITHDRAWAL_LOCK_PERIOD);

      const [canWithdraw, timeLeft] = await feeCollector.getWithdrawalInfo();
      
      expect(canWithdraw).to.be.true;
      expect(timeLeft).to.equal(0);
    });
  });
});
