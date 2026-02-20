/**
 * Web3 Integration Examples
 * Demonstra como usar os hooks nos componentes
 */

// ============================================
// 1. CREATE TOKEN (CreateTokenPage.jsx)
// ============================================

import { useTokenFactory } from '../hooks/useTokenFactory';

function CreateTokenExample() {
  const { createToken, isCreating, launchFee } = useTokenFactory();
  
  const handleCreate = async () => {
    try {
      await createToken({
        name: "Angola Rising",
        symbol: "AGR",
        initialSupply: "1000000"
      });
      // Token created! Transaction confirmed
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <div>
      <p>Launch Fee: {launchFee ? (Number(launchFee) / 1e18).toFixed(4) : '0.01'} ETH</p>
      <button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Token'}
      </button>
    </div>
  );
}

// ============================================
// 2. BUY/SELL TOKENS (TokenDetailPage.jsx)
// ============================================

import { useBondingCurve } from '../hooks/useBondingCurve';

function TradingExample({ tokenAddress }) {
  const { buyTokens, sellTokens, marketInfo, isTrading } = useBondingCurve(tokenAddress);
  
  const handleBuy = async () => {
    try {
      await buyTokens('100', 5); // Buy 100 tokens, 5% max slippage
      // Purchase successful!
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <div>
      <p>Market Active: {marketInfo.isActive ? 'Yes' : 'No'}</p>
      <p>Current Supply: {Number(marketInfo.currentSupply)}</p>
      <p>Total Volume: {Number(marketInfo.totalVolume) / 1e18} ETH</p>
      <button onClick={handleBuy} disabled={isTrading}>
        {isTrading ? 'Buying...' : 'Buy Tokens'}
      </button>
    </div>
  );
}

// ============================================
// 3. CLAIM YIELD (MyPortfolioPage.jsx)
// ============================================

import { useYieldClaim } from '../hooks/useYieldClaim';

function YieldClaimExample({ tokenAddress }) {
  const { pendingYield, claimYield, isClaiming, poolInfo } = useYieldClaim(tokenAddress);
  
  const handleClaim = async () => {
    try {
      await claimYield();
      // Yield claimed!
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <div>
      <p>Pending Yield: {pendingYield} ETH</p>
      <p>Pool Active: {poolInfo.isActive ? 'Yes' : 'No'}</p>
      <p>Total Pool Yield: {Number(poolInfo.totalYield) / 1e18} ETH</p>
      <button onClick={handleClaim} disabled={isClaiming || parseFloat(pendingYield) === 0}>
        {isClaiming ? 'Claiming...' : 'Claim Yield'}
      </button>
    </div>
  );
}

// ============================================
// 4. CLAIM MULTIPLE TOKENS
// ============================================

function MultiClaimExample({ tokenAddresses }) {
  const { claimMultiple, isClaiming } = useYieldClaim(); // Don't pass specific token
  
  const handleClaimAll = async () => {
    try {
      await claimMultiple(tokenAddresses);
      // All yields claimed!
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <button onClick={handleClaimAll} disabled={isClaiming}>
      {isClaiming ? 'Claiming...' : `Claim from ${tokenAddresses.length} tokens`}
    </button>
  );
}

// ============================================
// 5. CREATOR PROFILE (CreatorDashboard.jsx)
// ============================================

import { useCreatorProfile } from '../hooks/useCreatorProfile';

function CreatorProfileExample({ creatorAddress }) {
  const { 
    profile, 
    stats, 
    registerCreator, 
    updateProfile,
    rateCreator,
    isRegistered 
  } = useCreatorProfile(creatorAddress);
  
  const handleRegister = async () => {
    try {
      await registerCreator({
        name: "Angola Crypto",
        bio: "Building the future of finance in Angola",
        socialLinks: [
          "https://twitter.com/angolacrypto",
          "https://t.me/angolacrypto"
        ]
      });
      // Profile registered!
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleRate = async () => {
    try {
      await rateCreator(creatorAddress, 5); // Rate 5 stars
      // Rating submitted!
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <div>
      {!isRegistered ? (
        <button onClick={handleRegister}>Register as Creator</button>
      ) : (
        <div>
          <h3>{profile.name}</h3>
          <p>{profile.bio}</p>
          <p>Verified: {profile.isVerified ? 'Yes' : 'No'}</p>
          <p>Tokens Created: {Number(stats.tokensCreated)}</p>
          <p>Average Rating: {Number(stats.averageRating) / 100}/5</p>
          <button onClick={handleRate}>Rate this Creator</button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 6. GET USER'S TOKENS
// ============================================

import { useTokenFactory } from '../hooks/useTokenFactory';

function MyTokensExample({ userAddress }) {
  const { getUserTokens, allTokens } = useTokenFactory();
  const [myTokens, setMyTokens] = useState([]);
  
  useEffect(() => {
    async function loadMyTokens() {
      const tokens = await getUserTokens(userAddress);
      setMyTokens(tokens);
    }
    
    if (userAddress) {
      loadMyTokens();
    }
  }, [userAddress]);
  
  return (
    <div>
      <h3>My Created Tokens ({myTokens.length})</h3>
      {myTokens.map(tokenAddr => (
        <div key={tokenAddr}>{tokenAddr}</div>
      ))}
    </div>
  );
}

// ============================================
// 7. CALCULATE PRICES (before trading)
// ============================================

import { useBondingCurve } from '../hooks/useBondingCurve';

function PriceCalculatorExample({ tokenAddress }) {
  const { calculateBuyPrice, calculateSellPrice } = useBondingCurve(tokenAddress);
  const [amount, setAmount] = useState('100');
  const [buyPrice, setBuyPrice] = useState('0');
  const [sellPrice, setSellPrice] = useState('0');
  
  useEffect(() => {
    async function updatePrices() {
      const buy = await calculateBuyPrice(amount);
      const sell = await calculateSellPrice(amount);
      setBuyPrice(buy);
      setSellPrice(sell);
    }
    
    if (amount && parseFloat(amount) > 0) {
      updatePrices();
    }
  }, [amount]);
  
  return (
    <div>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <p>Buy {amount} tokens for: {buyPrice} ETH</p>
      <p>Sell {amount} tokens for: {sellPrice} ETH</p>
    </div>
  );
}

// ============================================
// NEXT STEPS AFTER DEPLOYMENT
// ============================================

/**
 * 1. Deploy contracts to Base Sepolia
 * 2. Copy deployed addresses from deployment JSON
 * 3. Update CONTRACTS in constants.js:
 * 
 * export const CONTRACTS = {
 *   TOKEN_FACTORY: '0x...', // From deployment
 *   BONDING_CURVE: '0x...', // From deployment
 *   YIELD_DISTRIBUTOR: '0x...', // From deployment
 *   CREATOR_REGISTRY: '0x...', // From deployment
 *   LIQUIDITY_LOCKER: '0x...', // From deployment
 *   FEE_COLLECTOR: '0x...' // From deployment
 * };
 * 
 * 4. Test each flow:
 *    - Create token
 *    - Buy/sell tokens
 *    - Claim yield
 *    - Register creator profile
 * 
 * 5. Monitor transactions on BaseScan
 */
