/**
 * Blockchain Sync Service
 * Indexes on-chain events from Launchpad contracts
 * Syncs Token, Trade, Holder data to PostgreSQL
 */

import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Contract ABIs (events only)
const TOKEN_FACTORY_EVENTS = {
  TokenCreated: parseAbiItem('event TokenCreated(address indexed token, string name, string symbol, uint256 totalSupply, address indexed creator)')
};

const BONDING_CURVE_EVENTS = {
  TokenPurchased: parseAbiItem('event TokenPurchased(address indexed token, address indexed buyer, uint256 ethAmount, uint256 tokenAmount, uint256 newPrice)'),
  TokenSold: parseAbiItem('event TokenSold(address indexed token, address indexed seller, uint256 ethAmount, uint256 tokenAmount, uint256 newPrice)')
};

const YIELD_DISTRIBUTOR_EVENTS = {
  YieldClaimed: parseAbiItem('event YieldClaimed(address indexed token, address indexed claimer, uint256 amount)')
};

const CREATOR_REGISTRY_EVENTS = {
  CreatorRated: parseAbiItem('event CreatorRated(address indexed creator, address indexed rater, uint256 rating)')
};

class BlockchainSyncService {
  constructor() {
    this.isMainnet = process.env.NODE_ENV === 'production';
    this.chain = this.isMainnet ? base : baseSepolia;
    
    this.client = createPublicClient({
      chain: this.chain,
      transport: http(process.env.RPC_URL || (this.isMainnet 
        ? 'https://mainnet.base.org' 
        : 'https://sepolia.base.org'))
    });
    
    // Contract addresses from env
    this.contracts = {
      TokenFactory: process.env.TOKEN_FACTORY_ADDRESS,
      BondingCurve: process.env.BONDING_CURVE_ADDRESS,
      YieldDistributor: process.env.YIELD_DISTRIBUTOR_ADDRESS,
      CreatorRegistry: process.env.CREATOR_REGISTRY_ADDRESS,
      FeeCollector: process.env.FEE_COLLECTOR_ADDRESS,
      LiquidityLocker: process.env.LIQUIDITY_LOCKER_ADDRESS
    };
  }

  /**
   * Initialize sync status for all contracts
   */
  async initializeSyncStatus() {
    const currentBlock = await this.client.getBlockNumber();
    
    for (const [name, address] of Object.entries(this.contracts)) {
      if (!address) continue;
      
      await prisma.syncStatus.upsert({
        where: { contractName: name },
        update: {},
        create: {
          contractName: name,
          contractAddress: address,
          lastSyncedBlock: Number(currentBlock) - 1000, // Start from 1000 blocks ago
          isActive: true
        }
      });
    }
    
    console.log(`✅ Sync status initialized for ${Object.keys(this.contracts).length} contracts`);
  }

  /**
   * Sync all events from all contracts
   */
  async syncAll() {
    console.log('🔄 Starting full blockchain sync...');
    
    try {
      await this.syncTokenCreatedEvents();
      await this.syncTradeEvents();
      await this.syncYieldClaimEvents();
      await this.syncCreatorRatingEvents();
      await this.updateTokenMetrics();
      
      console.log('✅ Full sync completed');
    } catch (error) {
      console.error('❌ Sync error:', error);
      throw error;
    }
  }

  /**
   * Sync TokenCreated events from TokenFactory
   */
  async syncTokenCreatedEvents() {
    const syncStatus = await prisma.syncStatus.findUnique({
      where: { contractName: 'TokenFactory' }
    });
    
    if (!syncStatus || !this.contracts.TokenFactory) {
      console.log('⏭️ TokenFactory not configured, skipping...');
      return;
    }
    
    const currentBlock = await this.client.getBlockNumber();
    const fromBlock = BigInt(syncStatus.lastSyncedBlock + 1);
    const toBlock = currentBlock;
    
    if (fromBlock > toBlock) {
      console.log('✅ TokenFactory already synced');
      return;
    }
    
    console.log(`📥 Syncing TokenFactory events from block ${fromBlock} to ${toBlock}...`);
    
    const logs = await this.client.getLogs({
      address: this.contracts.TokenFactory,
      event: TOKEN_FACTORY_EVENTS.TokenCreated,
      fromBlock,
      toBlock
    });
    
    console.log(`Found ${logs.length} TokenCreated events`);
    
    for (const log of logs) {
      const { token, name, symbol, totalSupply, creator } = log.args;
      
      // Check if token already exists
      const existing = await prisma.token.findUnique({
        where: { address: token }
      });
      
      if (!existing) {
        // Find user by wallet
        const user = await prisma.user.findFirst({
          where: { web3Wallet: { equals: creator, mode: 'insensitive' } }
        });
        
        await prisma.token.create({
          data: {
            address: token,
            name,
            symbol,
            totalSupply: totalSupply.toString(),
            creatorAddress: creator,
            creatorId: user?.id,
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber)
          }
        });
        
        console.log(`✅ Created token: ${name} (${symbol}) at ${token}`);
      }
    }
    
    // Update sync status
    await prisma.syncStatus.update({
      where: { contractName: 'TokenFactory' },
      data: { 
        lastSyncedBlock: Number(toBlock),
        lastSyncedAt: new Date()
      }
    });
  }

  /**
   * Sync Trade events (Buy/Sell) from BondingCurve
   */
  async syncTradeEvents() {
    const syncStatus = await prisma.syncStatus.findUnique({
      where: { contractName: 'BondingCurve' }
    });
    
    if (!syncStatus || !this.contracts.BondingCurve) {
      console.log('⏭️ BondingCurve not configured, skipping...');
      return;
    }
    
    const currentBlock = await this.client.getBlockNumber();
    const fromBlock = BigInt(syncStatus.lastSyncedBlock + 1);
    const toBlock = currentBlock;
    
    if (fromBlock > toBlock) {
      console.log('✅ BondingCurve already synced');
      return;
    }
    
    console.log(`📥 Syncing BondingCurve events from block ${fromBlock} to ${toBlock}...`);
    
    // Sync purchases
    const buyLogs = await this.client.getLogs({
      address: this.contracts.BondingCurve,
      event: BONDING_CURVE_EVENTS.TokenPurchased,
      fromBlock,
      toBlock
    });
    
    console.log(`Found ${buyLogs.length} TokenPurchased events`);
    
    for (const log of buyLogs) {
      await this.createTradeFromLog(log, 'BUY');
    }
    
    // Sync sells
    const sellLogs = await this.client.getLogs({
      address: this.contracts.BondingCurve,
      event: BONDING_CURVE_EVENTS.TokenSold,
      fromBlock,
      toBlock
    });
    
    console.log(`Found ${sellLogs.length} TokenSold events`);
    
    for (const log of sellLogs) {
      await this.createTradeFromLog(log, 'SELL');
    }
    
    // Update sync status
    await prisma.syncStatus.update({
      where: { contractName: 'BondingCurve' },
      data: { 
        lastSyncedBlock: Number(toBlock),
        lastSyncedAt: new Date()
      }
    });
  }

  /**
   * Create trade record from log
   */
  async createTradeFromLog(log, type) {
    const { token, buyer, seller, ethAmount, tokenAmount, newPrice } = log.args;
    const traderAddress = type === 'BUY' ? buyer : seller;
    
    // Check if trade already exists
    const existing = await prisma.trade.findUnique({
      where: { txHash: log.transactionHash }
    });
    
    if (existing) return;
    
    // Check if token exists
    const tokenRecord = await prisma.token.findUnique({
      where: { address: token }
    });
    
    if (!tokenRecord) {
      console.log(`⚠️ Token ${token} not found, skipping trade...`);
      return;
    }
    
    // Find trader user
    const user = await prisma.user.findFirst({
      where: { web3Wallet: { equals: traderAddress, mode: 'insensitive' } }
    });
    
    await prisma.trade.create({
      data: {
        tokenAddress: token,
        traderAddress,
        traderId: user?.id,
        type,
        ethAmount: formatUnits(ethAmount, 18),
        tokenAmount: formatUnits(tokenAmount, 18),
        price: formatUnits(newPrice, 18),
        txHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        logIndex: log.logIndex
      }
    });
    
    // Update holder balance
    await this.updateHolderBalance(token, traderAddress);
    
    console.log(`✅ Created ${type} trade: ${formatUnits(tokenAmount, 18)} tokens for ${formatUnits(ethAmount, 18)} ETH`);
  }

  /**
   * Update holder balance from on-chain
   */
  async updateHolderBalance(tokenAddress, holderAddress) {
    // This would call the token contract to get actual balance
    // For now, we calculate from trades
    
    const trades = await prisma.trade.findMany({
      where: {
        tokenAddress,
        traderAddress: holderAddress
      }
    });
    
    let balance = 0n;
    let totalBought = 0n;
    let totalSold = 0n;
    let firstBuyAt = null;
    let lastTradeAt = null;
    
    for (const trade of trades) {
      const amount = BigInt(Math.floor(parseFloat(trade.tokenAmount) * 1e18));
      
      if (trade.type === 'BUY') {
        balance += amount;
        totalBought += amount;
        if (!firstBuyAt) firstBuyAt = trade.timestamp;
      } else {
        balance -= amount;
        totalSold += amount;
      }
      
      lastTradeAt = trade.timestamp;
    }
    
    // Get token total supply for percentage
    const token = await prisma.token.findUnique({
      where: { address: tokenAddress }
    });
    
    const totalSupply = BigInt(token?.totalSupply || '1');
    const percentage = Number(balance * 10000n / totalSupply) / 100;
    
    // Find user
    const user = await prisma.user.findFirst({
      where: { web3Wallet: { equals: holderAddress, mode: 'insensitive' } }
    });
    
    await prisma.tokenHolder.upsert({
      where: {
        tokenAddress_holderAddress: { tokenAddress, holderAddress }
      },
      update: {
        balance: formatUnits(balance, 18),
        percentage,
        totalBought: formatUnits(totalBought, 18),
        totalSold: formatUnits(totalSold, 18),
        lastTradeAt
      },
      create: {
        tokenAddress,
        holderAddress,
        holderId: user?.id,
        balance: formatUnits(balance, 18),
        percentage,
        totalBought: formatUnits(totalBought, 18),
        totalSold: formatUnits(totalSold, 18),
        firstBuyAt,
        lastTradeAt
      }
    });
  }

  /**
   * Sync YieldClaimed events
   */
  async syncYieldClaimEvents() {
    const syncStatus = await prisma.syncStatus.findUnique({
      where: { contractName: 'YieldDistributor' }
    });
    
    if (!syncStatus || !this.contracts.YieldDistributor) {
      console.log('⏭️ YieldDistributor not configured, skipping...');
      return;
    }
    
    const currentBlock = await this.client.getBlockNumber();
    const fromBlock = BigInt(syncStatus.lastSyncedBlock + 1);
    const toBlock = currentBlock;
    
    if (fromBlock > toBlock) return;
    
    console.log(`📥 Syncing YieldDistributor events...`);
    
    const logs = await this.client.getLogs({
      address: this.contracts.YieldDistributor,
      event: YIELD_DISTRIBUTOR_EVENTS.YieldClaimed,
      fromBlock,
      toBlock
    });
    
    for (const log of logs) {
      const { token, claimer, amount } = log.args;
      
      const existing = await prisma.yieldClaim.findUnique({
        where: { txHash: log.transactionHash }
      });
      
      if (!existing) {
        const user = await prisma.user.findFirst({
          where: { web3Wallet: { equals: claimer, mode: 'insensitive' } }
        });
        
        await prisma.yieldClaim.create({
          data: {
            tokenAddress: token,
            claimerAddress: claimer,
            claimerId: user?.id,
            amount: formatUnits(amount, 18),
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber)
          }
        });
      }
    }
    
    await prisma.syncStatus.update({
      where: { contractName: 'YieldDistributor' },
      data: { lastSyncedBlock: Number(toBlock), lastSyncedAt: new Date() }
    });
  }

  /**
   * Sync CreatorRated events
   */
  async syncCreatorRatingEvents() {
    const syncStatus = await prisma.syncStatus.findUnique({
      where: { contractName: 'CreatorRegistry' }
    });
    
    if (!syncStatus || !this.contracts.CreatorRegistry) {
      console.log('⏭️ CreatorRegistry not configured, skipping...');
      return;
    }
    
    const currentBlock = await this.client.getBlockNumber();
    const fromBlock = BigInt(syncStatus.lastSyncedBlock + 1);
    const toBlock = currentBlock;
    
    if (fromBlock > toBlock) return;
    
    console.log(`📥 Syncing CreatorRegistry events...`);
    
    const logs = await this.client.getLogs({
      address: this.contracts.CreatorRegistry,
      event: CREATOR_REGISTRY_EVENTS.CreatorRated,
      fromBlock,
      toBlock
    });
    
    for (const log of logs) {
      const { creator, rater, rating } = log.args;
      
      const existing = await prisma.creatorRating.findUnique({
        where: { txHash: log.transactionHash }
      });
      
      if (!existing) {
        const user = await prisma.user.findFirst({
          where: { web3Wallet: { equals: rater, mode: 'insensitive' } }
        });
        
        await prisma.creatorRating.upsert({
          where: {
            creatorAddress_raterAddress: { creatorAddress: creator, raterAddress: rater }
          },
          update: {
            rating: Number(rating) / 100, // Convert from 100-500 to 1-5
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber)
          },
          create: {
            creatorAddress: creator,
            raterAddress: rater,
            raterId: user?.id,
            rating: Number(rating) / 100,
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber)
          }
        });
      }
    }
    
    await prisma.syncStatus.update({
      where: { contractName: 'CreatorRegistry' },
      data: { lastSyncedBlock: Number(toBlock), lastSyncedAt: new Date() }
    });
  }

  /**
   * Update token metrics (price, volume, holders) from trades
   */
  async updateTokenMetrics() {
    console.log('📊 Updating token metrics...');
    
    const tokens = await prisma.token.findMany();
    
    for (const token of tokens) {
      // Get latest trade price
      const latestTrade = await prisma.trade.findFirst({
        where: { tokenAddress: token.address },
        orderBy: { timestamp: 'desc' }
      });
      
      // Calculate 24h volume
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const trades24h = await prisma.trade.aggregate({
        where: {
          tokenAddress: token.address,
          timestamp: { gte: dayAgo }
        },
        _sum: { ethAmount: true },
        _count: true
      });
      
      // Calculate total volume
      const totalVolume = await prisma.trade.aggregate({
        where: { tokenAddress: token.address },
        _sum: { ethAmount: true }
      });
      
      // Count unique holders
      const holderCount = await prisma.tokenHolder.count({
        where: { 
          tokenAddress: token.address,
          balance: { gt: 0 }
        }
      });
      
      // Trade count
      const tradeCount = await prisma.trade.count({
        where: { tokenAddress: token.address }
      });
      
      // Calculate price change
      const dayAgoTrade = await prisma.trade.findFirst({
        where: {
          tokenAddress: token.address,
          timestamp: { lte: dayAgo }
        },
        orderBy: { timestamp: 'desc' }
      });
      
      let priceChange24h = 0;
      if (latestTrade && dayAgoTrade) {
        const oldPrice = parseFloat(dayAgoTrade.price);
        const newPrice = parseFloat(latestTrade.price);
        if (oldPrice > 0) {
          priceChange24h = ((newPrice - oldPrice) / oldPrice) * 100;
        }
      }
      
      // Market cap
      const currentPrice = latestTrade ? parseFloat(latestTrade.price) : 0;
      const supply = parseFloat(token.totalSupply) / 1e18;
      const marketCap = currentPrice * supply;
      
      await prisma.token.update({
        where: { address: token.address },
        data: {
          currentPrice,
          marketCap,
          totalVolume: totalVolume._sum.ethAmount || 0,
          volume24h: trades24h._sum.ethAmount || 0,
          priceChange24h,
          holderCount,
          tradeCount
        }
      });
    }
    
    console.log(`✅ Updated metrics for ${tokens.length} tokens`);
  }

  /**
   * Start continuous sync (call periodically)
   */
  async startContinuousSync(intervalMs = 30000) {
    console.log(`🔄 Starting continuous sync every ${intervalMs / 1000}s...`);
    
    await this.initializeSyncStatus();
    await this.syncAll();
    
    setInterval(async () => {
      try {
        await this.syncAll();
      } catch (error) {
        console.error('❌ Continuous sync error:', error.message);
      }
    }, intervalMs);
  }
}

export default new BlockchainSyncService();
