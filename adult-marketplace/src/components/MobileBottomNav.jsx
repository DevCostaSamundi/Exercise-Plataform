import { NavLink } from 'react-router-dom';
import { Home, Search, TrendingUp, Wallet, Rocket } from 'lucide-react';
import { useAccount } from 'wagmi';

export default function MobileBottomNav() {
  const { isConnected } = useAccount();

  const linkBase = 'flex flex-col items-center justify-center gap-1 py-3 px-2 transition-all flex-1';
  const linkInactive = 'text-gray-400';
  const linkActive = 'text-yellow-400';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50 pb-safe">
      <div className="grid grid-cols-5 h-16">
        
        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <Home size={22} />
          <span className="text-xs font-semibold">Home</span>
        </NavLink>

        {/* Explore */}
        <NavLink
          to="/explore"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <Search size={22} />
          <span className="text-xs font-semibold">Explore</span>
        </NavLink>

        {/* Launch Token - Center Button */}
        <NavLink
          to="/launch"
          className="flex flex-col items-center justify-center relative"
        >
          <div className="absolute -top-6 w-14 h-14 bg-yellow-400 hover:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95">
            <Rocket className="text-black" size={24} />
          </div>
          <span className="text-xs font-semibold text-yellow-400 mt-6">Launch</span>
        </NavLink>

        {/* Trending */}
        <NavLink
          to="/trending"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <TrendingUp size={22} />
          <span className="text-xs font-semibold">Trending</span>
        </NavLink>

        {/* Portfolio */}
        <NavLink
          to={isConnected ? "/portfolio" : "#"}
          className={({ isActive }) => `${linkBase} ${
            isActive && isConnected ? linkActive : linkInactive
          } ${!isConnected && 'opacity-50'}`}
        >
          <Wallet size={22} />
          <span className="text-xs font-semibold">Portfolio</span>
        </NavLink>
      </div>
    </nav>
  );
}
