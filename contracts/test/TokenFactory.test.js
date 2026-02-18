const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenFactory", function () {
  let tokenFactory;
  let owner, creator, feeReceiver, user;
  const LAUNCH_FEE = ethers.parseEther("0.01"); // 0.01 ETH

  beforeEach(async function () {
    [owner, creator, feeReceiver, user] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactory.deploy(feeReceiver.address, LAUNCH_FEE);
  });

  describe("Deployment", function () {
    it("Should set the right fee receiver", async function () {
      expect(await tokenFactory.feeReceiver()).to.equal(feeReceiver.address);
    });

    it("Should set the right launch fee", async function () {
      expect(await tokenFactory.launchFee()).to.equal(LAUNCH_FEE);
    });

    it("Should set the right owner", async function () {
      expect(await tokenFactory.owner()).to.equal(owner.address);
    });
  });

  describe("Token Creation", function () {
    const TOKEN_NAME = "Test Token";
    const TOKEN_SYMBOL = "TEST";
    const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens

    it("Should create a new token successfully", async function () {
      const tx = await tokenFactory.connect(creator).createToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        INITIAL_SUPPLY,
        { value: LAUNCH_FEE }
      );

      const receipt = await tx.wait();
      
      // Verificar evento TokenCreated
      const event = receipt.logs.find(log => {
        try {
          return tokenFactory.interface.parseLog(log).name === "TokenCreated";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const parsedEvent = tokenFactory.interface.parseLog(event);
      const tokenAddress = parsedEvent.args.tokenAddress;
      
      expect(parsedEvent.args.creator).to.equal(creator.address);
      expect(parsedEvent.args.name).to.equal(TOKEN_NAME);
      expect(parsedEvent.args.symbol).to.equal(TOKEN_SYMBOL);
      
      // Verificar contador
      expect(await tokenFactory.totalTokensCreated()).to.equal(1);
      
      // Verificar token info
      const tokenInfo = await tokenFactory.getTokenInfo(tokenAddress);
      expect(tokenInfo.creator).to.equal(creator.address);
      expect(tokenInfo.name).to.equal(TOKEN_NAME);
      expect(tokenInfo.isActive).to.be.true;
    });

    it("Should fail if fee is insufficient", async function () {
      await expect(
        tokenFactory.connect(creator).createToken(
          TOKEN_NAME,
          TOKEN_SYMBOL,
          INITIAL_SUPPLY,
          { value: ethers.parseEther("0.005") } // Menos que o necessário
        )
      ).to.be.revertedWith("Insufficient fee");
    });

    it("Should fail if supply is too low", async function () {
      const LOW_SUPPLY = ethers.parseEther("500"); // Menos que MIN_SUPPLY
      
      await expect(
        tokenFactory.connect(creator).createToken(
          TOKEN_NAME,
          TOKEN_SYMBOL,
          LOW_SUPPLY,
          { value: LAUNCH_FEE }
        )
      ).to.be.revertedWith("Supply too low");
    });

    it("Should fail if name is empty", async function () {
      await expect(
        tokenFactory.connect(creator).createToken(
          "",
          TOKEN_SYMBOL,
          INITIAL_SUPPLY,
          { value: LAUNCH_FEE }
        )
      ).to.be.revertedWith("Invalid name length");
    });

    it("Should refund excess ETH", async function () {
      const EXCESS_FEE = ethers.parseEther("0.02"); // Mais que o necessário
      const balanceBefore = await ethers.provider.getBalance(creator.address);
      
      const tx = await tokenFactory.connect(creator).createToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        INITIAL_SUPPLY,
        { value: EXCESS_FEE }
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);
      
      // Balance deve ter diminuído apenas pela fee + gas, não pelo excess
      const expectedBalance = balanceBefore - LAUNCH_FEE - gasUsed;
      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });

    it("Should track creator tokens", async function () {
      // Criar 2 tokens
      await tokenFactory.connect(creator).createToken(
        "Token 1",
        "TK1",
        INITIAL_SUPPLY,
        { value: LAUNCH_FEE }
      );
      
      await tokenFactory.connect(creator).createToken(
        "Token 2",
        "TK2",
        INITIAL_SUPPLY,
        { value: LAUNCH_FEE }
      );
      
      const creatorTokens = await tokenFactory.getCreatorTokens(creator.address);
      expect(creatorTokens.length).to.equal(2);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update launch fee", async function () {
      const NEW_FEE = ethers.parseEther("0.02");
      
      await expect(tokenFactory.connect(owner).setLaunchFee(NEW_FEE))
        .to.emit(tokenFactory, "LaunchFeeUpdated")
        .withArgs(LAUNCH_FEE, NEW_FEE);
      
      expect(await tokenFactory.launchFee()).to.equal(NEW_FEE);
    });

    it("Should not allow non-owner to update fee", async function () {
      const NEW_FEE = ethers.parseEther("0.02");
      
      await expect(
        tokenFactory.connect(user).setLaunchFee(NEW_FEE)
      ).to.be.reverted;
    });

    it("Should allow owner to withdraw fees", async function () {
      // Criar token para gerar fees
      await tokenFactory.connect(creator).createToken(
        "Test",
        "TST",
        ethers.parseEther("1000000"),
        { value: LAUNCH_FEE }
      );
      
      const balanceBefore = await ethers.provider.getBalance(feeReceiver.address);
      
      await tokenFactory.connect(owner).withdrawFees();
      
      const balanceAfter = await ethers.provider.getBalance(feeReceiver.address);
      expect(balanceAfter - balanceBefore).to.equal(LAUNCH_FEE);
    });

    it("Should allow owner to deactivate token", async function () {
      const tx = await tokenFactory.connect(creator).createToken(
        "Test",
        "TST",
        ethers.parseEther("1000000"),
        { value: LAUNCH_FEE }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return tokenFactory.interface.parseLog(log).name === "TokenCreated";
        } catch {
          return false;
        }
      });
      const tokenAddress = tokenFactory.interface.parseLog(event).args.tokenAddress;
      
      await tokenFactory.connect(owner).deactivateToken(tokenAddress);
      
      const tokenInfo = await tokenFactory.getTokenInfo(tokenAddress);
      expect(tokenInfo.isActive).to.be.false;
    });

    it("Should allow owner to pause/unpause", async function () {
      await tokenFactory.connect(owner).pause();
      
      await expect(
        tokenFactory.connect(creator).createToken(
          "Test",
          "TST",
          ethers.parseEther("1000000"),
          { value: LAUNCH_FEE }
        )
      ).to.be.reverted;
      
      await tokenFactory.connect(owner).unpause();
      
      await expect(
        tokenFactory.connect(creator).createToken(
          "Test",
          "TST",
          ethers.parseEther("1000000"),
          { value: LAUNCH_FEE }
        )
      ).to.not.be.reverted;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Criar 3 tokens
      for (let i = 1; i <= 3; i++) {
        await tokenFactory.connect(creator).createToken(
          `Token ${i}`,
          `TK${i}`,
          ethers.parseEther("1000000"),
          { value: LAUNCH_FEE }
        );
      }
    });

    it("Should return recent tokens correctly", async function () {
      const recentTokens = await tokenFactory.getRecentTokens(2);
      expect(recentTokens.length).to.equal(2);
      
      // Deve retornar os mais recentes primeiro
      const tokenInfo1 = await tokenFactory.getTokenInfo(recentTokens[0]);
      const tokenInfo2 = await tokenFactory.getTokenInfo(recentTokens[1]);
      
      expect(tokenInfo1.name).to.equal("Token 3");
      expect(tokenInfo2.name).to.equal("Token 2");
    });

    it("Should validate tokens correctly", async function () {
      const creatorTokens = await tokenFactory.getCreatorTokens(creator.address);
      const validToken = creatorTokens[0];
      
      expect(await tokenFactory.isValidToken(validToken)).to.be.true;
      expect(await tokenFactory.isValidToken(ethers.ZeroAddress)).to.be.false;
    });
  });
});
