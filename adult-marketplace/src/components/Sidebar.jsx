import { NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { Home, Search, TrendingUp, Rocket, Wallet, HelpCircle, LogOut, Menu, X, Sun, Moon, Shield, BarChart3 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { theme, toggleTheme } = useTheme();
  const { isOwner } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDisconnect = () => {
    disconnect();
  };

  const linkBase = 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all';
  const linkInactive = 'text-gray-400 hover:text-white hover:bg-gray-900';
  const linkActive = 'text-black bg-yellow-400';

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`hidden md:flex fixed md:sticky top-0 left-0 h-screen bg-black border-r border-gray-900 z-40 transition-all duration-300 ${
          isCollapsed ? 'md:w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full py-6 px-3">
          {/* Logo / Header */}
          <div className="flex items-center justify-between px-2 mb-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Rocket className="text-black" size={20} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Launchpad 2.0</span>
                  <span className="text-xs text-gray-500">
                    Base Network
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto">
            {/* Home */}
            <NavLink
              to="/"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Home"
            >
              <Home size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>Home</span>}
            </NavLink>

            {/* Explore */}
            <NavLink
              to="/explore"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Explore"
            >
              <Search size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>Explore</span>}
            </NavLink>

            {/* Trending */}
            <NavLink
              to="/trending"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Trending"
            >
              <TrendingUp size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>Trending</span>}
            </NavLink>

            {!isCollapsed && <div className="h-px bg-gray-900 my-3" />}

            {/* Portfolio */}
            {isConnected && (
              <NavLink
                to="/portfolio"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                title="Portfolio"
              >
                <Wallet size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Portfolio</span>}
              </NavLink>
            )}

            {/* Creator Dashboard */}
            {isConnected && (
              <NavLink
                to="/creator"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                title="Creator Dashboard"
              >
                <BarChart3 size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Creator</span>}
              </NavLink>
            )}

            {/* Admin Dashboard - só aparece se for o OWNER */}
            {isOwner && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                title="Admin"
              >
                <Shield size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>Admin</span>}
              </NavLink>
            )}

            {!isCollapsed && <div className="h-px bg-gray-900 my-3" />}

            {/* Help */}
            <NavLink
              to="/help"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Help"
            >
              <HelpCircle size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>Help</span>}
            </NavLink>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`${linkBase} ${linkInactive} w-full justify-start`}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} className="flex-shrink-0" /> : <Moon size={20} className="flex-shrink-0" />}
              {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
          </nav>

          {/* Call to Action - Launch Your Token */}
          {!isCollapsed && (
            <div className="mt-4 mb-4">
              <Link
                to="/launch"
                className="block bg-yellow-400 hover:bg-yellow-500 text-black text-center px-4 py-3 rounded-lg font-bold text-sm transition-all"
              >
                Launch Token
              </Link>
            </div>
          )}

          {/* User Profile */}
          {isConnected && address && (
            <div className="mt-auto pt-4 border-t border-gray-900">
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-sm">
                    {address?.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Connected
                    </p>
                  </div>
                )}
              </div>

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className={`${linkBase} ${linkInactive} w-full justify-start mt-2`}
                title="Disconnect"
              >
                <LogOut size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="text-red-400">Disconnect</span>}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
