/**
 * Launchpad 2.0 - Complete Contract ABIs
 * Generated from compiled smart contracts
 */

export const TokenFactoryABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_feeReceiver", type: "address" },
      { name: "_launchFee", type: "uint256" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createToken",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "initialSupply", type: "uint256" }
    ],
    outputs: [{ name: "tokenAddress", type: "address" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "launchFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "feeReceiver",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "isValidToken",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getTokensByCreator",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getAllTokens",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "TokenCreated",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "initialSupply", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  }
];

export const BondingCurveABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_tokenFactory", type: "address" },
      { name: "_feeCollector", type: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createMarket",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "buy",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "maxPrice", type: "uint256" }
    ],
    outputs: [{ name: "ethSpent", type: "uint256" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "sell",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "minPrice", type: "uint256" }
    ],
    outputs: [{ name: "ethReceived", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "calculateBuyPrice",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "price", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "calculateSellPrice",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "price", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getMarketInfo",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      {
        components: [
          { name: "isActive", type: "bool" },
          { name: "currentSupply", type: "uint256" },
          { name: "reserveBalance", type: "uint256" },
          { name: "totalVolume", type: "uint256" }
        ],
        type: "tuple"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "TokenPurchased",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "ethSpent", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "TokenSold",
    inputs: [
      { name: "seller", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "ethReceived", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  }
];

export const YieldDistributorABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createPool",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "depositYield",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "distributeYield",
    inputs: [
      { name: "token", type: "address" },
      { name: "holders", type: "address[]" },
      { name: "balances", type: "uint256[]" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "claimYield",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "amount", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "claimMultiple",
    inputs: [{ name: "tokens", type: "address[]" }],
    outputs: [{ name: "totalClaimed", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getPendingYield",
    inputs: [
      { name: "token", type: "address" },
      { name: "holder", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPoolInfo",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      {
        components: [
          { name: "isActive", type: "bool" },
          { name: "totalYield", type: "uint256" },
          { name: "totalClaimed", type: "uint256" },
          { name: "lastDistribution", type: "uint256" }
        ],
        type: "tuple"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "YieldDistributed",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "holderCount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "YieldClaimed",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "holder", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  }
];

export const CreatorRegistryABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerCreator",
    inputs: [
      { name: "name", type: "string" },
      { name: "bio", type: "string" },
      { name: "socialLinks", type: "string[]" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updateProfile",
    inputs: [
      { name: "name", type: "string" },
      { name: "bio", type: "string" },
      { name: "socialLinks", type: "string[]" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "rateCreator",
    inputs: [
      { name: "creator", type: "address" },
      { name: "score", type: "uint8" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "flagCreator",
    inputs: [
      { name: "creator", type: "address" },
      { name: "reason", type: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getCreatorProfile",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      {
        components: [
          { name: "name", type: "string" },
          { name: "bio", type: "string" },
          { name: "socialLinks", type: "string[]" },
          { name: "isRegistered", type: "bool" },
          { name: "isVerified", type: "bool" },
          { name: "isBanned", type: "bool" },
          { name: "registeredAt", type: "uint256" }
        ],
        type: "tuple"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getCreatorStats",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      {
        components: [
          { name: "tokensCreated", type: "uint256" },
          { name: "totalVolume", type: "uint256" },
          { name: "averageRating", type: "uint256" },
          { name: "totalRatings", type: "uint256" },
          { name: "flagsReceived", type: "uint256" }
        ],
        type: "tuple"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "CreatorRegistered",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "CreatorRated",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "rater", type: "address", indexed: true },
      { name: "score", type: "uint8", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  }
];

export const LiquidityLockerABI = [
  {
    type: "constructor",
    inputs: [{ name: "_penaltyReceiver", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "lockLiquidity",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "description", type: "string" }
    ],
    outputs: [{ name: "lockId", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "unlock",
    inputs: [{ name: "lockId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "emergencyUnlock",
    inputs: [{ name: "lockId", type: "uint256" }],
    outputs: [{ name: "penalty", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getLockInfo",
    inputs: [{ name: "lockId", type: "uint256" }],
    outputs: [
      {
        components: [
          { name: "token", type: "address" },
          { name: "owner", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "lockTime", type: "uint256" },
          { name: "unlockTime", type: "uint256" },
          { name: "isUnlocked", type: "bool" },
          { name: "description", type: "string" }
        ],
        type: "tuple"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "LiquidityLocked",
    inputs: [
      { name: "lockId", type: "uint256", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "unlockTime", type: "uint256", indexed: false }
    ]
  }
];

export const FeeCollectorABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_teamWallet", type: "address" },
      { name: "_yieldDistributor", type: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "withdrawTeamFees",
    inputs: [],
    outputs: [{ name: "amount", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "sendYieldToDistributor",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getTeamBalance",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getYieldBalance",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "FeesCollected",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "teamShare", type: "uint256", indexed: false },
      { name: "yieldShare", type: "uint256", indexed: false }
    ]
  }
];

// Export all ABIs
export const CONTRACT_ABIS = {
  TOKEN_FACTORY: TokenFactoryABI,
  BONDING_CURVE: BondingCurveABI,
  YIELD_DISTRIBUTOR: YieldDistributorABI,
  CREATOR_REGISTRY: CreatorRegistryABI,
  LIQUIDITY_LOCKER: LiquidityLockerABI,
  FEE_COLLECTOR: FeeCollectorABI
};
