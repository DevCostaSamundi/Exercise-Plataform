import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import creatorService from '../services/creatorService';
import withdrawalService from '../services/withdrawalService';

export default function CreatorSidebar() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [balance, setBalance] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const [userData, setUserData] = useState({
    displayName: 'Carregando...',
    username: '',
    avatar: null,
  });

  useEffect(() => {
    fetchCreatorData();
  }, []);

  const fetchCreatorData = async () => {
    try {
      // Buscar saldo
      const balanceResponse = await withdrawalService.getBalance();
      setBalance(balanceResponse.data);

      // Buscar dados do usuário
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setUserData({
        displayName: user.displayName || user.username || 'Criador',
        username: user.username || '',
        avatar: user.avatar,
      });

      // TODO: Buscar mensagens não lidas
      setUnreadMessages(0);
      setNotifications(0);
    } catch (error) {
      console.error('Error fetching creator data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value * 5.5); // Converter USD para BRL (taxa exemplo)
  };

  const linkBase = 'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all';
  const linkInactive = 'text-slate-400 hover:text-slate-100 hover:bg-slate-800';
  const linkActive = 'text-white bg-indigo-600 shadow-lg shadow-indigo-600/50';

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden fixed bottom-4 right-4 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen bg-slate-950 border-r border-slate-800 text-slate-100 z-40 transition-all duration-300 ${
          isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'
        }`}
      >
        <div className="flex flex-col h-full py-4 px-3">
          {/* Logo / título */}
          <div className="flex items-center justify-between px-2 mb-6">
            <Link to="/creator/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-xl">P</span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold">PrideConnect</span>
                  <span className="text-xs text-slate-400">Área do Criador</span>
                </div>
              )}
            </Link>

            {/* Collapse Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:block p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Stats Summary */}
          {!isCollapsed && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 mb-4 border border-slate-700 shadow-xl">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">💰 Disponível</span>
                  <span className="text-sm font-bold text-green-400">
                    {balance ? formatCurrency(balance.availableUSD) : 'R$ 0,00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">📈 Este mês</span>
                  <span className="text-sm font-bold text-white">
                    {balance ? formatCurrency(balance.monthlyEarnings) : 'R$ 0,00'}
                  </span>
                </div>
                <Link 
                  to="/creator/earnings"
                  className="block text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-2 transition-colors"
                >
                  Ver detalhes →
                </Link>
              </div>
            </div>
          )}

          {/* Navegação principal */}
          <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <NavLink
              to="/creator/dashboard"
              className={({ isActive }) => `${linkBase} ${isActive ?  linkActive : linkInactive}`}
              title="Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>

            <NavLink
              to="/creator/posts"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Meus Posts"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {!isCollapsed && <span>Meus Posts</span>}
            </NavLink>

            <NavLink
              to="/creator/upload"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Novo Post"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {!isCollapsed && <span>Novo Post</span>}
            </NavLink>

            {! isCollapsed && <div className="h-px bg-slate-800 my-3" />}

            <NavLink
              to="/creator/messages"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} relative`}
              title="Mensagens"
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {unreadMessages > 0 && ! isCollapsed && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              {!isCollapsed && <span>Mensagens</span>}
              {! isCollapsed && unreadMessages > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {unreadMessages}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/creator/earnings"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Ganhos & Saques"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {!isCollapsed && <span>Ganhos</span>}
            </NavLink>

            <NavLink
              to="/creator/subscribers"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Assinantes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              {!isCollapsed && <span>Assinantes</span>}
            </NavLink>

            <NavLink
              to="/creator/analytics"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Analytics"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              {!isCollapsed && <span>Analytics</span>}
            </NavLink>

            <NavLink
              to="/creator/notifications"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} relative`}
              title="Notificações"
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                )}
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
              {!isCollapsed && <span>Notificações</span>}
              {!isCollapsed && notifications > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full font-bold flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </NavLink>

            {! isCollapsed && <div className="h-px bg-slate-800 my-3" />}

            <NavLink
              to="/creator/settings"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Configurações"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {!isCollapsed && <span>Configurações</span>}
            </NavLink>
          </nav>

          {/* Footer / perfil / logout */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            {/* Profile */}
            {!isCollapsed ?  (
              <Link
                to={`/creator/${userData.username}`}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div className="relative">
                  {userData.avatar ?  (
                    <img 
                      src={userData.avatar} 
                      alt={userData.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {getInitials(userData.displayName)}
                      </span>
                    </div>
                  )}
                  {/* Status online */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
                    {userData.displayName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">Ver perfil público →</p>
                </div>
              </Link>
            ) : (
              <Link
                to={`/creator/${userData.username}`}
                className="flex items-center justify-center py-2 hover:bg-slate-800 rounded-lg transition-colors relative"
                title="Ver perfil"
              >
                {userData.avatar ? (
                  <img 
                    src={userData.avatar} 
                    alt={userData.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {getInitials(userData.displayName)}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-1 right-2 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full"></span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`${linkBase} ${linkInactive} hover:text-red-400 hover:bg-red-900/20 w-full justify-start`}
              title="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              {!isCollapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 animate-fadeIn"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}