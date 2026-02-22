import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import { TrendingUp, TrendingDown, Loader2, Radio } from 'lucide-react';
import { useBondingCurve } from '../hooks/useBondingCurve';
import { useTokenChart } from '../hooks/useTokens';
import { formatEther } from 'viem';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');

  .tc-root {
    --ink: #08080f;
    --ink-2: #0f0f1c;
    --ink-3: #161626;
    --ink-4: #1f1f35;
    --ink-5: #2a2a44;
    --muted: #42426a;
    --muted-2: #6060a0;
    --ghost: #9898cc;
    --soft: #c8c8ee;
    --bright: #e8e8ff;
    --accent: #7b61ff;
    --green: #00e090;
    --green-dim: rgba(0,224,144,0.12);
    --green-border: rgba(0,224,144,0.2);
    --red: #ff4f72;
    --red-dim: rgba(255,79,114,0.12);
    --red-border: rgba(255,79,114,0.2);
    --gold: #f5c842;

    font-family: 'Outfit', sans-serif;
    background: var(--ink-2);
    border: 1px solid var(--ink-4);
    border-radius: 16px;
    overflow: hidden;
  }

  /* ── TOP BAR ── */
  .tc-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--ink-3);
    gap: 12px;
    flex-wrap: wrap;
    background: var(--ink-2);
  }

  .tc-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .tc-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tc-title-text {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 0.06em;
    color: var(--bright);
    line-height: 1;
  }

  /* Live dot */
  .tc-live {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--green);
    background: var(--green-dim);
    border: 1px solid var(--green-border);
    border-radius: 20px;
    padding: 3px 9px;
  }

  .tc-live-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--green);
    animation: tc-pulse 1.8s ease-in-out infinite;
  }

  @keyframes tc-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  /* OHLC strip */
  .tc-ohlc {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  .tc-ohlc-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .tc-ohlc-key {
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 600;
  }

  .tc-ohlc-val {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--soft);
  }

  .tc-ohlc-val.up { color: var(--green); }
  .tc-ohlc-val.down { color: var(--red); }

  /* Timeframe buttons */
  .tc-tf-group {
    display: flex;
    background: var(--ink-3);
    border: 1px solid var(--ink-4);
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
  }

  .tc-tf-btn {
    background: none;
    border: none;
    padding: 5px 12px;
    border-radius: 7px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.18s;
  }

  .tc-tf-btn:hover { color: var(--ghost); }

  .tc-tf-btn.active {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 2px 10px rgba(123,97,255,0.3);
  }

  /* ── CHART WRAP ── */
  .tc-chart-wrap {
    position: relative;
    background: var(--ink);
  }

  .tc-loader {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(8,8,15,0.7);
    z-index: 10;
    backdrop-filter: blur(2px);
  }

  @keyframes tc-spin { to { transform: rotate(360deg); } }
  .tc-spinner { animation: tc-spin 0.9s linear infinite; color: var(--accent); }

  /* ── BOTTOM BAR ── */
  .tc-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-top: 1px solid var(--ink-3);
    flex-wrap: wrap;
    gap: 10px;
  }

  .tc-legend {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .tc-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--muted);
    text-transform: uppercase;
  }

  .tc-legend-swatch {
    width: 10px; height: 10px;
    border-radius: 2px;
  }

  .tc-legend-line {
    width: 14px; height: 1px;
    border-top: 1px dashed;
  }

  .tc-disclaimer {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.04em;
    font-style: italic;
  }

  /* Price change badge */
  .tc-change-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 20px;
    letter-spacing: 0.04em;
  }

  .tc-change-badge.up {
    color: var(--green);
    background: var(--green-dim);
    border: 1px solid var(--green-border);
  }

  .tc-change-badge.down {
    color: var(--red);
    background: var(--red-dim);
    border: 1px solid var(--red-border);
  }
`;

const TIMEFRAMES = [
  { label: '1H', value: '1H', seconds: 3600,   points: 60,  apiTf: '1h'  },
  { label: '4H', value: '4H', seconds: 14400,  points: 48,  apiTf: '4h'  },
  { label: '1D', value: '1D', seconds: 86400,  points: 96,  apiTf: '24h' },
  { label: '1W', value: '1W', seconds: 604800, points: 168, apiTf: '7d'  },
];

function generateMockData(timeframe, currentPrice = 0.001) {
  const cfg = TIMEFRAMES.find(t => t.value === timeframe);
  const now = Math.floor(Date.now() / 1000);
  const step = cfg.seconds / cfg.points;
  const data = [], volumeData = [];

  for (let i = cfg.points; i >= 0; i--) {
    const time = Math.floor(now - i * step);
    const progress = (cfg.points - i) / cfg.points;
    const trend = currentPrice * (0.78 + progress * 0.22);
    const noise = (Math.random() - 0.48) * 0.06;
    const base = trend * (1 + noise);
    const open  = base * (0.995 + Math.random() * 0.01);
    const close = base * (0.995 + Math.random() * 0.01);
    const high  = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low   = Math.min(open, close) * (1 - Math.random() * 0.012);

    data.push({ time, open: +open.toFixed(8), high: +high.toFixed(8), low: +low.toFixed(8), close: +close.toFixed(8) });
    volumeData.push({
      time,
      value: Math.random() * 45 + 5,
      color: close >= open ? 'rgba(0,224,144,0.45)' : 'rgba(255,79,114,0.45)',
    });
  }
  return { data, volumeData };
}

export default function TokenChart({ tokenAddress }) {
  const containerRef = useRef();
  const chartRef     = useRef();
  const candleRef    = useRef();
  const volRef       = useRef();

  const [timeframe, setTimeframe]   = useState('1D');
  const [isLoading, setIsLoading]   = useState(true);
  const [ohlc, setOhlc]             = useState(null); // { o, h, l, c, change }

  const { marketInfo } = useBondingCurve(tokenAddress);
  const { data: chartData } = useTokenChart(tokenAddress, TIMEFRAMES.find(t => t.value === timeframe)?.apiTf);

  // Current price from on-chain or mock
  const currentPrice = marketInfo?.currentPrice
    ? parseFloat(formatEther(marketInfo.currentPrice))
    : 0.001;

  // Build & load data
  const loadData = useCallback(() => {
    if (!candleRef.current || !volRef.current) return;
    setIsLoading(true);

    let candles, volumes;

    if (chartData?.candles?.length) {
      candles = chartData.candles;
      volumes = chartData.volumes || [];
    } else {
      const mock = generateMockData(timeframe, currentPrice);
      candles = mock.data;
      volumes = mock.volumeData;
    }

    candleRef.current.setData(candles);
    volRef.current.setData(volumes);
    chartRef.current?.timeScale().fitContent();

    // Set OHLC display from last candle
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    if (last) {
      const pct = prev ? ((last.close - prev.close) / prev.close * 100).toFixed(2) : '0.00';
      setOhlc({ o: last.open, h: last.high, l: last.low, c: last.close, pct });
    }

    setTimeout(() => setIsLoading(false), 200);
  }, [timeframe, chartData, currentPrice]);

  // Init chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#08080f' },
        textColor: '#6060a0',
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#161626' },
        horzLines: { color: '#161626' },
      },
      width: containerRef.current.clientWidth,
      height: 420,
      timeScale: {
        borderColor: '#1f1f35',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          const d = new Date(time * 1000);
          return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        },
      },
      rightPriceScale: {
        borderColor: '#1f1f35',
        scaleMargins: { top: 0.08, bottom: 0.28 },
        textColor: '#6060a0',
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#7b61ff', width: 1, style: 2, labelBackgroundColor: '#7b61ff' },
        horzLine: { color: '#7b61ff', width: 1, style: 2, labelBackgroundColor: '#7b61ff' },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Candle series
    candleRef.current = chart.addCandlestickSeries({
      upColor:        '#00e090',
      downColor:      '#ff4f72',
      borderUpColor:  '#00e090',
      borderDownColor:'#ff4f72',
      wickUpColor:    'rgba(0,224,144,0.6)',
      wickDownColor:  'rgba(255,79,114,0.6)',
    });

    // Volume series
    const vol = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 }, borderVisible: false });
    volRef.current = vol;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Reload when timeframe / data changes
  useEffect(() => { loadData(); }, [loadData]);

  const isUp = ohlc ? parseFloat(ohlc.pct) >= 0 : true;

  return (
    <div className="tc-root">
      <style>{styles}</style>

      {/* ── TOP BAR ── */}
      <div className="tc-topbar">
        <div className="tc-left">
          <div className="tc-title">
            <TrendingUp size={16} color="#7b61ff" />
            <span className="tc-title-text">Price Chart</span>
            <span className="tc-live"><span className="tc-live-dot" />LIVE</span>
          </div>

          {/* OHLC */}
          {ohlc && (
            <div className="tc-ohlc">
              {[
                { k: 'O', v: ohlc.o.toFixed(6) },
                { k: 'H', v: ohlc.h.toFixed(6), cls: 'up' },
                { k: 'L', v: ohlc.l.toFixed(6), cls: 'down' },
                { k: 'C', v: ohlc.c.toFixed(6) },
              ].map(({ k, v, cls }) => (
                <div className="tc-ohlc-item" key={k}>
                  <span className="tc-ohlc-key">{k}</span>
                  <span className={`tc-ohlc-val ${cls || ''}`}>{v}</span>
                </div>
              ))}
              <div className="tc-ohlc-item" style={{ justifyContent: 'flex-end' }}>
                <span className="tc-ohlc-key">CHG</span>
                <span className={`tc-change-badge ${isUp ? 'up' : 'down'}`}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? '+' : ''}{ohlc.pct}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Timeframe */}
        <div className="tc-tf-group">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`tc-tf-btn ${timeframe === tf.value ? 'active' : ''}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHART ── */}
      <div className="tc-chart-wrap">
        {isLoading && (
          <div className="tc-loader">
            <Loader2 size={32} className="tc-spinner" />
          </div>
        )}
        <div ref={containerRef} />
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="tc-bottom">
        <div className="tc-legend">
          <div className="tc-legend-item">
            <div className="tc-legend-swatch" style={{ background: '#00e090' }} />
            Bullish
          </div>
          <div className="tc-legend-item">
            <div className="tc-legend-swatch" style={{ background: '#ff4f72' }} />
            Bearish
          </div>
          <div className="tc-legend-item">
            <div className="tc-legend-line" style={{ borderColor: '#7b61ff' }} />
            Crosshair
          </div>
        </div>
        <span className="tc-disclaimer">
          {chartData?.candles ? 'Live data' : 'Simulated · real data post-deployment'}
        </span>
      </div>
    </div>
  );
}