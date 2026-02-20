/**
 * Token Service
 * Business logic for token operations
 * Connects database with blockchain data
 */

import { PrismaClient } from '@prisma/client';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia, base } from 'viem/chains';

const prisma = new PrismaClient();

class TokenService {
  constructor() {
    this.isMainnet = process.env.NODE_ENV === 'production';
    this.chain = this.isMainnet ? base : baseSepolia;
    
    this.client = createPublicClient({
      chain: this.chain,
      transport: http(process.env.RPC_URL)
    });
  }

  /**
   * Get all tokens with pagination
   */
  async getTokens({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', filter = {} }) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { symbol: { contains: filter.search, mode: 'insensitive' } },
        { address: { equals: filter.search, mode: 'insensitive' } }
      ];
    }
    
    if (filter.creator) {
      where.creatorAddress = { equals: filter.creator, mode: 'insensitive' };
    }
    
    if (filter.graduated !== undefined) {
      where.isGraduated = filter.graduated;
    }
    
    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              web3Wallet: true
            }
          },
          _count: {
            select: {
              trades: true,
              holders: true
            }
          }
        }
      }),
      prisma.token.count({ where })
    ]);
    
    return {
      tokens,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get trending tokens (by volume24h)
   */
  async getTrendingTokens(limit = 10) {
    return prisma.token.findMany({
      where: {
        volume24h: { gt: 0 }
      },
      orderBy: { volume24h: 'desc' },
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  /**
   * Get recently created tokens
   */
  async getRecentTokens(limit = 10) {
    return prisma.token.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  /**
   * Get token by address with full details
   */
  async getTokenByAddress(address) {
    const token = await prisma.token.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            web3Wallet: true
          }
        },
        _count: {
          select: {
            trades: true,
            holders: true,
            yieldClaims: true
          }
        }
      }
    });
    
    if (!token) return null;
    
    // Get top holders
    const topHolders = await prisma.tokenHolder.findMany({
      where: { tokenAddress: address.toLowerCase() },
      orderBy: { balance: 'desc' },
      take: 10,
      include: {
        holder: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
    
    // Get recent trades
    const recentTrades = await prisma.trade.findMany({
      where: { tokenAddress: address.toLowerCase() },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        trader: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
    
    // Get creator stats
    const creatorStats = await this.getCreatorStats(token.creatorAddress);
    
    return {
      ...token,
      topHolders,
      recentTrades,
      creatorStats
    };
  }

  /**
   * Get trades for a token
   */
  async getTokenTrades(address, { page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    
    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: { tokenAddress: address.toLowerCase() },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          trader: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      }),
      prisma.trade.count({ where: { tokenAddress: address.toLowerCase() } })
    ]);
    
    return {
      trades,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get token holders
   */
  async getTokenHolders(address, { page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    
    const [holders, total] = await Promise.all([
      prisma.tokenHolder.findMany({
        where: { 
          tokenAddress: address.toLowerCase(),
          balance: { gt: 0 }
        },
        skip,
        take: limit,
        orderBy: { balance: 'desc' },
        include: {
          holder: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      }),
      prisma.tokenHolder.count({ 
        where: { 
          tokenAddress: address.toLowerCase(),
          balance: { gt: 0 }
        }
      })
    ]);
    
    return {
      holders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get price history for charts
   */
  async getPriceHistory(address, timeframe = '24h') {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));
    
    const trades = await prisma.trade.findMany({
      where: {
        tokenAddress: address.toLowerCase(),
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'asc' },
      select: {
        price: true,
        ethAmount: true,
        tokenAmount: true,
        timestamp: true,
        type: true
      }
    });
    
    // Aggregate into OHLCV candles
    const candleInterval = {
      '1h': 5 * 60 * 1000, // 5 min candles
      '24h': 60 * 60 * 1000, // 1h candles
      '7d': 4 * 60 * 60 * 1000, // 4h candles
      '30d': 24 * 60 * 60 * 1000 // 1d candles
    }[timeframe] || 60 * 60 * 1000;
    
    const candles = [];
    let currentCandle = null;
    
    for (const trade of trades) {
      const candleTime = Math.floor(trade.timestamp.getTime() / candleInterval) * candleInterval;
      const price = parseFloat(trade.price);
      const volume = parseFloat(trade.ethAmount);
      
      if (!currentCandle || currentCandle.time !== candleTime) {
        if (currentCandle) candles.push(currentCandle);
        currentCandle = {
          time: candleTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volume
        };
      } else {
        currentCandle.high = Math.max(currentCandle.high, price);
        currentCandle.low = Math.min(currentCandle.low, price);
        currentCandle.close = price;
        currentCandle.volume += volume;
      }
    }
    
    if (currentCandle) candles.push(currentCandle);
    
    return candles;
  }

  /**
   * Get creator statistics
   */
  async getCreatorStats(creatorAddress) {
    const [tokensCreated, ratings, totalVolume] = await Promise.all([
      prisma.token.count({
        where: { creatorAddress: creatorAddress.toLowerCase() }
      }),
      prisma.creatorRating.aggregate({
        where: { creatorAddress: creatorAddress.toLowerCase() },
        _avg: { rating: true },
        _count: true
      }),
      prisma.token.aggregate({
        where: { creatorAddress: creatorAddress.toLowerCase() },
        _sum: { totalVolume: true }
      })
    ]);
    
    return {
      tokensCreated,
      averageRating: ratings._avg.rating || 0,
      ratingCount: ratings._count,
      totalVolumeGenerated: totalVolume._sum.totalVolume || 0
    };
  }

  /**
   * Get tokens created by a user
   */
  async getTokensByCreator(creatorAddress, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    
    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where: { creatorAddress: creatorAddress.toLowerCase() },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.token.count({
        where: { creatorAddress: creatorAddress.toLowerCase() }
      })
    ]);
    
    return {
      tokens,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get user's token holdings (portfolio)
   */
  async getUserHoldings(userAddress, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    
    const [holdings, total] = await Promise.all([
      prisma.tokenHolder.findMany({
        where: { 
          holderAddress: userAddress.toLowerCase(),
          balance: { gt: 0 }
        },
        skip,
        take: limit,
        orderBy: { balance: 'desc' },
        include: {
          token: true
        }
      }),
      prisma.tokenHolder.count({
        where: { 
          holderAddress: userAddress.toLowerCase(),
          balance: { gt: 0 }
        }
      })
    ]);
    
    // Calculate portfolio value
    let totalValue = 0;
    const enrichedHoldings = holdings.map(h => {
      const value = parseFloat(h.balance) * parseFloat(h.token.currentPrice || 0);
      totalValue += value;
      return {
        ...h,
        value,
        pnl: parseFloat(h.realizedPnl || 0)
      };
    });
    
    return {
      holdings: enrichedHoldings,
      totalValue,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get user's trade history
   */
  async getUserTrades(userAddress, { page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    
    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: { traderAddress: userAddress.toLowerCase() },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          token: {
            select: {
              name: true,
              symbol: true,
              logo: true
            }
          }
        }
      }),
      prisma.trade.count({
        where: { traderAddress: userAddress.toLowerCase() }
      })
    ]);
    
    return {
      trades,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    const [
      totalTokens,
      totalTrades,
      totalVolume,
      uniqueTraders,
      volume24h
    ] = await Promise.all([
      prisma.token.count(),
      prisma.trade.count(),
      prisma.token.aggregate({ _sum: { totalVolume: true } }),
      prisma.trade.groupBy({
        by: ['traderAddress'],
        _count: true
      }).then(r => r.length),
      prisma.token.aggregate({
        _sum: { volume24h: true }
      })
    ]);
    
    return {
      totalTokens,
      totalTrades,
      totalVolume: totalVolume._sum.totalVolume || 0,
      uniqueTraders,
      volume24h: volume24h._sum.volume24h || 0
    };
  }

  /**
   * Save token metadata (after creation)
   */
  async saveTokenMetadata(address, metadata) {
    return prisma.token.update({
      where: { address: address.toLowerCase() },
      data: {
        description: metadata.description,
        logo: metadata.logo,
        website: metadata.website,
        twitter: metadata.twitter,
        telegram: metadata.telegram,
        discord: metadata.discord
      }
    });
  }
}

export default new TokenService();
