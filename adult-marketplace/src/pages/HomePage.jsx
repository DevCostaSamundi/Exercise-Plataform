import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Rocket, TrendingUp, Coins, Shield, Activity } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ActivityFeed from '../components/ActivityFeed';
import FadeIn from '../components/FadeIn';
import { StaggerContainer, StaggerItem } from '../components/StaggerChildren';

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white pb-20 md:pb-0 overflow-x-hidden w-full md:w-auto">
        
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-24">
          <FadeIn className="mb-16 md:mb-24">
            <div className="inline-block mb-4 animate-bounce">
              <Rocket className="text-yellow-400" size={28} />
            </div>
            <h1 className="text-4xl md:text-7xl font-black mb-4 md:mb-6 tracking-tight">
              Launch tokens.
              <br />
              <span className="text-yellow-400">Earn yield.</span>
            </h1>
            <p className="text-base md:text-xl text-gray-400 mb-8 md:mb-12 max-w-2xl">
              Create and trade memecoins on Base network with bonding curves,
              automatic yield distribution, and locked liquidity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/launch"
                className="bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black px-8 py-4 rounded-lg font-bold text-lg transition-all text-center shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40"
              >
                Launch Token
              </Link>
              <Link
                to="/explore"
                className="border border-gray-700 hover:border-yellow-400 hover:scale-105 active:scale-95 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all text-center"
              >
                Explore
              </Link>
            </div>
          </FadeIn>

          {/* Features */}
          <StaggerContainer className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 mb-16 md:mb-24 border-t border-gray-800 pt-12 md:pt-24">
            <StaggerItem>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="mb-4 p-3 bg-yellow-400/10 rounded-lg inline-block group-hover:bg-yellow-400/20 transition-colors">
                  <TrendingUp className="text-yellow-400" size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Bonding Curve</h3>
                <p className="text-gray-400 leading-relaxed">
                  Automated pricing based on supply and demand. Buy and sell without slippage.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="mb-4 p-3 bg-yellow-400/10 rounded-lg inline-block group-hover:bg-yellow-400/20 transition-colors">
                  <Coins className="text-yellow-400" size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Auto Yield</h3>
                <p className="text-gray-400 leading-relaxed">
                  1% of every transaction distributed to holders. Passive income guaranteed.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="mb-4 p-3 bg-yellow-400/10 rounded-lg inline-block group-hover:bg-yellow-400/20 transition-colors">
                  <Shield className="text-yellow-400" size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Locked Liquidity</h3>
                <p className="text-gray-400 leading-relaxed">
                  Funds locked on-chain for 90 days. Zero rug pulls possible.
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* CTA */}
          <FadeIn delay={0.2} className="border border-gray-800 hover:border-yellow-400/30 rounded-2xl p-8 md:p-16 text-center mb-16 md:mb-24 bg-gradient-to-br from-yellow-400/5 to-transparent transition-all duration-300">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Ready to launch?
            </h2>
            <p className="text-lg md:text-xl text-gray-400 mb-8">
              {isConnected 
                ? "Connected. Click 'Launch Token' to start."
                : "Connect your wallet and launch in 3 minutes."}
            </p>
            {!isConnected && (
              <p className="text-xs md:text-sm text-gray-500">
                MetaMask • Coinbase Wallet • WalletConnect
              </p>
            )}
          </FadeIn>

          {/* Trending Tokens */}
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12 mb-16 md:mb-24">
            {/* Trending Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">Trending</h2>
                <Link 
                  to="/trending" 
                  className="text-yellow-400 hover:text-yellow-500 font-semibold text-sm md:text-base"
                >
                  View all →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-gray-800 hover:border-gray-700 rounded-xl p-6 transition-all">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
                      <div>
                        <h4 className="font-bold">TOKEN {i}</h4>
                        <p className="text-sm text-gray-500">Coming soon</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-semibold">--</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">24h:</span>
                        <span className="text-green-500">--</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center gap-2 mb-6 md:mb-8">
                <Activity className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" />
                <h2 className="text-xl md:text-3xl font-bold">Activity</h2>
              </div>
              <ActivityFeed limit={8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
