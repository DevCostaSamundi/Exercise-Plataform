/**
 * Header Principal
 * Navegação, busca, notificações e perfil
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiBell,
  FiMessageCircle,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationItem from '../../subscriber/NotificationItem';
import SearchBar from '../../subscriber/SearchBar';

const Header = ({ user, onLogout, onToggleMobileSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const { notifications, unreadCount, markAsRead } = useNotifications();
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    setShowNotifications(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiMenu className="text-2xl text-gray-700 dark:text-gray-300" />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black font-bold text-xl">P</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-black dark:text-white">
                FlowConnect
              </span>
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <SearchBar placeholder="Buscar criadores..." />
          </div>

          {/* Right: Actions / Auth CTA */}
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                {/* Mobile Search Toggle */}
                <button
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {showMobileSearch ? (
                    <FiX className="text-xl text-gray-700 dark:text-gray-300" />
                  ) : (
                    <FiSearch className="text-xl text-gray-700 dark:text-gray-300" />
                  )}
                </button>

                {/* Messages */}
                <Link
                  to="/messages"
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiMessageCircle className="text-xl text-gray-700 dark:text-gray-300" />
                </Link>

                {/* Notifications */}
                <div ref={notificationRef} className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FiBell className="text-xl text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-slate-900 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notificações</h3>
                        <Link to="/notifications" onClick={() => setShowNotifications(false)} className="text-sm text-black dark:text-white hover:underline font-bold">Ver todas</Link>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.slice(0, 5).length > 0 ? (
                          notifications.slice(0, 5).map((notification) => (
                            <NotificationItem key={notification._id} notification={notification} onClick={handleNotificationClick} />
                          ))
                        ) : (
                          <div className="p-8 text-center text-gray-500">Nenhuma notificação</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Menu */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <img
                      src={user?.avatar || '/default-avatar.png'}
                      alt={user?.displayName || user?.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="hidden sm:block text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">
                      {user?.displayName || user?.username}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 border-b dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <img src={user?.avatar || '/default-avatar.png'} alt="" className="w-12 h-12 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.displayName || user?.username}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <FiUser className="text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">Meu Perfil</span>
                        </Link>
                        <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <FiSettings className="text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">Configurações</span>
                        </Link>
                      </div>
                      <div className="border-t dark:border-gray-700 py-2">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-900 dark:hover:bg-slate-900/20 transition-colors">
                          <FiLogOut className="text-slate-900" />
                          <span className="text-slate-900 font-semibold">Sair</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden pb-4">
            <SearchBar placeholder="Buscar criadores..." autoFocus />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;