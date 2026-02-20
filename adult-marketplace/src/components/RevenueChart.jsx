import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { DollarSign } from 'lucide-react';

export default function RevenueChart({ data = [], timeframe = '7d' }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();

  // Generate mock revenue data if none provided
  const generateRevenueData = () => {
    const now = Math.floor(Date.now() / 1000);
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const daySeconds = 24 * 60 * 60;
    
    return Array.from({ length: days }, (_, i) => {
      const time = now - ((days - i) * daySeconds);
      const baseRevenue = 0.05 + (Math.random() * 0.15); // 0.05-0.2 ETH per day
      const trend = (i / days) * 0.1; // Slight upward trend
      
      return {
        time,
        value: baseRevenue + trend
      };
    });
  };

  const chartData = data.length > 0 ? data : generateRevenueData();

  useEffect(() => {
    if (!chartContainerRef.current) return;

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
      height: 300,
      timeScale: {
        borderColor: '#1f1f1f',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1f1f1f',
      },
    });

    chartRef.current = chart;

    // Area series for revenue
    const areaSeries = chart.addAreaSeries({
      topColor: 'rgba(250, 204, 21, 0.4)',
      bottomColor: 'rgba(250, 204, 21, 0.0)',
      lineColor: '#facc15',
      lineWidth: 2,
    });

    areaSeries.setData(chartData);
    chart.timeScale().fitContent();

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
  }, [timeframe, data]);

  // Calculate total revenue
  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0).toFixed(4);
  const avgDaily = (totalRevenue / chartData.length).toFixed(4);

  return (
    <div className="border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400/10 rounded-lg">
            <DollarSign className="text-yellow-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Revenue Analytics</h3>
            <p className="text-sm text-gray-500">
              Creator fees from trading volume
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-400">{totalRevenue} ETH</p>
          <p className="text-xs text-gray-500">Total ({timeframe})</p>
        </div>
      </div>

      <div ref={chartContainerRef} className="rounded-lg overflow-hidden" />

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Avg Daily</p>
          <p className="text-lg font-bold">{avgDaily} ETH</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Peak Day</p>
          <p className="text-lg font-bold">
            {Math.max(...chartData.map(d => d.value)).toFixed(4)} ETH
          </p>
        </div>
      </div>
    </div>
  );
}
