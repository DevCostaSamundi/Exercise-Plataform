import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useBondingCurve } from '../hooks/useBondingCurve';
import { formatEther } from 'viem';

export default function TokenChart({ tokenAddress }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const volumeSeriesRef = useRef();
  const [timeframe, setTimeframe] = useState('1D');
  const [isLoading, setIsLoading] = useState(true);
  
  const { marketInfo } = useBondingCurve(tokenAddress);

  const timeframes = [
    { label: '1H', value: '1H', seconds: 3600, points: 60 },
    { label: '4H', value: '4H', seconds: 14400, points: 48 },
    { label: '1D', value: '1D', seconds: 86400, points: 96 },
    { label: '1W', value: '1W', seconds: 604800, points: 168 },
  ];

  // Generate simulated price history based on current market price
  // TODO: Replace with actual blockchain events (TokenPurchased/TokenSold) or subgraph data
  const generatePriceHistory = () => {
    const data = [];
    const volumeData = [];
    const now = Math.floor(Date.now() / 1000);
    const config = timeframes.find(tf => tf.value === timeframe);
    
    // Use real market price or default
    const currentPrice = marketInfo?.currentPrice 
      ? parseFloat(formatEther(marketInfo.currentPrice))
      : 0.001;
    
    for (let i = config.points; i >= 0; i--) {
      const time = now - (i * (config.seconds / config.points));
      
      // Simulate price evolution with upward trend
      const progressRatio = (config.points - i) / config.points;
      const trendFactor = progressRatio * 0.2; // 20% growth over period
      const volatility = (Math.random() - 0.5) * 0.08; // ±8% random
      
      const basePrice = currentPrice * (0.8 + trendFactor); // Start 20% lower
      const price = basePrice * (1 + volatility);
      
      const open = price * (0.99 + Math.random() * 0.02);
      const close = price * (0.99 + Math.random() * 0.02);
      const high = Math.max(open, close) * (1 + Math.random() * 0.015);
      const low = Math.min(open, close) * (1 - Math.random() * 0.015);
      
      data.push({
        time,
        open: parseFloat(open.toFixed(8)),
        high: parseFloat(high.toFixed(8)),
        low: parseFloat(low.toFixed(8)),
        close: parseFloat(close.toFixed(8)),
      });

      volumeData.push({
        time,
        value: Math.random() * 50 + 5, // Random volume 5-55 ETH
        color: close >= open ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)',
      });
    }

    return { data, volumeData };
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    setIsLoading(true);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        borderColor: '#1f1f1f',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1f1f1f',
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#facc15',
          width: 1,
          style: 2,
          labelBackgroundColor: '#facc15',
        },
        horzLine: {
          color: '#facc15',
          width: 1,
          style: 2,
          labelBackgroundColor: '#facc15',
        },
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    volumeSeriesRef.current = volumeSeries;

    // Load data
    const { data, volumeData } = generatePriceHistory();
    candlestickSeries.setData(data);
    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();
    
    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [timeframe, marketInfo]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  return (
    <div className="border border-gray-800 rounded-xl p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-yellow-400" size={20} />
          <h3 className="text-lg font-bold">Price Chart</h3>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => handleTimeframeChange(tf.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                timeframe === tf.value
                  ? 'bg-yellow-400 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg">
            <Loader2 className="animate-spin text-yellow-400" size={40} />
          </div>
        )}
        <div ref={chartContainerRef} className="rounded-lg overflow-hidden" />
      </div>

      {/* Info */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <Clock size={14} />
        <span>
          Simulated price history based on current bonding curve. Real-time data will be available after contract deployment.
        </span>
      </div>
    </div>
  );
}
