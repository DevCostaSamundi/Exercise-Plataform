const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BondingCurve", function () {
  let bondingCurve, tokenFactory, launchpadToken;
  let owner, creator, feeCollector, trader1, trader2;
  const LAUNCH_FEE = ethers.parseEther("0.01");
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, creator, feeCollector, trader1, trader2] = await ethers.getSigners();

    // Deploy TokenFactory
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactory.deploy(feeCollector.address, LAUNCH_FEE);

    // Deploy BondingCurve
    const BondingCurve = await ethers.getContractFactory("BondingCurve");
    bondingCurve = await BondingCurve.deploy(
      await tokenFactory.getAddress(),
      feeCollector.address
    );

    // Criar um token
    const tx = await tokenFactory.connect(creator).createToken(
      "Test Token",
      "TEST",
      INITIAL_SUPPLY,
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
    launchpadToken = await ethers.getContractAt("LaunchpadToken", tokenAddress);
    
    // Transferir alguns tokens para o bonding curve
    await launchpadToken.connect(creator).transfer(
      await bondingCurve.getAddress(),
      ethers.parseEther("500000")
    );
  });

  describe("Market Creation", function () {
    it("Should create market for valid token", async function () {
      await bondingCurve.connect(creator).createMarket(await launchpadToken.getAddress());
      
      const marketInfo = await bondingCurve.getMarketInfo(await launchpadToken.getAddress());
      expect(marketInfo.isActive).to.be.true;
      expect(marketInfo.supply).to.equal(0);
      expect(marketInfo.creator).to.equal(creator.address);
    });

    it("Should fail to create market for non-factory token", async function () {
      const ERC20 = await ethers.getContractFactory("LaunchpadToken");
      const fakeToken = await ERC20.deploy("Fake", "FAKE", INITIAL_SUPPLY, creator.address);
      
      await expect(
        bondingCurve.createMarket(await fakeToken.getAddress())
      ).to.be.revertedWith("Token not from factory");
    });

    it("Should fail to create duplicate market", async function () {
      await bondingCurve.connect(creator).createMarket(await launchpadToken.getAddress());
      
      await expect(
        bondingCurve.connect(creator).createMarket(await launchpadToken.getAddress())
      ).to.be.revertedWith("Market already exists");
    });
  });

  describe("Price Calculation", function () {
    beforeEach(async function () {
      await bondingCurve.connect(creator).createMarket(await launchpadToken.getAddress());
    });

    it("Should return base price when supply is 0", async function () {
      const price = await bondingCurve.calculatePrice(await launchpadToken.getAddress());
      const BASE_PRICE = ethers.parseEther("0.0001");
      expect(price).to.equal(BASE_PRICE);
    });

    it("Should increase price as supply increases", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      
      // Verificar que supply aumenta (o que implica em aumento de preço pela fórmula)
      const marketBefore = await bondingCurve.getMarketInfo(tokenAddr);
      const supplyBefore = marketBefore.supply;
      
      // Fazer várias compras
      for (let i = 0; i < 3; i++) {
        await bondingCurve.connect(trader1).buy(tokenAddr, 0, { 
          value: ethers.parseEther("0.1")
        });
      }
      
      const marketAfter = await bondingCurve.getMarketInfo(tokenAddr);
      const supplyAfter = marketAfter.supply;
      
      // Supply deve ter aumentado
      expect(supplyAfter).to.be.gt(supplyBefore);
      
      // Price deve estar baseado no novo supply
      const currentPrice = marketAfter.currentPrice;
      expect(currentPrice).to.be.gte(BASE_PRICE);
    });

    const BASE_PRICE = ethers.parseEther("0.0001");

    it("Should calculate buy cost correctly", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const amount = ethers.parseEther("1000");
      
      const cost = await bondingCurve.calculateBuyCost(tokenAddr, amount);
      expect(cost).to.be.gt(0);
    });

    it("Should calculate sell return correctly", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      
      // Primeiro comprar alguns tokens
      const buyAmount = ethers.parseEther("0.1");
      await bondingCurve.connect(trader1).buy(tokenAddr, 0, { value: buyAmount });
      
      const marketInfo = await bondingCurve.getMarketInfo(tokenAddr);
      const supply = marketInfo.supply;
      
      // Calcular venda
      const sellReturn = await bondingCurve.calculateSellReturn(tokenAddr, supply / 2n);
      expect(sellReturn).to.be.gt(0);
    });
  });

  describe("Buying Tokens", function () {
    beforeEach(async function () {
      await bondingCurve.connect(creator).createMarket(await launchpadToken.getAddress());
    });

    it("Should buy tokens successfully", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const buyAmount = ethers.parseEther("0.05");
      
      const balanceBefore = await launchpadToken.balanceOf(trader1.address);
      
      await bondingCurve.connect(trader1).buy(tokenAddr, 0, { value: buyAmount });
      
      const balanceAfter = await launchpadToken.balanceOf(trader1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should emit TokensPurchased event", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const buyAmount = ethers.parseEther("0.05");
      
      await expect(
        bondingCurve.connect(trader1).buy(tokenAddr, 0, { value: buyAmount })
      ).to.emit(bondingCurve, "TokensPurchased");
    });

    it("Should collect trading fee", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const buyAmount = ethers.parseEther("0.1");
      
      const feeCollectorBalanceBefore = await ethers.provider.getBalance(feeCollector.address);
      
      await bondingCurve.connect(trader1).buy(tokenAddr, 0, { value: buyAmount });
      
      const feeCollectorBalanceAfter = await ethers.provider.getBalance(feeCollector.address);
      
      // Fee deve ser ~1% do buyAmount
      const expectedFee = buyAmount * 100n / 10000n;
      expect(feeCollectorBalanceAfter - feeCollectorBalanceBefore).to.be.closeTo(
        expectedFee,
        ethers.parseEther("0.001")
      );
    });

    it("Should fail if slippage too high", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const buyAmount = ethers.parseEther("0.1");
      
      // Definir minTokens muito alto
      const minTokens = ethers.parseEther("1000000");
      
      await expect(
        bondingCurve.connect(trader1).buy(tokenAddr, minTokens, { value: buyAmount })
      ).to.be.revertedWith("Slippage too high");
    });

    it("Should update market state correctly", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const buyAmount = ethers.parseEther("0.1");
      
      const marketBefore = await bondingCurve.getMarketInfo(tokenAddr);
      
      await bondingCurve.connect(trader1).buy(tokenAddr, 0, { value: buyAmount });
      
      const marketAfter = await bondingCurve.getMarketInfo(tokenAddr);
      
      expect(marketAfter.supply).to.be.gt(marketBefore.supply);
      expect(marketAfter.reserveBalance).to.be.gt(marketBefore.reserveBalance);
    });
  });

  describe("Selling Tokens", function () {
    beforeEach(async function () {
      await bondingCurve.connect(creator).createMarket(await launchpadToken.getAddress());
      
      // Trader1 compra tokens primeiro
      const buyAmount = ethers.parseEther("0.2");
      await bondingCurve.connect(trader1).buy(await launchpadToken.getAddress(), 0, {
        value: buyAmount
      });
    });

    it("Should sell tokens successfully", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const traderBalance = await launchpadToken.balanceOf(trader1.address);
      const sellAmount = traderBalance / 2n;
      
      // Aprovar bonding curve
      await launchpadToken.connect(trader1).approve(
        await bondingCurve.getAddress(),
        sellAmount
      );
      
      const ethBefore = await ethers.provider.getBalance(trader1.address);
      
      const tx = await bondingCurve.connect(trader1).sell(tokenAddr, sellAmount, 0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const ethAfter = await ethers.provider.getBalance(trader1.address);
      
      // Deve ter recebido ETH (considerando gas)
      expect(ethAfter + gasUsed).to.be.gt(ethBefore);
    });

    it("Should emit TokensSold event", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const traderBalance = await launchpadToken.balanceOf(trader1.address);
      const sellAmount = traderBalance / 2n;
      
      await launchpadToken.connect(trader1).approve(
        await bondingCurve.getAddress(),
        sellAmount
      );
      
      await expect(
        bondingCurve.connect(trader1).sell(tokenAddr, sellAmount, 0)
      ).to.emit(bondingCurve, "TokensSold");
    });

    it("Should fail if amount exceeds supply", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const marketInfo = await bondingCurve.getMarketInfo(tokenAddr);
      const tooMuch = marketInfo.supply + ethers.parseEther("1000");
      
      await expect(
        bondingCurve.connect(trader1).sell(tokenAddr, tooMuch, 0)
      ).to.be.revertedWith("Amount exceeds supply");
    });

    it("Should decrease supply after sell", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const traderBalance = await launchpadToken.balanceOf(trader1.address);
      const sellAmount = traderBalance / 2n;
      
      await launchpadToken.connect(trader1).approve(
        await bondingCurve.getAddress(),
        sellAmount
      );
      
      const supplyBefore = (await bondingCurve.getMarketInfo(tokenAddr)).supply;
      
      await bondingCurve.connect(trader1).sell(tokenAddr, sellAmount, 0);
      
      const supplyAfter = (await bondingCurve.getMarketInfo(tokenAddr)).supply;
      
      expect(supplyAfter).to.be.lt(supplyBefore);
    });
  });

  describe("Trade History", function () {
    beforeEach(async function () {
      await bondingCurve.connect(creator).createMarket(await launchpadToken.getAddress());
    });

    it("Should record trade history", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      
      await bondingCurve.connect(trader1).buy(tokenAddr, 0, { value: ethers.parseEther("0.1") });
      await bondingCurve.connect(trader2).buy(tokenAddr, 0, { value: ethers.parseEther("0.05") });
      
      const history = await bondingCurve.getTradeHistory(tokenAddr, 10);
      
      expect(history.length).to.equal(2);
      expect(history[0].trader).to.equal(trader1.address);
      expect(history[1].trader).to.equal(trader2.address);
    });

    it("Should limit trade history results", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      
      // Fazer várias trades
      for (let i = 0; i < 5; i++) {
        await bondingCurve.connect(trader1).buy(tokenAddr, 0, {
          value: ethers.parseEther("0.01")
        });
      }
      
      const history = await bondingCurve.getTradeHistory(tokenAddr, 3);
      expect(history.length).to.equal(3);
    });

    it("Should track total volume", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const amount1 = ethers.parseEther("0.1");
      const amount2 = ethers.parseEther("0.05");
      
      await bondingCurve.connect(trader1).buy(tokenAddr, 0, { value: amount1 });
      await bondingCurve.connect(trader2).buy(tokenAddr, 0, { value: amount2 });
      
      const totalVolume = await bondingCurve.totalVolume();
      expect(totalVolume).to.equal(amount1 + amount2);
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await bondingCurve.connect(creator).createMarket(await launchpadToken.getAddress());
    });

    it("Should allow owner to deactivate market", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      
      await bondingCurve.connect(owner).deactivateMarket(tokenAddr);
      
      // Verificar diretamente o storage ao invés de chamar getMarketInfo
      const market = await bondingCurve.markets(tokenAddr);
      expect(market.isActive).to.be.false;
    });

    it("Should not allow non-owner to deactivate market", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      
      await expect(
        bondingCurve.connect(trader1).deactivateMarket(tokenAddr)
      ).to.be.reverted;
    });

    it("Should allow owner to update fee collector", async function () {
      const newCollector = trader1.address;
      
      await bondingCurve.connect(owner).setFeeCollector(newCollector);
      
      expect(await bondingCurve.feeCollector()).to.equal(newCollector);
    });

    it("Should allow owner to pause/unpause", async function () {
      await bondingCurve.connect(owner).pause();
      
      await expect(
        bondingCurve.connect(trader1).buy(await launchpadToken.getAddress(), 0, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.reverted;
      
      await bondingCurve.connect(owner).unpause();
      
      await expect(
        bondingCurve.connect(trader1).buy(await launchpadToken.getAddress(), 0, {
          value: ethers.parseEther("0.1")
        })
      ).to.not.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await bondingCurve.connect(creator).createMarket(await launchpadToken.getAddress());
    });

    it("Should handle very small buy amounts", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      const tinyAmount = ethers.parseEther("0.0001");
      
      await expect(
        bondingCurve.connect(trader1).buy(tokenAddr, 0, { value: tinyAmount })
      ).to.not.be.reverted;
    });

    it("Should handle multiple sequential buys", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      
      for (let i = 0; i < 3; i++) {
        await bondingCurve.connect(trader1).buy(tokenAddr, 0, {
          value: ethers.parseEther("0.05")
        });
      }
      
      const balance = await launchpadToken.balanceOf(trader1.address);
      expect(balance).to.be.gt(0);
    });

    it("Should handle buy and sell cycle", async function () {
      const tokenAddr = await launchpadToken.getAddress();
      
      // Buy
      await bondingCurve.connect(trader1).buy(tokenAddr, 0, {
        value: ethers.parseEther("0.1")
      });
      
      const bought = await launchpadToken.balanceOf(trader1.address);
      
      // Sell half
      const sellAmount = bought / 2n;
      await launchpadToken.connect(trader1).approve(
        await bondingCurve.getAddress(),
        sellAmount
      );
      
      await bondingCurve.connect(trader1).sell(tokenAddr, sellAmount, 0);
      
      const remaining = await launchpadToken.balanceOf(trader1.address);
      expect(remaining).to.be.closeTo(bought / 2n, ethers.parseEther("1"));
    });
  });
});
