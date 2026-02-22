import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle, Zap, Settings2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useBondingCurve } from '../hooks/useBondingCurve';
import { transactionToast } from '../hooks/useTransactionNotification.jsx';

export default function TradingPanel({ tokenAddress, tokenSymbol }) {
  const { address } = useAccount();
  const { buyTokens, sellTokens, calculateBuyPrice, calculateSellPrice, marketInfo, isTrading } = useBondingCurve(tokenAddress);

  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('0');
  const [slippage, setSlippage] = useState(5);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: ethBalance } = useBalance({ address });
  const tokenBalance = '0';

  useEffect(() => {
    const calculateEstimate = async () => {
      if (!amount || parseFloat(amount) <= 0) { setEstimatedPrice('0'); return; }
      try {
        if (activeTab === 'buy') {
          const ethCost = await calculateBuyPrice(parseEther(amount));
          setEstimatedPrice(ethCost ? formatEther(ethCost) : '0');
        } else {
          const ethReceived = await calculateSellPrice(parseEther(amount));
          setEstimatedPrice(ethReceived ? formatEther(ethReceived) : '0');
        }
      } catch { setEstimatedPrice('0'); }
    };
    calculateEstimate();
  }, [amount, activeTab, calculateBuyPrice, calculateSellPrice]);

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!address) { toast.error('Connect your wallet'); return; }
    if (activeTab === 'buy') {
      const bal = ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0;
      if (parseFloat(estimatedPrice) > bal) { toast.error('Insufficient ETH balance'); return; }
    } else {
      if (parseFloat(amount) > parseFloat(tokenBalance)) { toast.error(`Insufficient ${tokenSymbol} balance`); return; }
    }
    try {
      let toastId;
      if (activeTab === 'buy') {
        toastId = transactionToast.pending('Transaction submitted...');
        const tx = await buyTokens(parseEther(amount), slippage);
        if (tx) { toast.dismiss(toastId); transactionToast.success(tx, `Bought ${amount} ${tokenSymbol}!`); setAmount(''); }
      } else {
        toastId = transactionToast.pending('Transaction submitted...');
        const tx = await sellTokens(parseEther(amount), slippage);
        if (tx) { toast.dismiss(toastId); transactionToast.success(tx, `Sold ${amount} ${tokenSymbol}!`); setAmount(''); }
      }
    } catch (error) {
      let msg = 'Transaction failed';
      if (error.message?.includes('User rejected')) msg = 'Transaction rejected';
      else if (error.message?.includes('insufficient funds')) msg = 'Insufficient funds';
      else if (error.message?.includes('slippage')) msg = 'Price moved too much — increase slippage';
      transactionToast.error(msg, error.message);
    }
  };

  const setMaxAmount = () => {
    if (activeTab === 'buy' && ethBalance) {
      setAmount((parseFloat(formatEther(ethBalance.value)) * 0.95).toFixed(4));
    } else {
      setAmount(tokenBalance);
    }
  };

  const priceImpact = marketInfo && estimatedPrice !== '0'
    ? ((parseFloat(estimatedPrice) / parseFloat(amount || 1) - parseFloat(formatEther(marketInfo.currentPrice || '0'))) / parseFloat(formatEther(marketInfo.currentPrice || '1')) * 100).toFixed(2)
    : '0';

  const isBuy = activeTab === 'buy';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

        .tp-root {
          font-family: 'Syne', sans-serif;
          background: #0a0a0f;
          border: 1px solid #1c1c28;
          border-radius: 20px;
          padding: 28px;
          max-width: 420px;
          width: 100%;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 80px rgba(0,0,0,0.6);
        }

        .tp-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 40% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Tab Toggle */
        .tp-tabs {
          display: flex;
          background: #111118;
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 24px;
          position: relative;
        }

        .tp-tab {
          flex: 1;
          padding: 10px 0;
          border: none;
          border-radius: 9px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          color: #4a4a6a;
        }

        .tp-tab.active-buy {
          background: linear-gradient(135deg, #00dc82, #00a65f);
          color: #001a0d;
          box-shadow: 0 4px 20px rgba(0,220,130,0.3);
        }

        .tp-tab.active-sell {
          background: linear-gradient(135deg, #ff4d6d, #c9184a);
          color: #fff;
          box-shadow: 0 4px 20px rgba(255,77,109,0.3);
        }

        /* Price Card */
        .tp-price-card {
          background: #0e0e1a;
          border: 1px solid #1c1c2e;
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tp-price-label {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #4a4a6a;
          margin-bottom: 4px;
        }

        .tp-price-value {
          font-family: 'DM Mono', monospace;
          font-size: 22px;
          font-weight: 500;
          color: #e8e8ff;
          letter-spacing: -0.02em;
        }

        .tp-price-unit {
          font-size: 13px;
          color: #6b6b9a;
          margin-left: 5px;
        }

        .tp-stats {
          display: flex;
          gap: 20px;
          text-align: right;
        }

        .tp-stat-label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #3a3a58;
          margin-bottom: 3px;
        }

        .tp-stat-value {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #6b6b9a;
        }

        /* Input */
        .tp-input-wrapper {
          margin-bottom: 16px;
        }

        .tp-input-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .tp-input-label {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4a4a6a;
          font-weight: 600;
        }

        .tp-max-btn {
          background: none;
          border: 1px solid #2a2a42;
          border-radius: 6px;
          padding: 3px 10px;
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #6b6b9a;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tp-max-btn:hover {
          border-color: #4a4a9a;
          color: #9898cc;
        }

        .tp-input-box {
          background: #0e0e1a;
          border: 1px solid #1c1c2e;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: border-color 0.2s;
        }

        .tp-input-box:focus-within {
          border-color: #4a4aaa;
        }

        .tp-input-box input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: 'DM Mono', monospace;
          font-size: 22px;
          font-weight: 500;
          color: #e8e8ff;
          min-width: 0;
        }

        .tp-input-box input::placeholder { color: #2a2a48; }

        .tp-token-badge {
          background: #1a1a2e;
          border: 1px solid #2a2a42;
          border-radius: 8px;
          padding: 5px 12px;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #8888bb;
          white-space: nowrap;
        }

        /* Balance row */
        .tp-balance {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          padding: 0 4px;
        }

        .tp-balance-label {
          font-size: 11px;
          color: #3a3a58;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .tp-balance-value {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #5a5a7a;
        }

        /* Estimate box */
        .tp-estimate {
          background: #0e0e1a;
          border: 1px solid #1c1c2e;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tp-estimate-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tp-estimate-key {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #3a3a58;
        }

        .tp-estimate-val {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #9898cc;
        }

        .tp-slippage-val {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #f59e0b;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.2);
          border-radius: 5px;
          padding: 2px 8px;
        }

        .tp-impact-warn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          background: rgba(255,100,0,0.07);
          border: 1px solid rgba(255,100,0,0.15);
          border-radius: 8px;
          font-size: 11px;
          color: #f97316;
          letter-spacing: 0.04em;
        }

        /* Advanced */
        .tp-adv-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: #3a3a58;
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 14px;
          transition: color 0.2s;
          padding: 0;
        }

        .tp-adv-toggle:hover { color: #6a6a8a; }

        .tp-adv-toggle svg { transition: transform 0.2s; }
        .tp-adv-toggle.open svg { transform: rotate(180deg); }

        .tp-adv-panel {
          background: #0e0e1a;
          border: 1px solid #1c1c2e;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 18px;
        }

        .tp-adv-label {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4a4a6a;
          margin-bottom: 10px;
        }

        .tp-slippage-options {
          display: flex;
          gap: 6px;
        }

        .tp-slip-btn {
          background: #141420;
          border: 1px solid #2a2a42;
          border-radius: 8px;
          padding: 7px 14px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #5a5a7a;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tp-slip-btn.active {
          background: rgba(245,158,11,0.1);
          border-color: rgba(245,158,11,0.4);
          color: #f59e0b;
        }

        .tp-slip-btn:hover:not(.active) {
          border-color: #3a3a5a;
          color: #8888aa;
        }

        .tp-slip-input {
          flex: 1;
          background: #141420;
          border: 1px solid #2a2a42;
          border-radius: 8px;
          padding: 7px 12px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #9898cc;
          outline: none;
          min-width: 0;
          transition: border-color 0.2s;
        }

        .tp-slip-input:focus { border-color: #4a4a7a; }

        /* CTA Button */
        .tp-cta {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 14px;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }

        .tp-cta::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(255,255,255,0.08), transparent);
          pointer-events: none;
        }

        .tp-cta.buy {
          background: linear-gradient(135deg, #00dc82, #00a65f);
          color: #001a0d;
          box-shadow: 0 6px 30px rgba(0,220,130,0.25);
        }

        .tp-cta.buy:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 40px rgba(0,220,130,0.35);
        }

        .tp-cta.sell {
          background: linear-gradient(135deg, #ff4d6d, #c9184a);
          color: #fff;
          box-shadow: 0 6px 30px rgba(255,77,109,0.25);
        }

        .tp-cta.sell:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 40px rgba(255,77,109,0.35);
        }

        .tp-cta:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none !important;
        }

        /* Footer note */
        .tp-footer {
          margin-top: 16px;
          font-size: 11px;
          color: #2a2a40;
          text-align: center;
          letter-spacing: 0.04em;
          line-height: 1.6;
        }

        .tp-divider {
          height: 1px;
          background: #1a1a2a;
          margin: 6px 0 12px;
        }
      `}</style>

      <div className="tp-root">
        {/* Tabs */}
        <div className="tp-tabs">
          <button
            onClick={() => setActiveTab('buy')}
            className={`tp-tab ${isBuy ? 'active-buy' : ''}`}
          >
            <ArrowUpRight size={15} />
            Buy
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`tp-tab ${!isBuy ? 'active-sell' : ''}`}
          >
            <ArrowDownRight size={15} />
            Sell
          </button>
        </div>

        {/* Price Card */}
        <div className="tp-price-card">
          <div>
            <div className="tp-price-label">Current Price</div>
            <div className="tp-price-value">
              {marketInfo?.currentPrice ? parseFloat(formatEther(marketInfo.currentPrice)).toFixed(6) : '0.000000'}
              <span className="tp-price-unit">ETH</span>
            </div>
          </div>
          {marketInfo && (
            <div className="tp-stats">
              <div>
                <div className="tp-stat-label">Supply</div>
                <div className="tp-stat-value">{marketInfo.totalSupply ? parseFloat(formatEther(marketInfo.totalSupply)).toFixed(2) : '0'}</div>
              </div>
              <div>
                <div className="tp-stat-label">Reserve</div>
                <div className="tp-stat-value">{marketInfo.reserveBalance ? parseFloat(formatEther(marketInfo.reserveBalance)).toFixed(4) : '0'} ETH</div>
              </div>
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="tp-input-wrapper">
          <div className="tp-input-header">
            <span className="tp-input-label">{isBuy ? 'Buy amount' : 'Sell amount'}</span>
            <button className="tp-max-btn" onClick={setMaxAmount}>Max</button>
          </div>
          <div className="tp-input-box">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <div className="tp-token-badge">{tokenSymbol}</div>
          </div>
        </div>

        {/* Balance */}
        <div className="tp-balance">
          <span className="tp-balance-label">Balance</span>
          <span className="tp-balance-value">
            {isBuy
              ? `${ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : '0.0000'} ETH`
              : `${tokenBalance} ${tokenSymbol}`}
          </span>
        </div>

        {/* Estimate */}
        {amount && parseFloat(amount) > 0 && (
          <div className="tp-estimate">
            <div className="tp-estimate-row">
              <span className="tp-estimate-key">{isBuy ? 'You Pay' : 'You Receive'}</span>
              <span className="tp-estimate-val">
                {estimatedPrice !== '0' ? `${parseFloat(estimatedPrice).toFixed(6)} ETH` : '...'}
              </span>
            </div>
            <div className="tp-divider" />
            <div className="tp-estimate-row">
              <span className="tp-estimate-key">Slippage</span>
              <span className="tp-slippage-val">{slippage}%</span>
            </div>
            {parseFloat(priceImpact) > 1 && (
              <div className="tp-impact-warn">
                <AlertTriangle size={13} />
                Price impact {priceImpact}% — proceed with caution
              </div>
            )}
          </div>
        )}

        {/* Advanced */}
        <button
          className={`tp-adv-toggle ${showAdvanced ? 'open' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings2 size={13} />
          Advanced
          <ChevronDown size={13} />
        </button>

        {showAdvanced && (
          <div className="tp-adv-panel">
            <div className="tp-adv-label">Slippage Tolerance</div>
            <div className="tp-slippage-options">
              {[1, 5, 10].map((p) => (
                <button
                  key={p}
                  onClick={() => setSlippage(p)}
                  className={`tp-slip-btn ${slippage === p ? 'active' : ''}`}
                >
                  {p}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 5)}
                className="tp-slip-input"
                placeholder="Custom"
                min="1"
                max="50"
                step="1"
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleTrade}
          disabled={isTrading || !amount || parseFloat(amount) <= 0 || !address}
          className={`tp-cta ${isBuy ? 'buy' : 'sell'}`}
        >
          {isTrading ? (
            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
          ) : !address ? (
            'Connect Wallet'
          ) : (
            <><Zap size={16} /> {isBuy ? 'Buy' : 'Sell'} {tokenSymbol}</>
          )}
        </button>

        <p className="tp-footer">
          Prices follow the bonding curve formula. Slippage protects against price movement during execution.
        </p>
      </div>
    </>
  );
}