import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Clock } from 'lucide-react';

export default function TokenChart({ tokenAddress }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const volumeSeriesRef = useRef();
  const [timeframe, setTimeframe] = useState('1D');

  const timeframes = [
    { label: '1H', value: '1H' },
    { label: '4H', value: '4H' },
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
  ];

  // Generate mock OHLCV data (replace with real data from subgraph/API)
  const generateMockData = (interval = '1D') => {
    const data = [];
    const volumeData = [];
    const now = Math.floor(Date.now() / 1000);
    const intervals = {
      '1H': 3600,
      '4H': 14400,
      '1D': 86400,
      '1W': 604800,
    };
    const interval_seconds = intervals[interval];
    const points = 100;

    let price = 0.001;

    for (let i = points; i >= 0; i--) {
      const time = now - i * interval_seconds;
      
      const change = (Math.random() - 0.48) * 0.0001;
      price = Math.max(0.0001, price + change);
      
      const open = price;
      const close = price + (Math.random() - 0.5) * 0.00005;
      const high = Math.max(open, close) + Math.random() * 0.00003;
      const low = Math.min(open, close) - Math.random() * 0.00003;
      
      data.push({
        time,
        open: parseFloat(open.toFixed(6)),
        high: parseFloat(high.toFixed(6)),
        low: parseFloat(low.toFixed(6)),
        close: parseFloat(close.toFixed(6)),
      });

      volumeData.push({
        time,
        value: Math.random() * 100000,
        color: close > open ? '#10b98180' : '#ef444480',
      });
    }

    return { data, volumeData };
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        borderColor: '#1a1a1a',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1a1a1a',
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#facc15',
          width: 1,
          style: 3,
          labelBackgroundColor: '#facc15',
        },
        horzLine: {
          color: '#facc15',
          width: 1,
          style: 3,
          labelBackgroundColor: '#facc15',
        },
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeries;

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeriesRef.current = volumeSeries;

    const { data, volumeData } = generateMockData(timeframe);
    candlestickSeries.setData(data);
    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    const { data, volumeData } = generateMockData(timeframe);
    candlestickSeriesRef.current.setData(data);
    volumeSeriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [timeframe]);

  return (
    <div className="border border-gray-800 rounded-xl p-6 bg-black">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="text-yellow-400" size={20} />
          <h3 className="text-xl font-bold">Price Chart</h3>
        </div>

        <div className="flex gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                timeframe === tf.value
                  ? 'bg-yellow-400 text-black'
                  : 'border border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full" />

      <div className="flex items-center gap-6 mt-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          <span>Bullish</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-sm" />
          <span>Bearish</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-yellow-400" />
          <span>Crosshair</span>
        </div>
      </div>
    </div>
  );
}
